import { useState, useEffect, useMemo } from "react";
import { useLanguage } from "@/hooks/use-language";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { format, subMonths, startOfDay, endOfDay } from "date-fns";
import { 
  Receipt, 
  Search, 
  FileText, 
  IndianRupee, 
  QrCode,
  Calendar,
  Loader2,
  Download,
  RefreshCw,
  Filter,
  X,
  ChevronDown,
  Phone
} from "lucide-react";
import { ErrorState } from "@/components/error-state";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useInfiniteQuery } from "@tanstack/react-query";
import { listInvoices } from "@workspace/api-client-react";
import { useInView } from "react-intersection-observer";
import { useDebounce } from "@/hooks/use-debounce";

interface InvoiceItem {
  itemId: string;
  itemName: string;
  quantity: number;
  unit: string;
  price: number;
  total: number;
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  customerName?: string | null;
  customerPhone?: string | null;
  items: InvoiceItem[];
  subtotal: number;
  total: number;
  paymentMethod: string;
  status: string;
  pdfUrl?: string | null;
  createdAt: string;
}

function getHeaders(): Record<string, string> {
  const token = localStorage.getItem("kirana_token");
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return headers;
}

export default function Invoices() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const { ref, inView } = useInView();

  // Filters State
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 500);
  
  const [startDate, setStartDate] = useState<string>(subMonths(new Date(), 1).toISOString());
  const [endDate, setEndDate] = useState<string>(new Date().toISOString());
  const [paymentMethod, setPaymentMethod] = useState<string>("all");
  const [minAmount, setMinAmount] = useState<string>("");
  const [maxAmount, setMaxAmount] = useState<string>("");
  const [showFilters, setShowFilters] = useState(false);

  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isPdfLoading, setIsPdfLoading] = useState(false);
  const [isExcelLoading, setIsExcelLoading] = useState(false);

  // Infinite Query
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    error,
    refetch,
    isRefetching
  } = useInfiniteQuery({
    queryKey: ["invoices", debouncedSearch, startDate, endDate, paymentMethod, minAmount, maxAmount],
    queryFn: ({ pageParam = 0 }) => 
      listInvoices({
        q: debouncedSearch || undefined,
        startDate,
        endDate,
        paymentMethod: paymentMethod === "all" ? undefined : (paymentMethod as any),
        minAmount: minAmount ? parseFloat(minAmount) : undefined,
        maxAmount: maxAmount ? parseFloat(maxAmount) : undefined,
        limit: 20,
        offset: pageParam
      }),
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.length < 20) return undefined;
      return allPages.length * 20;
    },
    initialPageParam: 0,
  });

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  const invoices = useMemo(() => {
    return data?.pages.flat() || [];
  }, [data]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatQuantity = (quantity: number | string, unit: string) => {
    const q = parseFloat(quantity.toString());
    const u = unit.toLowerCase();
    if (q < 1 && q > 0) {
      if (u === 'kg') return `${Math.round(q * 1000)} gm`;
      if (u === 'litre' || u === 'ltr' || u === 'liter') return `${Math.round(q * 1000)} ml`;
    }
    return `${parseFloat(q.toFixed(3))} ${unit}`;
  };

  const downloadPdf = async (invoice: Invoice) => {
    setIsPdfLoading(true);
    try {
      const res = await fetch(`/api/invoices/${invoice.id}/pdf`, { headers: getHeaders() });
      if (!res.ok) throw new Error("Failed to download PDF");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${invoice.invoiceNumber}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err.message });
    } finally {
      setIsPdfLoading(false);
    }
  };

  const downloadExcel = async (invoice: Invoice) => {
    setIsExcelLoading(true);
    try {
      const res = await fetch(`/api/invoices/${invoice.id}/excel`, { headers: getHeaders() });
      if (!res.ok) throw new Error("Failed to download Excel");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${invoice.invoiceNumber}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err.message });
    } finally {
      setIsExcelLoading(false);
    }
  };

  const clearFilters = () => {
    setStartDate(subMonths(new Date(), 1).toISOString());
    setEndDate(new Date().toISOString());
    setPaymentMethod("all");
    setMinAmount("");
    setMaxAmount("");
    setSearchTerm("");
  };

  return (
    <div className="space-y-6">
      {/* Sticky Header Section */}
      <div className="sticky top-0 z-20 -mx-4 md:-mx-6 px-4 md:px-6 pt-6 pb-4 space-y-4 bg-background/95 backdrop-blur-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">{t("Invoice History", "बिल का इतिहास")}</h1>
            <p className="text-muted-foreground">{t("View all past transactions", "सभी पिछले लेनदेन देखें")}</p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => setShowFilters(!showFilters)}
              className={showFilters ? "border-primary text-primary bg-primary/5" : "border-[#cacbcf] hover:border-[#cacbcf] transition-colors"}
            >
              <Filter className="mr-2 h-4 w-4" />
              {t("Filters", "फ़िल्टर")}
            </Button>
            <Button variant="outline" onClick={() => refetch()} disabled={isLoading || isRefetching} className="border-[#cacbcf] hover:border-[#cacbcf] transition-colors">
              <RefreshCw className={`mr-2 h-4 w-4 ${isRefetching ? 'animate-spin' : ''}`} />
              {t("Refresh", "ताज़ा करें")}
            </Button>
          </div>
        </div>

        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-[#cacbcf] transition-colors" />
          <Input 
            placeholder={t("Search invoices...", "बिल खोजें...")} 
            className="pl-12 h-12 text-lg bg-white border-[#cacbcf] rounded-xl transition-all focus:border-[#cacbcf]" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {showFilters && (
          <Card className="border-[#cacbcf] bg-white animate-in fade-in slide-in-from-top-2 shadow-sm">
            <CardContent className="p-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">{t("From Date", "से तिथि")}</label>
                  <Input 
                    type="date" 
                    className="border-[#cacbcf] bg-white"
                    value={startDate.split('T')[0]}
                    onChange={(e) => setStartDate(new Date(e.target.value).toISOString())}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">{t("To Date", "तक तिथि")}</label>
                  <Input 
                    type="date" 
                    className="border-[#cacbcf] bg-white"
                    value={endDate.split('T')[0]}
                    onChange={(e) => setEndDate(new Date(e.target.value).toISOString())}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">{t("Payment Mode", "भुगतान का तरीका")}</label>
                  <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                    <SelectTrigger className="border-[#cacbcf] bg-white">
                      <SelectValue placeholder={t("Select Mode", "तरीका चुनें")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t("All", "सभी")}</SelectItem>
                      <SelectItem value="cash">{t("Cash", "नकद")}</SelectItem>
                      <SelectItem value="upi">UPI</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">{t("Amount Range", "राशि सीमा")}</label>
                  <div className="flex items-center gap-2">
                    <Input 
                      placeholder="Min" 
                      type="number" 
                      className="border-[#cacbcf] bg-white" 
                      value={minAmount}
                      onChange={(e) => setMinAmount(e.target.value)}
                    />
                    <span>-</span>
                    <Input 
                      placeholder="Max" 
                      type="number" 
                      className="border-[#cacbcf] bg-white" 
                      value={maxAmount}
                      onChange={(e) => setMaxAmount(e.target.value)}
                    />
                  </div>
                </div>
              </div>
              <div className="flex justify-end">
                <Button variant="ghost" size="sm" onClick={clearFilters} className="text-muted-foreground h-8 text-xs">
                  <X className="mr-1 h-3 w-3" />
                  {t("Clear All Filters", "सभी फ़िल्टर हटाएँ")}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="pt-2">
        {isLoading ? (
          <div className="h-[40vh] flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : isError ? (
          <ErrorState 
            message={error?.message} 
            onRetry={() => refetch()} 
          />
        ) : invoices.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {invoices.map((invoice) => (
                <Card 
                  key={invoice.id} 
                  className="shadow-sm cursor-pointer hover:border-[#cacbcf] transition-colors group"
                  onClick={() => setSelectedInvoice(invoice)}
                >
                  <CardContent className="p-0">
                    <div className="p-4 border-b flex justify-between items-start bg-muted/20 group-hover:bg-muted/30 transition-colors">
                      <div>
                        <h3 className="font-bold text-lg text-foreground">{invoice.invoiceNumber}</h3>
                        <p className="text-sm text-muted-foreground flex items-center mt-1">
                          <Calendar className="mr-1 h-3 w-3" />
                          {format(new Date(invoice.createdAt), 'dd MMM yyyy, h:mm a')}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-xl text-primary">{formatCurrency(invoice.total)}</div>
                      </div>
                    </div>
                    <div className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{invoice.customerName || t("Walk-in Customer", "आम ग्राहक")}</span>
                      </div>
                      <div className="flex gap-2">
                        {invoice.paymentMethod === 'cash' ? (
                          <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">
                            <IndianRupee className="mr-1 h-3 w-3" /> {t("Cash", "नकद")}
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-secondary/5 text-secondary border-secondary/20">
                            <QrCode className="mr-1 h-3 w-3" /> UPI
                          </Badge>
                        )}
                        <Badge variant={invoice.status === 'paid' ? 'default' : 'destructive'}>
                          {invoice.status === 'paid' ? t("Paid", "भुगतान") : t("Unpaid", "बकाया")}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            
            {/* Intersection Observer Trigger */}
            <div ref={ref} className="h-10 flex items-center justify-center py-8">
              {isFetchingNextPage ? (
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              ) : hasNextPage ? (
                <p className="text-sm text-muted-foreground">{t("Scroll for more", "और देखने के लिए स्क्रॉल करें")}</p>
              ) : (
                <p className="text-sm text-muted-foreground">{t("End of history", "इतिहास का अंत")}</p>
              )}
            </div>
          </>
        ) : (
          <Card className="shadow-sm border-dashed">
            <CardContent className="flex flex-col items-center justify-center p-12 text-center">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                <FileText className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">{t("No invoices found", "कोई बिल नहीं मिला")}</h3>
              <p className="text-muted-foreground max-w-md">
                {t("Try adjusting your filters or search term.", "अपने फ़िल्टर या खोज शब्द को बदलने का प्रयास करें।")}
              </p>
              <Button variant="outline" className="mt-4 border-[#cacbcf]" onClick={clearFilters}>
                {t("Reset All Filters", "सभी फ़िल्टर रीसेट करें")}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Invoice Details Dialog */}
      <Dialog open={!!selectedInvoice} onOpenChange={(open) => !open && setSelectedInvoice(null)}>
        <DialogContent className="sm:max-w-[600px] w-[95vw] h-[90vh] sm:h-auto sm:max-h-[90vh] p-0 overflow-hidden border-none shadow-2xl flex flex-col">
          {selectedInvoice ? (
            <div className="flex flex-col h-full bg-white animate-in fade-in slide-in-from-bottom-4 duration-300 overflow-hidden">
              <div className="p-6 sm:p-8 border-b bg-muted/10 flex-none relative">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <h2 className="text-3xl font-black tracking-tight text-foreground flex items-center gap-2">
                      <Receipt className="h-7 w-7 text-primary" />
                      {t("Invoice", "बिल")} 
                      <span className="text-muted-foreground font-medium text-xl">#{selectedInvoice.invoiceNumber}</span>
                    </h2>
                    <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">
                      {format(new Date(selectedInvoice.createdAt), 'dd MMMM yyyy • h:mm a')}
                    </p>
                  </div>
                  <Badge variant={selectedInvoice.status === 'paid' ? 'default' : 'destructive'} className="text-xs px-4 py-1.5 font-bold uppercase tracking-widest rounded-full">
                    {selectedInvoice.status === 'paid' ? t("Paid", "पूर्ण भुगतान") : t("Unpaid", "बकाया")}
                  </Badge>
                </div>
              </div>

              <div className="p-6 sm:p-8 space-y-8 overflow-y-auto flex-1 custom-scrollbar">
                {/* Billing Details Grid */}
                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <h4 className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.2em]">{t("Billed To", "ग्राहक विवरण")}</h4>
                    <div className="space-y-1">
                      <p className="font-bold text-xl text-foreground leading-tight">{selectedInvoice.customerName || t("Walk-in Customer", "आम ग्राहक")}</p>
                      {selectedInvoice.customerPhone && (
                        <p className="text-base text-slate-500 font-medium flex items-center gap-1.5">
                          <Phone className="h-4 w-4" />
                          {selectedInvoice.customerPhone}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="space-y-2 text-right">
                    <h4 className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.2em]">{t("Payment Mode", "भुगतान विधि")}</h4>
                    <div className="flex flex-col items-end">
                      <div className="flex items-center gap-2 bg-primary/5 text-primary px-3 py-1.5 rounded-xl border border-primary/10">
                        {selectedInvoice.paymentMethod === 'cash' ? <IndianRupee className="h-4 w-4" /> : <QrCode className="h-4 w-4" />}
                        <span className="font-bold uppercase text-sm tracking-widest">{selectedInvoice.paymentMethod}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Items Table */}
                <div className="space-y-4">
                  <h4 className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.2em]">{t("Items Purchased", "सामान सूची")}</h4>
                  <div className="space-y-4">
                    {selectedInvoice.items.map((item, i) => (
                      <div key={i} className="flex justify-between items-center group">
                        <div className="space-y-1">
                          <p className="font-bold text-lg text-foreground group-hover:text-primary transition-colors">{item.itemName}</p>
                          <p className="text-xs font-bold text-muted-foreground bg-muted/50 inline-block px-2 py-0.5 rounded">
                            {formatQuantity(item.quantity, item.unit)} × ₹{parseFloat(item.price.toString()).toFixed(2)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-black text-xl text-foreground">₹{parseFloat(item.total.toString()).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Calculation Summary */}
                <div className="pt-8 border-t-2 border-dashed border-muted">
                  <div className="flex justify-between items-center bg-primary/5 p-6 rounded-[2rem] border border-primary/10">
                    <div className="space-y-1">
                      <span className="text-sm font-black uppercase text-primary tracking-widest">{t("Grand Total", "कुल राशि")}</span>
                      <p className="text-xs text-muted-foreground font-bold">{selectedInvoice.items.length} {t("Items included", "सामान शामिल")}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-4xl font-black text-primary tracking-tight">₹{parseFloat(selectedInvoice.total.toString()).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="p-6 sm:p-8 bg-muted/5 border-t flex flex-col sm:flex-row gap-3 sm:gap-4 flex-none">
                <Button variant="outline" className="flex-1 h-14 rounded-2xl border-[#cacbcf] font-bold text-lg hover:bg-white hover:scale-[1.02] transition-all" onClick={() => downloadPdf(selectedInvoice)} disabled={isPdfLoading}>
                  {isPdfLoading ? <Loader2 className="mr-3 h-5 w-5 animate-spin" /> : <Download className="mr-3 h-5 w-5" />}
                  {t("Download PDF", "PDF डाउनलोड")}
                </Button>
                <Button variant="outline" className="flex-1 h-14 rounded-2xl border-[#cacbcf] font-bold text-lg hover:bg-white hover:scale-[1.02] transition-all" onClick={() => downloadExcel(selectedInvoice)} disabled={isExcelLoading}>
                  {isExcelLoading ? <Loader2 className="mr-3 h-5 w-5 animate-spin" /> : <Download className="mr-3 h-5 w-5" />}
                  {t("Excel Export", "एक्सेल फ़ाइल")}
                </Button>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
