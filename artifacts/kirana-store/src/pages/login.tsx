import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLoginUser } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/hooks/use-language";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Store, Loader2, Eye, EyeOff } from "lucide-react";
import { SEO } from "@/components/seo";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function Login() {
  const [, setLocation] = useLocation();
  const { setToken } = useAuth();
  const { toast } = useToast();
  const { t } = useLanguage();
  const loginMutation = useLoginUser();

  const [showPassword, setShowPassword] = useState(false);
  const form = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = (data: LoginForm) => {
    loginMutation.mutate(
      { data },
      {
        onSuccess: (res) => {
          setToken(res.token);
          toast({ title: t("Welcome back!", "वापसी पर स्वागत है!") });
          setLocation("/dashboard");
        },
        onError: (err) => {
          toast({ 
            variant: "destructive", 
            title: t("Login Failed", "लॉगिन विफल"),
            description: err.message || t("Please check your credentials", "कृपया अपना विवरण जांचें")
          });
        },
      }
    );
  };

  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-primary/5 p-4">
      <SEO title="Login" description="Login to your KiranaPro dashboard to manage your store." />
      <Card className="w-full max-w-md shadow-xl border-primary/20">
        <CardHeader className="space-y-3 text-center pb-6">
          <div className="mx-auto flex items-center justify-center mb-6">
            <img src="/kirana_logo.png" alt="KiranaPro" className="h-14 md:h-16 w-auto object-contain" />
          </div>
          <CardDescription className="text-lg text-muted-foreground">
            {t("Sign in to manage your store", "अपनी दुकान प्रबंधित करने के लिए साइन इन करें")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <Label className="text-base">{t("Email", "ईमेल")}</Label>
              <Input 
                {...form.register("email")} 
                type="email" 
                placeholder="shop@example.com" 
                className="h-14 text-lg"
              />
              {form.formState.errors.email && (
                <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label className="text-base">{t("Password", "पासवर्ड")}</Label>
              <div className="relative">
                <Input 
                  {...form.register("password")} 
                  type={showPassword ? "text" : "password"} 
                  placeholder="••••••••" 
                  className="h-14 text-lg pr-12"
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
            <div className="text-right">
              <Link href="/forgot-password">
                <span className="text-sm text-primary hover:underline cursor-pointer">
                  {t("Forgot Password?", "पासवर्ड भूल गए?")}
                </span>
              </Link>
            </div>
            <Button 
              type="submit" 
              className="w-full h-14 text-lg font-bold" 
              disabled={loginMutation.isPending}
            >
              {loginMutation.isPending ? <Loader2 className="mr-2 h-6 w-6 animate-spin" /> : null}
              {t("Sign In", "साइन इन करें")}
            </Button>
          </form>
          <div className="mt-8 text-center text-base">
            <p className="text-muted-foreground">
              {t("Don't have an account?", "खाता नहीं है?")}{" "}
              <Link href="/register">
                <span className="text-primary font-bold hover:underline cursor-pointer">
                  {t("Register here", "यहां रजिस्टर करें")}
                </span>
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
