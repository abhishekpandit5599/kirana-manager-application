import { labourRepository } from "./labour.repository";
import { AppError } from "../../middlewares/error.middleware";

function formatLabour(l: any) {
  return { id: l.id, name: l.name, phone: l.phone, role: l.role, salaryPerMonth: parseFloat(l.salaryPerMonth), isActive: l.isActive, createdAt: l.createdAt.toISOString() };
}

export const labourService = {
  async list(shopId: string) { return (await labourRepository.findAllByShop(shopId)).map(formatLabour); },
  async get(id: string, shopId: string) { const l = await labourRepository.findById(id, shopId); if (!l) throw new AppError(404, "Labour not found"); return formatLabour(l); },
  async create(shopId: string, data: any) { return formatLabour(await labourRepository.create({ ...data, salaryPerMonth: data.salaryPerMonth.toString(), phone: data.phone ?? null, role: data.role ?? null, shopId })); },
  async update(id: string, shopId: string, data: any) {
    const d: any = {};
    if (data.name !== undefined) d.name = data.name;
    if (data.phone !== undefined) d.phone = data.phone;
    if (data.role !== undefined) d.role = data.role;
    if (data.salaryPerMonth !== undefined) d.salaryPerMonth = data.salaryPerMonth.toString();
    if (data.isActive !== undefined) d.isActive = data.isActive;
    const l = await labourRepository.update(id, shopId, d);
    if (!l) throw new AppError(404, "Labour not found");
    return formatLabour(l);
  },
  async remove(id: string, shopId: string) { const l = await labourRepository.deleteById(id, shopId); if (!l) throw new AppError(404, "Labour not found"); },

  async getSalary(id: string, shopId: string, month: string) {
    const labour = await labourRepository.findById(id, shopId);
    if (!labour) throw new AppError(404, "Labour not found");
    const records = await labourRepository.findAttendance(shopId, id, month);
    const presentDays = records.filter((a) => a.status === "present").length;
    const halfDays = records.filter((a) => a.status === "half").length;
    const absentDays = records.filter((a) => a.status === "absent").length;
    const [year, mon] = month.split("-").map(Number);
    const totalDays = new Date(year, mon, 0).getDate();
    const baseSalary = parseFloat(labour.salaryPerMonth);
    const calculatedSalary = Math.round((presentDays + halfDays * 0.5) * (baseSalary / totalDays) * 100) / 100;
    return { labourId: labour.id, labourName: labour.name, month, totalDays, presentDays, halfDays, absentDays, baseSalary, calculatedSalary };
  },

  async listAttendance(shopId: string, labourId?: string, month?: string) {
    const records = await labourRepository.findAttendance(shopId, labourId, month);
    return records.map((r) => ({ id: r.id, labourId: r.labourId, labourName: r.labourName ?? "", date: r.date, status: r.status, createdAt: r.createdAt.toISOString() }));
  },

  async markAttendance(shopId: string, labourId: string, date: string, status: string) {
    const labour = await labourRepository.findById(labourId, shopId);
    if (!labour) throw new AppError(404, "Labour not found");
    const record = await labourRepository.upsertAttendance(shopId, labourId, date, status);
    return { id: record.id, labourId: record.labourId, labourName: labour.name, date: record.date, status: record.status, createdAt: record.createdAt.toISOString() };
  },
};
