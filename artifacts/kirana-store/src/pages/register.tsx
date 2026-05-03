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
import { Store, Loader2 } from "lucide-react";

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

  const form = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: "", shopName: "", email: "", password: "", phone: "" },
  });

  const onSubmit = (data: RegisterForm) => {
    registerMutation.mutate(
      { data },
      {
        onSuccess: (res) => {
          setToken(res.token);
          toast({ title: t("Registration successful!", "पंजीकरण सफल!") });
          setLocation("/");
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

  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-primary/5 p-4 py-8">
      <Card className="w-full max-w-md shadow-xl border-primary/20">
        <CardHeader className="space-y-3 text-center pb-6">
          <div className="mx-auto bg-primary text-primary-foreground w-16 h-16 flex items-center justify-center rounded-2xl shadow-lg mb-2">
            <Store className="w-8 h-8" />
          </div>
          <CardTitle className="text-3xl font-bold text-foreground">Kirana Manager</CardTitle>
          <CardDescription className="text-lg text-muted-foreground">
            {t("Create your store account", "अपना स्टोर खाता बनाएं")}
          </CardDescription>
        </CardHeader>
        <CardContent>
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
              <Input 
                {...form.register("password")} 
                type="password" 
                placeholder="••••••••" 
                className="h-12 text-base"
              />
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
