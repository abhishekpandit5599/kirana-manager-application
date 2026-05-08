import { config } from "../config";

export async function sendWhatsAppTemplate({
  to,
  templateName,
  params,
  buttonParam,
}: {
  to: string;
  templateName: string;
  params: string[];
  buttonParam?: string;
}) {
  const url = `https://graph.facebook.com/v25.0/${config.whatsappPhoneNumberId}/messages`;

  const components: any[] = [
    {
      type: "body",
      parameters: params.map((p) => ({
        type: "text",
        text: p,
      })),
    },
  ];

  // Add CTA button parameter
  if (buttonParam) {
    components.push({
      type: "button",
      sub_type: "url",
      index: "0",
      parameters: [
        {
          type: "text",
          text: buttonParam,
        },
      ],
    });
  }

  const body = {
    messaging_product: "whatsapp",
    to,
    type: "template",
    template: {
      name: templateName,
      language: { code: "en_US" },
      components,
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