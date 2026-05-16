import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Store, 
  ChevronRight, 
  Check, 
  ArrowRight, 
  MessageSquare, 
  Zap, 
  Shield, 
  Globe, 
  BarChart3, 
  Users, 
  LayoutDashboard, 
  Menu, 
  X,
  Play,
  Clock,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { SEO } from "@/components/seo";
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

// Image constants (using real app screenshots)
const IMAGES = {
  hero: "/landing/v2_settings.png",
  dashboard: "/landing/v2_dashboard.png",
  login: "/landing/v2_login.png",
  invoices: "/landing/v2_invoices.png",
  settings: "/landing/v2_settings.png"
};

const fadeIn = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6 }
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

export default function LandingPage() {
  const { token } = useAuth();
  const [, setLocation] = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-emerald-100 selection:text-emerald-900">
      <SEO 
        title="Smart Kirana Store Management" 
        description="The smarter way to manage your Kirana store. AI-powered tools for billing, inventory, and customer Udhaar tracking. Trusted by 5,000+ stores."
        ogImage={IMAGES.dashboard}
      />
      {/* Navigation */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${scrolled ? "bg-white/80 backdrop-blur-md shadow-sm border-b border-slate-100 py-3" : "bg-transparent py-5"}`}>
        <div className="container mx-auto px-4 md:px-6 flex items-center justify-between">
          <div className="flex items-center">
            <img src="/kirana_logo.png" alt="KiranaPro" className="h-10 w-auto md:h-14" />
          </div>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm font-medium text-slate-600 hover:text-emerald-600 transition-colors">Features</a>
            <a href="#how-it-works" className="text-sm font-medium text-slate-600 hover:text-emerald-600 transition-colors">How it Works</a>
            <a href="#pricing" className="text-sm font-medium text-slate-600 hover:text-emerald-600 transition-colors">Pricing</a>
            <div className="h-6 w-px bg-slate-200 mx-2" />
            {token ? (
              <Button onClick={() => setLocation("/dashboard")} className="bg-gradient-to-r from-emerald-600 to-green-500 hover:from-emerald-700 hover:to-green-600 text-white rounded-md px-6 border-none">
                Go to Dashboard
              </Button>
            ) : (
              <Button onClick={() => setLocation("/register")} className="bg-gradient-to-r from-emerald-600 to-green-500 hover:from-emerald-700 hover:to-green-600 text-white rounded-md px-6 shadow-md shadow-emerald-200 transition-all hover:scale-105 active:scale-95 border-none">
                Get Started Free
              </Button>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <button className="md:hidden p-2 text-slate-600" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="fixed top-[64px] left-0 w-full bg-white border-b border-slate-100 z-40 md:hidden overflow-hidden"
          >
            <div className="flex flex-col gap-4 p-6">
              <a href="#features" onClick={() => setIsMenuOpen(false)} className="text-lg font-medium text-slate-700">Features</a>
              <a href="#how-it-works" onClick={() => setIsMenuOpen(false)} className="text-lg font-medium text-slate-700">How it Works</a>
              <a href="#pricing" onClick={() => setIsMenuOpen(false)} className="text-lg font-medium text-slate-700">Pricing</a>
              <hr className="border-slate-100" />
              {token ? (
                <Button onClick={() => setLocation("/dashboard")} className="w-full bg-emerald-600 text-white h-12 rounded-md text-lg font-semibold">
                  Dashboard
                </Button>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <Button variant="outline" onClick={() => setLocation("/login")} className="h-12 rounded-md text-lg font-semibold border-slate-200">
                    Sign In
                  </Button>
                  <Button onClick={() => setLocation("/register")} className="h-12 rounded-md text-lg font-semibold bg-emerald-600 text-white">
                    Register
                  </Button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero Section */}
      <section className="pt-24 pb-20 md:pt-32 md:pb-32 overflow-hidden relative">
        <div className="absolute top-0 right-0 -z-10 w-1/2 h-full bg-gradient-to-l from-emerald-50/50 to-transparent rounded-l-full blur-3xl opacity-60" />
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
            <motion.div 
              initial="initial"
              animate="animate"
              variants={staggerContainer}
              className="flex-1 text-center lg:text-left space-y-8"
            >
              <motion.div variants={fadeIn} className="inline-flex items-center gap-2 px-4 py-1.5 bg-emerald-50 text-emerald-700 rounded-full text-sm font-semibold border border-emerald-100">
                <span className="flex h-2 w-2 rounded-full bg-emerald-600 animate-pulse" />
                Trusted by 5,000+ local kirana stores
              </motion.div>
              
              <motion.h1 variants={fadeIn} className="text-4xl md:text-5xl lg:text-6xl font-extrabold leading-[1.1] tracking-tight text-slate-900">
                Manage Your Kirana Store <span className="text-emerald-600">Smarter</span> with KiranaPro
              </motion.h1>
              
              <motion.p variants={fadeIn} className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
                Billing, inventory, customer dues, and daily sales — all in one simple app. Save 2+ hours every day and grow your business digitally.
              </motion.p>
              
              <motion.div variants={fadeIn} className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-4">
                <Button onClick={() => setLocation("/register")} className="w-full sm:w-auto h-14 px-10 text-lg font-bold bg-gradient-to-r from-emerald-600 to-green-500 hover:from-emerald-700 hover:to-green-600 text-white rounded-md shadow-xl shadow-emerald-200 transition-all hover:scale-105 active:scale-95 group border-none">
                  Start Free Forever
                  <ChevronRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </motion.div>

              <motion.div variants={fadeIn} className="flex flex-wrap items-center justify-center lg:justify-start gap-6 pt-4 text-slate-500 font-medium">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  No Credit Card Required
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  Free Lifetime Access
                </div>
              </motion.div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, x: 100, rotate: 5 }}
              animate={{ opacity: 1, x: 0, rotate: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="flex-1 relative w-full max-w-[500px]"
            >
              <div className="relative z-10 bg-white rounded-[2.5rem] p-3 shadow-2xl shadow-emerald-200/50 border border-slate-100">
                <img src={IMAGES.dashboard} alt="KiranaPro Billing App" className="rounded-[2rem] w-full h-auto" />
              </div>
              
              {/* Floating Cards */}
              <motion.div 
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -top-6 -left-6 z-20 bg-white p-4 rounded-2xl shadow-xl border border-slate-50 flex items-center gap-3"
              >
                <div className="bg-emerald-100 p-2 rounded-lg text-emerald-600">
                  <BarChart3 className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-xs text-slate-500">Today's Sales</div>
                  <div className="text-lg font-bold">₹12,450</div>
                </div>
              </motion.div>

              <motion.div 
                animate={{ y: [0, 10, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                className="absolute top-1/2 -right-8 z-20 bg-white p-4 rounded-2xl shadow-xl border border-slate-50 flex items-center gap-3"
              >
                <div className="bg-orange-100 p-2 rounded-lg text-orange-600">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-xs text-slate-500">Low Stock</div>
                  <div className="text-lg font-bold">8 Items</div>
                </div>
              </motion.div>

              <motion.div 
                animate={{ x: [0, -10, 0] }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                className="absolute -bottom-8 left-12 z-20 bg-white p-4 rounded-2xl shadow-xl border border-slate-50 flex items-center gap-3"
              >
                <div className="bg-blue-100 p-2 rounded-lg text-blue-600">
                  <MessageSquare className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-xs text-slate-500">WhatsApp Sent</div>
                  <div className="text-lg font-bold">Daily Report</div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Problem & Solution Section */}
      <section className="py-20 bg-slate-50">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
            <h2 className="text-emerald-600 font-bold uppercase tracking-widest text-lg">The Struggle is Real</h2>
            <h3 className="text-3xl md:text-4xl font-extrabold text-slate-900">Stop wasting time on manual records</h3>
            <p className="text-lg text-slate-600">Managing a kirana store with paper and pen is exhausting. It's time to digitize and save your energy for growth.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 lg:gap-12 items-center">
            <div className="space-y-6">
              {[
                { title: "Slow Checkout", desc: "Long queues because manual calculation takes time." },
                { title: "Customer Due Confusion", desc: "Forgetting who owes you money and losing thousands." },
                { title: "Stock Surprises", desc: "Running out of popular items without knowing." },
                { title: "Messy Paper Records", desc: "Searching through diaries for hours to find one entry." }
              ].map((item, idx) => (
                <motion.div 
                  key={idx}
                  whileInView={{ opacity: 1, x: 0 }}
                  initial={{ opacity: 0, x: -20 }}
                  className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex gap-4 items-start"
                >
                  <div className="bg-red-50 p-2 rounded-full text-red-500 mt-1">
                    <X className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-slate-800">{item.title}</h4>
                    <p className="text-slate-600">{item.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="bg-emerald-600 p-8 md:p-12 rounded-[2.5rem] text-white space-y-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500 rounded-full -mr-20 -mt-20 opacity-30" />
              <div className="relative z-10">
                <h3 className="text-3xl font-extrabold mb-6">The KiranaPro Solution</h3>
                <div className="space-y-6">
                  {[
                    "Lightning Fast Digital Billing",
                    "Automated Customer Due Reminders",
                    "Real-time Inventory Tracking",
                    "Complete Sales Reports in 1 Click"
                  ].map((text, idx) => (
                    <div key={idx} className="flex items-center gap-4 text-xl font-medium">
                      <div className="bg-white/20 p-1 rounded-full">
                        <Check className="w-6 h-6" />
                      </div>
                      {text}
                    </div>
                  ))}
                </div>
                <Button onClick={() => setLocation("/register")} className="mt-10 h-14 w-full bg-white text-emerald-700 hover:bg-emerald-50 text-lg font-bold rounded-md shadow-lg transition-transform hover:-translate-y-1 border-none">
                  Experience the Difference
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 md:py-32">
        <div className="container mx-auto px-4 md:px-6 text-center mb-16">
          <h2 className="text-emerald-600 font-bold uppercase tracking-widest text-lg mb-4">Powerful Features</h2>
          <h3 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-6">Everything you need to grow</h3>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">Build for Indian merchants with simplicity at its core. No technical training required.</p>
        </div>

        <div className="container mx-auto px-4 md:px-6">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { icon: BarChart3, title: "Daily Sales Tracking", desc: "Monitor your store's performance with beautiful, easy-to-read daily reports." },
              { icon: LayoutDashboard, title: "Inventory Management", desc: "Track stock levels, set low-stock alerts, and never run out of items." },
              { icon: MessageSquare, title: "WhatsApp Reminders", desc: "Send automated billing and payment reminders to your customers instantly." },
              { icon: Users, title: "Customer Dues Tracking", desc: "Manage Udhaar records digitally and recover payments 3x faster." },
              { icon: Zap, title: "Quick Billing System", desc: "Generate invoices in seconds. Supports voice search and barcode scanning." },
              { icon: Shield, title: "Offline Mode Support", desc: "Continue billing even without internet. Syncs automatically when back online." },
              { icon: Globe, title: "Hindi + English Support", desc: "Switch between languages seamlessly. Use the app in your preferred language." },
              { icon: Clock, title: "24/7 Support", desc: "Need help? Our dedicated support team is always just a WhatsApp message away." },
              { icon: CheckCircle2, title: "Unlimited Everything", desc: "Add unlimited products, customers, and invoices without any restrictions." }
            ].map((feature, idx) => (
              <motion.div 
                key={idx}
                whileHover={{ y: -5 }}
                className="p-8 rounded-3xl border border-slate-100 bg-white hover:shadow-xl hover:shadow-emerald-50 transition-all group"
              >
                <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                  <feature.icon className="w-8 h-8" />
                </div>
                <h4 className="text-xl font-bold mb-3 text-slate-800">{feature.title}</h4>
                <p className="text-slate-600 leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section id="how-it-works" className="py-20 bg-emerald-900 text-white overflow-hidden">
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            <div className="flex-1 space-y-12">
              <div className="space-y-4">
                <h2 className="text-emerald-400 font-bold uppercase tracking-widest text-lg">Simple Process</h2>
                <h3 className="text-3xl md:text-4xl font-extrabold leading-tight">Get your shop online in minutes</h3>
              </div>

              <div className="space-y-10">
                {[
                  { step: "01", title: "Add Your Products", desc: "Enter your items manually or use our pre-built database of 50,000+ Indian products." },
                  { step: "02", title: "Manage Billing & Customers", desc: "Start generating digital invoices and recording customer dues with ease." },
                  { step: "03", title: "Track Sales & Grow", desc: "Use real-time data to understand your profit and manage your store like a pro." }
                ].map((item, idx) => (
                  <div key={idx} className="flex gap-6 items-start">
                    <div className="text-4xl font-black text-emerald-500/30 font-serif leading-none">{item.step}</div>
                    <div className="space-y-2">
                      <h4 className="text-2xl font-bold">{item.title}</h4>
                      <p className="text-emerald-100 text-lg opacity-80 leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              
              <Button onClick={() => window.open("https://play.google.com/store", "_blank")} className="h-16 px-10 bg-gradient-to-r from-emerald-600 to-green-500 hover:from-emerald-700 hover:to-green-600 text-white text-xl font-bold rounded-md shadow-xl group border-none">
                Try it Yourself
                <ChevronRight className="ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>

            <div className="flex-1 relative">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-emerald-500/10 rounded-full blur-3xl" />
              <motion.div 
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.5 }}
                className="relative z-10 bg-slate-800 rounded-[2rem] p-3 shadow-2xl border border-white/10"
              >
                <img src={IMAGES.login} alt="KiranaPro Hero" className="rounded-md w-full" />
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* App Screenshots Gallery Section */}
      <section className="py-20 md:py-32 bg-slate-50 overflow-hidden">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
            <h2 className="text-emerald-600 font-bold uppercase tracking-widest text-lg">Product Tour</h2>
            <h3 className="text-3xl md:text-4xl font-extrabold text-slate-900">Experience KiranaPro in Action</h3>
            <p className="text-lg text-slate-600">Take a look at our clean, easy-to-use interface designed for Indian merchants.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-12 lg:gap-16">
            {[
              { img: IMAGES.login, title: "Modern Secure Login", desc: "Access your store data from any device." },
              { img: IMAGES.settings, title: "Flexible Shop Settings", desc: "Customize branding and preferences." },
              { img: IMAGES.invoices, title: "Detailed Invoice History", desc: "Track every transaction with ease." }
            ].map((screen, idx) => (
              <motion.div 
                key={idx}
                whileInView={{ opacity: 1, y: 0 }}
                initial={{ opacity: 0, y: 30 }}
                className="group"
              >
                <div className="relative rounded-[2rem] p-4 bg-white shadow-2xl border border-slate-100 mb-8 overflow-hidden">
                  <img 
                    src={screen.img} 
                    alt={screen.title} 
                    className="rounded-md w-full h-auto object-cover transition-transform duration-700 group-hover:scale-105" 
                  />
                </div>
                <div className="text-center space-y-2">
                  <h4 className="text-2xl font-bold text-slate-800">{screen.title}</h4>
                  <p className="text-slate-500 text-lg">{screen.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Comparison Section */}
      <section id="pricing" className="py-20 md:py-32">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
            <h2 className="text-emerald-600 font-bold uppercase tracking-widest text-lg">Transparent Pricing</h2>
            <h3 className="text-3xl md:text-4xl font-extrabold text-slate-900">Why pay when you can get it for free?</h3>
            <p className="text-lg text-slate-600">We believe in empowering small Indian kirana stores without the burden of monthly subscriptions.</p>
          </div>

          <div className="max-w-5xl mx-auto overflow-hidden rounded-[2.5rem] border border-slate-100 shadow-2xl bg-white">
            <div className="grid md:grid-cols-3">
              <div className="p-10 bg-slate-50 border-r border-slate-100">
                <h4 className="text-xl font-bold text-slate-400 mb-2">Monthly Plan</h4>
                <div className="text-3xl font-bold text-slate-500 mb-6">₹199<span className="text-base font-medium">/month</span></div>
                <div className="space-y-4 text-slate-500">
                  <div className="flex items-center gap-2"><Check className="w-5 h-5" /> All Basic Features</div>
                  <div className="flex items-center gap-2"><Check className="w-5 h-5" /> 24/7 Support</div>
                  <div className="flex items-center gap-2 text-slate-400">Total: ₹2,388/year</div>
                </div>
              </div>
              
              <div className="p-10 bg-slate-50 border-r border-slate-100">
                <h4 className="text-xl font-bold text-slate-400 mb-2">Annual Plan</h4>
                <div className="text-3xl font-bold text-slate-500 mb-6">₹1,999<span className="text-base font-medium">/year</span></div>
                <div className="space-y-4 text-slate-500">
                  <div className="flex items-center gap-2"><Check className="w-5 h-5" /> All Premium Features</div>
                  <div className="flex items-center gap-2"><Check className="w-5 h-5" /> Email Support</div>
                  <div className="flex items-center gap-2 text-emerald-600 font-semibold">Save ₹389/year</div>
                </div>
              </div>

              <div className="p-10 bg-emerald-600 text-white relative flex flex-col justify-between">
                <div>
                  <div className="absolute top-4 right-6 bg-yellow-400 text-slate-900 text-xs font-black uppercase px-3 py-1 rounded-full shadow-lg">Best for India</div>
                  <h4 className="text-2xl font-black mb-2">KiranaPro</h4>
                  <div className="text-5xl font-black mb-8">₹0<span className="text-lg font-medium opacity-80">/Forever</span></div>
                  
                  <div className="grid grid-cols-1 gap-y-4 mb-8">
                    {[
                      "Invoice PDF Send Direct to Customer",
                      "AI Voice Assistant",
                      "AI Product Scan (OCR)",
                      "Fast PDF Download",
                      "Bulk Inventory Upload",
                      "Default Inventory Import",
                      "Automated Daily Reports",
                      "Labour Attendance & Salary",
                      "100% Free Forever"
                    ].map((feature, fidx) => (
                      <div key={fidx} className="flex items-center gap-3 text-base font-bold">
                        <CheckCircle2 className="w-5 h-5 text-yellow-400 flex-shrink-0" />
                        {feature}
                      </div>
                    ))}
                  </div>
                </div>
                
                <Button onClick={() => setLocation("/register")} className="w-full h-14 bg-white text-emerald-700 hover:bg-emerald-50 text-xl font-bold rounded-md shadow-xl transition-all hover:scale-105 border-none mt-auto">
                  Get Started Now
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-slate-50 overflow-hidden">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-emerald-600 font-bold uppercase tracking-widest text-lg">Success Stories</h2>
            <h3 className="text-3xl md:text-4xl font-extrabold text-slate-900">What shop owners say</h3>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { name: "Rajesh Kumar", shop: "Sharma General Store", text: "KiranaPro has completely changed how I track udhaar. I used to lose ₹2000 every month just because I forgot entries. Now I send WhatsApp reminders and get paid on time!" },
              { name: "Ankit Gupta", shop: "Gupta Kirana Shop", text: "The offline mode is a lifesaver. My village has power cuts often, but I can still bill customers. The app is so simple, even my father uses it easily." },
              { name: "Vikram Verma", shop: "Verma Mini Mart", text: "I tried many other paid apps but KiranaPro is the best because it's free and has all features like billing, inventory, and reports. Highly recommended!" }
            ].map((t, idx) => (
              <motion.div 
                key={idx}
                whileInView={{ opacity: 1, y: 0 }}
                whileHover={{ scale: 1.05 }}
                initial={{ opacity: 0, y: 20 }}
                className="bg-white p-10 rounded-[2rem] shadow-sm border border-slate-100 flex flex-col justify-between transition-all"
              >
                <div className="space-y-6">
                  <div className="flex gap-1">
                    {[1,2,3,4,5].map(i => <Zap key={i} className="w-5 h-5 text-yellow-400 fill-yellow-400" />)}
                  </div>
                  <p className="text-slate-600 text-lg leading-relaxed italic">"{t.text}"</p>
                </div>
                <div className="mt-8 pt-8 border-t border-slate-50 flex items-center gap-4">
                  <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-700 font-bold text-xl">
                    {t.name[0]}
                  </div>
                  <div>
                    <div className="font-bold text-slate-800">{t.name}</div>
                    <div className="text-sm text-slate-500">{t.shop}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 md:py-32">
        <div className="container mx-auto px-4 md:px-6">
          <div className="max-w-3xl mx-auto space-y-12">
            <div className="text-center space-y-4">
              <h2 className="text-emerald-600 font-bold uppercase tracking-widest text-lg">FAQ</h2>
              <h3 className="text-3xl md:text-4xl font-extrabold text-slate-900">Got questions?</h3>
            </div>

            <Accordion type="single" collapsible className="w-full space-y-4">
              {[
                { q: "Is KiranaPro really free?", a: "Yes, KiranaPro is free for all essential features including billing, inventory, and customer management. No monthly or annual fees." },
                { q: "Does it work offline?", a: "Absolutely. You can create invoices and manage your shop without an internet connection. Data will sync automatically when you go online." },
                { q: "Is Hindi supported?", a: "Yes, the entire application is available in both Hindi and English. You can switch anytime from settings." },
                { q: "Is my data safe?", a: "We use banking-grade encryption to secure your data. Your records are private and backed up automatically to the cloud." },
                { q: "Can I use it on mobile?", a: "KiranaPro is built for mobile first. It works perfectly on any Android or iOS device through your browser." }
              ].map((item, idx) => (
                <AccordionItem key={idx} value={`item-${idx}`} className="border border-slate-100 rounded-2xl px-6 bg-white shadow-sm overflow-hidden">
                  <AccordionTrigger className="text-lg font-bold text-slate-800 hover:no-underline py-6">
                    {item.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-slate-600 text-lg pb-6 leading-relaxed">
                    {item.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 md:py-32 bg-emerald-600 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-emerald-500 to-emerald-700" />
        <div className="container mx-auto px-4 md:px-6 text-center relative z-10 space-y-10">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            className="space-y-6"
          >
            <h2 className="text-3xl md:text-5xl font-black text-white leading-tight">
              Start Managing Your Kirana Store <br /> Digitally — For Free
            </h2>
            <p className="text-xl md:text-2xl text-emerald-50 max-w-3xl mx-auto font-medium opacity-90">
              Join thousands of smart shopkeepers who are growing their business with KiranaPro.
            </p>
          </motion.div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <Button onClick={() => setLocation("/register")} className="w-full sm:w-auto h-20 px-12 bg-white text-emerald-700 hover:bg-emerald-50 text-2xl font-black rounded-md shadow-2xl transition-all hover:scale-105 active:scale-95 border-none">
              Get Started Free Now
            </Button>
            <div className="text-white/80 font-bold flex flex-col items-center sm:items-start">
              <div className="flex items-center gap-1">
                {[1,2,3,4,5].map(i => <Zap key={i} className="w-4 h-4 text-yellow-400 fill-yellow-400" />)}
              </div>
              100% Free & Secure
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-20 bg-white border-t border-slate-100">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-12 lg:gap-8 mb-16">
            <div className="col-span-2 space-y-6">
              <div className="flex items-center">
                <img src="/kirana_logo.png" alt="KiranaPro" className="h-12 w-auto md:h-16" />
              </div>
              <p className="text-slate-500 text-lg leading-relaxed max-w-sm">
                Empowering Indian kirana stores with simple, powerful, and free digital tools to manage their business efficiently.
              </p>
              <div className="flex items-center gap-4">
                <div className="bg-emerald-50 p-3 rounded-full text-emerald-600 cursor-pointer hover:bg-emerald-600 hover:text-white transition-all">
                  <MessageSquare className="w-6 h-6" />
                </div>
                <div className="bg-emerald-50 p-3 rounded-full text-emerald-600 cursor-pointer hover:bg-emerald-600 hover:text-white transition-all">
                  <Zap className="w-6 h-6" />
                </div>
                <div className="bg-emerald-50 p-3 rounded-full text-emerald-600 cursor-pointer hover:bg-emerald-600 hover:text-white transition-all">
                  <Globe className="w-6 h-6" />
                </div>
              </div>
            </div>

            <div>
              <h5 className="font-bold text-slate-900 mb-6">Product</h5>
              <ul className="space-y-4 text-slate-500 text-lg">
                <li><a href="#features" className="hover:text-emerald-600 transition-colors cursor-pointer">Features</a></li>
                <li><a href="#how-it-works" className="hover:text-emerald-600 transition-colors cursor-pointer">How it Works</a></li>
                <li><a href="#pricing" className="hover:text-emerald-600 transition-colors cursor-pointer">Pricing</a></li>
                <li className="hover:text-emerald-600 transition-colors cursor-pointer">Updates</li>
              </ul>
            </div>

            <div>
              <h5 className="font-bold text-slate-900 mb-6">Company</h5>
              <ul className="space-y-4 text-slate-500 text-lg">
                <li className="hover:text-emerald-600 transition-colors cursor-pointer">About Us</li>
                <li className="hover:text-emerald-600 transition-colors cursor-pointer">Contact</li>
                <li className="hover:text-emerald-600 transition-colors cursor-pointer">Terms of Service</li>
                <li className="hover:text-emerald-600 transition-colors cursor-pointer">Privacy Policy</li>
              </ul>
            </div>

            {/* 
            <div className="col-span-2">
              <h5 className="font-bold text-slate-900 mb-6">Download App</h5>
              <div className="flex flex-col sm:flex-row gap-4">
                <a href="https://play.google.com/store" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 bg-slate-900 text-white px-8 py-4 rounded-md cursor-pointer hover:bg-slate-800 transition-all border-none min-w-[200px] justify-center no-underline">
                  <Play className="w-6 h-6 fill-white" />
                  <div className="text-left">
                    <div className="text-[10px] uppercase font-bold opacity-60 leading-none">Get it on</div>
                    <div className="text-lg font-bold leading-none whitespace-nowrap">Google Play</div>
                  </div>
                </a>
                <a href="https://apps.apple.com" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 bg-slate-900 text-white px-8 py-4 rounded-md cursor-pointer hover:bg-slate-800 transition-all border-none min-w-[200px] justify-center no-underline">
                  <Shield className="w-6 h-6" />
                  <div className="text-left">
                    <div className="text-[10px] uppercase font-bold opacity-60 leading-none">Download on</div>
                    <div className="text-lg font-bold leading-none whitespace-nowrap">App Store</div>
                  </div>
                </a>
              </div>
            </div>
            */}
          </div>
          
          <div className="pt-8 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-6 text-slate-400 text-base">
            <p>© {new Date().getFullYear()} KiranaPro. Built with ❤️ for India.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
