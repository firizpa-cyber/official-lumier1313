import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/hooks/use-toast";
import { ChevronLeft, MessageSquare, Phone, ArrowRight } from "lucide-react";
import logo from "@/assets/logo-lumiere.png";

const AuthPage = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: Phone, 2: Code

  // Login form state
  const [loginPhone, setLoginPhone] = useState("");
  const [loginCode, setLoginCode] = useState("");
  const [isRequesting, setIsRequesting] = useState(false);

  const handleRequestCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loginPhone.length < 9) {
      toast({
        title: "Ошибка",
        description: "Введите корректный номер телефона",
        variant: "destructive",
      });
      return;
    }

    setIsRequesting(true);
    try {
      const response = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "send_code",
          phone: "+992" + loginPhone
        })
      });

      const data = await response.json();

      if (data.success || data.status === "ok" || data.message === "Success") {
        setStep(2);
        toast({
          title: "Код отправлен",
          description: "Мы отправили сообщение на ваш номер",
        });
      } else {
        throw new Error(data.message || "Ошибка при отправке кода");
      }
    } catch (error: any) {
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось отправить код. Попробуйте снова.",
        variant: "destructive",
      });
    } finally {
      setIsRequesting(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginCode) {
      toast({
        title: "Ошибка",
        description: "Введите код подтверждения",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "verify_code",
          phone: "+992" + loginPhone,
          code: loginCode
        })
      });

      const data = await response.json();

      if (data.success || data.status === "ok" || data.token) {
        // Store token if available
        if (data.token) {
          localStorage.setItem("auth_token", data.token);
        }

        toast({
          title: "Успешный вход",
          description: "Добро пожаловать в Lumiere!",
        });
        navigate("/profile");
      } else {
        throw new Error(data.message || "Неверный код подтверждения");
      }
    } catch (error: any) {
      toast({
        title: "Ошибка",
        description: error.message || "Ошибка авторизации",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#02050D] p-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-600/10 blur-[120px] rounded-full" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-purple-600/10 blur-[120px] rounded-full" />

      <div className="relative w-full max-w-[420px]">
        {/* Back link */}
        <Link
          to="/"
          className="absolute -top-12 left-0 flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
        >
          <ChevronLeft size={16} />
          <span>На главную</span>
        </Link>

        {/* Auth card */}
        <div className="bg-[#0A0F1E]/80 backdrop-blur-xl border border-white/5 rounded-3xl p-8 shadow-2xl">
          {/* Logo */}
          <div className="text-center mb-10">
            <img src={logo} alt="Lumiere" className="h-10 mx-auto mb-6" />
            <h1 className="text-2xl font-bold text-white mb-2">
              {step === 1 ? "Вход в аккаунт" : "Подтверждение"}
            </h1>
            <p className="text-gray-400 text-sm">
              {step === 1
                ? "Введите номер телефона для получения кода доступа"
                : `Код отправлен на номер +992 ${loginPhone}`}
            </p>
          </div>

          {step === 1 ? (
            <form onSubmit={handleRequestCode} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-gray-300 text-xs uppercase tracking-wider font-semibold">
                  Номер телефона
                </Label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2 pointer-events-none">
                    <span className="text-gray-400 font-medium">+992</span>
                    <div className="w-px h-4 bg-white/10" />
                  </div>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="000 000 000"
                    value={loginPhone}
                    onChange={(e) => setLoginPhone(e.target.value.replace(/\D/g, "").slice(0, 9))}
                    className="pl-[74px] h-14 bg-white/5 border-white/10 text-white placeholder:text-gray-600 rounded-2xl focus:ring-blue-500/20 focus:border-blue-500/50 transition-all text-lg"
                    required
                    autoFocus
                  />
                </div>
              </div>


              <Button
                type="submit"
                disabled={isRequesting || loginPhone.length < 9}
                className="w-full bg-[#3B59FF] hover:bg-[#3B59FF]/90 text-white h-14 rounded-2xl text-lg font-semibold shadow-lg shadow-blue-500/20 transition-all active:scale-[0.98]"
              >
                {isRequesting ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Отправка...</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span>Получить код</span>
                    <ArrowRight size={18} />
                  </div>
                )}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleLogin} className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="space-y-2">
                <Label htmlFor="code" className="text-gray-300 text-xs uppercase tracking-wider font-semibold">
                  Код подтверждения
                </Label>
                <div className="relative">
                  <MessageSquare className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    id="code"
                    type="text"
                    placeholder="Введите 6-значный код"
                    value={loginCode}
                    onChange={(e) => setLoginCode(e.target.value)}
                    className="pl-12 h-14 bg-white/5 border-white/10 text-white placeholder:text-gray-600 rounded-2xl focus:ring-blue-500/20 focus:border-blue-500/50 transition-all text-lg"
                    required
                    autoFocus
                  />
                </div>
              </div>

              <div className="flex justify-center">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-xs text-gray-500 hover:text-blue-400 transition-colors underline underline-offset-4"
                >
                  Изменить номер телефона
                </button>
              </div>

              <Button
                type="submit"
                disabled={isLoading || !loginCode}
                className="w-full bg-[#3B59FF] hover:bg-[#3B59FF]/90 text-white h-14 rounded-2xl text-lg font-semibold shadow-lg shadow-blue-500/20 transition-all active:scale-[0.98]"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Вход...</span>
                  </div>
                ) : (
                  "Войти"
                )}
              </Button>

              <div className="text-center">
                <button type="button" className="text-sm text-gray-500 hover:text-white transition-colors">
                  Отправить код повторно через 59 сек
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Footer info */}
        <p className="text-center mt-12 text-gray-500 text-xs leading-relaxed">
          Продолжая, вы соглашаетесь с условиями <br />
          <Link to="/terms" className="text-gray-400 hover:text-white">Пользовательского соглашения</Link>
        </p>
      </div>
    </div>
  );
};

export default AuthPage;
