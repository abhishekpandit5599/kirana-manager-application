import cron from "node-cron";
import { db, shopsTable, shopSettingsTable } from "@workspace/db";
import { reportsService } from "../modules/reports/reports.service";
import { notificationService } from "../modules/notification/notification.service";
import { logger } from "../utils/logger";
import { eq } from "drizzle-orm";
import { sendWhatsAppTemplate } from "../utils/whatsapp-cloud"; // 👈 NEW

export function startCronJobs() {
  cron.schedule("0 22 * * *", async () => {
    logger.info("Running daily report cron job...");

    try {
      const shops = await db.select().from(shopsTable);

      for (const shop of shops) {
        try {
          const report = await reportsService.getDailyReport(shop.id);

          const topItem =
            report.topItems?.length > 0
              ? report.topItems.slice(0, 3).map((i) => i.itemName).join(", ")
              : "N/A";

          const lowStockText =
            report.lowStockItems?.length > 0
              ? `${report.lowStockItems.length} items`
              : "All good";

          const message =
            `Daily Report (${report.date})\n` +
            `💰 Sales: ₹${report.totalSales}\n` +
            `📊 Profit: ₹${report.estimatedProfit}\n` +
            `📄 Invoices: ${report.invoiceCount}\n` +
            `⚠️ Low Stock: ${lowStockText}\n` +
            `🏆 Top: ${topItem}`;

          await notificationService.createNotification(
            shop.id,
            "system",
            "Daily Report",
            message
          );

          const [settings] = await db
            .select()
            .from(shopSettingsTable)
            .where(eq(shopSettingsTable.shopId, shop.id));

          if (settings?.ownerWhatsapp) {
            // Normalize phone
            const phone = settings.ownerWhatsapp.startsWith("+")
              ? settings.ownerWhatsapp.replace("+", "")
              : `91${settings.ownerWhatsapp}`;

            await sendWhatsAppTemplate({
              to: phone,
              templateName: "daily_report",
              params: [
                shop.name,
                String(report.totalSales),
                String(report.estimatedProfit),
                String(report.invoiceCount),
                lowStockText,
                topItem,
              ],
            });
          }

          logger.info({ shopId: shop.id }, "Daily report sent");
        } catch (err) {
          logger.error({ err, shopId: shop.id }, "Failed for shop");
        }
      }
    } catch (err) {
      logger.error({ err }, "Cron failed");
    }
  }, {
    timezone: "Asia/Kolkata",
  });

  logger.info("Cron started: every 30 seconds (dev mode)");
}