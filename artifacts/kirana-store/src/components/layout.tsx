import { ReactNode, useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useLanguage } from "@/hooks/use-language";
import { 
  LayoutDashboard, 
  Package, 
  Receipt, 
  History, 
  Users, 
  Bell, 
  LogOut,
  Menu,
  ScanLine,
  Mic,
  UserCircle,
  Settings,
  ListChecks,
  Store
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useGetMe } from "@workspace/api-client-react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/store";
import { fetchSettings } from "@/store/slices/settingsSlice";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [location] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { logout } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const { data: user } = useGetMe();
  const dispatch = useDispatch<AppDispatch>();
  const settings = useSelector((state: RootState) => state.settings);
  const logoUrl = settings.logoUrl;

  useEffect(() => {
    dispatch(fetchSettings());
  }, [dispatch]);
  
  // Close mobile menu on navigation
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location]);

  useEffect(() => {
    if (settings.themeColor) {
      const hex = settings.themeColor.replace('#', '');
      const r = parseInt(hex.substring(0, 2), 16) / 255;
      const g = parseInt(hex.substring(2, 4), 16) / 255;
      const b = parseInt(hex.substring(4, 6), 16) / 255;
      const max = Math.max(r, g, b), min = Math.min(r, g, b);
      let h = 0, s_val = 0, l = (max + min) / 2;
      if (max !== min) {
        const d = max - min;
        s_val = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
          case r: h = (g - b) / d + (g < b ? 6 : 0); break;
          case g: h = (b - r) / d + 2; break;
          case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
      }
      const hslString = `${Math.round(h * 360)} ${Math.round(s_val * 100)}% ${Math.round(l * 100)}%`;
      document.documentElement.style.setProperty('--primary', hslString);
      document.documentElement.style.setProperty('--sidebar-primary', hslString);
      document.documentElement.style.setProperty('--chart-1', hslString);
    }
  }, [settings.themeColor]);

  const navigation = [
    { name: t("Dashboard", "डैशबोर्ड"), href: "/dashboard", icon: LayoutDashboard },
    { name: t("Inventory", "सामान"), href: "/inventory", icon: Package },
    { name: t("Billing", "बिलिंग"), href: "/billing", icon: Receipt },
    { name: t("Invoices", "रसीद"), href: "/invoices", icon: History },
    { name: t("Customers", "ग्राहक"), href: "/customers", icon: UserCircle },
    { name: t("Labour", "मजदूर"), href: "/labour", icon: Users },
    { name: t("Notifications", "सूचनाएं"), href: "/notifications", icon: Bell },
    { name: t("AI Scan", "स्कैन"), href: "/ai-ocr", icon: ScanLine },
    { name: t("AI Voice", "आवाज़"), href: "/ai-voice", icon: Mic },
    { name: t("Default Items", "डिफ़ॉल्ट सामान"), href: "/inventory/defaults", icon: ListChecks },
    { name: t("Settings", "सेटिंग्स"), href: "/settings", icon: Settings },
  ];

  const ShopLogo = ({ size = "sm" }: { size?: "sm" | "lg" }) => {
    const dim = size === "lg" ? "w-12 h-12" : "w-8 h-8";
    if (logoUrl) {
      return <img src={logoUrl} alt="Shop Logo" className={`${dim} rounded-lg object-cover border border-white/20`} />;
    }
    const fallbackSrc = size === "lg" ? "/kirana.png" : "/logo.png";
    return (
      <img src={fallbackSrc} alt="Kirana Logo" className={`${dim} rounded-xl object-cover bg-white shadow-sm`} />
    );
  };

  const NavLinks = () => (
    <div className="space-y-1">
      {navigation.map((item) => {
        const isActive = location === item.href;
        return (
          <Link key={item.name} href={item.href}>
            <span
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium text-sm transition-colors cursor-pointer ${
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-foreground hover:bg-muted"
              }`}
            >
              <item.icon className="h-4 w-4" />
              {item.name}
            </span>
          </Link>
        );
      })}
    </div>
  );

  return (
    <div className="h-screen bg-background flex flex-col md:flex-row overflow-hidden">
      {/* Mobile Header */}
      <header className="md:hidden sticky top-0 z-50 flex items-center justify-between p-3 bg-card border-b shadow-sm">
        <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[280px] p-0 border-none !p-0">
            <div className="p-4 bg-primary text-primary-foreground flex items-center gap-3">
              <ShopLogo size="lg" />
              <div className="min-w-0">
                <h2 className="text-lg font-bold truncate">{settings.shopName || (user as any)?.shopName || "Kirana"}</h2>
                <p className="text-sm opacity-90 truncate">{user?.name}</p>
              </div>
            </div>
            <div className="flex flex-col h-[calc(100vh-70px)] md:h-[calc(100vh-80px)]">
              <div className="h-[70%] md:flex-1 overflow-y-auto p-2">
                <NavLinks />
              </div>
              <div className="h-[30%] md:h-auto p-4 border-t bg-card space-y-3">
                <div className="flex items-center justify-between px-2">
                  <span className="text-sm font-medium">Language / भाषा</span>
                  <div className="flex bg-muted rounded-lg p-0.5">
                    <Button variant={language === "en" ? "default" : "ghost"} size="sm" className="h-7 text-xs px-2" onClick={() => setLanguage("en")}>EN</Button>
                    <Button variant={language === "hi" ? "default" : "ghost"} size="sm" className="h-7 text-xs px-2" onClick={() => setLanguage("hi")}>हि</Button>
                  </div>
                </div>
                <Button variant="outline" className="w-full justify-start h-9 text-sm" onClick={logout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  {t("Logout", "लॉग आउट")}
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
        <div className="flex items-center gap-2">
          <img src={logoUrl || "/logo.png"} alt="" className="w-7 h-7 rounded-md object-cover bg-primary/10" />
          <h1 className="text-base font-bold text-primary truncate max-w-[150px]">{settings.shopName || (user as any)?.shopName || "Kirana"}</h1>
        </div>
        <div className="flex bg-muted rounded-lg p-0.5">
          <Button variant={language === "en" ? "default" : "ghost"} size="sm" className="h-7 text-xs px-2" onClick={() => setLanguage("en")}>EN</Button>
          <Button variant={language === "hi" ? "default" : "ghost"} size="sm" className="h-7 text-xs px-2" onClick={() => setLanguage("hi")}>हि</Button>
        </div>
      </header>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-60 flex-col bg-card border-r fixed inset-y-0 left-0 z-50">
        <div className="p-4 bg-primary text-primary-foreground flex items-center gap-3">
          <ShopLogo size="lg" />
          <div className="min-w-0">
            <h2 className="text-base font-bold truncate">{settings.shopName || (user as any)?.shopName || "Kirana Store"}</h2>
            <p className="text-xs opacity-90 truncate mt-0.5">{user?.name}</p>
          </div>
        </div>
        <div className="flex-1 p-3 overflow-y-auto">
          <NavLinks />
        </div>
        <div className="p-3 border-t space-y-3 bg-card">
          <div className="flex items-center justify-between px-2">
            <span className="text-xs font-medium">Language / भाषा</span>
            <div className="flex bg-muted rounded-lg p-0.5">
              <Button variant={language === "en" ? "default" : "ghost"} size="sm" className="h-6 text-xs px-2" onClick={() => setLanguage("en")}>EN</Button>
              <Button variant={language === "hi" ? "default" : "ghost"} size="sm" className="h-6 text-xs px-2" onClick={() => setLanguage("hi")}>हि</Button>
            </div>
          </div>
          <Button variant="outline" className="w-full justify-start h-8 text-xs" onClick={logout}>
            <LogOut className="mr-1.5 h-3.5 w-3.5" />
            {t("Logout", "लॉग आउट")}
          </Button>
        </div>
      </aside>

      <main className="flex-1 md:ml-60 bg-muted/30 overflow-y-auto h-full px-4 md:px-6 pb-4 md:pb-6">
        <div className="max-w-6xl mx-auto pb-24 md:pb-0">
          {children}
        </div>
      </main>
    </div>
  );
}
