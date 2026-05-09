import { useState, useEffect, useMemo } from "react";
import { useLanguage } from "@/hooks/use-language";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient, useInfiniteQuery, useMutation } from "@tanstack/react-query";
import { 
  listCustomers, 
  useCreateCustomer, 
  useUpdateCustomer, 
  useDeleteCustomer 
} from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import {
  Users,
  Plus,
  Edit,
  Trash2,
  Phone,
  Mail,
  MapPin,
  Search,
  Loader2,
  UserPlus,
  StickyNote,
  RefreshCw
} from "lucide-react";
import { ErrorState } from "@/components/error-state";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useInView } from "react-intersection-observer";
import { useDebounce } from "@/hooks/use-debounce";

interface Customer {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  notes: string | null;
  createdAt: string;
}

const customerSchema = z.object({
  name: z.string().min(2, "Name is required"),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  address: z.string().optional(),
  notes: z.string().optional(),
});
type CustomerForm = z.infer<typeof customerSchema>;

export default function Customers() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { ref, inView } = useInView();

  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 500);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

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
    queryKey: ["customers", debouncedSearch],
    queryFn: ({ pageParam = 0 }) => 
      listCustomers({
        q: debouncedSearch || undefined,
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

  const customers = useMemo(() => {
    return data?.pages.flat() || [];
  }, [data]);

  const createMutation = useCreateCustomer();
  const updateMutation = useUpdateCustomer();
  const deleteMutation = useDeleteCustomer();

  const addForm = useForm<CustomerForm>({ resolver: zodResolver(customerSchema), defaultValues: { name: "", phone: "", email: "", address: "", notes: "" } });
  const editForm = useForm<CustomerForm>({ resolver: zodResolver(customerSchema) });

  const handleAddSubmit = (data: CustomerForm) => {
    createMutation.mutate({ data: data as any }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["customers"] });
        setIsAddOpen(false);
        addForm.reset();
        toast({ title: t("Customer added", "ग्राहक जोड़ा गया") });
      },
      onError: (e: any) => toast({ variant: "destructive", title: t("Error", "त्रुटि"), description: e.message })
    });
  };

  const handleEditSubmit = (data: CustomerForm) => {
    if (!editingId) return;
    updateMutation.mutate({ id: editingId, data: data as any }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["customers"] });
        setIsEditOpen(false);
        toast({ title: t("Customer updated", "ग्राहक अपडेट हुआ") });
      },
      onError: (e: any) => toast({ variant: "destructive", title: t("Error", "त्रुटि"), description: e.message })
    });
  };

  const openEdit = (customer: Customer) => {
    setEditingId(customer.id);
    editForm.reset({ name: customer.name, phone: customer.phone || "", email: customer.email || "", address: customer.address || "", notes: customer.notes || "" });
    setIsEditOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Sticky Header Section */}
      <div className="sticky top-14 md:top-0 z-20 -mx-4 md:-mx-6 px-4 md:px-6 pt-6 pb-4 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">{t("Customers", "ग्राहक")}</h1>
            <p className="text-muted-foreground">{t("Manage your customer directory and dues", "अपने ग्राहकों की सूची और बकाया प्रबंधित करें")}</p>
          </div>
          <Button className="h-12 shadow-md border-none rounded-xl bg-primary hover:bg-primary/90" onClick={() => setIsAddOpen(true)}>
            <Plus className="mr-2 h-5 w-5" />
            {t("Add Customer", "नया ग्राहक")}
          </Button>
        </div>

        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-[#cacbcf] transition-colors" />
          <Input 
            placeholder={t("Search by name or phone...", "नाम या फोन से खोजें...")} 
            className="pl-12 h-12 text-lg bg-white border-[#cacbcf] rounded-xl transition-all focus:border-[#cacbcf]" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="h-[40vh] flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : isError ? (
        <ErrorState 
          message={error?.message} 
          onRetry={() => refetch()} 
        />
      ) : customers.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center p-12 text-center">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-2">
              {searchTerm ? t("No customers match your search", "खोज से कोई ग्राहक नहीं मिला") : t("No customers yet", "अभी कोई ग्राहक नहीं")}
            </h3>
            {!searchTerm && (
              <Button onClick={() => setIsAddOpen(true)} className="mt-4 border-none">
                <UserPlus className="mr-2 h-5 w-5" />
                {t("Add first customer", "पहला ग्राहक जोड़ें")}
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {customers.map(customer => (
              <Card key={customer.id} className="shadow-sm hover:border-[#cacbcf] transition-colors border-[#cacbcf]/30 group overflow-hidden">
                <CardContent className="p-0">
                  <div className="p-4 bg-muted/20 group-hover:bg-muted/30 transition-colors border-b">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg flex-shrink-0">
                          {customer.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h3 className="font-bold text-lg text-foreground truncate">{customer.name}</h3>
                          <Badge variant="outline" className="text-[10px] uppercase font-bold border-[#cacbcf]">
                            {t("Customer", "ग्राहक")}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-10 w-10 hover:bg-muted" onClick={() => openEdit(customer as any)}>
                          <Edit className="h-5 w-5 text-secondary" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-10 w-10 hover:bg-muted">
                              <Trash2 className="h-5 w-5 text-destructive" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>{t("Delete customer?", "ग्राहक हटाएं?")}</AlertDialogTitle>
                              <AlertDialogDescription>{t("This will permanently delete ", "यह स्थायी रूप से हटा देगा ")}<strong>{customer.name}</strong>.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel className="border-[#cacbcf]">{t("Cancel", "रद्द करें")}</AlertDialogCancel>
                              <AlertDialogAction onClick={() => deleteMutation.mutate({ id: customer.id })} className="bg-destructive hover:bg-destructive/90">
                                {t("Delete", "हटाएं")}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </div>
                  <div className="p-4 space-y-3">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      {customer.phone && (
                        <div className="flex items-center text-muted-foreground">
                          <Phone className="h-3.5 w-3.5 mr-2 text-primary" />
                          <span className="truncate">{customer.phone}</span>
                        </div>
                      )}
                      {customer.email && (
                        <div className="flex items-center text-muted-foreground col-span-2">
                          <Mail className="h-3.5 w-3.5 mr-2 text-primary" />
                          <span className="truncate">{customer.email}</span>
                        </div>
                      )}
                      {customer.address && (
                        <div className="flex items-start text-muted-foreground col-span-2">
                          <MapPin className="h-3.5 w-3.5 mr-2 mt-0.5 text-primary flex-shrink-0" />
                          <span className="line-clamp-2">{customer.address}</span>
                        </div>
                      )}
                    </div>
                    {customer.notes && (
                      <div className="bg-muted/30 p-2 rounded-lg text-xs text-muted-foreground flex items-start italic border border-[#cacbcf]/30">
                        <StickyNote className="h-3 w-3 mr-2 mt-0.5 flex-shrink-0" />
                        <span className="line-clamp-2">{customer.notes}</span>
                      </div>
                    )}
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
              <p className="text-sm text-muted-foreground">{t("All customers loaded", "सभी ग्राहक लोड हो गए")}</p>
            )}
          </div>
        </>
      )}

      {/* Add Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("Add New Customer", "नया ग्राहक जोड़ें")}</DialogTitle>
          </DialogHeader>
          <form onSubmit={addForm.handleSubmit(handleAddSubmit)}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">{t("Full Name", "पूरा नाम")} *</Label>
                <Input id="name" {...addForm.register("name")} className="h-12 border-[#cacbcf]" placeholder="Ramesh Kumar" />
                {addForm.formState.errors.name && <p className="text-xs text-destructive">{addForm.formState.errors.name.message}</p>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="phone">{t("Phone Number", "फ़ोन नंबर")}</Label>
                  <Input id="phone" {...addForm.register("phone")} className="h-12 border-[#cacbcf]" placeholder="9876543210" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">{t("Email Address", "ईमेल पता")}</Label>
                  <Input id="email" {...addForm.register("email")} className="h-12 border-[#cacbcf]" type="email" placeholder="ramesh@example.com" />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="address">{t("Address", "पता")}</Label>
                <Input id="address" {...addForm.register("address")} className="h-12 border-[#cacbcf]" placeholder="House No, Street, City..." />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="notes">{t("Notes / Observations", "नोट्स")}</Label>
                <Input id="notes" {...addForm.register("notes")} className="h-12 border-[#cacbcf]" placeholder={t("Prefer credit, regular buyer, etc.", "क्रेडिट पसंद है, नियमित खरीदार, आदि।")} />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" className="border-[#cacbcf]" onClick={() => setIsAddOpen(false)}>{t("Cancel", "रद्द करें")}</Button>
              <Button type="submit" className="border-none" disabled={createMutation.isPending}>
                {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t("Save Customer", "ग्राहक सेव करें")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("Edit Customer", "ग्राहक बदलें")}</DialogTitle>
          </DialogHeader>
          <form onSubmit={editForm.handleSubmit(handleEditSubmit)}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-name">{t("Full Name", "पूरा नाम")} *</Label>
                <Input id="edit-name" {...editForm.register("name")} className="h-12 border-[#cacbcf]" />
                {editForm.formState.errors.name && <p className="text-xs text-destructive">{editForm.formState.errors.name.message}</p>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-phone">{t("Phone Number", "फ़ोन नंबर")}</Label>
                  <Input id="edit-phone" {...editForm.register("phone")} className="h-12 border-[#cacbcf]" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-email">{t("Email Address", "ईमेल पता")}</Label>
                  <Input id="edit-email" {...editForm.register("email")} className="h-12 border-[#cacbcf]" type="email" />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-address">{t("Address", "पता")}</Label>
                <Input id="edit-address" {...editForm.register("address")} className="h-12 border-[#cacbcf]" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-notes">{t("Notes / Observations", "नोट्स")}</Label>
                <Input id="edit-notes" {...editForm.register("notes")} className="h-12 border-[#cacbcf]" />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" className="border-[#cacbcf]" onClick={() => setIsEditOpen(false)}>{t("Cancel", "रद्द करें")}</Button>
              <Button type="submit" className="border-none" disabled={updateMutation.isPending}>
                {updateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t("Save Changes", "बदलाव सेव करें")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
