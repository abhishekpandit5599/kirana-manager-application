import { useState, useMemo, useEffect } from "react";
import { useLanguage } from "@/hooks/use-language";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import {
  useCreateInvoice,
  getListItemsQueryKey
} from "@workspace/api-client-react";
import { useQueryClient, useInfiniteQuery } from "@tanstack/react-query";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/store";
import { clearAiExtractedItems } from "@/store/slices/billingSlice";
import { getUpiQr, handleResponse } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  Plus,
  Minus,
  Trash2,
  Receipt,
  IndianRupee,
  QrCode,
  CheckCircle2,
  Loader2
} from "lucide-react";
import { Item } from "@workspace/api-client-react";
import { ErrorState } from "@/components/error-state";
import { useInView } from "react-intersection-observer";

interface CartItem extends Item {
  cartQuantity: number;
  displayUnit: string;
}

const UNIT_OPTIONS: Record<string, string[]> = {
  kg: ["kg", "gm"],
  gm: ["kg", "gm"],
  litre: ["litre", "ml"],
  liter: ["litre", "ml"],
  ltr: ["ltr", "ml"],
  ml: ["ltr", "ml"],
  pcs: ["pcs"],
  pc: ["pcs"],
  pack: ["pack"],
  packet: ["packet"],
  box: ["box"],
  nos: ["nos"],
  dozen: ["dozen"],
};

const convertQuantity = (quantity: number, fromUnit: string, toUnit: string): number => {
  const from = fromUnit.toLowerCase();
  const to = toUnit.toLowerCase();
  
  if (from === to) return quantity;
  
  // Weights
  if (from === "kg" && (to === "gm" || to === "gram")) return quantity * 1000;
  if ((from === "gm" || from === "gram") && to === "kg") return quantity / 1000;
  
  // Volumes
  if ((from === "litre" || from === "liter" || from === "ltr") && to === "ml") return quantity * 1000;
  if (from === "ml" && (to === "litre" || to === "liter" || to === "ltr")) return quantity / 1000;

  return quantity;
};

export default function Billing() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const dispatch = useDispatch();
  const aiExtractedItems = useSelector((state: RootState) => state.billing.aiExtractedItems);
  const { ref, inView } = useInView();

  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "upi">("cash");
  const [isSuccess, setIsSuccess] = useState(false);
  const [customerError, setCustomerError] = useState("");
  const [upiQrData, setUpiQrData] = useState<string | null>(null);
  const [upiLoading, setUpiLoading] = useState(false);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: itemsLoading,
    isError,
    error,
    refetch
  } = useInfiniteQuery({
    queryKey: ['/api/items', debouncedSearch],
    queryFn: async ({ pageParam = 0 }) => {
      const res = await fetch(`/api/items?offset=${pageParam}&limit=20&q=${encodeURIComponent(debouncedSearch)}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem("kirana_token")}` }
      });
      return handleResponse(res);
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.length === 20 ? allPages.length * 20 : undefined;
    },
  });

  const items = data?.pages.flat() || [];

  useEffect(() => {
    if (inView && hasNextPage) {
      fetchNextPage();
    }
  }, [inView, fetchNextPage, hasNextPage]);

  const createInvoice = useCreateInvoice();

  const addToCart = (item: Item) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        return prev.map(i => i.id === item.id ? { ...i, cartQuantity: i.cartQuantity + 1 } : i);
      }
      return [...prev, { ...item, cartQuantity: 1, displayUnit: item.unit }];
    });
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQ = Math.max(1, item.cartQuantity + delta);
        return { ...item, cartQuantity: newQ };
      }
      return item;
    }));
  };

  const setQuantityDirect = (id: string, val: string) => {
    if (val === "" || val === "0") {
      setCart(prev => prev.map(item => item.id === id ? { ...item, cartQuantity: 0 } : item));
      return;
    }
    const n = parseFloat(val);
    if (isNaN(n) || n < 0) return;
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const internalQty = convertQuantity(n, item.displayUnit, item.unit);
        return { ...item, cartQuantity: internalQty };
      }
      return item;
    }));
  };

  const changeUnit = (id: string, newUnit: string) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        return { ...item, displayUnit: newUnit };
      }
      return item;
    }));
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const cartTotal = Math.round(cart.reduce((sum, item) => sum + (item.price * item.cartQuantity), 0) * 100) / 100;

  useEffect(() => {
    if (paymentMethod === "upi" && cart.length > 0 && cartTotal > 0) {
      setUpiLoading(true);
      getUpiQr(cartTotal)
        .then((data) => { setUpiQrData(data.qrDataUrl); })
        .catch(() => { setUpiQrData(null); })
        .finally(() => setUpiLoading(false));
    } else {
      setUpiQrData(null);
    }
  }, [paymentMethod, cartTotal, cart.length]);

  useEffect(() => {
    if (items && items.length > 0 && aiExtractedItems && aiExtractedItems.length > 0) {
      const itemsToAdd: CartItem[] = [];
      aiExtractedItems.forEach(aiItem => {
        if (aiItem.matchedItemId) {
          const matchedAPIItem = items.find(i => i.id === aiItem.matchedItemId);
          if (matchedAPIItem) {
            const internalQty = convertQuantity(aiItem.quantity, aiItem.unit, matchedAPIItem.unit);
            itemsToAdd.push({ 
              ...matchedAPIItem, 
              cartQuantity: internalQty,
              displayUnit: aiItem.unit
            });
          }
        }
      });
      
      if (itemsToAdd.length > 0) {
        setCart(prev => {
          const newCart = [...prev];
          itemsToAdd.forEach(newItem => {
            const existingIndex = newCart.findIndex(c => c.id === newItem.id);
            if (existingIndex > -1) {
              newCart[existingIndex] = { 
                ...newCart[existingIndex], 
                cartQuantity: newCart[existingIndex].cartQuantity + newItem.cartQuantity 
              };
            } else {
              newCart.push(newItem);
            }
          });
          return newCart;
        });
        toast({ title: t("AI Items added to bill!", "AI सामान बिल में जोड़े गए!") });
      }
      dispatch(clearAiExtractedItems());
    }
  }, [items, aiExtractedItems, dispatch, t, toast]);

  const validateCustomer = (): boolean => {
    if (customerName && !customerPhone) {
      setCustomerError(t("Phone number is required when name is provided", "नाम दिए जाने पर फ़ोन नंबर ज़रूरी है"));
      return false;
    }
    if (customerPhone && !customerName) {
      setCustomerError(t("Customer name is required when phone is provided", "फ़ोन दिए जाने पर ग्राहक का नाम ज़रूरी है"));
      return false;
    }
    setCustomerError("");
    return true;
  };

  const submitInvoice = () => {
    if (cart.length === 0) return;
    if (!validateCustomer()) return;
    createInvoice.mutate({
      data: {
        customerName: customerName || undefined,
        customerPhone: customerPhone || undefined,
        paymentMethod,
        items: cart.map(item => ({ itemId: item.id, quantity: item.cartQuantity }))
      }
    }, {
      onSuccess: () => {
        setIsSuccess(true);
        setCustomerError("");
        queryClient.invalidateQueries({ queryKey: getListItemsQueryKey() });
        setTimeout(() => {
          setIsSuccess(false);
          setCart([]);
          setCustomerName("");
          setCustomerPhone("");
          setLocation("/invoices");
        }, 2000);
      },
      onError: (err: any) => {
        const msg = err?.response?.data?.error || err?.message || t("Failed to create invoice", "बिल बनाने में विफल");
        toast({ variant: "destructive", title: t("Error", "त्रुटि"), description: msg });
      }
    });
  };

  if (isSuccess) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center space-y-4">
        <div className="w-16 h-16 bg-secondary/20 rounded-full flex items-center justify-center animate-in zoom-in">
          <CheckCircle2 className="h-9 w-9 text-secondary" />
        </div>
        <h2 className="text-xl font-bold">{t("Invoice Saved!", "बिल सेव हो गया!")}</h2>
        <p className="text-sm text-muted-foreground">{t("Redirecting to invoices...", "बिल सूची पर जा रहे हैं...")}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row gap-4 h-[calc(100vh-110px)] md:h-[calc(100vh-140px)] min-h-[600px] pt-4 md:pt-6">
      {/* Left: Item picker */}
      <div className="w-full lg:w-3/5 flex flex-col gap-3 h-full">
        <div className="md:sticky md:top-0 z-20 -mx-4 md:-mx-0 px-4 md:px-0 pt-6 pb-4 space-y-4 md:bg-background/95 md:backdrop-blur-md">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold">{t("New Invoice", "नया बिल")}</h1>
          </div>

          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-[#cacbcf] transition-colors" />
            <Input
              placeholder={t("Search items...", "सामान खोजें...")}
              className="pl-12 h-10 text-base bg-white border-[#cacbcf] rounded-xl transition-all hover:border-[#cacbcf] focus:border-[#cacbcf]"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto pr-1">
          {itemsLoading && items.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : isError ? (
            <div className="h-full flex items-center justify-center p-4">
              <ErrorState 
                message={error?.message} 
                onRetry={() => refetch()} 
              />
            </div>
          ) : items.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {items.map(item => {
                const inCart = cart.find(c => c.id === item.id);
                return (
                  <button
                    key={item.id}
                    className={`rounded-lg border p-3 text-left transition-all hover:shadow-sm active:scale-95 ${inCart ? 'border-primary bg-primary/5' : 'border-[#cacbcf]/30 bg-card hover:border-[#cacbcf]'}`}
                    onClick={() => addToCart(item)}
                  >
                    <div className="font-semibold text-sm truncate">{item.name}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{item.category}</div>
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-xs text-muted-foreground">{item.stock} {item.unit}</span>
                      <span className="text-primary font-bold text-sm">₹{item.price}</span>
                    </div>
                    {inCart && (
                      <div className="mt-1.5">
                        <Badge className="text-xs px-1.5 py-0 h-4 bg-primary">×{parseFloat(inCart.cartQuantity.toFixed(3))}</Badge>
                      </div>
                    )}
                  </button>
                );
              })}
              {/* Infinite Scroll Trigger */}
              <div ref={ref} className="col-span-full py-4 flex justify-center">
                {isFetchingNextPage && <Loader2 className="h-5 w-5 animate-spin text-primary" />}
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
              <Search className="h-8 w-8 mb-2 opacity-20" />
              <p className="text-sm">{t("No items found", "कोई सामान नहीं मिला")}</p>
            </div>
          )}
        </div>
      </div>

      {/* Right: Live Invoice */}
      <Card className="w-full lg:w-2/5 flex flex-col shadow border-primary/20 h-full">
        <CardHeader className="bg-primary/5 pb-3 border-b pt-4 px-4">
          <CardTitle className="flex items-center justify-between text-base">
            <span className="flex items-center gap-2">
              <Receipt className="h-4 w-4 text-primary" />
              {t("Invoice", "बिल")}
            </span>
            <Badge className="bg-primary text-primary-foreground text-xs px-2">
              {cart.length} {t("items", "सामान")}
            </Badge>
          </CardTitle>
          <Input
            placeholder={t("Customer Name (optional)", "ग्राहक का नाम (वैकल्पिक)")}
            className={`h-8 text-sm mt-2 border-[#cacbcf]/50 focus:border-primary ${customerError && !customerName ? 'border-destructive' : ''}`}
            value={customerName}
            onChange={(e) => { setCustomerName(e.target.value); setCustomerError(""); }}
          />
          <Input
            placeholder={t("Phone for WhatsApp invoice (optional)", "WhatsApp बिल के लिए फोन (वैकल्पिक)")}
            className={`h-8 text-sm mt-1 border-[#cacbcf]/50 focus:border-primary ${customerError && !customerPhone ? 'border-destructive' : ''}`}
            value={customerPhone}
            onChange={(e) => { setCustomerPhone(e.target.value); setCustomerError(""); }}
          />
          {customerError && (
            <p className="text-xs text-destructive mt-1 font-medium">{customerError}</p>
          )}
        </CardHeader>

        <CardContent className="flex-1 overflow-y-auto p-0">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground p-6 text-center">
              <Receipt className="h-10 w-10 mb-3 opacity-20" />
              <p className="text-sm">{t("Tap items on the left to add them here.", "बाईं ओर से सामान चुनें।")}</p>
            </div>
          ) : (
            <>
              <div className="px-3 py-1.5 bg-muted/40 border-b flex text-xs font-semibold text-muted-foreground">
                <span className="flex-1">{t("Item", "सामान")}</span>
                <span className="w-16 text-center">{t("Qty", "मात्रा")}</span>
                <span className="w-20 text-center">{t("Unit", "इकाई")}</span>
                <span className="w-16 text-right">{t("Amount", "राशि")}</span>
                <span className="w-6"></span>
              </div>
              <div className="divide-y">
                {cart.map((item) => {
                  const displayQty = Math.round(convertQuantity(item.cartQuantity, item.unit, item.displayUnit) * 1000) / 1000;
                  const unitOptions = UNIT_OPTIONS[item.unit.toLowerCase()] || [item.unit];
                  
                  return (
                    <div key={item.id} className="px-3 py-2 flex items-center gap-1 hover:bg-muted/20 text-sm">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{item.name}</div>
                        <div className="text-xs text-muted-foreground">₹{item.price}/{item.unit}</div>
                      </div>
                      <div className="w-16 flex items-center justify-center">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={displayQty === 0 ? "" : displayQty}
                          onChange={e => setQuantityDirect(item.id, e.target.value)}
                          className="w-14 text-center text-sm font-bold bg-transparent border-b border-border outline-none focus:border-primary"
                        />
                      </div>
                      <div className="w-20">
                        <Select value={item.displayUnit} onValueChange={(val) => changeUnit(item.id, val)}>
                          <SelectTrigger className="h-7 px-1 text-[11px] border-none bg-muted/50 hover:bg-muted focus:ring-0">
                            <SelectValue placeholder="Unit" />
                          </SelectTrigger>
                          <SelectContent>
                            {unitOptions.map(u => (
                              <SelectItem key={u} value={u} className="text-xs">{u}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="w-16 text-right font-semibold">
                        ₹{(item.price * item.cartQuantity).toFixed(2)}
                      </div>
                      <Button variant="ghost" size="icon" className="w-6 h-6 text-destructive hover:bg-destructive/10" onClick={() => removeFromCart(item.id)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </CardContent>

        <CardFooter className="flex-none flex-col border-t bg-muted/10 px-4 py-3 space-y-3">
          <div className="w-full flex justify-between items-center">
            <span className="text-sm text-muted-foreground font-medium">{t("Total", "कुल राशि")}</span>
            <span className="text-2xl font-bold text-primary">₹{cartTotal.toFixed(2)}</span>
          </div>
          <div className="w-full">
            <p className="text-xs text-muted-foreground mb-2 font-medium">{t("Payment Method", "भुगतान का तरीका")}</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setPaymentMethod("cash")}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-semibold transition-all ${paymentMethod === "cash" ? "border-primary bg-primary/10 text-primary" : "border-[#cacbcf]/50 text-muted-foreground hover:border-[#cacbcf]"}`}
              >
                <IndianRupee className="h-4 w-4" />
                {t("Cash", "नकद")}
              </button>
              <button
                onClick={() => setPaymentMethod("upi")}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-semibold transition-all ${paymentMethod === "upi" ? "border-primary bg-primary/10 text-primary" : "border-[#cacbcf]/50 text-muted-foreground hover:border-[#cacbcf]"}`}
              >
                <QrCode className="h-4 w-4" />
                UPI
              </button>
            </div>
          </div>

          {paymentMethod === "upi" && cart.length > 0 && (
            <div className="w-full flex flex-col items-center gap-2 p-3 rounded-lg bg-white border border-[#cacbcf]/30">
              {upiLoading ? (
                <div className="w-32 h-32 flex items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : upiQrData ? (
                <>
                  <img src={upiQrData} alt="UPI QR" className="w-36 h-36 rounded" />
                  <p className="text-xs text-muted-foreground text-center font-medium">
                    {t("Show QR to customer to pay", "ग्राहक को QR दिखाएं")} <span className="text-primary font-bold">₹{cartTotal}</span>
                  </p>
                </>
              ) : (
                <div className="flex items-center gap-3 w-full">
                  <div className="w-12 h-12 bg-muted border rounded-md flex items-center justify-center flex-shrink-0">
                    <QrCode className="h-7 w-7 text-foreground/30" />
                  </div>
                  <p className="text-xs text-muted-foreground">{t("Configure UPI ID in Settings to show QR", "QR दिखाने के लिए सेटिंग्स में UPI ID कॉन्फ़िगर करें")}</p>
                </div>
              )}
            </div>
          )}

          <Button
            className="w-full h-10 font-bold text-sm bg-primary hover:bg-primary/90 border-none"
            disabled={cart.length === 0 || createInvoice.isPending}
            onClick={submitInvoice}
          >
            {createInvoice.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
            {t("Confirm & Save Invoice", "बिल पक्का करें")}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
