import { useLanguage } from "@/hooks/use-language";
import { 
  useGetDashboard, 
  useGetSalesAnalytics, 
  useGetTopItems 
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { 
  IndianRupee, 
  Receipt, 
  AlertTriangle, 
  Bell, 
  ScanLine, 
  Mic, 
  Plus,
  Loader2
} from "lucide-react";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar
} from "recharts";
import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function Dashboard() {
  const { t } = useLanguage();
  const { data: dashboard, isLoading: dashboardLoading } = useGetDashboard();
  
  const [analyticsPeriod, setAnalyticsPeriod] = useState<"daily" | "weekly" | "monthly">("daily");
  const { data: analytics, isLoading: analyticsLoading } = useGetSalesAnalytics({ period: analyticsPeriod });
  
  const { data: topItems, isLoading: topItemsLoading } = useGetTopItems();

  if (dashboardLoading) {
    return (
      <div className="h-[50vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">{t("Dashboard", "डैशबोर्ड")}</h1>
          <p className="text-muted-foreground">{t("Welcome back to your store", "आपकी दुकान में वापसी पर स्वागत है")}</p>
        </div>
        
        {/* Quick Actions */}
        <div className="flex flex-wrap gap-2">
          <Link href="/billing">
            <Button className="h-12 text-base shadow-md">
              <Plus className="mr-2 h-5 w-5" />
              {t("New Invoice", "नया बिल")}
            </Button>
          </Link>
          <Link href="/ai-ocr">
            <Button variant="secondary" className="h-12 text-base shadow-md">
              <ScanLine className="mr-2 h-5 w-5" />
              {t("Scan List", "स्कैन")}
            </Button>
          </Link>
          <Link href="/ai-voice">
            <Button variant="outline" className="h-12 text-base bg-white shadow-sm">
              <Mic className="mr-2 h-5 w-5 text-primary" />
              {t("Voice", "आवाज़")}
            </Button>
          </Link>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-primary text-primary-foreground shadow-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-medium">{t("Today's Sales", "आज की बिक्री")}</CardTitle>
            <IndianRupee className="h-5 w-5 opacity-80" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{formatCurrency(dashboard?.todaySales || 0)}</div>
            <p className="text-sm opacity-80 mt-1">
              {dashboard?.todayInvoices || 0} {t("invoices today", "बिल आज")}
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-medium text-muted-foreground">{t("Monthly Sales", "महीने की बिक्री")}</CardTitle>
            <Receipt className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{formatCurrency(dashboard?.monthlySales || 0)}</div>
            <p className="text-sm text-muted-foreground mt-1">
              {t("Estimated Profit:", "अनुमानित लाभ:")} <span className="text-secondary font-medium">{formatCurrency(dashboard?.estimatedProfit || 0)}</span>
            </p>
          </CardContent>
        </Card>

        <Card className={`shadow-sm ${(dashboard?.lowStockCount || 0) > 0 ? 'border-destructive' : ''}`}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-medium text-muted-foreground">{t("Low Stock", "कम सामान")}</CardTitle>
            <AlertTriangle className={`h-5 w-5 ${(dashboard?.lowStockCount || 0) > 0 ? 'text-destructive' : 'text-muted-foreground'}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${(dashboard?.lowStockCount || 0) > 0 ? 'text-destructive' : 'text-foreground'}`}>
              {dashboard?.lowStockCount || 0} {t("items", "सामान")}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {dashboard?.totalItems || 0} {t("total items in store", "कुल सामान")}
            </p>
          </CardContent>
        </Card>

        <Card className={`shadow-sm ${(dashboard?.unreadNotifications || 0) > 0 ? 'border-primary' : ''}`}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-medium text-muted-foreground">{t("Notifications", "सूचनाएं")}</CardTitle>
            <Bell className={`h-5 w-5 ${(dashboard?.unreadNotifications || 0) > 0 ? 'text-primary' : 'text-muted-foreground'}`} />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">
              {dashboard?.unreadNotifications || 0}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {t("unread messages", "नये संदेश")}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Chart */}
        <Card className="lg:col-span-2 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xl font-bold">{t("Sales Analytics", "बिक्री ग्राफ")}</CardTitle>
            <Select 
              value={analyticsPeriod} 
              onValueChange={(val: any) => setAnalyticsPeriod(val)}
            >
              <SelectTrigger className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">{t("Daily", "दैनिक")}</SelectItem>
                <SelectItem value="weekly">{t("Weekly", "साप्ताहिक")}</SelectItem>
                <SelectItem value="monthly">{t("Monthly", "मासिक")}</SelectItem>
              </SelectContent>
            </Select>
          </CardHeader>
          <CardContent>
            {analyticsLoading ? (
              <div className="h-[300px] flex items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : analytics && analytics.length > 0 ? (
              <div className="h-[300px] w-full mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={analytics} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={(val) => {
                        if (analyticsPeriod === 'daily') return val.split('T')[0];
                        return val;
                      }}
                      stroke="#888888" 
                      fontSize={12} 
                      tickLine={false} 
                      axisLine={false} 
                    />
                    <YAxis 
                      stroke="#888888" 
                      fontSize={12} 
                      tickLine={false} 
                      axisLine={false} 
                      tickFormatter={(value) => `₹${value}`}
                    />
                    <Tooltip 
                      formatter={(value: number) => [`₹${value}`, t("Sales", "बिक्री")]}
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="sales" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={3} 
                      dot={{ r: 4, strokeWidth: 2 }} 
                      activeDot={{ r: 6 }} 
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                {t("No sales data available", "कोई बिक्री डेटा उपलब्ध नहीं है")}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Items */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl font-bold">{t("Top Selling Items", "सबसे ज्यादा बिकने वाला सामान")}</CardTitle>
          </CardHeader>
          <CardContent>
            {topItemsLoading ? (
              <div className="h-[300px] flex items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : topItems && topItems.length > 0 ? (
              <div className="space-y-4 mt-2">
                {topItems.map((item, index) => (
                  <div key={item.itemId} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{item.itemName}</p>
                        <p className="text-xs text-muted-foreground">{item.totalQuantitySold} {t("sold", "बिका")}</p>
                      </div>
                    </div>
                    <div className="font-bold text-foreground">
                      {formatCurrency(item.totalRevenue)}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                {t("No item data available", "कोई सामान डेटा उपलब्ध नहीं है")}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
