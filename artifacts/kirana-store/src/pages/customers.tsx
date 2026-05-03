import { useState, useMemo } from "react";
import { useLanguage } from "@/hooks/use-language";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  StickyNote
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const API_BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

function getAuthHeader() {
  const token = localStorage.getItem("kirana_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function apiFetch(path: string, options?: RequestInit) {
  const res = await fetch(`${API_BASE}/api${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...getAuthHeader(), ...options?.headers },
  });
  if (!res.ok) { const e = await res.json().catch(() => ({ error: res.statusText })); throw new Error(e.error || res.statusText); }
  if (res.status === 204) return null;
  return res.json();
}

interface Customer {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  notes: string | null;
  createdAt: string;
}

import { useQuery, useMutation } from "@tanstack/react-query";

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

  const [search, setSearch] = useState("");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const { data: customers, isLoading } = useQuery<Customer[]>({
    queryKey: ["customers"],
    queryFn: () => apiFetch("/customers"),
  });

  const createMutation = useMutation({
    mutationFn: (data: CustomerForm) => apiFetch("/customers", { method: "POST", body: JSON.stringify({ ...data, phone: data.phone || null, email: data.email || null, address: data.address || null, notes: data.notes || null }) }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["customers"] }); setIsAddOpen(false); addForm.reset(); toast({ title: t("Customer added", "ग्राहक जोड़ा गया") }); },
    onError: (e: Error) => toast({ variant: "destructive", title: t("Error", "त्रुटि"), description: e.message }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: CustomerForm }) => apiFetch(`/customers/${id}`, { method: "PATCH", body: JSON.stringify({ ...data, phone: data.phone || null, email: data.email || null, address: data.address || null, notes: data.notes || null }) }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["customers"] }); setIsEditOpen(false); toast({ title: t("Customer updated", "ग्राहक अपडेट हुआ") }); },
    onError: (e: Error) => toast({ variant: "destructive", title: t("Error", "त्रुटि"), description: e.message }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiFetch(`/customers/${id}`, { method: "DELETE" }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["customers"] }); toast({ title: t("Customer deleted", "ग्राहक हटाया गया") }); },
    onError: (e: Error) => toast({ variant: "destructive", title: t("Error", "त्रुटि"), description: e.message }),
  });

  const addForm = useForm<CustomerForm>({ resolver: zodResolver(customerSchema), defaultValues: { name: "", phone: "", email: "", address: "", notes: "" } });
  const editForm = useForm<CustomerForm>({ resolver: zodResolver(customerSchema) });

  const openEdit = (customer: Customer) => {
    setEditingId(customer.id);
    editForm.reset({ name: customer.name, phone: customer.phone || "", email: customer.email || "", address: customer.address || "", notes: customer.notes || "" });
    setIsEditOpen(true);
  };

  const filteredCustomers = useMemo(() => {
    if (!customers) return [];
    if (!search) return customers;
    const q = search.toLowerCase();
    return customers.filter(c =>
      c.name.toLowerCase().includes(q) ||
      (c.phone && c.phone.includes(q)) ||
      (c.email && c.email.toLowerCase().includes(q))
    );
  }, [customers, search]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">{t("Customers", "ग्राहक")}</h1>
          <p className="text-xs text-muted-foreground">{t("Manage your customer list", "अपने ग्राहकों का प्रबंधन करें")}</p>
        </div>
        <Button className="h-9 text-sm" onClick={() => setIsAddOpen(true)}>
          <UserPlus className="mr-1.5 h-4 w-4" />
          {t("Add Customer", "नया ग्राहक")}
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={t("Search by name or phone...", "नाम या फोन से खोजें...")}
          className="pl-9 h-9 text-sm"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : filteredCustomers.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center p-10 text-center">
            <Users className="h-10 w-10 text-muted-foreground mb-3 opacity-30" />
            <h3 className="font-semibold text-sm mb-1">{search ? t("No customers match your search", "खोज से कोई ग्राहक नहीं मिला") : t("No customers yet", "अभी कोई ग्राहक नहीं")}</h3>
            {!search && (
              <Button size="sm" onClick={() => setIsAddOpen(true)} className="mt-3">
                <UserPlus className="mr-1.5 h-3.5 w-3.5" />{t("Add first customer", "पहला ग्राहक जोड़ें")}
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {filteredCustomers.map(customer => (
            <Card key={customer.id} className="shadow-sm hover:shadow transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm flex-shrink-0">
                      {customer.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-sm truncate">{customer.name}</h3>
                      {customer.phone && (
                        <div className="flex items-center text-xs text-muted-foreground mt-0.5">
                          <Phone className="h-2.5 w-2.5 mr-1 flex-shrink-0" />
                          <span>{customer.phone}</span>
                        </div>
                      )}
                      {customer.email && (
                        <div className="flex items-center text-xs text-muted-foreground mt-0.5">
                          <Mail className="h-2.5 w-2.5 mr-1 flex-shrink-0" />
                          <span className="truncate">{customer.email}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(customer)}>
                      <Edit className="h-3 w-3 text-secondary" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7">
                          <Trash2 className="h-3 w-3 text-destructive" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>{t("Delete customer?", "ग्राहक हटाएं?")}</AlertDialogTitle>
                          <AlertDialogDescription>{t("This will permanently delete ", "यह स्थायी रूप से हटा देगा ")}<strong>{customer.name}</strong>.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>{t("Cancel", "रद्द करें")}</AlertDialogCancel>
                          <AlertDialogAction onClick={() => deleteMutation.mutate(customer.id)} className="bg-destructive">
                            {t("Delete", "हटाएं")}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
                {(customer.address || customer.notes) && (
                  <div className="mt-2 pt-2 border-t space-y-1">
                    {customer.address && (
                      <div className="flex items-start text-xs text-muted-foreground">
                        <MapPin className="h-2.5 w-2.5 mr-1 mt-0.5 flex-shrink-0" />
                        <span className="line-clamp-1">{customer.address}</span>
                      </div>
                    )}
                    {customer.notes && (
                      <div className="flex items-start text-xs text-muted-foreground">
                        <StickyNote className="h-2.5 w-2.5 mr-1 mt-0.5 flex-shrink-0" />
                        <span className="line-clamp-2">{customer.notes}</span>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="text-xs text-muted-foreground text-right">
        {filteredCustomers.length} {t("customer(s)", "ग्राहक")}
        {customers && customers.length !== filteredCustomers.length && ` (${customers.length} total)`}
      </div>

      {/* Add Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base">{t("Add Customer", "नया ग्राहक")}</DialogTitle>
          </DialogHeader>
          <form onSubmit={addForm.handleSubmit((d) => createMutation.mutate(d))}>
            <div className="space-y-3 py-3">
              <div className="space-y-1">
                <Label className="text-xs">{t("Name", "नाम")} *</Label>
                <Input {...addForm.register("name")} className="h-9 text-sm" placeholder="Ramesh Kumar" />
                {addForm.formState.errors.name && <p className="text-xs text-destructive">{addForm.formState.errors.name.message}</p>}
              </div>
              <div className="space-y-1">
                <Label className="text-xs">{t("Phone", "फोन")}</Label>
                <Input {...addForm.register("phone")} className="h-9 text-sm" placeholder="9876543210" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">{t("Email", "ईमेल")}</Label>
                <Input {...addForm.register("email")} className="h-9 text-sm" type="email" placeholder="ramesh@example.com" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">{t("Address", "पता")}</Label>
                <Input {...addForm.register("address")} className="h-9 text-sm" placeholder="123, Main Street..." />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">{t("Notes", "नोट्स")}</Label>
                <Input {...addForm.register("notes")} className="h-9 text-sm" placeholder={t("Any extra info...", "कोई अतिरिक्त जानकारी...")} />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" size="sm" onClick={() => setIsAddOpen(false)}>{t("Cancel", "रद्द करें")}</Button>
              <Button type="submit" size="sm" disabled={createMutation.isPending}>
                {createMutation.isPending && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
                {t("Save", "सेव करें")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base">{t("Edit Customer", "ग्राहक बदलें")}</DialogTitle>
          </DialogHeader>
          <form onSubmit={editForm.handleSubmit((d) => { if (editingId) updateMutation.mutate({ id: editingId, data: d }); })}>
            <div className="space-y-3 py-3">
              <div className="space-y-1">
                <Label className="text-xs">{t("Name", "नाम")} *</Label>
                <Input {...editForm.register("name")} className="h-9 text-sm" />
                {editForm.formState.errors.name && <p className="text-xs text-destructive">{editForm.formState.errors.name.message}</p>}
              </div>
              <div className="space-y-1">
                <Label className="text-xs">{t("Phone", "फोन")}</Label>
                <Input {...editForm.register("phone")} className="h-9 text-sm" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">{t("Email", "ईमेल")}</Label>
                <Input {...editForm.register("email")} className="h-9 text-sm" type="email" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">{t("Address", "पता")}</Label>
                <Input {...editForm.register("address")} className="h-9 text-sm" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">{t("Notes", "नोट्स")}</Label>
                <Input {...editForm.register("notes")} className="h-9 text-sm" />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" size="sm" onClick={() => setIsEditOpen(false)}>{t("Cancel", "रद्द करें")}</Button>
              <Button type="submit" size="sm" disabled={updateMutation.isPending}>
                {updateMutation.isPending && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
                {t("Save Changes", "बदलाव सेव करें")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
