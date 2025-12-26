import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "@/hooks/use-toast";
import { Check, CreditCard, Smartphone, Shield, Star } from "lucide-react";
import logo from "@/assets/logo-lumiere.png";

const plans = [
  {
    id: "basic",
    name: "Базовый",
    price: 15,
    period: "30 дней",
    features: [
      "HD качество",
      "1 устройство",
      "Без рекламы",
      "Базовая библиотека",
    ],
  },
  {
    id: "standard",
    name: "Стандартный",
    price: 30,
    period: "30 дней",
    popular: true,
    features: [
      "Full HD качество",
      "2 устройства",
      "Без рекламы",
      "Полная библиотека",
      "Скачивание контента",
    ],
  },
  {
    id: "premium",
    name: "Премиум",
    price: 50,
    period: "30 дней",
    features: [
      "4K + HDR качество",
      "4 устройства",
      "Без рекламы",
      "Полная библиотека",
      "Скачивание контента",
      "Эксклюзивные премьеры",
      "Семейный доступ",
    ],
  },
];

const PaymentPage = () => {
  const navigate = useNavigate();
  const [selectedPlan, setSelectedPlan] = useState("standard");
  const [paymentMethod, setPaymentMethod] = useState("card");
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Card form state
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvc, setCardCvc] = useState("");
  const [cardName, setCardName] = useState("");

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || "";
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    return parts.length ? parts.join(" ") : value;
  };

  const formatExpiry = (value: string) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
    if (v.length >= 2) {
      return v.substring(0, 2) + "/" + v.substring(2, 4);
    }
    return v;
  };

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    
    // Simulate payment processing
    setTimeout(() => {
      setIsProcessing(false);
      toast({
        title: "Оплата успешна!",
        description: "Добро пожаловать в Lumiere Premium!",
      });
      navigate("/");
    }, 2000);
  };

  const selectedPlanData = plans.find((p) => p.id === selectedPlan);

  return (
    <div className="min-h-screen bg-background">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-secondary/5" />
      
      <div className="relative container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-10">
          <Link to="/">
            <img src={logo} alt="Lumiere" className="h-10 mx-auto mb-6" />
          </Link>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
            Выберите подписку
          </h1>
          <p className="text-muted-foreground">
            Смотрите фильмы и сериалы без ограничений
          </p>
        </div>
        
        <div className="max-w-5xl mx-auto grid lg:grid-cols-[1fr,400px] gap-8">
          {/* Plans selection */}
          <div>
            <h2 className="text-xl font-semibold text-foreground mb-4">Тарифные планы</h2>
            
            <RadioGroup value={selectedPlan} onValueChange={setSelectedPlan} className="space-y-4">
              {plans.map((plan) => (
                <div key={plan.id} className="relative">
                  <RadioGroupItem
                    value={plan.id}
                    id={plan.id}
                    className="peer sr-only"
                  />
                  <Label
                    htmlFor={plan.id}
                    className="flex items-start gap-4 p-4 rounded-xl border-2 border-border bg-card cursor-pointer transition-all peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 hover:bg-muted/50"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-semibold text-foreground">{plan.name}</span>
                        {plan.popular && (
                          <span className="px-2 py-0.5 bg-gradient-primary rounded text-xs text-white font-medium">
                            Популярный
                          </span>
                        )}
                      </div>
                      
                      <ul className="space-y-1">
                        {plan.features.map((feature, index) => (
                          <li key={index} className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Check className="w-4 h-4 text-primary" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    <div className="text-right">
                      <div className="text-2xl font-bold text-foreground">{plan.price} сом</div>
                      <div className="text-sm text-muted-foreground">/{plan.period}</div>
                    </div>
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
          
          {/* Payment form */}
          <div className="glass rounded-2xl p-6 h-fit sticky top-8">
            <h2 className="text-xl font-semibold text-foreground mb-4">Способ оплаты</h2>
            
            {/* Payment method selection */}
            <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod} className="grid grid-cols-2 gap-3 mb-6">
              <div>
                <RadioGroupItem value="card" id="card" className="peer sr-only" />
                <Label
                  htmlFor="card"
                  className="flex items-center justify-center gap-2 p-3 rounded-lg border border-border cursor-pointer transition-all peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 hover:bg-muted/50"
                >
                  <CreditCard className="w-5 h-5" />
                  <span className="text-sm">Карта</span>
                </Label>
              </div>
              <div>
                <RadioGroupItem value="mobile" id="mobile" className="peer sr-only" />
                <Label
                  htmlFor="mobile"
                  className="flex items-center justify-center gap-2 p-3 rounded-lg border border-border cursor-pointer transition-all peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 hover:bg-muted/50"
                >
                  <Smartphone className="w-5 h-5" />
                  <span className="text-sm">Мобильный</span>
                </Label>
              </div>
            </RadioGroup>
            
            {/* Card form */}
            {paymentMethod === "card" && (
              <form onSubmit={handlePayment} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="card-number">Номер карты</Label>
                  <Input
                    id="card-number"
                    placeholder="1234 5678 9012 3456"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                    maxLength={19}
                    required
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="card-expiry">Срок действия</Label>
                    <Input
                      id="card-expiry"
                      placeholder="MM/YY"
                      value={cardExpiry}
                      onChange={(e) => setCardExpiry(formatExpiry(e.target.value))}
                      maxLength={5}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="card-cvc">CVC</Label>
                    <Input
                      id="card-cvc"
                      type="password"
                      placeholder="•••"
                      value={cardCvc}
                      onChange={(e) => setCardCvc(e.target.value.replace(/\D/g, "").slice(0, 3))}
                      maxLength={3}
                      required
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="card-name">Имя владельца</Label>
                  <Input
                    id="card-name"
                    placeholder="IVAN IVANOV"
                    value={cardName}
                    onChange={(e) => setCardName(e.target.value.toUpperCase())}
                    required
                  />
                </div>
                
                {/* Order summary */}
                <div className="pt-4 border-t border-border">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-muted-foreground">План:</span>
                    <span className="font-medium text-foreground">{selectedPlanData?.name}</span>
                  </div>
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-muted-foreground">Итого:</span>
                    <span className="text-2xl font-bold text-foreground">
                      {selectedPlanData?.price} сом
                    </span>
                  </div>
                </div>
                
                <Button
                  type="submit"
                  className="w-full bg-gradient-primary hover:opacity-90"
                  disabled={isProcessing}
                >
                  {isProcessing ? "Обработка..." : "Оплатить"}
                </Button>
                
                <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                  <Shield className="w-4 h-4" />
                  Безопасная оплата
                </div>
              </form>
            )}
            
            {/* Mobile payment */}
            {paymentMethod === "mobile" && (
              <div className="text-center py-8">
                <Smartphone className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">
                  Оплата будет списана с вашего мобильного счёта
                </p>
                <Button className="w-full bg-gradient-primary hover:opacity-90">
                  Продолжить
                </Button>
              </div>
            )}
          </div>
        </div>
        
        {/* Back link */}
        <p className="text-center mt-8 text-muted-foreground text-sm">
          <Link to="/" className="hover:text-foreground transition-colors">
            ← Вернуться на главную
          </Link>
        </p>
      </div>
    </div>
  );
};

export default PaymentPage;
