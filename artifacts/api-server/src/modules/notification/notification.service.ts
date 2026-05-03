import { notificationRepository } from "./notification.repository";
import { AppError } from "../../middlewares/error.middleware";

function formatNotification(n: any) {
  return { id: n.id, type: n.type, title: n.title, message: n.message, isRead: n.isRead, createdAt: n.createdAt.toISOString() };
}

export const notificationService = {
  async listNotifications(shopId: string) {
    const notifications = await notificationRepository.findAllByShop(shopId);
    return notifications.map(formatNotification);
  },

  async createNotification(shopId: string, type: string, title: string, message: string) {
    const n = await notificationRepository.create({ shopId, type, title, message });
    return formatNotification(n);
  },

  async markAsRead(id: string, shopId: string) {
    const n = await notificationRepository.markRead(id, shopId);
    if (!n) throw new AppError(404, "Notification not found");
    return formatNotification(n);
  },

  // Auto-generated notifications
  async createLowStockNotification(shopId: string, itemName: string, stock: number, unit: string) {
    return this.createNotification(shopId, "low_stock", "Low Stock Alert", `${itemName} is low: ${stock} ${unit} remaining`);
  },

  async createInvoiceNotification(shopId: string, invoiceNumber: string, total: number) {
    return this.createNotification(shopId, "invoice", "New Invoice", `Invoice ${invoiceNumber} created for ₹${total.toFixed(2)}`);
  },
};
