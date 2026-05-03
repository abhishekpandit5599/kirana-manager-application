import { useState, useEffect } from "react";
import { useLanguage } from "@/hooks/use-language";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { format } from "date-fns";
import { 
  Receipt, 
  Search, 
  FileText, 
  IndianRupee, 
  QrCode,
  Calendar,
  Loader2,
  Download,
  RefreshCw
} from "lucide-react";
import { Input } from "@/components/ui/input";

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
  customerName: string | null;
  customerPhone: string | null;
  items: InvoiceItem[];
  subtotal: number;
  total: number;
  paymentMethod: string;
  status: string;
  pdfUrl: string | null;
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
  const [searchTerm, setSearchTerm] = useState("");
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isPdfLoading, setIsPdfLoading] = useState(false);
  const [isExcelLoading, setIsExcelLoading] = useState(false);

  const fetchInvoices = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/invoices", { headers: getHeaders() });
      if (!res.ok) throw new Error("Failed to fetch invoices");
      const data = await res.json();
      setInvoices(data);
    } catch (err: any) {
      toast({ variant: "destructive", title: t("Error", "त्रुटि"), description: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchInvoices(); }, []);

  const filteredInvoices = invoices.filter(inv => 
    inv.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (inv.customerName && inv.customerName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">{t("Invoice History", "बिल का इतिहास")}</h1>
          <p className="text-muted-foreground">{t("View all past transactions", "सभी पिछले लेनदेन देखें")}</p>
        </div>
        <Button variant="outline" onClick={fetchInvoices} disabled={isLoading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          {t("Refresh", "ताज़ा करें")}
        </Button>
      </div>

      <Card className="shadow-sm">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-6 w-6 text-muted-foreground" />
            <Input 
              placeholder={t("Search by invoice number or customer name...", "बिल नंबर या ग्राहक के नाम से खोजें...")} 
              className="pl-11 h-12 text-lg"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="h-[40vh] flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : filteredInvoices.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredInvoices.map((invoice) => (
            <Card 
              key={invoice.id} 
              className="shadow-sm cursor-pointer hover:border-primary transition-colors"
              onClick={() => setSelectedInvoice(invoice)}
            >
              <CardContent className="p-0">
                <div className="p-4 border-b flex justify-between items-start bg-muted/20">
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
      ) : (
        <Card className="shadow-sm border-dashed">
          <CardContent className="flex flex-col items-center justify-center p-12 text-center">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
              <FileText className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-2">{t("No invoices found", "कोई बिल नहीं मिला")}</h3>
            <p className="text-muted-foreground max-w-md">
              {t("You haven't created any invoices yet. Go to Billing to create one.", "आपने अभी तक कोई बिल नहीं बनाया है। बिलिंग पर जाएं।")}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Invoice Details Dialog */}
      <Dialog open={!!selectedInvoice} onOpenChange={(open) => !open && setSelectedInvoice(null)}>
        <DialogContent className="sm:max-w-[500px]">
          {selectedInvoice ? (
            <>
              <DialogHeader className="border-b pb-4">
                <div className="flex justify-between items-start">
                  <div>
                    <DialogTitle className="text-2xl">{t("Invoice", "बिल")} {selectedInvoice.invoiceNumber}</DialogTitle>
                    <p className="text-muted-foreground mt-1">
                      {format(new Date(selectedInvoice.createdAt), 'dd MMM yyyy, h:mm a')}
                    </p>
                  </div>
                  <Badge variant={selectedInvoice.status === 'paid' ? 'default' : 'destructive'} className="text-sm px-3 py-1 mr-4 mt-1">
                    {selectedInvoice.status === 'paid' ? t("Paid", "भुगतान किया") : t("Unpaid", "बकाया")}
                  </Badge>
                </div>
              </DialogHeader>

              <div className="py-4 space-y-4">
                <div className="flex justify-between text-sm bg-muted/30 p-3 rounded-lg">
                  <div>
                    <p className="text-muted-foreground">{t("Customer", "ग्राहक")}</p>
                    <p className="font-medium text-base">{selectedInvoice.customerName || t("Walk-in Customer", "आम ग्राहक")}</p>
                    {selectedInvoice.customerPhone && (
                      <p className="text-xs text-muted-foreground">{selectedInvoice.customerPhone}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-muted-foreground">{t("Payment", "भुगतान")}</p>
                    <p className="font-medium text-base flex items-center justify-end">
                      {selectedInvoice.paymentMethod === 'cash' ? <IndianRupee className="mr-1 h-4 w-4" /> : <QrCode className="mr-1 h-4 w-4" />}
                      {selectedInvoice.paymentMethod.toUpperCase()}
                    </p>
                  </div>
                </div>

                <div>
                  <h4 className="font-bold text-lg mb-2">{t("Items", "सामान")}</h4>
                  <div className="space-y-3">
                    {selectedInvoice.items.map((item, i) => (
                      <div key={i} className="flex justify-between items-center text-sm border-b pb-2 last:border-0">
                        <div className="flex-1">
                          <p className="font-medium text-base">{item.itemName}</p>
                          <p className="text-muted-foreground">{item.quantity} {item.unit} x ₹{item.price}</p>
                        </div>
                        <div className="font-bold text-base">₹{item.total}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border-t pt-4">
                  <div className="flex justify-between items-center text-xl font-bold">
                    <span>{t("Total Amount", "कुल राशि")}</span>
                    <span className="text-primary">₹{selectedInvoice.total}</span>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button variant="outline" className="flex-1" onClick={() => downloadPdf(selectedInvoice)} disabled={isPdfLoading}>
                    {isPdfLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                    PDF
                  </Button>
                  <Button variant="outline" className="flex-1" onClick={() => downloadExcel(selectedInvoice)} disabled={isExcelLoading}>
                    {isExcelLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                    Excel
                  </Button>
                </div>
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
