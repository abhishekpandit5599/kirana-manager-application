import { Router, type IRouter } from "express";
import { db, labourTable, attendanceTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { authMiddleware, getShop } from "../lib/auth";
import { CreateLabourBody, UpdateLabourBody, MarkAttendanceBody, ListAttendanceQueryParams, GetLabourSalaryQueryParams } from "@workspace/api-zod";

const router: IRouter = Router();

function formatLabour(labour: typeof labourTable.$inferSelect) {
  return {
    id: labour.id,
    name: labour.name,
    phone: labour.phone,
    role: labour.role,
    salaryPerMonth: parseFloat(labour.salaryPerMonth),
    isActive: labour.isActive,
    createdAt: labour.createdAt.toISOString(),
  };
}

router.get("/labour", authMiddleware, async (req, res): Promise<void> => {
  const shop = getShop(req);
  const labours = await db.select().from(labourTable).where(eq(labourTable.shopId, shop.id));
  res.json(labours.map(formatLabour));
});

router.post("/labour", authMiddleware, async (req, res): Promise<void> => {
  const shop = getShop(req);
  const parsed = CreateLabourBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [labour] = await db.insert(labourTable).values({
    name: parsed.data.name,
    phone: parsed.data.phone ?? null,
    role: parsed.data.role ?? null,
    salaryPerMonth: parsed.data.salaryPerMonth.toString(),
    shopId: shop.id,
  }).returning();
  res.status(201).json(formatLabour(labour));
});

router.get("/labour/:id", authMiddleware, async (req, res): Promise<void> => {
  const shop = getShop(req);
  const id = req.params.id;
  const [labour] = await db.select().from(labourTable).where(and(eq(labourTable.id, id), eq(labourTable.shopId, shop.id)));
  if (!labour) {
    res.status(404).json({ error: "Labour not found" });
    return;
  }
  res.json(formatLabour(labour));
});

router.patch("/labour/:id", authMiddleware, async (req, res): Promise<void> => {
  const shop = getShop(req);
  const id = req.params.id;
  const parsed = UpdateLabourBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const updateData: Record<string, unknown> = {};
  const d = parsed.data;
  if (d.name !== undefined) updateData.name = d.name;
  if (d.phone !== undefined) updateData.phone = d.phone;
  if (d.role !== undefined) updateData.role = d.role;
  if (d.salaryPerMonth !== undefined) updateData.salaryPerMonth = d.salaryPerMonth.toString();
  if (d.isActive !== undefined) updateData.isActive = d.isActive;

  const [labour] = await db.update(labourTable).set(updateData as any).where(and(eq(labourTable.id, id), eq(labourTable.shopId, shop.id))).returning();
  if (!labour) {
    res.status(404).json({ error: "Labour not found" });
    return;
  }
  res.json(formatLabour(labour));
});

router.delete("/labour/:id", authMiddleware, async (req, res): Promise<void> => {
  const shop = getShop(req);
  const id = req.params.id;
  const [labour] = await db.delete(labourTable).where(and(eq(labourTable.id, id), eq(labourTable.shopId, shop.id))).returning();
  if (!labour) {
    res.status(404).json({ error: "Labour not found" });
    return;
  }
  res.sendStatus(204);
});

router.get("/labour/:id/salary", authMiddleware, async (req, res): Promise<void> => {
  const shop = getShop(req);
  const id = req.params.id;
  const queryParsed = GetLabourSalaryQueryParams.safeParse(req.query);
  const month = queryParsed.success && queryParsed.data.month ? queryParsed.data.month : new Date().toISOString().slice(0, 7);

  const [labour] = await db.select().from(labourTable).where(and(eq(labourTable.id, id), eq(labourTable.shopId, shop.id)));
  if (!labour) {
    res.status(404).json({ error: "Labour not found" });
    return;
  }

  const attendanceRecords = await db.select().from(attendanceTable).where(
    and(eq(attendanceTable.labourId, id), eq(attendanceTable.shopId, shop.id))
  );

  const monthRecords = attendanceRecords.filter((a) => a.date.startsWith(month));
  const presentDays = monthRecords.filter((a) => a.status === "present").length;
  const halfDays = monthRecords.filter((a) => a.status === "half").length;
  const absentDays = monthRecords.filter((a) => a.status === "absent").length;

  const year = parseInt(month.split("-")[0]);
  const mon = parseInt(month.split("-")[1]) - 1;
  const totalDays = new Date(year, mon + 1, 0).getDate();

  const baseSalary = parseFloat(labour.salaryPerMonth);
  const perDay = baseSalary / totalDays;
  const calculatedSalary = Math.round((presentDays + halfDays * 0.5) * perDay * 100) / 100;

  res.json({
    labourId: labour.id,
    labourName: labour.name,
    month,
    totalDays,
    presentDays,
    halfDays,
    absentDays,
    baseSalary,
    calculatedSalary,
  });
});

router.get("/attendance", authMiddleware, async (req, res): Promise<void> => {
  const shop = getShop(req);
  const parsed = ListAttendanceQueryParams.safeParse(req.query);

  let records = await db.select({
    id: attendanceTable.id,
    labourId: attendanceTable.labourId,
    labourName: labourTable.name,
    date: attendanceTable.date,
    status: attendanceTable.status,
    createdAt: attendanceTable.createdAt,
  }).from(attendanceTable)
    .leftJoin(labourTable, eq(attendanceTable.labourId, labourTable.id))
    .where(eq(attendanceTable.shopId, shop.id));

  if (parsed.success && parsed.data.labourId) {
    records = records.filter((r) => r.labourId === parsed.data.labourId);
  }
  if (parsed.success && parsed.data.month) {
    records = records.filter((r) => r.date.startsWith(parsed.data.month!));
  }

  res.json(records.map((r) => ({
    id: r.id,
    labourId: r.labourId,
    labourName: r.labourName ?? "",
    date: r.date,
    status: r.status,
    createdAt: r.createdAt.toISOString(),
  })));
});

router.post("/attendance", authMiddleware, async (req, res): Promise<void> => {
  const shop = getShop(req);
  const parsed = MarkAttendanceBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { labourId, date, status } = parsed.data;

  const [labour] = await db.select().from(labourTable).where(and(eq(labourTable.id, labourId), eq(labourTable.shopId, shop.id)));
  if (!labour) {
    res.status(404).json({ error: "Labour not found" });
    return;
  }

  const existing = await db.select().from(attendanceTable).where(
    and(eq(attendanceTable.labourId, labourId), eq(attendanceTable.date, date), eq(attendanceTable.shopId, shop.id))
  );

  let record;
  if (existing.length > 0) {
    const [updated] = await db.update(attendanceTable).set({ status }).where(eq(attendanceTable.id, existing[0].id)).returning();
    record = updated;
  } else {
    const [inserted] = await db.insert(attendanceTable).values({
      labourId,
      date,
      status,
      shopId: shop.id,
    }).returning();
    record = inserted;
  }

  res.status(201).json({
    id: record.id,
    labourId: record.labourId,
    labourName: labour.name,
    date: record.date,
    status: record.status,
    createdAt: record.createdAt.toISOString(),
  });
});

export default router;
