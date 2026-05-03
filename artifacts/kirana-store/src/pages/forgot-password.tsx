import { useState } from "react";
import { Link } from "wouter";
import { useLanguage } from "@/hooks/use-language";
import { useToast } from "@/hooks/use-toast";
import { forgotPassword } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Store, Loader2, Mail, ArrowLeft, CheckCircle2 } from "lucide-react";

export default function ForgotPassword() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    try {
      await forgotPassword(email);
      setSent(true);
    } catch (err: any) {
      toast({ variant: "destructive", title: t("Error", "त्रुटि"), description: err.message });
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-primary/5 p-4">
        <Card className="w-full max-w-md shadow-xl border-primary/20">
          <CardContent className="py-12 text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-xl font-bold">{t("Check your email", "अपना ईमेल देखें")}</h2>
            <p className="text-muted-foreground">
              {t("If this email is registered, you'll receive a password reset link shortly.", 
                 "अगर यह ईमेल पंजीकृत है, तो आपको जल्द ही पासवर्ड रीसेट लिंक मिलेगा।")}
            </p>
            <Link href="/login">
              <Button variant="outline" className="mt-4">
                <ArrowLeft className="mr-2 h-4 w-4" />
                {t("Back to Login", "लॉगिन पर वापस जाएं")}
              </Button>
            </Link>
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
            <Mail className="w-8 h-8" />
          </div>
          <CardTitle className="text-2xl font-bold">{t("Forgot Password", "पासवर्ड भूल गए")}</CardTitle>
          <CardDescription>
            {t("Enter your email to receive a reset link", "रीसेट लिंक प्राप्त करने के लिए ईमेल दर्ज करें")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label className="text-base">{t("Email", "ईमेल")}</Label>
              <Input
                type="email"
                placeholder="shop@example.com"
                className="h-14 text-lg"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full h-14 text-lg font-bold" disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-6 w-6 animate-spin" /> : <Mail className="mr-2 h-5 w-5" />}
              {t("Send Reset Link", "रीसेट लिंक भेजें")}
            </Button>
          </form>
          <div className="mt-6 text-center">
            <Link href="/login">
              <span className="text-primary font-medium hover:underline cursor-pointer text-sm flex items-center justify-center gap-1">
                <ArrowLeft className="h-4 w-4" />
                {t("Back to Login", "लॉगिन पर वापस जाएं")}
              </span>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
