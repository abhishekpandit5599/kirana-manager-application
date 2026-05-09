import { useState, useMemo, useEffect } from "react";
import { useLanguage } from "@/hooks/use-language";
import { useToast } from "@/hooks/use-toast";
import {
  listLabour,
  useCreateLabour,
  useUpdateLabour,
  useDeleteLabour,
  listAttendance,
  useMarkAttendance,
  useGetLabourSalary,
} from "@workspace/api-client-react";
import { useQueryClient, useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
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
  ChevronRight,
  Search,
  RefreshCw,
  MoreVertical
} from "lucide-react";
import { ErrorState } from "@/components/error-state";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format, getDaysInMonth, startOfMonth, addMonths, subMonths, parseISO } from "date-fns";
import { useInView } from "react-intersection-observer";
import { useDebounce } from "@/hooks/use-debounce";

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
  const { ref, inView } = useInView();

  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 500);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingLabourId, setEditingLabourId] = useState<string | null>(null);
  const [selectedLabourForSalary, setSelectedLabourForSalary] = useState<string | null>(null);

  const [viewDate, setViewDate] = useState(new Date());
  const currentMonthStr = format(viewDate, 'yyyy-MM');
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const daysInMonth = getDaysInMonth(viewDate);

  // Infinite Query for Labourers
  const {
    data: labourData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: laboursLoading,
    refetch: refetchLabour,
    isRefetching: isRefetchingLabour,
    isError: isLabourError,
    error: labourError
  } = useInfiniteQuery({
    queryKey: ["labour", debouncedSearch],
    queryFn: ({ pageParam = 0 }) => 
      listLabour({
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

  const labours = useMemo(() => {
    return labourData?.pages.flat() || [];
  }, [labourData]);

  // Attendance data (not paginated yet as it's month-based, but we could add it if needed)
  const { data: attendanceData, isLoading: attendanceLoading, refetch: refetchAttendance } = useQuery({
    queryKey: ["attendance", currentMonthStr],
    queryFn: () => listAttendance({ month: currentMonthStr })
  });

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
    createLabour.mutate({ data: data as any }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["labour"] });
        setIsAddOpen(false);
        addForm.reset();
        toast({ title: t("Worker added", "मजदूर जोड़ा गया") });
      },
      onError: (err: any) => toast({ variant: "destructive", title: t("Error", "त्रुटि"), description: err.message })
    });
  };

  const openEdit = (labour: any) => {
    setEditingLabourId(labour.id);
    editForm.reset({ name: labour.name, phone: labour.phone || "", role: labour.role || "", salaryPerMonth: labour.salaryPerMonth });
    setIsEditOpen(true);
  };

  const handleEditSubmit = (data: LabourForm) => {
    if (!editingLabourId) return;
    updateLabour.mutate({ id: editingLabourId, data: data as any }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["labour"] });
        setIsEditOpen(false);
        toast({ title: t("Worker updated", "मजदूर अपडेट किया गया") });
      },
      onError: (err: any) => toast({ variant: "destructive", title: t("Error", "त्रुटि"), description: err.message })
    });
  };

  const handleDelete = (id: string) => {
    deleteLabour.mutate({ id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["labour"] });
        toast({ title: t("Worker deleted", "मजदूर हटाया गया") });
      },
      onError: (err: any) => toast({ variant: "destructive", title: t("Error", "त्रुटि"), description: err.message })
    });
  };

  const handleMarkAttendance = (labourId: string, date: string, status: "present" | "absent" | "half") => {
    markAttendance.mutate({ data: { labourId, date, status } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["attendance", currentMonthStr] });
        queryClient.invalidateQueries({ queryKey: ["salary", labourId, currentMonthStr] });
        toast({ title: t("Attendance marked", "हाजिरी दर्ज की गई") });
      }
    });
  };

  const getStatus = (labourId: string, dateStr: string) => {
    return attendanceData?.find(a => a.labourId === labourId && a.date.startsWith(dateStr))?.status;
  };

  const getTodayStatus = (labourId: string) => getStatus(labourId, todayStr);

  const isCurrentMonth = format(viewDate, 'yyyy-MM') === format(new Date(), 'yyyy-MM');

  const dayColumns = Array.from({ length: daysInMonth }, (_, i) => {
    const dayNum = i + 1;
    const dateStr = `${currentMonthStr}-${String(dayNum).padStart(2, '0')}`;
    const dayOfWeek = new Date(dateStr).getDay();
    const isSunday = dayOfWeek === 0;
    return { dayNum, dateStr, isSunday };
  });

  return (
    <div className="space-y-6">
      <Tabs defaultValue="today" className="w-full">
        {/* Sticky Header Section */}
        <div className="sticky top-14 md:top-0 z-20 -mx-4 md:-mx-6 px-4 md:px-6 pt-6 pb-4 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-foreground">{t("Labour Management", "मजदूर प्रबंधन")}</h1>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="border-[#cacbcf] hover:border-[#cacbcf] h-12 rounded-xl bg-white transition-all shadow-sm" onClick={() => { refetchLabour(); refetchAttendance(); }} disabled={laboursLoading || isRefetchingLabour}>
                <RefreshCw className={`mr-2 h-5 w-5 ${isRefetchingLabour ? 'animate-spin' : ''}`} />
                {t("Refresh", "ताज़ा करें")}
              </Button>
              <Button className="h-12 border-none rounded-xl shadow-md bg-primary hover:bg-primary/90" onClick={() => setIsAddOpen(true)}>
                <Plus className="mr-2 h-5 w-5" />
                {t("Add Worker", "नया मजदूर")}
              </Button>
            </div>
          </div>

          <TabsList className="flex items-center justify-start gap-1 h-11 p-1 bg-muted/40 rounded-xl w-fit">
            <TabsTrigger value="today" className="rounded-lg h-full text-xs font-bold transition-all data-[state=active]:bg-white data-[state=active]:shadow-sm px-4">{t("Today's Attendance", "आज की हाजिरी")}</TabsTrigger>
            <TabsTrigger value="history" className="rounded-lg h-full text-xs font-bold transition-all data-[state=active]:bg-white data-[state=active]:shadow-sm px-4">{t("Attendance History", "हाजिरी इतिहास")}</TabsTrigger>
            <TabsTrigger value="salary" className="rounded-lg h-full text-xs font-bold transition-all data-[state=active]:bg-white data-[state=active]:shadow-sm px-4">{t("Salary", "वेतन")}</TabsTrigger>
          </TabsList>

        </div>

        <TabsContent value="today" className="mt-6 space-y-6 animate-in fade-in slide-in-from-bottom-2">

          {laboursLoading ? (
            <div className="h-[30vh] flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
          ) : isLabourError ? (
            <ErrorState 
              message={labourError?.message} 
              onRetry={() => refetchLabour()} 
            />
          ) : labours.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {labours.map(labour => {
                const todayStatus = getTodayStatus(labour.id);
                return (
                  <Card key={labour.id} className="group hover:border-[#cacbcf] transition-all border-[#cacbcf]/30 overflow-hidden shadow-sm focus:ring-0 focus:outline-none">
                    <CardContent className="p-0">
                      <div className="p-4 bg-muted/20 border-b flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
                            {labour.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <h3 className="font-bold text-lg text-foreground truncate max-w-[150px]">{labour.name}</h3>
                            <Badge variant="secondary" className="text-[10px] uppercase font-bold">{labour.role || t("Worker", "मजदूर")}</Badge>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-white" onClick={() => openEdit(labour)}>
                            <Edit className="h-4 w-4 text-secondary" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-white">
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>{t("Delete worker?", "मजदूर हटाएं?")}</AlertDialogTitle>
                                <AlertDialogDescription>{t("This will permanently delete ", "यह स्थायी रूप से हटा देगा ")}<strong>{labour.name}</strong>.</AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel className="border-[#cacbcf]">{t("Cancel", "रद्द करें")}</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete(labour.id)} className="bg-destructive hover:bg-destructive/90">{t("Delete", "हटाएं")}</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                      
                      <div className="p-4 space-y-4">
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex flex-col">
                            <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">{t("Salary", "वेतन")}</span>
                            <span className="font-bold text-primary flex items-center">
                              <IndianRupee className="h-3.5 w-3.5 mr-0.5" />
                              {labour.salaryPerMonth}/mo
                            </span>
                          </div>
                          {labour.phone && (
                            <div className="flex flex-col items-end">
                              <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">{t("Contact", "संपर्क")}</span>
                              <span className="flex items-center text-slate-600">
                                <Phone className="h-3.5 w-3.5 mr-1" />
                                {labour.phone}
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="grid grid-cols-3 gap-2">
                          {(["present", "half", "absent"] as const).map(s => (
                            <Button
                              key={s}
                              size="sm"
                              variant={todayStatus === s ? "default" : "outline"}
                              className={`h-9 text-[10px] font-bold uppercase rounded-xl transition-all ${
                                todayStatus === s 
                                  ? (s === "present" ? "bg-secondary border-none" : s === "half" ? "bg-amber-500 border-none" : "bg-destructive border-none") 
                                  : "border-[#cacbcf] hover:bg-muted"
                              }`}
                              onClick={() => handleMarkAttendance(labour.id, todayStr, s)}
                              disabled={markAttendance.isPending}
                            >
                              {s === "present" ? t("P", "उ") : s === "half" ? t("H", "आ") : t("A", "अ")}
                            </Button>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
              <div ref={ref} className="h-10 col-span-full flex items-center justify-center">
                {isFetchingNextPage && <Loader2 className="h-6 w-6 animate-spin text-primary" />}
              </div>
            </div>
          ) : (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center p-16 text-center">
                <Users className="h-12 w-12 text-muted-foreground mb-4 opacity-30" />
                <h3 className="text-xl font-bold mb-2">{t("No workers yet", "अभी कोई मजदूर नहीं")}</h3>
                <Button onClick={() => setIsAddOpen(true)} className="mt-4 border-none">
                  <Plus className="mr-2 h-5 w-5" />{t("Add Your First Worker", "पहला मजदूर जोड़ें")}
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="history" className="mt-6 animate-in fade-in slide-in-from-bottom-2 max-w-full min-w-0">
          <Card className="shadow-sm border-[#cacbcf]/30 overflow-hidden w-full max-w-full">
            <div className="p-4 border-b bg-muted/10 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-xl text-primary">
                  <CalendarDays className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">{t("Attendance Grid", "हाजिरी ग्रिड")}</h3>
                  <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">{format(viewDate, 'MMMM yyyy')}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 bg-white p-1 rounded-xl border border-[#cacbcf]/50">
                <Button variant="ghost" size="icon" className="h-10 w-10 rounded-lg" onClick={() => setViewDate(d => subMonths(d, 1))}>
                  <ChevronLeft className="h-5 w-5" />
                </Button>
                <span className="text-sm font-bold min-w-[120px] text-center">{format(viewDate, 'MMMM yyyy')}</span>
                <Button variant="ghost" size="icon" className="h-10 w-10 rounded-lg" disabled={isCurrentMonth} onClick={() => setViewDate(d => addMonths(d, 1))}>
                  <ChevronRight className="h-5 w-5" />
                </Button>
              </div>
            </div>
            <CardContent className="p-0 overflow-x-auto relative w-full">
              {laboursLoading || attendanceLoading ? (
                <div className="h-40 flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
              ) : isLabourError ? (
                <div className="p-12">
                  <ErrorState 
                    message={labourError?.message} 
                    onRetry={() => { refetchLabour(); refetchAttendance(); }} 
                  />
                </div>
              ) : labours.length > 0 ? (
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="bg-muted/50">
                      <th className="text-left py-1 px-2 font-bold uppercase tracking-wider sticky left-0 bg-slate-50 z-20 border-b border-r w-20 text-[8px]">{t("Worker", "मजदूर")}</th>
                      {dayColumns.map(({ dayNum, isSunday }) => (
                        <th key={dayNum} className={`py-1 px-0.5 text-center font-bold border-b min-w-[18px] text-[9px] ${isSunday ? 'text-destructive bg-destructive/5' : 'text-muted-foreground'}`}>
                          {dayNum}
                        </th>
                      ))}
                      <th className="py-1 px-1 text-center font-bold border-b text-secondary bg-slate-50 sticky right-[60px] z-20 border-l text-[9px]">P</th>
                      <th className="py-1 px-1 text-center font-bold border-b text-amber-500 bg-slate-50 sticky right-[30px] z-20 border-l text-[9px]">H</th>
                      <th className="py-1 px-1 text-center font-bold border-b text-destructive bg-slate-50 sticky right-0 z-20 border-l text-[9px]">A</th>
                    </tr>
                  </thead>
                  <tbody>
                    {labours.map(labour => {
                      let presentCount = 0, halfCount = 0, absentCount = 0;
                      return (
                        <tr key={labour.id} className="hover:bg-muted/30 transition-colors border-b last:border-0 group">
                          <td className="py-2 px-2 font-bold sticky left-0 bg-white group-hover:bg-muted/30 z-10 truncate max-w-[5rem] border-r text-[10px]">
                            {labour.name}
                          </td>
                          {dayColumns.map(({ dayNum, dateStr, isSunday }) => {
                            const status = getStatus(labour.id, dateStr);
                            if (status === "present") presentCount++;
                            else if (status === "half") halfCount++;
                            else if (status === "absent") absentCount++;
                            const cfg = status ? STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] : null;
                            const isPast = dateStr <= todayStr;
                            const isToday = dateStr === todayStr;
                            return (
                              <td key={dayNum} className={`py-3 px-1 text-center border-r last:border-0 ${isSunday ? 'bg-destructive/5' : ''}`}>
                                {cfg ? (
                                  <div className={`w-7 h-7 mx-auto rounded-lg flex items-center justify-center text-[10px] font-black shadow-sm ${cfg.class} animate-in zoom-in-50`}>
                                    {cfg.label}
                                  </div>
                                ) : (
                                  <div className={`w-7 h-7 mx-auto rounded-lg flex items-center justify-center text-[10px] font-bold ${isSunday ? 'text-destructive/30' : 'text-muted-foreground/20'}`}>
                                    {isSunday ? 'S' : isPast ? '•' : ''}
                                  </div>
                                )}
                              </td>
                            );
                          })}
                          <td className="py-1 px-1 text-center font-black text-secondary bg-white sticky right-[60px] z-10 border-l border-r group-hover:bg-muted/30 text-[9px]">{presentCount}</td>
                          <td className="py-1 px-1 text-center font-black text-amber-500 bg-white sticky right-[30px] z-10 border-l border-r group-hover:bg-muted/30 text-[9px]">{halfCount}</td>
                          <td className="py-1 px-1 text-center font-black text-destructive bg-white sticky right-0 z-10 border-l group-hover:bg-muted/30 text-[9px]">{absentCount}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : (
                <div className="p-12 text-center text-muted-foreground">{t("No data available.", "कोई डेटा उपलब्ध नहीं।")}</div>
              )}
            </CardContent>
            <div className="p-4 border-t bg-muted/5 flex flex-wrap gap-6 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              <div className="flex items-center gap-2"><div className="w-4 h-4 rounded bg-secondary" /> {t("Present", "उपस्थित")}</div>
              <div className="flex items-center gap-2"><div className="w-4 h-4 rounded bg-amber-500" /> {t("Half Day", "आधा दिन")}</div>
              <div className="flex items-center gap-2"><div className="w-4 h-4 rounded bg-destructive" /> {t("Absent", "अनुपस्थित")}</div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="salary" className="mt-6 animate-in fade-in slide-in-from-bottom-2">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 space-y-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-lg">{t("Select Worker", "मजदूर चुनें")}</h3>
                <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-[#cacbcf]/50">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setViewDate(d => subMonths(d, 1))}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8" disabled={isCurrentMonth} onClick={() => setViewDate(d => addMonths(d, 1))}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                {laboursLoading ? (
                  <div className="flex justify-center py-4"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
                ) : labours.map(labour => (
                  <button
                    key={labour.id}
                    onClick={() => setSelectedLabourForSalary(labour.id)}
                    className={`w-full text-left rounded-2xl border p-4 flex items-center gap-4 transition-all ${
                      selectedLabourForSalary === labour.id 
                        ? 'border-primary ring-2 ring-primary/10 bg-primary/5' 
                        : 'border-[#cacbcf]/30 bg-white hover:border-[#cacbcf]'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                      {labour.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold truncate">{labour.name}</div>
                      <div className="text-xs text-muted-foreground flex items-center">
                        <IndianRupee className="h-3 w-3 mr-0.5" />
                        {labour.salaryPerMonth}/mo
                      </div>
                    </div>
                    <ChevronRight className={`h-5 w-5 transition-transform ${selectedLabourForSalary === labour.id ? 'translate-x-1 text-primary' : 'text-muted-foreground'}`} />
                  </button>
                ))}
              </div>
            </div>

            <div className="lg:col-span-2">
              <Card className="shadow-lg border-[#cacbcf]/30 overflow-hidden h-full">
                <div className="p-6 border-b bg-muted/10">
                  <h3 className="font-bold text-lg">{t("Salary Statement", "वेतन विवरण")}</h3>
                  <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">{format(viewDate, 'MMMM yyyy')}</p>
                </div>
                <CardContent className="p-8">
                  {!selectedLabourForSalary ? (
                    <div className="flex flex-col items-center justify-center py-20 text-muted-foreground space-y-4">
                      <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center">
                        <IndianRupee className="h-10 w-10 opacity-20" />
                      </div>
                      <p className="font-bold">{t("Select a worker to view salary statement", "वेतन देखने के लिए मजदूर चुनें")}</p>
                    </div>
                  ) : salaryLoading ? (
                    <div className="flex flex-col items-center justify-center py-20"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>
                  ) : salaryData ? (
                    <div className="space-y-8 animate-in fade-in zoom-in-95">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <div className="w-16 h-16 rounded-2xl bg-primary text-white flex items-center justify-center text-3xl font-black shadow-lg shadow-primary/20">
                            {salaryData.labourName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <h3 className="font-black text-3xl text-foreground">{salaryData.labourName}</h3>
                            <Badge variant="outline" className="mt-1 border-[#cacbcf] font-bold uppercase tracking-widest">{t("Active Staff", "सक्रिय कर्मचारी")}</Badge>
                          </div>
                        </div>
                        <div className="bg-muted/50 p-4 rounded-2xl border border-[#cacbcf]/30 text-right w-full sm:w-auto">
                          <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest mb-1">{t("Payable Salary", "देय वेतन")}</p>
                          <p className="text-4xl font-black text-primary">₹{Math.round(salaryData.calculatedSalary).toLocaleString()}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <div className="p-4 rounded-2xl bg-secondary/5 border border-secondary/20 space-y-1">
                          <p className="text-[10px] font-bold uppercase text-secondary tracking-widest">{t("Present", "उपस्थित")}</p>
                          <p className="text-2xl font-black text-secondary">{salaryData.presentDays} <span className="text-xs font-medium opacity-70">Days</span></p>
                        </div>
                        <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20 space-y-1">
                          <p className="text-[10px] font-bold uppercase text-amber-600 tracking-widest">{t("Half Days", "आधे दिन")}</p>
                          <p className="text-2xl font-black text-amber-600">{salaryData.halfDays} <span className="text-xs font-medium opacity-70">Days</span></p>
                        </div>
                        <div className="p-4 rounded-2xl bg-destructive/5 border border-destructive/20 space-y-1">
                          <p className="text-[10px] font-bold uppercase text-destructive tracking-widest">{t("Absent", "अनुपस्थित")}</p>
                          <p className="text-2xl font-black text-destructive">{salaryData.absentDays} <span className="text-xs font-medium opacity-70">Days</span></p>
                        </div>
                        <div className="p-4 rounded-2xl bg-slate-100 border border-slate-200 space-y-1">
                          <p className="text-[10px] font-bold uppercase text-slate-500 tracking-widest">{t("Month total", "कुल दिन")}</p>
                          <p className="text-2xl font-black text-slate-700">{salaryData.totalDays} <span className="text-xs font-medium opacity-70">Days</span></p>
                        </div>
                      </div>

                      <div className="pt-6 border-t space-y-4">
                        <div className="flex justify-between items-center px-2">
                          <span className="text-sm font-bold text-muted-foreground uppercase tracking-widest">{t("Base Salary", "मूल वेतन")}</span>
                          <span className="text-lg font-bold">₹{salaryData.baseSalary.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center px-2">
                          <span className="text-sm font-bold text-muted-foreground uppercase tracking-widest">{t("Deductions", "कटौती")}</span>
                          <span className="text-lg font-bold text-destructive">-₹{Math.round(salaryData.baseSalary - salaryData.calculatedSalary).toLocaleString()}</span>
                        </div>
                        <div className="bg-primary/5 p-6 rounded-[2rem] border border-primary/20 flex flex-col sm:flex-row items-center justify-between gap-4">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-primary text-white flex items-center justify-center">
                              <CheckCircle2 className="h-6 w-6" />
                            </div>
                            <div>
                              <p className="font-bold text-lg">{t("Final Settlement", "अंतिम भुगतान")}</p>
                              <p className="text-xs text-muted-foreground">{t("Calculated based on attendance history", "हाजिरी इतिहास के आधार पर")}</p>
                            </div>
                          </div>
                          <p className="text-4xl font-black text-primary">₹{Math.round(salaryData.calculatedSalary).toLocaleString()}</p>
                        </div>
                      </div>
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Add Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("Add New Worker", "नया मजदूर जोड़ें")}</DialogTitle>
          </DialogHeader>
          <form onSubmit={addForm.handleSubmit(handleAddSubmit)}>
            <div className="grid gap-6 py-6">
              <div className="grid gap-2">
                <Label htmlFor="name">{t("Full Name", "पूरा नाम")} *</Label>
                <Input id="name" {...addForm.register("name")} className="h-12 border-[#cacbcf]" placeholder="Ramesh Helper" />
                {addForm.formState.errors.name && <p className="text-xs text-destructive font-bold">{addForm.formState.errors.name.message}</p>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="phone">{t("Phone Number", "फ़ोन नंबर")}</Label>
                  <Input id="phone" {...addForm.register("phone")} className="h-12 border-[#cacbcf]" placeholder="9876543210" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="role">{t("Role / Position", "पद")}</Label>
                  <Input id="role" {...addForm.register("role")} className="h-12 border-[#cacbcf]" placeholder="e.g. Delivery, Stock" />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="salary">{t("Monthly Salary (₹)", "मासिक वेतन (₹)")} *</Label>
                <div className="relative">
                  <IndianRupee className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input id="salary" type="number" {...addForm.register("salaryPerMonth")} className="h-12 pl-12 border-[#cacbcf]" placeholder="8000" />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" className="border-[#cacbcf] h-12 px-6" onClick={() => setIsAddOpen(false)}>{t("Cancel", "रद्द करें")}</Button>
              <Button type="submit" className="h-12 px-8 border-none" disabled={createLabour.isPending}>
                {createLabour.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t("Save Worker", "मजदूर सेव करें")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("Edit Worker Details", "मजदूर विवरण बदलें")}</DialogTitle>
          </DialogHeader>
          <form onSubmit={editForm.handleSubmit(handleEditSubmit)}>
            <div className="grid gap-6 py-6">
              <div className="grid gap-2">
                <Label htmlFor="edit-name">{t("Full Name", "पूरा नाम")} *</Label>
                <Input id="edit-name" {...editForm.register("name")} className="h-12 border-[#cacbcf]" />
                {editForm.formState.errors.name && <p className="text-xs text-destructive font-bold">{editForm.formState.errors.name.message}</p>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-phone">{t("Phone Number", "फ़ोन नंबर")}</Label>
                  <Input id="edit-phone" {...editForm.register("phone")} className="h-12 border-[#cacbcf]" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-role">{t("Role / Position", "पद")}</Label>
                  <Input id="edit-role" {...editForm.register("role")} className="h-12 border-[#cacbcf]" />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-salary">{t("Monthly Salary (₹)", "मासिक वेतन (₹)")} *</Label>
                <div className="relative">
                  <IndianRupee className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input id="edit-salary" type="number" {...editForm.register("salaryPerMonth")} className="h-12 pl-12 border-[#cacbcf]" />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" className="border-[#cacbcf] h-12 px-6" onClick={() => setIsEditOpen(false)}>{t("Cancel", "रद्द करें")}</Button>
              <Button type="submit" className="h-12 px-8 border-none" disabled={updateLabour.isPending}>
                {updateLabour.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t("Save Changes", "बदलाव सेव करें")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
