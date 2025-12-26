import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Check, ChevronLeft } from "lucide-react";
import logo from "@/assets/logo-lumiere.png";
import qrImage from "@/assets/price_qr.png";

const plans = [
  {
    id: "standard",
    name: "Стандарт",
    price: 15,
    description: "Смотрите на 1 устройстве одновременно",
    period: "месяц",
    features: [
      "Смотрите на 1 устройстве одновременно",
      "Видеоразрешение FullHD",
      "Без рекламы",
    ],
  },
  {
    id: "premium",
    name: "Премиум",
    price: 30,
    description: "Смотрите на 2 устройствах одновременно",
    period: "месяц",
    features: [
      "Смотрите на 2 устройствах одновременно",
      "Видеоразрешение FullHD",
      "Без рекламы",
    ],
  },
];

const PricingPage = () => {
  const navigate = useNavigate();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [showQR, setShowQR] = useState(false);

  const handleSelectPlan = (planId: string) => {
    setSelectedPlan(planId);
    setShowQR(true);
  };

  const currentPlan = plans.find(p => p.id === selectedPlan);

  if (showQR) {
    return (
      <div className="min-h-screen bg-[#02050D] text-white flex flex-col items-center justify-center p-4">
        {/* Background Gradients */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-600/20 blur-[120px] rounded-full" />
          <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-purple-600/20 blur-[120px] rounded-full" />
        </div>

        <div className="relative z-10 w-full max-w-lg text-center">
          <button
            onClick={() => setShowQR(false)}
            className="absolute top-[-40px] left-0 flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
          >
            <ChevronLeft size={16} />
            <span>Подписки</span>
          </button>

          <h1 className="text-3xl font-bold mb-4">Выберите тариф</h1>
          <p className="text-gray-400 mb-8 max-w-md mx-auto">
            Выберите тариф который хотите подключить, хотите <span className="text-blue-500">Ежемесячный тариф?</span>
          </p>

          <div className="bg-[#0A0F1E] border border-white/5 rounded-3xl p-8 mb-6 shadow-2xl">
            <div className="aspect-square bg-white rounded-2xl p-4 mb-8">
              <img src={qrImage} alt="Payment QR" className="w-full h-full object-contain" />
            </div>

            <Button
              onClick={() => navigate("/")}
              className="w-full bg-[#3B59FF] hover:bg-[#3B59FF]/90 text-white py-6 rounded-xl text-lg font-medium"
            >
              Проверить
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#02050D] text-white overflow-hidden relative">
      {/* Background Glows */}
      <div className="absolute top-0 right-0 w-[60%] h-[60%] bg-blue-900/10 blur-[150px] -z-10" />
      <div className="absolute bottom-0 left-0 w-[60%] h-[60%] bg-purple-900/10 blur-[150px] -z-10" />

      <div className="container mx-auto px-4 py-12 relative z-10">
        {/* Navigation */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors mb-12"
        >
          <ChevronLeft size={16} />
          <span>Подписки</span>
        </button>

        {/* Header */}
        <div className="max-w-2xl mb-16">
          <h1 className="text-5xl font-bold mb-6">Выберите тариф</h1>
          <p className="text-xl text-gray-400 leading-relaxed">
            Смотрите лучшие сериалы, культовые фильмы и захватывающие истории из реальной жизни
          </p>
        </div>

        <div className="mb-20">
          <h2 className="text-2xl font-semibold mb-12 text-center">Ежемесячные</h2>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className="bg-[#0A0F1E] border border-white/5 rounded-[40px] p-10 flex flex-col transition-transform hover:scale-[1.02] shadow-xl"
              >
                <div className="text-center mb-10">
                  <h3 className="text-3xl font-bold mb-2">{plan.name}</h3>
                  <div className="text-xl text-gray-300">{plan.price} смн/месяц</div>
                </div>

                <div className="space-y-6 mb-12 flex-1">
                  {plan.features.map((feature, idx) => (
                    <div key={idx} className="flex items-center gap-4 text-gray-300">
                      <div className="flex-shrink-0 w-5 h-5 flex items-center justify-center">
                        <Check size={18} className="text-blue-500" />
                      </div>
                      <span className="text-sm font-light">{feature}</span>
                    </div>
                  ))}
                </div>

                <Button
                  onClick={() => handleSelectPlan(plan.id)}
                  className="w-full bg-[#3B59FF] hover:bg-[#3B59FF]/90 text-white py-7 rounded-2xl text-lg font-medium tracking-wide"
                >
                  Подключить
                </Button>
              </div>
            ))}
          </div>
        </div>

        {/* Logo at bottom */}
        <div className="flex justify-center mt-20 opacity-30">
          <img src={logo} alt="Lumiere" className="h-8 brightness-0 invert" />
        </div>
      </div>
    </div>
  );
};

export default PricingPage;
