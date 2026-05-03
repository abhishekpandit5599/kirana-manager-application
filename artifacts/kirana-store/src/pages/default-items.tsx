import { useState, useEffect } from "react";
import { useLanguage } from "@/hooks/use-language";
import { useToast } from "@/hooks/use-toast";
import { getDefaultItems, addDefaultItems } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Search, ShoppingCart } from "lucide-react";
import { useLocation } from "wouter";

interface DefaultItem { id: string; name: string; category: string; price: number; unit: string; }
interface SelectedItem extends DefaultItem { stock: number; editedPrice: number; }

export default function DefaultItems() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [items, setItems] = useState<DefaultItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selected, setSelected] = useState<Map<string, SelectedItem>>(new Map());
  const [categories, setCategories] = useState<string[]>([]);
  const [activeCategory, setActiveCategory] = useState("All");

  useEffect(() => {
    getDefaultItems().then((data) => {
      setItems(data);
      setCategories([...new Set(data.map((i: DefaultItem) => i.category))] as string[]);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

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

  const filtered = items.filter(i => {
    const s = !searchTerm || i.name.toLowerCase().includes(searchTerm.toLowerCase());
    const c = activeCategory === "All" || i.category === activeCategory;
    return s && c;
  });

  const handleSubmit = async () => {
    if (!selected.size) return;
    setSubmitting(true);
    try {
      const arr = Array.from(selected.values()).map(s => ({ name: s.name, category: s.category, price: s.editedPrice, stock: s.stock, unit: s.unit }));
      await addDefaultItems(arr);
      toast({ title: t("Items Added!", "सामान जोड़ दिया!") });
      setLocation("/inventory");
    } catch (err: any) { toast({ variant: "destructive", title: "Error", description: err.message }); }
    finally { setSubmitting(false); }
  };

  if (loading) return <div className="h-[60vh] flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div><h1 className="text-xl font-bold">{t("Default Items Catalog","डिफ़ॉल्ट सामान")}</h1><p className="text-sm text-muted-foreground">{t("Select items to add","सामान चुनें")}</p></div>
        <Badge className="bg-primary">{selected.size} {t("selected","चुने")}</Badge>
      </div>
      <div className="flex gap-2">
        <div className="relative flex-1"><Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" /><Input placeholder={t("Search...","खोजें...")} className="pl-9 h-9" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} /></div>
        <Button variant="outline" size="sm" onClick={() => { const n = new Map(selected); filtered.forEach(i => { if(!n.has(i.id)) n.set(i.id, {...i,stock:10,editedPrice:i.price}); }); setSelected(n); }}>Select All</Button>
        <Button variant="ghost" size="sm" onClick={() => setSelected(new Map())}>Clear</Button>
      </div>
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {["All", ...categories].map(cat => (
          <button key={cat} onClick={() => setActiveCategory(cat)} className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${activeCategory === cat ? "bg-primary text-primary-foreground" : "bg-muted"}`}>{cat}</button>
        ))}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
        {filtered.map(item => {
          const isSel = selected.has(item.id); const sel = selected.get(item.id);
          return (
            <div key={item.id} className={`rounded-lg border p-3 cursor-pointer transition-all ${isSel ? "border-primary bg-primary/5" : "border-border bg-card hover:border-primary/30"}`} onClick={() => toggleItem(item)}>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2"><Checkbox checked={isSel} /><div><p className="font-semibold text-sm">{item.name}</p><p className="text-xs text-muted-foreground">{item.category}</p></div></div>
                <span className="text-primary font-bold text-sm">₹{item.price}/{item.unit}</span>
              </div>
              {isSel && sel && (
                <div className="mt-2 flex gap-2 pt-2 border-t" onClick={e => e.stopPropagation()}>
                  <div className="flex-1"><label className="text-xs text-muted-foreground">Price</label><Input type="number" className="h-7 text-xs" value={sel.editedPrice} onChange={e => updateSel(item.id,"editedPrice",Number(e.target.value))} /></div>
                  <div className="flex-1"><label className="text-xs text-muted-foreground">Stock</label><Input type="number" className="h-7 text-xs" value={sel.stock} onChange={e => updateSel(item.id,"stock",Number(e.target.value))} /></div>
                </div>
              )}
            </div>
          );
        })}
      </div>
      {selected.size > 0 && (
        <div className="fixed bottom-0 left-0 right-0 md:left-60 bg-card border-t p-4 shadow-lg z-40">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <span className="font-bold text-sm">{selected.size} items selected</span>
            <Button disabled={submitting} onClick={handleSubmit}>{submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShoppingCart className="mr-2 h-4 w-4" />}Add to Inventory</Button>
          </div>
        </div>
      )}
    </div>
  );
}
