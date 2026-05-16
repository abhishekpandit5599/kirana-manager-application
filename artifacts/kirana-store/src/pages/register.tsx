import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRegisterUser } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/hooks/use-language";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Store, Loader2, Eye, EyeOff, ArrowLeft } from "lucide-react";
import { SEO } from "@/components/seo";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";

const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  shopName: z.string().min(2, "Shop Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  phone: z.string().optional(),
});

type RegisterForm = z.infer<typeof registerSchema>;

export default function Register() {
  const [, setLocation] = useLocation();
  const { setToken } = useAuth();
  const { toast } = useToast();
  const { t } = useLanguage();
  const registerMutation = useRegisterUser();

  const [step, setStep] = useState<"form" | "otp">("form");
  const [showPassword, setShowPassword] = useState(false);
  const [otp, setOtp] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);

  const form = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: "", shopName: "", email: "", password: "", phone: "" },
  });

  const onSubmit = (data: RegisterForm) => {
    registerMutation.mutate(
      { data },
      {
        onSuccess: () => {
          toast({ title: t("OTP Sent!", "OTP भेज दिया गया!") });
          setStep("otp");
        },
        onError: (err) => {
          toast({ 
            variant: "destructive", 
            title: t("Registration Failed", "पंजीकरण विफल"),
            description: err.message || t("Please check your details", "कृपया अपना विवरण जांचें")
          });
        },
      }
    );
  };

  const handleVerifyOtp = async () => {
    if (otp.length !== 6) return;
    setIsVerifying(true);
    try {
      const email = form.getValues("email");
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Invalid OTP");
      
      setToken(data.token);
      toast({ title: t("Account Verified!", "खाता सत्यापित!") });
      setLocation("/dashboard");
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err.message });
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-primary/5 p-4 py-8">
      <SEO title="Register" description="Join KiranaPro today and manage your store smarter." />
      <Card className="w-full max-w-md shadow-xl border-primary/20">
        <CardHeader className="space-y-3 text-center pb-6">
          <div className="mx-auto flex items-center justify-center mb-6">
            <img src="/kirana_logo.png" alt="KiranaPro" className="h-14 md:h-16 w-auto object-contain" />
          </div>
          <CardDescription className="text-lg text-muted-foreground">
            {step === "form" 
              ? t("Create your store account", "अपना स्टोर खाता बनाएं")
              : t("Verify your email", "अपना ईमेल सत्यापित करें")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {step === "form" ? (
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label className="text-base">{t("Full Name", "पूरा नाम")}</Label>
                <Input 
                  {...form.register("name")} 
                  placeholder="Ramesh Kumar" 
                  className="h-12 text-base"
                />
                {form.formState.errors.name && (
                  <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label className="text-base">{t("Shop Name", "दुकान का नाम")}</Label>
                <Input 
                  {...form.register("shopName")} 
                  placeholder="Ramesh Kirana Store" 
                  className="h-12 text-base"
                />
                {form.formState.errors.shopName && (
                  <p className="text-sm text-destructive">{form.formState.errors.shopName.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label className="text-base">{t("Email", "ईमेल")}</Label>
                <Input 
                  {...form.register("email")} 
                  type="email" 
                  placeholder="shop@example.com" 
                  className="h-12 text-base"
                />
                {form.formState.errors.email && (
                  <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label className="text-base">{t("Phone (Optional)", "फोन (वैकल्पिक)")}</Label>
                <Input 
                  {...form.register("phone")} 
                  type="tel" 
                  placeholder="9876543210" 
                  className="h-12 text-base"
                />
                {form.formState.errors.phone && (
                  <p className="text-sm text-destructive">{form.formState.errors.phone.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label className="text-base">{t("Password", "पासवर्ड")}</Label>
                <div className="relative">
                  <Input 
                    {...form.register("password")} 
                    type={showPassword ? "text" : "password"} 
                    placeholder="••••••••" 
                    className="h-12 text-base pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {form.formState.errors.password && (
                  <p className="text-sm text-destructive">{form.formState.errors.password.message}</p>
                )}
              </div>
              <Button 
                type="submit" 
                className="w-full h-14 text-lg font-bold mt-4" 
                disabled={registerMutation.isPending}
              >
                {registerMutation.isPending ? <Loader2 className="mr-2 h-6 w-6 animate-spin" /> : null}
                {t("Register", "रजिस्टर करें")}
              </Button>
            </form>
          ) : (
            <div className="space-y-6 flex flex-col items-center py-4">
              <p className="text-center text-muted-foreground">
                {t("We've sent a 6-digit code to", "हमने 6-अंकों का कोड भेजा है")} <br/>
                <span className="font-bold text-foreground">{form.getValues("email")}</span>
              </p>
              
              <InputOTP 
                maxLength={6} 
                value={otp} 
                onChange={setOtp}
                onComplete={handleVerifyOtp}
              >
                <InputOTPGroup className="gap-2">
                  <InputOTPSlot index={0} className="w-12 h-14 text-xl font-bold" />
                  <InputOTPSlot index={1} className="w-12 h-14 text-xl font-bold" />
                  <InputOTPSlot index={2} className="w-12 h-14 text-xl font-bold" />
                  <InputOTPSlot index={3} className="w-12 h-14 text-xl font-bold" />
                  <InputOTPSlot index={4} className="w-12 h-14 text-xl font-bold" />
                  <InputOTPSlot index={5} className="w-12 h-14 text-xl font-bold" />
                </InputOTPGroup>
              </InputOTP>

              <Button 
                onClick={handleVerifyOtp} 
                className="w-full h-14 text-lg font-bold"
                disabled={otp.length !== 6 || isVerifying}
              >
                {isVerifying ? <Loader2 className="mr-2 h-6 w-6 animate-spin" /> : null}
                {t("Verify OTP", "OTP सत्यापित करें")}
              </Button>

              <Button 
                variant="ghost" 
                className="w-full h-12"
                onClick={() => setStep("form")}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                {t("Back to Registration", "पंजीकरण पर वापस जाएं")}
              </Button>
            </div>
          )}
          
          <div className="mt-8 text-center text-base">
            <p className="text-muted-foreground">
              {t("Already have an account?", "पहले से खाता है?")}{" "}
              <Link href="/login">
                <span className="text-primary font-bold hover:underline cursor-pointer">
                  {t("Sign in", "साइन इन करें")}
                </span>
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
