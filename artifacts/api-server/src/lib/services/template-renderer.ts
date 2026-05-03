import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function renderTemplate(name: string, data: any) {
  const filePath = path.join(
    __dirname,
    "../templates/invoice",
    `${name}.html`
  );

  const template = fs.readFileSync(filePath, "utf-8");

  return template.replace(/{{(.*?)}}/g, (_, key) => {
    return data[key.trim()] ?? "";
  });
}