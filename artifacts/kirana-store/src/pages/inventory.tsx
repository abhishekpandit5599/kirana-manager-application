import { useState, useEffect, useMemo } from "react";
import { useLanguage } from "@/hooks/use-language";
import { useToast } from "@/hooks/use-toast";
import { 
  listItems,
  useCreateItem, 
  useUpdateItem, 
  useDeleteItem, 
  useSeedDefaultItems,
  getListItemsQueryKey
} from "@workspace/api-client-react";
import { useQueryClient, useInfiniteQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  PackageSearch,
  AlertTriangle,
  Loader2,
  Download,
  Upload,
  FileSpreadsheet
} from "lucide-react";
import { ErrorState } from "@/components/error-state";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { downloadExcelTemplate, importExcel, exportExcel } from "@/lib/api";
import { useInView } from "react-intersection-observer";
import { useDebounce } from "@/hooks/use-debounce";

const ITEM_UNITS = ["kg", "pcs", "litre", "gm", "ml", "dozen", "pack"] as const;

const itemSchema = z.object({
  name: z.string().min(1, "Name is required"),
  category: z.string().min(1, "Category is required"),
  price: z.coerce.number().min(0, "Price must be positive"),
  stock: z.coerce.number().min(0, "Stock must be positive"),
  unit: z.enum(ITEM_UNITS),
  lowStockThreshold: z.coerce.number().min(0).default(5),
});

type ItemForm = z.infer<typeof itemSchema>;

export default function Inventory() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { ref, inView } = useInView();
  
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 500);
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [lowStockFilter, setLowStockFilter] = useState<boolean>(false);
  
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importMode, setImportMode] = useState<"create" | "update">("create");
  const [isImporting, setIsImporting] = useState(false);

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
    queryKey: ["items", debouncedSearch, categoryFilter, lowStockFilter],
    queryFn: ({ pageParam = 0 }) => 
      listItems({
        q: debouncedSearch || undefined,
        category: categoryFilter !== "all" ? categoryFilter : undefined,
        lowStock: lowStockFilter ? "true" : undefined,
        limit: 20,
        offset: pageParam as number
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

  const items = useMemo(() => {
    return data?.pages.flat() || [];
  }, [data]);

  const createItem = useCreateItem();
  const updateItem = useUpdateItem();
  const deleteItem = useDeleteItem();
  const seedItems = useSeedDefaultItems();

  const addForm = useForm<ItemForm>({
    resolver: zodResolver(itemSchema),
    defaultValues: { name: "", category: "", price: 0, stock: 0, unit: "pcs", lowStockThreshold: 5 },
  });

  const editForm = useForm<ItemForm>({
    resolver: zodResolver(itemSchema),
  });

  // Extract unique categories from current items list (or we could fetch categories separately)
  const categories = useMemo(() => {
    return Array.from(new Set(items?.map(i => i.category) || []));
  }, [items]);

  const handleAddSubmit = (data: ItemForm) => {
    createItem.mutate({ data: data as any }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["items"] });
        setIsAddOpen(false);
        addForm.reset();
        toast({ title: t("Item added successfully", "सामान सफलतापूर्वक जोड़ा गया") });
      },
      onError: (err) => {
        toast({ variant: "destructive", title: t("Error adding item", "सामान जोड़ने में त्रुटि"), description: err.message });
      }
    });
  };

  const openEdit = (item: any) => {
    setEditingItemId(item.id);
    editForm.reset({
      name: item.name,
      category: item.category,
      price: item.price,
      stock: item.stock,
      unit: item.unit as any,
      lowStockThreshold: item.lowStockThreshold,
    });
    setIsEditOpen(true);
  };

  const handleEditSubmit = (data: ItemForm) => {
    if (!editingItemId) return;
    updateItem.mutate({ id: editingItemId, data: data as any }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["items"] });
        setIsEditOpen(false);
        setEditingItemId(null);
        toast({ title: t("Item updated successfully", "सामान सफलतापूर्वक अपडेट किया गया") });
      },
      onError: (err) => {
        toast({ variant: "destructive", title: t("Error updating item", "सामान अपडेट करने में त्रुटि"), description: err.message });
      }
    });
  };

  const handleDelete = (id: string) => {
    deleteItem.mutate({ id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["items"] });
        toast({ title: t("Item deleted", "सामान हटा दिया गया") });
      },
      onError: (err) => {
        toast({ variant: "destructive", title: t("Error deleting item", "सामान हटाने में त्रुटि"), description: err.message });
      }
    });
  };

  const handleSeed = () => {
    seedItems.mutate(undefined, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["items"] });
        toast({ title: t("Defaults added successfully", "डिफ़ॉल्ट सामान सफलतापूर्वक जोड़ा गया") });
      },
      onError: (err) => {
        toast({ variant: "destructive", title: "Error", description: err.message });
      }
    });
  };

  const handleDownloadTemplate = async () => {
    try {
      const blob = await downloadExcelTemplate();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "inventory_template.xlsx";
      a.click();
      URL.revokeObjectURL(url);
      toast({ title: t("Template downloaded!", "टेम्पलेट डाउनलोड हो गया!") });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err.message });
    }
  };

  const handleExportExcel = async () => {
    try {
      const blob = await exportExcel();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `inventory_export_${new Date().toISOString().slice(0, 10)}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
      toast({ title: t("Exported successfully!", "निर्यात सफल!") });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err.message });
    }
  };

  const handleImportExcel = async () => {
    if (!importFile) return;
    setIsImporting(true);
    try {
      const result = await importExcel(importFile, importMode);
      queryClient.invalidateQueries({ queryKey: ["items"] });
      setIsImportOpen(false);
      setImportFile(null);
      toast({ title: t("Import successful!", "आयात सफल!"), description: `${result.created || 0} created, ${result.updated || 0} updated, ${result.errors || 0} errors` });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Import Error", description: err.message });
    } finally {
      setIsImporting(false);
    }
  };

  const ItemFormFields = ({ form }: { form: any }) => (
    <div className="space-y-4 py-4">
      <div className="space-y-2">
        <Label>{t("Item Name", "सामान का नाम")}</Label>
        <Input {...form.register("name")} className="h-12 border-[#cacbcf]" />
        {form.formState.errors.name && <p className="text-xs text-destructive">{form.formState.errors.name.message as string}</p>}
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>{t("Category", "वर्ग")}</Label>
          <Input {...form.register("category")} className="h-12 border-[#cacbcf]" />
        </div>
        <div className="space-y-2">
          <Label>{t("Price (₹)", "मूल्य (₹)")}</Label>
          <Input type="number" step="0.01" {...form.register("price")} className="h-12 border-[#cacbcf]" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>{t("Current Stock", "स्टॉक")}</Label>
          <Input type="number" {...form.register("stock")} className="h-12 border-[#cacbcf]" />
        </div>
        <div className="space-y-2">
          <Label>{t("Unit", "इकाई")}</Label>
          <Select 
            value={form.watch("unit")} 
            onValueChange={(val) => form.setValue("unit", val)}
          >
            <SelectTrigger className="h-12 border-[#cacbcf]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ITEM_UNITS.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-2">
        <Label>{t("Low Stock Alert Below", "कम स्टॉक अलर्ट")}</Label>
        <Input type="number" {...form.register("lowStockThreshold")} className="h-12 border-[#cacbcf]" />
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Sticky Header Section */}
      <div className="sticky top-14 md:top-0 z-20 -mx-4 md:-mx-6 px-4 md:px-6 pt-6 pb-4 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">{t("Inventory", "सामान (इन्वेंटरी)")}</h1>
            <p className="text-muted-foreground">{t("Manage your shop items", "अपनी दुकान का सामान प्रबंधित करें")}</p>
          </div>
          
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" className="h-12 shadow-sm border-[#cacbcf] rounded-xl" onClick={handleDownloadTemplate}>
              <FileSpreadsheet className="mr-2 h-5 w-5" />
              {t("Template", "टेम्पलेट")}
            </Button>
            <Button variant="outline" className="h-12 shadow-sm border-[#cacbcf] rounded-xl" onClick={() => setIsImportOpen(true)}>
              <Upload className="mr-2 h-5 w-5" />
              {t("Import Excel", "Excel आयात")}
            </Button>
            <Button variant="outline" className="h-12 shadow-sm border-[#cacbcf] rounded-xl" onClick={handleExportExcel}>
              <Download className="mr-2 h-5 w-5" />
              {t("Export Excel", "Excel निर्यात")}
            </Button>
            <Button className="h-12 shadow-md border-none rounded-xl bg-primary hover:bg-primary/90" onClick={() => setIsAddOpen(true)}>
              <Plus className="mr-2 h-5 w-5" />
              {t("Add Item", "नया सामान")}
            </Button>
          </div>
        </div>

        {/* Filters & Search */}
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-1 group w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-[#cacbcf] transition-colors" />
            <Input 
              placeholder={t("Search items...", "सामान खोजें...")} 
              className="pl-12 h-12 text-lg bg-white border-[#cacbcf] rounded-xl transition-all focus:border-[#cacbcf]" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full md:w-[200px] h-12 text-base border-[#cacbcf] rounded-xl bg-white shadow-sm">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("All Categories", "सभी वर्ग")}</SelectItem>
              {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button 
            variant={lowStockFilter ? "destructive" : "outline"} 
            className={`h-12 text-base px-6 rounded-xl border-[#cacbcf] shadow-sm ${!lowStockFilter && 'hover:border-[#cacbcf]'}`}
            onClick={() => setLowStockFilter(!lowStockFilter)}
          >
            <AlertTriangle className="mr-2 h-5 w-5" />
            {t("Low Stock Only", "केवल कम स्टॉक")}
          </Button>
        </div>
      </div>

      <div className="pt-2">

      {/* Item List */}
      {isLoading ? (
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map((item) => (
              <Card key={item.id} className={`shadow-sm overflow-hidden group hover:border-[#cacbcf] transition-all ${item.isLowStock ? 'border-destructive/50' : 'border-[#cacbcf]/30'}`}>
                <CardContent className="p-0">
                  <div className="p-4 border-b bg-muted/20 group-hover:bg-muted/30 transition-colors">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-bold text-lg text-foreground">{item.name}</h3>
                        <Badge variant="secondary" className="mt-1">{item.category}</Badge>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-xl text-primary">₹{item.price}</div>
                        <div className="text-sm text-muted-foreground">per {item.unit}</div>
                      </div>
                    </div>
                  </div>
                  <div className="p-4 flex items-center justify-between">
                    <div>
                      <div className="text-sm text-muted-foreground">{t("Current Stock", "वर्तमान स्टॉक")}</div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`font-bold text-xl ${item.isLowStock ? 'text-destructive' : 'text-foreground'}`}>
                          {item.stock} {item.unit}
                        </span>
                        {item.isLowStock && (
                          <Badge variant="destructive" className="text-[10px] uppercase">
                            {t("LOW", "कम")}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="icon" className="h-10 w-10 border-[#cacbcf]" onClick={() => openEdit(item)}>
                        <Edit className="h-5 w-5 text-secondary" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="icon" className="h-10 w-10 border-[#cacbcf]">
                            <Trash2 className="h-5 w-5 text-destructive" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>{t("Are you sure?", "क्या आपको यकीन है?")}</AlertDialogTitle>
                            <AlertDialogDescription>
                              {t("This will permanently delete ", "यह स्थायी रूप से हटा देगा ")}
                              <span className="font-bold">{item.name}</span>.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel className="border-[#cacbcf]">{t("Cancel", "रद्द करें")}</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => handleDelete(item.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              {t("Delete", "हटाएं")}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
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
              <p className="text-sm text-muted-foreground">{t("All items loaded", "सभी सामान लोड हो गए")}</p>
            )}
          </div>
        </>
      ) : (
        <Card className="shadow-sm border-dashed">
          <CardContent className="flex flex-col items-center justify-center p-12 text-center">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
              <PackageSearch className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-2">{t("No items found", "कोई सामान नहीं मिला")}</h3>
            <p className="text-muted-foreground max-w-md">
              {t("You haven't added any items yet, or none match your search.", "आपने अभी तक कोई सामान नहीं जोड़ा है, या आपकी खोज से कोई मेल नहीं खाता।")}
            </p>
            <div className="flex gap-4 mt-6">
              <Button onClick={() => setIsAddOpen(true)} className="h-12 border-none">
                <Plus className="mr-2 h-5 w-5" />
                {t("Add Item", "सामान जोड़ें")}
              </Button>
              <Button variant="outline" onClick={handleSeed} className="h-12 border-[#cacbcf]">
                <Download className="mr-2 h-5 w-5" />
                {t("Add Defaults", "डिफ़ॉल्ट जोड़ें")}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>

      {/* Add Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{t("Add New Item", "नया सामान जोड़ें")}</DialogTitle>
          </DialogHeader>
          <form onSubmit={addForm.handleSubmit(handleAddSubmit)}>
            <ItemFormFields form={addForm} />
            <DialogFooter>
              <Button type="button" variant="outline" className="border-[#cacbcf]" onClick={() => setIsAddOpen(false)}>
                {t("Cancel", "रद्द करें")}
              </Button>
              <Button type="submit" className="border-none" disabled={createItem.isPending}>
                {createItem.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {t("Save Item", "सेव करें")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{t("Edit Item", "सामान बदलें")}</DialogTitle>
          </DialogHeader>
          <form onSubmit={editForm.handleSubmit(handleEditSubmit)}>
            <ItemFormFields form={editForm} />
            <DialogFooter>
              <Button type="button" variant="outline" className="border-[#cacbcf]" onClick={() => setIsEditOpen(false)}>
                {t("Cancel", "रद्द करें")}
              </Button>
              <Button type="submit" className="border-none" disabled={updateItem.isPending}>
                {updateItem.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {t("Save Changes", "बदलाव सेव करें")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Import Excel Dialog */}
      <Dialog open={isImportOpen} onOpenChange={setIsImportOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{t("Import from Excel", "Excel से आयात करें")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>{t("Excel File", "Excel फ़ाइल")}</Label>
              <Input type="file" accept=".xlsx,.xls" onChange={(e) => setImportFile(e.target.files?.[0] || null)} className="h-12 border-[#cacbcf]" />
            </div>
            <div className="space-y-2">
              <Label>{t("Import Mode", "आयात मोड")}</Label>
              <Select value={importMode} onValueChange={(val) => setImportMode(val as "create" | "update")}>
                <SelectTrigger className="h-12 border-[#cacbcf]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="create">{t("Create new items only", "केवल नए सामान बनाएं")}</SelectItem>
                  <SelectItem value="update">{t("Update existing + create new", "मौजूदा अपडेट + नए बनाएं")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <p className="text-xs text-muted-foreground">
              {t("Download the template first, fill it with your items, then upload here.", "पहले टेम्पलेट डाउनलोड करें, अपने सामान भरें, फिर यहां अपलोड करें।")}
            </p>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" className="border-[#cacbcf]" onClick={() => setIsImportOpen(false)}>
              {t("Cancel", "रद्द करें")}
            </Button>
            <Button onClick={handleImportExcel} className="border-none" disabled={!importFile || isImporting}>
              {isImporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
              {t("Import", "आयात करें")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
