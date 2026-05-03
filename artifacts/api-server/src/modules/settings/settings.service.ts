import { settingsRepository } from "./settings.repository";
import QRCode from "qrcode";

export const settingsService = {
  async getSettings(shopId: string) {
    const [settings, shop] = await Promise.all([
      settingsRepository.findByShop(shopId),
      settingsRepository.findById(shopId),
    ]);

    return {
      ...(settings ?? {
        logoUrl: null,
        themeColor: "#1e40af",
        upiId: null,
        upiQrUrl: null,
        language: "en",
        ownerWhatsapp: null,
      }),
      shopName: shop?.name ?? null,
    };
  },

  async updateSettings(shopId: string, data: any) {
    if (data.shopName) {
      await settingsRepository.updateShopName(shopId, data.shopName);
      delete data.shopName;
    }
    return settingsRepository.upsert(shopId, data);
  },

  async uploadLogo(shopId: string, fileUrl: string) {
    return settingsRepository.upsert(shopId, { logoUrl: fileUrl });
  },

  async uploadUpiQr(shopId: string, fileUrl: string) {
    return settingsRepository.upsert(shopId, { upiQrUrl: fileUrl });
  },

  async generateUpiQr(upiId: string, amount?: number) {
    // Standard UPI deep link format
    let upiUrl = `upi://pay?pa=${upiId}&pn=Kirana Store`;
    if (amount) upiUrl += `&am=${amount}`;
    const qrDataUrl = await QRCode.toDataURL(upiUrl, { width: 300, margin: 2 });
    return qrDataUrl;
  },
};
