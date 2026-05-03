import puppeteer from "puppeteer";
import { renderTemplate } from "./services/template-renderer";

export interface InvoiceForPdf {
  invoiceNumber: string;
  shopName: string;
  shopPhone?: string | null;
  shopAddress?: string | null;
  customerName?: string | null;
  customerPhone?: string | null;
  items: {
    itemName: string;
    quantity: number;
    unit: string;
    price: number;
    total: number;
  }[];
  subtotal: number;
  total: number;
  paymentMethod: string;
  createdAt: string;
}

export function generateInvoiceHtml(invoice: InvoiceForPdf): Record<string, string> {
  const items = (invoice.items || [])
    .map(
      (item, i) => `
      <tr>
        <td>${i + 1}</td>
        <td>${item.itemName}</td>
        <td>${item.quantity}</td>
        <td>₹${item.price.toFixed(2)}</td>
        <td>₹${item.total.toFixed(2)}</td>
      </tr>
    `
    )
    .join("");

  return {
    shopName: invoice.shopName,
    shopAddress: invoice.shopAddress || "",
    shopPhone: invoice.shopPhone || "",
    invoiceNumber: invoice.invoiceNumber,
    createdAt: new Date(invoice.createdAt).toLocaleDateString("en-IN"),
    paymentMethod: invoice.paymentMethod,
    customerName: invoice.customerName || "Customer",
    customerPhone: invoice.customerPhone || "",
    items,
    total: invoice.total.toFixed(2),
  };
}

export async function generateInvoicePdf(invoice: InvoiceForPdf): Promise<Buffer> {
  try {
    const data = generateInvoiceHtml(invoice);
    const html = renderTemplate("default", data);

    const browser = await puppeteer.launch({
      headless: true,
      executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    });

    const page = await browser.newPage();

    await page.setContent(html, {
      waitUntil: "domcontentloaded", // safer than networkidle0
    });

    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
    });

    await browser.close();

    return Buffer.from(pdf);
  } catch (err: any) {
    console.error("PDF ERROR:", err); // 👈 THIS WILL SHOW REAL ISSUE
    throw err;
  }
}

export async function sendWhatsAppInvoice(
  toPhone: string,
  pdfUrl: string,
  invoiceNumber: string,
  total: number,
  shopName: string
): Promise<{ sent: boolean; error?: string }> {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_WHATSAPP_FROM;

  if (!sid || !token || !from) {
    return { sent: false, error: "WhatsApp not configured (TWILIO_* env vars missing)" };
  }

  const phone = toPhone.startsWith("+") ? toPhone : `+91${toPhone}`;

  try {
    const url = `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`;
    const body = new URLSearchParams({
      To: `whatsapp:${phone}`,
      From: `whatsapp:${from}`,
      Body: `Namaste! Your invoice ${invoiceNumber} from ${shopName} is ready.\nTotal: Rs.${total.toFixed(2)}\nDownload PDF: ${pdfUrl}`,
      MediaUrl: pdfUrl,
    });
    const resp = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: "Basic " + Buffer.from(`${sid}:${token}`).toString("base64"),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
    });
    if (!resp.ok) {
      const text = await resp.text();
      return { sent: false, error: text };
    }
    return { sent: true };
  } catch (err: any) {
    return { sent: false, error: err.message };
  }
}
