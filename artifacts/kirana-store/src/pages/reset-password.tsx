import { useState } from "react";
import { Link, useLocation, useSearch } from "wouter";
import { useLanguage } from "@/hooks/use-language";
import { useToast } from "@/hooks/use-toast";
import { resetPassword } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Lock, Loader2, CheckCircle2, ArrowLeft } from "lucide-react";

export default function ResetPassword() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const searchString = useSearch();
  const params = new URLSearchParams(searchString);
  const token = params.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast({ variant: "destructive", title: t("Error", "त्रुटि"), description: t("Passwords do not match", "पासवर्ड मेल नहीं खाते") });
      return;
    }
    if (password.length < 6) {
      toast({ variant: "destructive", title: t("Error", "त्रुटि"), description: t("Password must be at least 6 characters", "पासवर्ड कम से कम 6 अक्षर का होना चाहिए") });
      return;
    }
    setLoading(true);
    try {
      await resetPassword(token, password);
      setSuccess(true);
      setTimeout(() => setLocation("/login"), 3000);
    } catch (err: any) {
      toast({ variant: "destructive", title: t("Error", "त्रुटि"), description: err.message });
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-primary/5 p-4">
        <Card className="w-full max-w-md shadow-xl">
          <CardContent className="py-12 text-center space-y-4">
            <p className="text-destructive font-medium">{t("Invalid or missing reset token", "अमान्य या गायब रीसेट टोकन")}</p>
            <Link href="/forgot-password">
              <Button variant="outline"><ArrowLeft className="mr-2 h-4 w-4" />{t("Request new link", "नया लिंक प्राप्त करें")}</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-primary/5 p-4">
        <Card className="w-full max-w-md shadow-xl border-primary/20">
          <CardContent className="py-12 text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center animate-in zoom-in">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-xl font-bold">{t("Password Reset!", "पासवर्ड रीसेट हो गया!")}</h2>
            <p className="text-muted-foreground">{t("Redirecting to login...", "लॉगिन पेज पर जा रहे हैं...")}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-primary/5 p-4">
      <Card className="w-full max-w-md shadow-xl border-primary/20">
        <CardHeader className="space-y-3 text-center pb-6">
          <div className="mx-auto bg-primary text-primary-foreground w-16 h-16 flex items-center justify-center rounded-2xl shadow-lg mb-2">
            <Lock className="w-8 h-8" />
          </div>
          <CardTitle className="text-2xl font-bold">{t("Reset Password", "पासवर्ड रीसेट करें")}</CardTitle>
          <CardDescription>{t("Enter your new password below", "नीचे अपना नया पासवर्ड दर्ज करें")}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label className="text-base">{t("New Password", "नया पासवर्ड")}</Label>
              <Input type="password" placeholder="••••••••" className="h-14 text-lg" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label className="text-base">{t("Confirm Password", "पासवर्ड की पुष्टि करें")}</Label>
              <Input type="password" placeholder="••••••••" className="h-14 text-lg" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
            </div>
            <Button type="submit" className="w-full h-14 text-lg font-bold" disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-6 w-6 animate-spin" /> : <Lock className="mr-2 h-5 w-5" />}
              {t("Reset Password", "पासवर्ड रीसेट करें")}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
