import { useState } from "react";
import { Mail, Lock, Eye, EyeOff, User, ArrowRight, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/lib/i18n";
import { Link } from "wouter";

export default function Login() {
  const { toast } = useToast();
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState<"signin" | "signup">("signin");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const form = e.currentTarget as HTMLFormElement;
    const data = new FormData(form);
    const email = (data.get("email") as string)?.trim().toLowerCase();
    const name  = (data.get("name")  as string)?.trim() || email?.split("@")[0] || "";
    await new Promise(r => setTimeout(r, 800));
    setLoading(false);
    // Persist credentials so Chat & Tickets pages can read them without re-asking
    if (email) {
      localStorage.setItem("sorad_user_email", email);
      if (name) localStorage.setItem("sorad_user_name", name);
      // Clear cached chat session so it will be rebuilt with the new credentials
      sessionStorage.removeItem("sorad_chat_user");
    }
    toast({
      title: activeTab === "signin" ? "مرحباً بعودتك! 👋" : "تم إنشاء الحساب! 🎉",
      description: "تم تسجيل دخولك بنجاح — يمكنك الآن استخدام الدردشة.",
    });
  };

  return (
    <div className="min-h-screen w-full relative flex items-center justify-center p-4 bg-[#06060a] overflow-hidden">

      {/* Background effects */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Radial glows */}
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] rounded-full bg-[#c9a227]/6 blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] rounded-full bg-[#c9a227]/4 blur-[100px]" />
        {/* Starfield */}
        {Array.from({ length: 50 }).map((_, i) => (
          <div key={i} className="absolute rounded-full bg-white"
            style={{
              width: Math.random() * 1.5 + 0.5 + "px",
              height: Math.random() * 1.5 + 0.5 + "px",
              top: Math.random() * 100 + "%",
              left: Math.random() * 100 + "%",
              opacity: Math.random() * 0.3 + 0.05,
            }}
          />
        ))}
      </div>

      <div className="max-w-md w-full relative z-10">

        {/* Logo */}
        <Link href="/" className="flex flex-col items-center gap-3 mb-8 group">
          <div className="relative">
            <div className="absolute -inset-[2px] rounded-[22px] bg-gradient-to-br from-[#f0d060] via-[#c9a227] to-[#8b6914] opacity-80" />
            <img
              src="/sorad-logo.png"
              alt="SORAD"
              className="relative w-20 h-20 rounded-[20px] object-cover"
            />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-black text-white tracking-tight">سُراد SORAD</h1>
            <p className="text-xs text-[#c9a227]/60 tracking-widest mt-0.5">صُنع بأيدي عربية</p>
          </div>
        </Link>

        {/* Card */}
        <div className="bg-[#0d0d12]/90 backdrop-blur-xl rounded-3xl border border-white/8 p-8 shadow-[0_30px_80px_rgba(0,0,0,0.6)]">

          {/* Tabs */}
          <div className="flex p-1 mb-8 bg-white/5 rounded-2xl gap-1">
            {(["signin", "signup"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-semibold transition-all duration-200 ${
                  activeTab === tab
                    ? "bg-[#c9a227] text-[#06060a] shadow-[0_4px_12px_rgba(201,162,39,0.3)]"
                    : "text-white/50 hover:text-white/80"
                }`}
              >
                {tab === "signin" ? t("signIn") : t("createAccount")}
              </button>
            ))}
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">

            {activeTab === "signup" && (
              <div className="relative group">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30 group-focus-within:text-[#c9a227] transition-colors" />
                <Input
                  name="name"
                  placeholder={t("fullName")}
                  className="pl-11 h-13 bg-white/5 border-white/10 focus-visible:ring-[#c9a227] focus-visible:border-[#c9a227]/50 text-white placeholder:text-white/30 rounded-2xl"
                  required
                />
              </div>
            )}

            <div className="relative group">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30 group-focus-within:text-[#c9a227] transition-colors" />
              <Input
                name="email"
                type="email"
                placeholder={t("emailAddress")}
                className="pl-11 h-13 bg-white/5 border-white/10 focus-visible:ring-[#c9a227] focus-visible:border-[#c9a227]/50 text-white placeholder:text-white/30 rounded-2xl"
                required
              />
            </div>

            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30 group-focus-within:text-[#c9a227] transition-colors" />
              <Input
                type={showPassword ? "text" : "password"}
                placeholder={t("password")}
                className="pl-11 pr-12 h-13 bg-white/5 border-white/10 focus-visible:ring-[#c9a227] focus-visible:border-[#c9a227]/50 text-white placeholder:text-white/30 rounded-2xl"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/70 transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            {activeTab === "signup" && (
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30 group-focus-within:text-[#c9a227] transition-colors" />
                <Input
                  type={showConfirm ? "text" : "password"}
                  placeholder={t("confirmPassword")}
                  className="pl-11 pr-12 h-13 bg-white/5 border-white/10 focus-visible:ring-[#c9a227] focus-visible:border-[#c9a227]/50 text-white placeholder:text-white/30 rounded-2xl"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/70 transition-colors"
                >
                  {showConfirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            )}

            {activeTab === "signin" && (
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="remember"
                    className="border-white/20 data-[state=checked]:bg-[#c9a227] data-[state=checked]:border-[#c9a227]"
                  />
                  <label htmlFor="remember" className="text-white/40 cursor-pointer text-xs hover:text-white/60 transition-colors">
                    {t("rememberMe")}
                  </label>
                </div>
                <button type="button" className="text-[#c9a227]/70 hover:text-[#c9a227] transition-colors text-xs">
                  {t("forgotPassword")}
                </button>
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-13 text-base font-bold rounded-2xl mt-2 gap-2
                bg-gradient-to-r from-[#c9a227] to-[#e8c040]
                text-[#06060a] border-0
                shadow-[0_4px_20px_rgba(201,162,39,0.35)]
                hover:shadow-[0_6px_28px_rgba(201,162,39,0.5)]
                hover:from-[#e0b835] hover:to-[#f5d050]
                transition-all duration-200
                disabled:opacity-70"
            >
              {loading ? (
                <div className="w-5 h-5 rounded-full border-2 border-[#06060a]/30 border-t-[#06060a] animate-spin" />
              ) : (
                <>
                  {activeTab === "signin" ? t("signIn") : t("createAccount")}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-px bg-white/8" />
            <span className="text-white/20 text-xs font-medium">OR</span>
            <div className="flex-1 h-px bg-white/8" />
          </div>

          {/* Continue as guest */}
          <Link href="/">
            <Button variant="outline" className="w-full h-11 rounded-2xl border-white/10 bg-white/3 text-white/50 hover:text-white/80 hover:bg-white/8 hover:border-white/20 gap-2 text-sm font-medium">
              <Sparkles className="w-4 h-4 text-[#c9a227]/50" />
              Continue as Guest
            </Button>
          </Link>
        </div>

        {/* Demo notice */}
        <p className="text-center text-xs text-white/20 mt-6 px-4">
          This app is in demo mode. Account features are coming soon.
        </p>
      </div>
    </div>
  );
}
