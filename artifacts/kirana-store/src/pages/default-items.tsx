import { useState, useEffect, useMemo } from "react";
import { useLanguage } from "@/hooks/use-language";
import { useToast } from "@/hooks/use-toast";
import { addDefaultItems, getDefaultCategories } from "@/lib/api";
import { getDefaultItems } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Search, ShoppingCart, Package } from "lucide-react";
import { ErrorState } from "@/components/error-state";
import { useLocation } from "wouter";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { useInView } from "react-intersection-observer";
import { useDebounce } from "@/hooks/use-debounce";

interface DefaultItem { id: string; name: string; category: string; price: number | string; unit: string; }
interface SelectedItem extends DefaultItem { stock: number; editedPrice: number | string; }

export default function DefaultItems() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const { ref, inView } = useInView();

  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 500);
  const [activeCategory, setActiveCategory] = useState("All");
  const [selected, setSelected] = useState<Map<string, SelectedItem>>(new Map());
  const [submitting, setSubmitting] = useState(false);

  // Fetch Categories
  const { data: categories = [] } = useQuery({
    queryKey: ["default-categories"],
    queryFn: getDefaultCategories
  });

  // Infinite Query for Default Items
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    error,
    refetch
  } = useInfiniteQuery({
    queryKey: ["default-items", debouncedSearch, activeCategory],
    queryFn: ({ pageParam = 0 }) => 
      getDefaultItems({
        q: debouncedSearch || undefined,
        category: activeCategory === "All" ? undefined : activeCategory,
        limit: 30,
        offset: pageParam as number
      }),
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.length < 30) return undefined;
      return allPages.length * 30;
    },
    initialPageParam: 0,
  });

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  const items = useMemo(() => {
    return data?.pages.flat() || [];
  }, [data]);

  const toggleItem = (item: DefaultItem) => {
    setSelected((prev) => {
      const next = new Map(prev);
      if (next.has(item.id)) next.delete(item.id);
      else next.set(item.id, { ...item, stock: 10, editedPrice: item.price });
      return next;
    });
  };

  const updateSel = (id: string, f: "stock"|"editedPrice", v: number) => {
    setSelected((prev) => { const n = new Map(prev); const i = n.get(id); if(i) n.set(id, {...i,[f]:v}); return n; });
  };

  const handleSelectAll = () => {
    const n = new Map(selected);
    items.forEach(i => {
      if (!n.has(i.id)) {
        n.set(i.id, { ...i, stock: 10, editedPrice: i.price });
      }
    });
    setSelected(n);
  };

  const handleSubmit = async () => {
    if (!selected.size) return;
    setSubmitting(true);
    try {
      const arr = Array.from(selected.values()).map(s => ({ 
        name: s.name, 
        category: s.category, 
        price: s.editedPrice, 
        stock: s.stock, 
        unit: s.unit 
      }));
      await addDefaultItems(arr);
      toast({ title: t("Items Added!", "सामान जोड़ दिया!") });
      setLocation("/inventory");
    } catch (err: any) { 
      toast({ variant: "destructive", title: "Error", description: err.message }); 
    } finally { 
      setSubmitting(false); 
    }
  };

  return (
    <div className="space-y-6">
      {/* Sticky Header Section */}
      <div className="md:sticky md:top-0 z-20 -mx-4 md:-mx-6 px-4 md:px-6 pt-6 pb-4 space-y-6 md:bg-background/95 md:backdrop-blur-md">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">{t("Default Items Catalog","डिफ़ॉल्ट सामान")}</h1>
            <p className="text-muted-foreground">{t("Manage your shop items","अपनी दुकान का सामान प्रबंधित करें")}</p>
          </div>
          <Badge className="bg-primary px-4 py-1 text-sm">{selected.size} {t("selected","चुने")}</Badge>
        </div>

        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-1 group w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-[#cacbcf] transition-colors" />
            <Input 
              placeholder={t("Search catalog...","खोजें...")} 
              className="pl-12 h-12 text-lg bg-white border-[#cacbcf] rounded-xl transition-all shadow-sm focus:border-[#cacbcf]" 
              value={searchTerm} 
              onChange={e => setSearchTerm(e.target.value)} 
            />
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            <Button variant="outline" className="h-12 border-[#cacbcf] rounded-xl flex-1 md:flex-none shadow-sm" onClick={handleSelectAll}>
              {t("Select All Visible", "दिखाई देने वाले सभी चुनें")}
            </Button>
            <Button variant="ghost" className="h-12 text-muted-foreground hover:text-foreground flex-1 md:flex-none" onClick={() => setSelected(new Map())}>
              {t("Clear All", "सभी साफ करें")}
            </Button>
          </div>
        </div>
        
        {/* Categories Pills - Wrapped for better UI */}
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar sm:overflow-visible sm:pb-0">
          <Button
            variant={activeCategory === "All" ? "default" : "secondary"}
            size="sm"
            className={`rounded-full px-4 text-xs font-bold uppercase tracking-wider ${activeCategory === "All" ? "bg-primary" : "bg-white border-[#cacbcf]/50 hover:border-[#cacbcf] text-muted-foreground"}`}
            onClick={() => setActiveCategory("All")}
          >
            {t("All", "सभी")}
          </Button>
          {categories.map((cat: string) => (
            <Button
              key={cat}
              variant={activeCategory === cat ? "default" : "secondary"}
              size="sm"
              className={`rounded-full px-4 text-xs font-bold uppercase tracking-wider ${activeCategory === cat ? "bg-primary" : "bg-white border-[#cacbcf]/50 hover:border-[#cacbcf] text-muted-foreground"}`}
              onClick={() => setActiveCategory(cat)}
            >
              {cat}
            </Button>
          ))}
        </div>
      </div>

      <div className="pt-2">
        {isLoading && items.length === 0 ? (
          <div className="h-[40vh] flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : isError ? (
          <ErrorState 
            message={error?.message} 
            onRetry={() => refetch()} 
          />
        ) : items.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-24">
              {items.map(item => {
                const isSel = selected.has(item.id); 
                const sel = selected.get(item.id);
                return (
                  <Card 
                    key={item.id} 
                    className={`cursor-pointer transition-all border-[#cacbcf]/30 hover:border-[#cacbcf] group ${isSel ? "ring-2 ring-primary ring-offset-2 bg-primary/5" : "bg-card"}`} 
                    onClick={() => toggleItem(item as any)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${isSel ? "bg-primary border-primary" : "border-[#cacbcf] bg-white"}`}>
                            {isSel && <div className="w-2 h-2 bg-white rounded-full" />}
                          </div>
                          <div>
                            <p className="font-bold text-lg text-foreground transition-colors">{item.name}</p>
                            <Badge variant="secondary" className="mt-1 text-[10px] uppercase">{item.category}</Badge>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-lg text-primary">₹{item.price}</div>
                          <div className="text-xs text-muted-foreground">per {item.unit}</div>
                        </div>
                      </div>
                      
                      {isSel && sel && (
                        <div className="mt-4 flex gap-4 pt-4 border-t border-primary/20 animate-in fade-in slide-in-from-top-1" onClick={e => e.stopPropagation()}>
                          <div className="flex-1 space-y-1">
                            <label className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">{t("Price", "कीमत")}</label>
                            <Input type="number" className="h-9 border-[#cacbcf] bg-white text-sm focus:border-primary" value={sel.editedPrice} onChange={e => updateSel(item.id,"editedPrice",Number(e.target.value))} />
                          </div>
                          <div className="flex-1 space-y-1">
                            <label className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">{t("Initial Stock", "स्टॉक")}</label>
                            <Input type="number" className="h-9 border-[#cacbcf] bg-white text-sm focus:border-primary" value={sel.stock} onChange={e => updateSel(item.id,"stock",Number(e.target.value))} />
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
            
            <div ref={ref} className="h-10 flex items-center justify-center py-4">
              {isFetchingNextPage && <Loader2 className="h-6 w-6 animate-spin text-primary" />}
            </div>
          </>
        ) : (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center p-12 text-center">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                <Package className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">{t("No items found", "कोई सामान नहीं मिला")}</h3>
              <p className="text-muted-foreground max-w-md">
                {t("Try a different search term or category.", "कोई दूसरा खोज शब्द या वर्ग आज़माएं।")}
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {selected.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-white/80 backdrop-blur-md border border-[#cacbcf] p-4 shadow-2xl rounded-2xl z-50 flex items-center gap-8 min-w-[300px] animate-in slide-in-from-bottom-4">
          <div className="flex flex-col">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{t("Selected", "चुने गए")}</span>
            <span className="text-lg font-bold text-primary">{selected.size} {t("Items", "सामान")}</span>
          </div>
          <Button 
            disabled={submitting} 
            onClick={handleSubmit}
            className="h-12 px-8 rounded-xl shadow-lg shadow-primary/20 border-none flex-1 bg-primary hover:bg-primary/90"
          >
            {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShoppingCart className="mr-2 h-4 w-4" />}
            {t("Add to Inventory", "इन्वेंटरी में जोड़ें")}
          </Button>
        </div>
      )}
    </div>
  );
}
