import { useState, useEffect } from "react";
import { useLanguage } from "@/hooks/use-language";
import { useToast } from "@/hooks/use-toast";
import { getSettings, updateSettings, uploadLogo, uploadUpiQr, getUpiQr, deleteLogo } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Save, Upload, Settings as SettingsIcon, Trash2 } from "lucide-react";
import { useDispatch } from "react-redux";
import { updateSettingsState } from "@/store/slices/settingsSlice";

export default function Settings() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<any>({});
  const [shopName, setShopName] = useState("");
  const [upiId, setUpiId] = useState("");
  const [themeColor, setThemeColor] = useState("#1e40af");
  const [ownerWhatsapp, setOwnerWhatsapp] = useState("");

  useEffect(() => {
    getSettings().then((data) => {
      setSettings(data);
      setUpiId(data.upiId || "");
      setShopName(data.shopName || "");
      setThemeColor(data.themeColor || "#1e40af");
      setOwnerWhatsapp(data.ownerWhatsapp || "");
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      let res = await updateSettings({ shopName: shopName || undefined, upiId, themeColor, ownerWhatsapp });
      localStorage.setItem("kirana_settings", JSON.stringify(res));
      if (res?.themeColor) {
        const hex = res.themeColor.replace('#', '');
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
        toast({ title: t("Settings Saved!", "सेटिंग्स सहेजी गईं!") });
      }
      dispatch(updateSettingsState({ shopName, upiId, themeColor, ownerWhatsapp }));
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err.message });
    } finally { setSaving(false); }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const result = await uploadLogo(file);
      setSettings((s: any) => ({ ...s, logoUrl: result.logoUrl }));
      dispatch(updateSettingsState({ logoUrl: result.logoUrl }));
      toast({ title: t("Logo Uploaded!", "लोगो अपलोड हो गया!") });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err.message });
    }
  };

  if (loading) return <div className="h-[60vh] flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6 max-w-2xl">
      <div><h1 className="text-xl font-bold flex items-center gap-2"><SettingsIcon className="h-5 w-5" />{t("Settings","सेटिंग्स")}</h1><p className="text-sm text-muted-foreground">{t("Configure your shop preferences","दुकान की प्राथमिकताएं कॉन्फ़िगर करें")}</p></div>

      <Card>
        <CardHeader><CardTitle className="text-base">{t("Shop Details","दुकान विवरण")}</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div><Label>{t("Shop Name","दुकान का नाम")}</Label><Input placeholder="My Kirana Store" value={shopName} onChange={e => setShopName(e.target.value)} /></div>
          <div><Label>{t("Shop Logo","दुकान का लोगो")}</Label>
            <div className="flex items-center gap-3 mt-1">
              {settings.logoUrl && <img src={settings.logoUrl} alt="Logo" className="w-12 h-12 rounded-lg object-cover border" />}
              <label className="cursor-pointer"><input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} /><Button variant="outline" size="sm" asChild><span><Upload className="mr-1 h-3 w-3" />{t("Upload","अपलोड")}</span></Button></label>
              {settings.logoUrl && (
                <Button variant="ghost" size="sm" onClick={async () => {
                  try {
                    await deleteLogo();
                    setSettings((s: any) => ({ ...s, logoUrl: null }));
                    dispatch(updateSettingsState({ logoUrl: null }));
                    toast({ title: t("Logo Removed", "लोगो हटा दिया गया") });
                  } catch (err: any) {
                    toast({ variant: "destructive", title: "Error", description: err.message });
                  }
                }}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              )}
            </div>
          </div>
          <div><Label>{t("Theme Color","थीम रंग")}</Label><div className="flex items-center gap-2 mt-1"><input type="color" value={themeColor} onChange={e => setThemeColor(e.target.value)} className="w-10 h-10 rounded cursor-pointer" /><Input value={themeColor} onChange={e => setThemeColor(e.target.value)} className="w-32" /></div></div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">{t("Payment","भुगतान")}</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div><Label>UPI ID</Label><Input placeholder="yourshop@upi" value={upiId} onChange={e => setUpiId(e.target.value)} /><p className="text-xs text-muted-foreground mt-1">{t("Used to generate QR codes for UPI payments","UPI भुगतान के लिए QR कोड बनाने में उपयोग होता है")}</p></div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">{t("Notifications","सूचनाएं")}</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div><Label>{t("WhatsApp Number","WhatsApp नंबर")}</Label><Input placeholder="+91 9876543210" value={ownerWhatsapp} onChange={e => setOwnerWhatsapp(e.target.value)} /><p className="text-xs text-muted-foreground mt-1">{t("Daily report will be sent here at 10 PM","दैनिक रिपोर्ट रात 10 बजे यहां भेजी जाएगी")}</p></div>
        </CardContent>
      </Card>

      <Button className="w-full h-12 font-bold" onClick={handleSave} disabled={saving}>
        {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
        {t("Save Settings","सेटिंग्स सहेजें")}
      </Button>
    </div>
  );
}
