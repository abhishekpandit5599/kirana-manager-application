import { useLanguage } from "@/hooks/use-language";
import { 
  useMarkNotificationRead,
  getListNotificationsQueryKey
} from "@workspace/api-client-react";
import { useQueryClient, useInfiniteQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { 
  Bell, 
  AlertTriangle, 
  Receipt, 
  Users, 
  Info,
  CheckCircle2,
  Loader2,
  CheckCheck
} from "lucide-react";
import { ErrorState } from "@/components/error-state";
import { useEffect } from "react";
import { useInView } from "react-intersection-observer";
import { markAllNotificationsRead, handleResponse } from "@/lib/api";

export default function Notifications() {
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const { ref, inView } = useInView();

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
    queryKey: getListNotificationsQueryKey(),
    queryFn: async ({ pageParam = 0 }) => {
      const res = await fetch(`/api/notifications?offset=${pageParam}&limit=20`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem("kirana_token")}`
        }
      });
      return handleResponse(res);
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.length === 20 ? allPages.length * 20 : undefined;
    },
  });

  const notifications = data?.pages.flat() || [];

  const markRead = useMarkNotificationRead();
  const markAllRead = useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: getListNotificationsQueryKey() });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard'] });
    }
  });

  useEffect(() => {
    if (inView && hasNextPage) {
      fetchNextPage();
    }
  }, [inView, fetchNextPage, hasNextPage]);

  const handleMarkRead = (id: string) => {
    markRead.mutate({ id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListNotificationsQueryKey() });
        queryClient.invalidateQueries({ queryKey: ['/api/dashboard'] });
      }
    });
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'low_stock': return <AlertTriangle className="h-6 w-6 text-destructive" />;
      case 'invoice': return <Receipt className="h-6 w-6 text-secondary" />;
      case 'salary': return <Users className="h-6 w-6 text-amber-500" />;
      case 'system':
      default: return <Info className="h-6 w-6 text-primary" />;
    }
  };

  const getBgColor = (type: string, isRead: boolean) => {
    if (isRead) return 'bg-background';
    switch (type) {
      case 'low_stock': return 'bg-destructive/5';
      case 'invoice': return 'bg-secondary/5';
      case 'salary': return 'bg-amber-500/5';
      case 'system':
      default: return 'bg-primary/5';
    }
  };

  return (
    <div className="space-y-6">
      {/* Sticky Header Section */}
      <div className="md:sticky md:top-0 z-20 -mx-4 md:-mx-6 px-4 md:px-6 pt-6 pb-4 space-y-4 md:bg-background/95 md:backdrop-blur-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">{t("Notifications", "सूचनाएं")}</h1>
            <p className="text-muted-foreground">{t("Stay updated with your store", "अपनी दुकान से अपडेट रहें")}</p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => markAllRead.mutate()}
              disabled={markAllRead.isPending || notifications.every(n => n.isRead)}
              className="border-[#cacbcf] hover:border-[#cacbcf] transition-colors"
            >
              <CheckCheck className="mr-2 h-4 w-4" />
              {t("Mark all read", "सभी पढ़े हुए")}
            </Button>
            <Button variant="outline" onClick={() => refetch()} className="border-[#cacbcf] hover:border-[#cacbcf] transition-colors">
              <Loader2 className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
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
        ) : notifications.length > 0 ? (
          <>
            <div className="space-y-4">
              {notifications.map((notification) => (
                <Card key={notification.id} className={`shadow-sm transition-colors group hover:border-[#cacbcf] ${getBgColor(notification.type, notification.isRead)} ${!notification.isRead ? 'border-primary/30' : 'border-[#cacbcf]/30'}`}>
                  <CardContent className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="flex-none bg-background p-3 rounded-full shadow-sm border border-muted flex items-center justify-center self-start sm:self-auto">
                      {getIcon(notification.type)}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className={`text-lg ${!notification.isRead ? 'font-bold' : 'font-medium'}`}>{notification.title}</h3>
                        {!notification.isRead && <Badge className="bg-primary hover:bg-primary uppercase text-[10px]">NEW</Badge>}
                      </div>
                      <p className="text-muted-foreground">{notification.message}</p>
                      <p className="text-xs text-muted-foreground mt-2">
                        {format(new Date(notification.createdAt), 'dd MMM yyyy, h:mm a')}
                      </p>
                    </div>
                    
                    {!notification.isRead && (
                      <Button 
                        variant="outline" 
                        className="self-start sm:self-center shrink-0 border-[#cacbcf]"
                        onClick={() => handleMarkRead(notification.id)}
                        disabled={markRead.isPending}
                      >
                        <CheckCircle2 className="mr-2 h-4 w-4 text-secondary" />
                        {t("Mark as Read", "पढ़ लिया")}
                      </Button>
                    )}
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
                <p className="text-sm text-muted-foreground">{t("All notifications loaded", "सभी सूचनाएं लोड हो गई")}</p>
              )}
            </div>
          </>
        ) : (
          <Card className="shadow-sm border-dashed">
            <CardContent className="flex flex-col items-center justify-center p-12 text-center">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                <Bell className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">{t("All caught up!", "सभी सूचनाएं पढ़ लीं!")}</h3>
              <p className="text-muted-foreground max-w-md">
                {t("You have no new notifications.", "आपके पास कोई नई सूचना नहीं है।")}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
