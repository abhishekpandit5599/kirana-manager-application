import { db, labourTable, attendanceTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";

export const labourRepository = {
  async findAllByShop(shopId: string) {
    return db.select().from(labourTable).where(eq(labourTable.shopId, shopId));
  },
  async findById(id: string, shopId: string) {
    const [l] = await db.select().from(labourTable).where(and(eq(labourTable.id, id), eq(labourTable.shopId, shopId)));
    return l ?? null;
  },
  async create(data: any) {
    const [l] = await db.insert(labourTable).values(data).returning();
    return l;
  },
  async update(id: string, shopId: string, data: any) {
    const [l] = await db.update(labourTable).set(data).where(and(eq(labourTable.id, id), eq(labourTable.shopId, shopId))).returning();
    return l ?? null;
  },
  async deleteById(id: string, shopId: string) {
    const [l] = await db.delete(labourTable).where(and(eq(labourTable.id, id), eq(labourTable.shopId, shopId))).returning();
    return l ?? null;
  },
  // Attendance
  async findAttendance(shopId: string, labourId?: string, month?: string) {
    let records = await db.select({
      id: attendanceTable.id, labourId: attendanceTable.labourId, labourName: labourTable.name,
      date: attendanceTable.date, status: attendanceTable.status, createdAt: attendanceTable.createdAt,
    }).from(attendanceTable).leftJoin(labourTable, eq(attendanceTable.labourId, labourTable.id)).where(eq(attendanceTable.shopId, shopId));
    if (labourId) records = records.filter((r) => r.labourId === labourId);
    if (month) records = records.filter((r) => r.date.startsWith(month));
    return records;
  },
  async upsertAttendance(shopId: string, labourId: string, date: string, status: string) {
    const existing = await db.select().from(attendanceTable).where(
      and(eq(attendanceTable.labourId, labourId), eq(attendanceTable.date, date), eq(attendanceTable.shopId, shopId))
    );
    if (existing.length > 0) {
      const [updated] = await db.update(attendanceTable).set({ status }).where(eq(attendanceTable.id, existing[0].id)).returning();
      return updated;
    }
    const [inserted] = await db.insert(attendanceTable).values({ labourId, date, status, shopId }).returning();
    return inserted;
  },
};
