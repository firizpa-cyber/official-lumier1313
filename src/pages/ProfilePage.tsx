import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
    User, Settings, Bell, Heart, History,
    CreditCard, LogOut, LayoutGrid, Smile, Trophy, Percent, Home, Tv
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Layout } from "@/components/layout/Layout";

const ProfilePage = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState("profile");
    const [phone, setPhone] = useState("+992 92 992 92 92");
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [accountType, setAccountType] = useState("adult");

    // Check if logged in
    useEffect(() => {
        const token = localStorage.getItem("auth_token");
        if (!token) {
            // navigate("/auth"); // Optional: uncomment if you want to force login
        }
    }, [navigate]);

    const handleLogout = () => {
        localStorage.removeItem("auth_token");
        navigate("/auth");
    };

    const navItems = [
        { id: "profile", label: "Настройка профиля", icon: Settings },
        { id: "notifications", label: "Уведомление", icon: Bell },
        { id: "favorites", label: "Избранное", icon: Heart },
        { id: "history", label: "История просмотров", icon: History },
        { id: "promo", label: "Активация промокода", icon: LayoutGrid },
        { id: "subscriptions", label: "Мои подписки", icon: CreditCard },
    ];

    return (
        <Layout>
            <div className="min-h-screen text-white font-sans bg-[#02050D]">
                <main className="max-w-[1200px] mx-auto pt-8 px-4 sm:px-8 pb-20">
                    <div className="grid grid-cols-1 md:grid-cols-[300px,1fr] gap-12 items-start">
                        {/* Sidebar */}
                        <aside className="bg-[#0A0F1E]/60 backdrop-blur-xl border border-white/5 rounded-[32px] overflow-hidden p-6 shadow-2xl sticky top-24">
                            <nav className="space-y-1">
                                {navItems.map((item) => (
                                    <button
                                        key={item.id}
                                        onClick={() => setActiveTab(item.id)}
                                        className={`w-full flex items-center gap-4 px-4 py-4 rounded-2xl text-sm font-medium transition-all group relative ${activeTab === item.id
                                            ? "text-white bg-white/5"
                                            : "text-gray-400 hover:text-gray-200 hover:bg-white/5"
                                            }`}
                                    >
                                        {activeTab === item.id && (
                                            <div className="absolute left-0 top-4 bottom-4 w-1 bg-[#3B59FF] rounded-r-full" />
                                        )}
                                        <item.icon size={20} className={activeTab === item.id ? "text-[#3B59FF]" : "text-gray-500 group-hover:text-gray-300"} />
                                        {item.label}
                                    </button>
                                ))}

                                <button
                                    onClick={handleLogout}
                                    className="w-full flex items-center gap-4 px-4 py-4 rounded-2xl text-sm font-medium text-red-500 hover:bg-red-500/5 transition-all group"
                                >
                                    <LogOut size={20} />
                                    Выход
                                </button>
                            </nav>
                        </aside>

                        {/* Content Area */}
                        <div className="space-y-12">
                            {/* Profile Selection */}
                            <section className="space-y-6">
                                <h2 className="text-2xl font-bold">Выбор профиля</h2>
                                <div className="flex flex-col gap-6">
                                    <div className="flex items-center gap-4 group cursor-pointer p-2 rounded-2xl hover:bg-white/5 transition-all">
                                        <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 group-hover:border-[#3B59FF] group-hover:text-[#3B59FF] transition-all">
                                            <User size={32} />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-semibold group-hover:text-[#3B59FF] transition-colors">
                                                {firstName || lastName ? `${firstName} ${lastName}` : "Имя Фамилия"}
                                            </h3>
                                            <p className="text-sm text-gray-400">{phone}</p>
                                        </div>
                                    </div>

                                    <button className="flex items-center gap-4 group text-gray-400 hover:text-white transition-all pl-2">
                                        <div className="w-16 h-16 rounded-full bg-white/5 border border-dashed border-white/20 flex items-center justify-center group-hover:border-white/40 transition-all text-2xl font-light">
                                            +
                                        </div>
                                        <div className="text-left">
                                            <h3 className="text-lg font-medium">Добавить аккаунт</h3>
                                            <p className="text-xs text-gray-500">Вы можете добавить ещё один аккаунт</p>
                                        </div>
                                    </button>
                                </div>
                            </section>

                            {/* Profile Settings Form */}
                            <section className="space-y-8">
                                <h2 className="text-2xl font-bold">Настройка профиля</h2>

                                <form className="space-y-8 max-w-md">
                                    <div className="space-y-2">
                                        <Label htmlFor="firstName" className="text-gray-400 text-xs uppercase tracking-widest font-bold">Имя</Label>
                                        <Input
                                            id="firstName"
                                            value={firstName}
                                            onChange={(e) => setFirstName(e.target.value)}
                                            placeholder="Введите ваше имя"
                                            className="h-14 bg-white/5 border-white/10 rounded-2xl focus:ring-[#3B59FF]/30 text-white placeholder:text-gray-600"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="lastName" className="text-gray-400 text-xs uppercase tracking-widest font-bold">Фамилия</Label>
                                        <Input
                                            id="lastName"
                                            value={lastName}
                                            onChange={(e) => setLastName(e.target.value)}
                                            placeholder="Введите вашу фамилию"
                                            className="h-14 bg-white/5 border-white/10 rounded-2xl focus:ring-[#3B59FF]/30 text-white placeholder:text-gray-600"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="phoneField" className="text-gray-400 text-xs uppercase tracking-widest font-bold">Номер телефона</Label>
                                        <Input
                                            id="phoneField"
                                            value={phone}
                                            readOnly
                                            className="h-14 bg-white/5 border-white/10 rounded-2xl text-gray-400 cursor-not-allowed"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-gray-400 text-xs uppercase tracking-widest font-bold">Тип аккаунта</Label>
                                        <Select value={accountType} onValueChange={setAccountType}>
                                            <SelectTrigger className="h-14 bg-white/5 border-white/10 rounded-2xl focus:ring-[#3B59FF]/30">
                                                <SelectValue placeholder="Выберите возраст" />
                                            </SelectTrigger>
                                            <SelectContent className="bg-[#0A0F1E] border-white/10 text-white rounded-xl">
                                                <SelectItem value="child">Детский</SelectItem>
                                                <SelectItem value="adult">Взрослый</SelectItem>
                                                <SelectItem value="senior">Семейный</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <Button className="w-full h-14 bg-[#3B59FF] hover:bg-[#3B59FF]/90 text-white rounded-2xl text-lg font-semibold shadow-lg shadow-[#3B59FF]/20 transition-all">
                                        Сохранить изменения
                                    </Button>
                                </form>
                            </section>
                        </div>
                    </div>
                </main>
            </div>
        </Layout>
    );
};

export default ProfilePage;
