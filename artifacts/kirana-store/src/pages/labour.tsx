import { useState } from "react";
import { useLanguage } from "@/hooks/use-language";
import { useToast } from "@/hooks/use-toast";
import {
  useListLabour,
  useCreateLabour,
  useUpdateLabour,
  useDeleteLabour,
  useListAttendance,
  useMarkAttendance,
  useGetLabourSalary,
  getListLabourQueryKey,
  getListAttendanceQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Users,
  Plus,
  Edit,
  Trash2,
  CalendarDays,
  IndianRupee,
  Phone,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format, getDaysInMonth, startOfMonth, addMonths, subMonths, parseISO } from "date-fns";

const labourSchema = z.object({
  name: z.string().min(2, "Name is required"),
  phone: z.string().optional(),
  role: z.string().optional(),
  salaryPerMonth: z.coerce.number().min(0, "Salary must be positive"),
});

type LabourForm = z.infer<typeof labourSchema>;

const STATUS_CONFIG = {
  present: { label: "P", class: "bg-secondary text-white", full: "Present" },
  half: { label: "H", class: "bg-amber-500 text-white", full: "Half Day" },
  absent: { label: "A", class: "bg-destructive text-white", full: "Absent" },
};

export default function Labour() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingLabourId, setEditingLabourId] = useState<string | null>(null);
  const [selectedLabourForSalary, setSelectedLabourForSalary] = useState<string | null>(null);

  const [viewDate, setViewDate] = useState(new Date());
  const currentMonthStr = format(viewDate, 'yyyy-MM');
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const daysInMonth = getDaysInMonth(viewDate);

  const { data: labours, isLoading: laboursLoading } = useListLabour();

  const { data: attendanceData, isLoading: attendanceLoading } = useListAttendance(
    { month: currentMonthStr },
    { }
  );

  const { data: salaryData, isLoading: salaryLoading } = useGetLabourSalary(
    selectedLabourForSalary || "",
    { month: currentMonthStr } as any,
    { query: { enabled: !!selectedLabourForSalary, queryKey: ["salary", selectedLabourForSalary, currentMonthStr] as const } }
  );

  const createLabour = useCreateLabour();
  const updateLabour = useUpdateLabour();
  const deleteLabour = useDeleteLabour();
  const markAttendance = useMarkAttendance();

  const addForm = useForm<LabourForm>({
    resolver: zodResolver(labourSchema),
    defaultValues: { name: "", phone: "", role: "", salaryPerMonth: 0 },
  });

  const editForm = useForm<LabourForm>({
    resolver: zodResolver(labourSchema),
  });

  const handleAddSubmit = (data: LabourForm) => {
    createLabour.mutate({ data }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListLabourQueryKey() });
        setIsAddOpen(false);
        addForm.reset();
        toast({ title: t("Worker added", "मजदूर जोड़ा गया") });
      },
      onError: (err) => toast({ variant: "destructive", title: t("Error", "त्रुटि"), description: err.message })
    });
  };

  const openEdit = (labour: any) => {
    setEditingLabourId(labour.id);
    editForm.reset({ name: labour.name, phone: labour.phone || "", role: labour.role || "", salaryPerMonth: labour.salaryPerMonth });
    setIsEditOpen(true);
  };

  const handleEditSubmit = (data: LabourForm) => {
    if (!editingLabourId) return;
    updateLabour.mutate({ id: editingLabourId, data }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListLabourQueryKey() });
        setIsEditOpen(false);
        toast({ title: t("Worker updated", "मजदूर अपडेट किया गया") });
      },
      onError: (err) => toast({ variant: "destructive", title: t("Error", "त्रुटि"), description: err.message })
    });
  };

  const handleDelete = (id: string) => {
    deleteLabour.mutate({ id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListLabourQueryKey() });
        toast({ title: t("Worker deleted", "मजदूर हटाया गया") });
      },
      onError: (err) => toast({ variant: "destructive", title: t("Error", "त्रुटि"), description: err.message })
    });
  };

  const handleMarkAttendance = (labourId: string, date: string, status: "present" | "absent" | "half") => {
    markAttendance.mutate({ data: { labourId, date, status } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListAttendanceQueryKey({ month: currentMonthStr }) });
        queryClient.invalidateQueries({ queryKey: ["getLabourSalary", labourId] });
        toast({ title: t("Attendance marked", "हाजिरी दर्ज की गई") });
      }
    });
  };

  const getStatus = (labourId: string, dateStr: string) => {
    return attendanceData?.find(a => a.labourId === labourId && a.date.startsWith(dateStr))?.status;
  };

  const getTodayStatus = (labourId: string) => getStatus(labourId, todayStr);

  const isCurrentMonth = format(viewDate, 'yyyy-MM') === format(new Date(), 'yyyy-MM');

  // Build day columns for attendance grid
  const dayColumns = Array.from({ length: daysInMonth }, (_, i) => {
    const dayNum = i + 1;
    const dateStr = `${currentMonthStr}-${String(dayNum).padStart(2, '0')}`;
    const dayOfWeek = new Date(dateStr).getDay();
    const isSunday = dayOfWeek === 0;
    return { dayNum, dateStr, isSunday };
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">{t("Labour Management", "मजदूर प्रबंधन")}</h1>
          <p className="text-xs text-muted-foreground">{t("Manage workers, attendance and salaries", "मजदूर, हाजिरी और वेतन प्रबंधन")}</p>
        </div>
        <Button className="h-9 text-sm" onClick={() => setIsAddOpen(true)}>
          <Plus className="mr-1.5 h-4 w-4" />
          {t("Add Worker", "नया मजदूर")}
        </Button>
      </div>

      <Tabs defaultValue="today">
        <TabsList className="h-8 text-xs">
          <TabsTrigger value="today" className="text-xs">{t("Today's Attendance", "आज की हाजिरी")}</TabsTrigger>
          <TabsTrigger value="history" className="text-xs">{t("Attendance History", "हाजिरी इतिहास")}</TabsTrigger>
          <TabsTrigger value="salary" className="text-xs">{t("Salary", "वेतन")}</TabsTrigger>
        </TabsList>

        {/* TODAY'S ATTENDANCE */}
        <TabsContent value="today" className="mt-3 space-y-3">
          {laboursLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          ) : labours && labours.length > 0 ? (
            labours.map(labour => {
              const todayStatus = getTodayStatus(labour.id);
              return (
                <Card key={labour.id} className="shadow-sm">
                  <CardContent className="p-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm flex-shrink-0">
                          {labour.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <h3 className="font-semibold text-sm">{labour.name}</h3>
                            <Badge variant="outline" className="text-xs px-1.5 py-0 h-4">{labour.role || t("Worker", "मजदूर")}</Badge>
                          </div>
                          <div className="flex items-center gap-3 mt-0.5 text-muted-foreground text-xs">
                            {labour.phone && <span className="flex items-center"><Phone className="mr-0.5 h-2.5 w-2.5" />{labour.phone}</span>}
                            <span className="flex items-center"><IndianRupee className="mr-0.5 h-2.5 w-2.5" />₹{labour.salaryPerMonth}/mo</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {(["present", "half", "absent"] as const).map(s => (
                          <Button
                            key={s}
                            size="sm"
                            variant={todayStatus === s ? "default" : "outline"}
                            className={`h-7 px-2 text-xs ${todayStatus === s ? (s === "present" ? "bg-secondary" : s === "half" ? "bg-amber-500" : "bg-destructive") : ""}`}
                            onClick={() => handleMarkAttendance(labour.id, todayStr, s)}
                            disabled={markAttendance.isPending}
                          >
                            {s === "present" ? <><CheckCircle2 className="mr-1 h-3 w-3" />{t("Present", "उपस्थित")}</> :
                             s === "half" ? <><Clock className="mr-1 h-3 w-3" />{t("Half", "आधा दिन")}</> :
                             <><XCircle className="mr-1 h-3 w-3" />{t("Absent", "अनुपस्थित")}</>}
                          </Button>
                        ))}
                        <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => openEdit(labour)}>
                          <Edit className="h-3 w-3 text-secondary" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="icon" className="h-7 w-7">
                              <Trash2 className="h-3 w-3 text-destructive" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>{t("Delete worker?", "मजदूर हटाएं?")}</AlertDialogTitle>
                              <AlertDialogDescription>{t("This will permanently delete ", "यह स्थायी रूप से हटा देगा ")}<strong>{labour.name}</strong>.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>{t("Cancel", "रद्द करें")}</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(labour.id)} className="bg-destructive">{t("Delete", "हटाएं")}</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          ) : (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center p-10 text-center">
                <Users className="h-8 w-8 text-muted-foreground mb-3 opacity-40" />
                <h3 className="font-semibold text-sm mb-1">{t("No workers yet", "अभी कोई मजदूर नहीं")}</h3>
                <Button size="sm" onClick={() => setIsAddOpen(true)} className="mt-3">
                  <Plus className="mr-1.5 h-3.5 w-3.5" />{t("Add Worker", "मजदूर जोड़ें")}
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ATTENDANCE HISTORY */}
        <TabsContent value="history" className="mt-3">
          <Card className="shadow-sm">
            <CardHeader className="pb-2 pt-3 px-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">{t("Attendance Record", "हाजिरी रिकॉर्ड")}</CardTitle>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => setViewDate(d => subMonths(d, 1))}>
                    <ChevronLeft className="h-3.5 w-3.5" />
                  </Button>
                  <span className="text-sm font-semibold w-28 text-center">{format(viewDate, 'MMMM yyyy')}</span>
                  <Button variant="outline" size="icon" className="h-7 w-7" disabled={isCurrentMonth} onClick={() => setViewDate(d => addMonths(d, 1))}>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-3 overflow-x-auto">
              {laboursLoading || attendanceLoading ? (
                <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
              ) : labours && labours.length > 0 ? (
                <table className="w-full text-xs border-collapse" style={{ minWidth: `${daysInMonth * 28 + 120}px` }}>
                  <thead>
                    <tr>
                      <th className="text-left py-1 px-2 font-semibold sticky left-0 bg-card z-10 border-b w-28">{t("Worker", "मजदूर")}</th>
                      {dayColumns.map(({ dayNum, isSunday }) => (
                        <th key={dayNum} className={`py-1 px-0.5 text-center font-medium border-b w-7 ${isSunday ? 'text-destructive' : 'text-muted-foreground'}`}>
                          {dayNum}
                        </th>
                      ))}
                      <th className="py-1 px-2 text-center font-semibold border-b">{t("P", "उ")}</th>
                      <th className="py-1 px-2 text-center font-semibold border-b">{t("H", "आ")}</th>
                      <th className="py-1 px-2 text-center font-semibold border-b">{t("A", "अ")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {labours.map(labour => {
                      let presentCount = 0, halfCount = 0, absentCount = 0;
                      return (
                        <tr key={labour.id} className="hover:bg-muted/20 border-b last:border-0">
                          <td className="py-1.5 px-2 font-medium sticky left-0 bg-card z-10 truncate max-w-[7rem]">{labour.name}</td>
                          {dayColumns.map(({ dayNum, dateStr, isSunday }) => {
                            const status = getStatus(labour.id, dateStr);
                            if (status === "present") presentCount++;
                            else if (status === "half") halfCount++;
                            else if (status === "absent") absentCount++;
                            const cfg = status ? STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] : null;
                            const isPast = dateStr <= format(new Date(), 'yyyy-MM-dd');
                            const isToday = dateStr === todayStr;
                            return (
                              <td key={dayNum} className="py-1 px-0.5 text-center">
                                {cfg ? (
                                  <span className={`inline-flex items-center justify-center w-5 h-5 rounded text-xs font-bold ${cfg.class}`}>{cfg.label}</span>
                                ) : (
                                  <span className={`inline-flex items-center justify-center w-5 h-5 rounded text-xs ${isToday ? 'ring-1 ring-primary' : ''} ${isSunday ? 'text-destructive/40' : 'text-muted-foreground/30'}`}>
                                    {isSunday ? 'S' : isPast ? '-' : ''}
                                  </span>
                                )}
                              </td>
                            );
                          })}
                          <td className="py-1 px-2 text-center font-bold text-secondary">{presentCount}</td>
                          <td className="py-1 px-2 text-center font-bold text-amber-500">{halfCount}</td>
                          <td className="py-1 px-2 text-center font-bold text-destructive">{absentCount}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : (
                <p className="text-center text-muted-foreground text-sm py-6">{t("No workers added yet.", "अभी कोई मजदूर नहीं।")}</p>
              )}
              <div className="mt-3 flex gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><span className="w-4 h-4 rounded bg-secondary text-white flex items-center justify-center text-xs font-bold">P</span> {t("Present", "उपस्थित")}</span>
                <span className="flex items-center gap-1"><span className="w-4 h-4 rounded bg-amber-500 text-white flex items-center justify-center text-xs font-bold">H</span> {t("Half Day", "आधा दिन")}</span>
                <span className="flex items-center gap-1"><span className="w-4 h-4 rounded bg-destructive text-white flex items-center justify-center text-xs font-bold">A</span> {t("Absent", "अनुपस्थित")}</span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* SALARY TAB */}
        <TabsContent value="salary" className="mt-3">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold">{t("Select Worker", "मजदूर चुनें")}</h3>
                <div className="flex items-center gap-1">
                  <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => setViewDate(d => subMonths(d, 1))}>
                    <ChevronLeft className="h-3.5 w-3.5" />
                  </Button>
                  <span className="text-xs font-medium w-24 text-center">{format(viewDate, 'MMM yyyy')}</span>
                  <Button variant="outline" size="icon" className="h-7 w-7" disabled={isCurrentMonth} onClick={() => setViewDate(d => addMonths(d, 1))}>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
              {laboursLoading ? (
                <div className="flex justify-center py-4"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
              ) : labours?.map(labour => (
                <button
                  key={labour.id}
                  onClick={() => setSelectedLabourForSalary(labour.id)}
                  className={`w-full text-left rounded-lg border p-3 flex items-center gap-3 transition-all text-sm ${selectedLabourForSalary === labour.id ? 'border-primary bg-primary/5' : 'border-border hover:border-[#cacbcf]'}`}
                >
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs flex-shrink-0">
                    {labour.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="font-medium">{labour.name}</div>
                    <div className="text-xs text-muted-foreground">₹{labour.salaryPerMonth}/month</div>
                  </div>
                  <IndianRupee className="ml-auto h-3.5 w-3.5 text-primary" />
                </button>
              ))}
            </div>

            <Card className="shadow-sm">
              <CardHeader className="pb-2 pt-3 px-4">
                <CardTitle className="text-sm">{t("Salary Calculation", "वेतन गणना")}</CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                {!selectedLabourForSalary ? (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    {t("Select a worker to view salary", "वेतन देखने के लिए मजदूर चुनें")}
                  </div>
                ) : salaryLoading ? (
                  <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
                ) : salaryData ? (
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-bold text-base">{salaryData.labourName}</h3>
                      <p className="text-xs text-muted-foreground">{format(viewDate, 'MMMM yyyy')}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-secondary/10 p-3 rounded-lg border border-secondary/20">
                        <p className="text-xs text-muted-foreground">{t("Present", "उपस्थित")}</p>
                        <p className="font-bold text-lg text-secondary">{salaryData.presentDays} {t("days", "दिन")}</p>
                      </div>
                      <div className="bg-amber-500/10 p-3 rounded-lg border border-amber-500/20">
                        <p className="text-xs text-muted-foreground">{t("Half Days", "आधे दिन")}</p>
                        <p className="font-bold text-lg text-amber-600">{salaryData.halfDays} {t("days", "दिन")}</p>
                      </div>
                      <div className="bg-destructive/10 p-3 rounded-lg border border-destructive/20">
                        <p className="text-xs text-muted-foreground">{t("Absent", "अनुपस्थित")}</p>
                        <p className="font-bold text-lg text-destructive">{salaryData.absentDays} {t("days", "दिन")}</p>
                      </div>
                      <div className="bg-muted p-3 rounded-lg border">
                        <p className="text-xs text-muted-foreground">{t("Total Days", "कुल दिन")}</p>
                        <p className="font-bold text-lg">{salaryData.totalDays} {t("days", "दिन")}</p>
                      </div>
                    </div>
                    <div className="border-t pt-3 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">{t("Base Salary", "मूल वेतन")}</span>
                        <span className="font-medium">₹{salaryData.baseSalary}</span>
                      </div>
                      <div className="flex justify-between items-center bg-primary/10 px-4 py-3 rounded-lg border border-primary/20">
                        <span className="font-semibold text-sm">{t("Earned Salary", "अर्जित वेतन")}</span>
                        <span className="font-bold text-xl text-primary">₹{salaryData.calculatedSalary.toFixed(0)}</span>
                      </div>
                    </div>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Add Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base">{t("Add New Worker", "नया मजदूर")}</DialogTitle>
          </DialogHeader>
          <form onSubmit={addForm.handleSubmit(handleAddSubmit)}>
            <div className="space-y-3 py-3">
              <div className="space-y-1"><Label className="text-xs">{t("Name", "नाम")}</Label><Input {...addForm.register("name")} className="h-9 text-sm" />{addForm.formState.errors.name && <p className="text-xs text-destructive">{addForm.formState.errors.name.message}</p>}</div>
              <div className="space-y-1"><Label className="text-xs">{t("Phone (optional)", "फोन (वैकल्पिक)")}</Label><Input {...addForm.register("phone")} className="h-9 text-sm" /></div>
              <div className="space-y-1"><Label className="text-xs">{t("Role (optional)", "काम (वैकल्पिक)")}</Label><Input {...addForm.register("role")} placeholder="Helper, Delivery..." className="h-9 text-sm" /></div>
              <div className="space-y-1"><Label className="text-xs">{t("Monthly Salary (₹)", "मासिक वेतन (₹)")}</Label><Input type="number" {...addForm.register("salaryPerMonth")} className="h-9 text-sm" /></div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" size="sm" onClick={() => setIsAddOpen(false)}>{t("Cancel", "रद्द करें")}</Button>
              <Button type="submit" size="sm" disabled={createLabour.isPending}>{createLabour.isPending ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : null}{t("Save", "सेव करें")}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base">{t("Edit Worker", "मजदूर बदलें")}</DialogTitle>
          </DialogHeader>
          <form onSubmit={editForm.handleSubmit(handleEditSubmit)}>
            <div className="space-y-3 py-3">
              <div className="space-y-1"><Label className="text-xs">{t("Name", "नाम")}</Label><Input {...editForm.register("name")} className="h-9 text-sm" /></div>
              <div className="space-y-1"><Label className="text-xs">{t("Phone", "फोन")}</Label><Input {...editForm.register("phone")} className="h-9 text-sm" /></div>
              <div className="space-y-1"><Label className="text-xs">{t("Role", "काम")}</Label><Input {...editForm.register("role")} className="h-9 text-sm" /></div>
              <div className="space-y-1"><Label className="text-xs">{t("Monthly Salary (₹)", "मासिक वेतन (₹)")}</Label><Input type="number" {...editForm.register("salaryPerMonth")} className="h-9 text-sm" /></div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" size="sm" onClick={() => setIsEditOpen(false)}>{t("Cancel", "रद्द करें")}</Button>
              <Button type="submit" size="sm" disabled={updateLabour.isPending}>{updateLabour.isPending ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : null}{t("Save Changes", "बदलाव सेव करें")}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
