import { customerRepository } from "./customer.repository";
import { invoiceRepository } from "../invoice/invoice.repository";
import { notificationService } from "../notification/notification.service";
import { AppError } from "../../middlewares/error.middleware";

function formatCustomer(c: any) {
  return { id: c.id, name: c.name, phone: c.phone, email: c.email, address: c.address, notes: c.notes, createdAt: c.createdAt.toISOString() };
}

export const customerService = {
  async listCustomers(shopId: string, query: any) {
    const limit = Math.min(parseInt(query.limit) || 20, 100);
    const offset = parseInt(query.offset) || 0;

    const customers = await customerRepository.findAllByShop(shopId, query, { limit, offset });
    return customers.map(formatCustomer);
  },

  async getCustomer(id: string, shopId: string) {
    const c = await customerRepository.findById(id, shopId);
    if (!c) throw new AppError(404, "Customer not found");
    return formatCustomer(c);
  },

  async createCustomer(shopId: string, data: any) {
    const c = await customerRepository.create({
      shopId, name: data.name, phone: data.phone ?? null,
      email: data.email ?? null, address: data.address ?? null, notes: data.notes ?? null,
    });
    // Notification for new customer
    await notificationService.createNotification(shopId, "system", "New Customer", `${data.name} added as a customer`);
    return formatCustomer(c);
  },

  async updateCustomer(id: string, shopId: string, data: any) {
    const updateData: Record<string, unknown> = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.phone !== undefined) updateData.phone = data.phone;
    if (data.email !== undefined) updateData.email = data.email;
    if (data.address !== undefined) updateData.address = data.address;
    if (data.notes !== undefined) updateData.notes = data.notes;
    const c = await customerRepository.update(id, shopId, updateData);
    if (!c) throw new AppError(404, "Customer not found");
    return formatCustomer(c);
  },

  async deleteCustomer(id: string, shopId: string) {
    const c = await customerRepository.deleteById(id, shopId);
    if (!c) throw new AppError(404, "Customer not found");
  },

  async getCustomerStats(id: string, shopId: string) {
    const customer = await customerRepository.findById(id, shopId);
    if (!customer) throw new AppError(404, "Customer not found");
    const invoices = await invoiceRepository.findByCustomer(id, shopId);
    const totalSpend = invoices.reduce((sum, inv) => sum + parseFloat(inv.total), 0);
    return {
      customer: formatCustomer(customer),
      totalSpend: Math.round(totalSpend * 100) / 100,
      purchaseCount: invoices.length,
      invoices: invoices.map((inv) => ({
        id: inv.id, invoiceNumber: inv.invoiceNumber, total: parseFloat(inv.total),
        paymentMethod: inv.paymentMethod, createdAt: inv.createdAt.toISOString(),
      })),
    };
  },
};
