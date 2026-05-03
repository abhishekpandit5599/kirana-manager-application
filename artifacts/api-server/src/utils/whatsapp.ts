// import { config } from "../config";
// import { logger } from "./logger";

// export async function sendWhatsAppMessage(
//   toPhone: string,
//   message: string,
//   mediaUrl?: string
// ): Promise<{ sent: boolean; error?: string }> {
//   const { twilioAccountSid: sid, twilioAuthToken: token, twilioWhatsappFrom: from } = config;

//   if (!sid || !token || !from) {
//     return { sent: false, error: "WhatsApp not configured (TWILIO_* env vars missing)" };
//   }

//   const phone = toPhone.startsWith("+") ? toPhone : `+91${toPhone}`;

//   try {
//     const url = `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`;
//     const params = new URLSearchParams({
//       To: `whatsapp:${phone}`,
//       From: `whatsapp:${from}`,
//       Body: message,
//     });
//     if (mediaUrl) params.append("MediaUrl", mediaUrl);

//     const resp = await fetch(url, {
//       method: "POST",
//       headers: {
//         Authorization: "Basic " + Buffer.from(`${sid}:${token}`).toString("base64"),
//         "Content-Type": "application/x-www-form-urlencoded",
//       },
//       body: params,
//     });
//     if (!resp.ok) {
//       const text = await resp.text();
//       return { sent: false, error: text };
//     }
//     return { sent: true };
//   } catch (err: any) {
//     logger.error({ err }, "WhatsApp send failed");
//     return { sent: false, error: err.message };
//   }
// }

// export async function sendWhatsAppInvoice(
//   toPhone: string,
//   pdfUrl: string,
//   invoiceNumber: string,
//   total: number,
//   shopName: string
// ): Promise<{ sent: boolean; error?: string }> {
//   const message = `Namaste! Your invoice ${invoiceNumber} from ${shopName} is ready.\nTotal: ₹${total.toFixed(2)}\nDownload PDF: ${pdfUrl}`;
//   return sendWhatsAppMessage(toPhone, message, pdfUrl);
// }


import { config } from "../config";
import { logger } from "./logger";

const WHATSAPP_API_VERSION = "v25.0";
const PHONE_NUMBER_ID = config.whatsappPhoneNumberId; // IMPORTANT
const ACCESS_TOKEN = config.whatsappAccessToken;

export async function sendWhatsAppMessage(
  toPhone: string,
  message: string
): Promise<{ sent: boolean; error?: string }> {
  if (!PHONE_NUMBER_ID || !ACCESS_TOKEN) {
    return { sent: false, error: "WhatsApp Cloud API not configured" };
  }

  const phone = toPhone.startsWith("+") ? toPhone.replace("+", "") : `91${toPhone}`;

  try {
    const url = `https://graph.facebook.com/${WHATSAPP_API_VERSION}/${PHONE_NUMBER_ID}/messages`;

    const payload = {
      messaging_product: "whatsapp",
      to: phone,
      type: "text",
      text: {
        body: message,
      },
    };

    const resp = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await resp.json();

    if (!resp.ok) {
      return { sent: false, error: JSON.stringify(data) };
    }

    return { sent: true };
  } catch (err: any) {
    logger.error({ err }, "WhatsApp send failed");
    return { sent: false, error: err.message };
  }
}


export async function sendWhatsAppInvoice(
  toPhone: string,
  pdfUrl: string,
  invoiceNumber: string,
  total: number,
  shopName: string
): Promise<{ sent: boolean; error?: string }> {
  const phone = toPhone.startsWith("+") ? toPhone.replace("+", "") : `91${toPhone}`;

  const url = `https://graph.facebook.com/${WHATSAPP_API_VERSION}/${PHONE_NUMBER_ID}/messages`;

  const payload = {
    messaging_product: "whatsapp",
    to: phone,
    type: "document",
    document: {
      link: pdfUrl, // MUST be public URL (S3 / Cloudinary)
      caption: `Invoice ${invoiceNumber} from ${shopName}\nTotal: ₹${total.toFixed(2)}`,
      filename: `invoice-${invoiceNumber}.pdf`,
    },
  };

  try {
    const resp = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await resp.json();

    if (!resp.ok) {
      return { sent: false, error: JSON.stringify(data) };
    }

    return { sent: true };
  } catch (err: any) {
    return { sent: false, error: err.message };
  }
}