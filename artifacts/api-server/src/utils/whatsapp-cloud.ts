import { config } from "../config";

export async function sendWhatsAppTemplate({
  to,
  templateName,
  params,
}: {
  to: string;
  templateName: string;
  params: string[];
}) {
  const url = `https://graph.facebook.com/v25.0/${config.whatsappPhoneNumberId}/messages`;

  const body = {
    messaging_product: "whatsapp",
    to,
    type: "template",
    template: {
      name: templateName,
      language: { code: "en_US" },
      components: [
        {
          type: "body",
          parameters: params.map((p) => ({
            type: "text",
            text: p,
          })),
        },
      ],
    },
  };

  const resp = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.whatsappAccessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const data = await resp.json();

  if (!resp.ok) {
    throw new Error(JSON.stringify(data));
  }

  return data;
}