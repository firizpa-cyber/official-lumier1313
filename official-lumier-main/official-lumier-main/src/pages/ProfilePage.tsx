import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
    User, Settings, Bell, Heart, History,
    CreditCard, LogOut, LayoutGrid, Plus, Check
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
import { toast } from "@/hooks/use-toast";

interface Profile {
    id: string;
    phone: string;
    firstName: string;
    lastName: string;
    accountType: 'child' | 'adult' | 'senior';
    createdAt: string;
    updatedAt: string;
}

const ProfilePage = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState("profile");

    // Профили пользователя
    const [profiles, setProfiles] = useState<Profile[]>([]);
    const [currentProfile, setCurrentProfile] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(true);

    // Форма редактирования
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [accountType, setAccountType] = useState<'child' | 'adult' | 'senior'>("adult");
    const [isSaving, setIsSaving] = useState(false);

    // Получаем телефон из localStorage
    const getPhoneFromStorage = () => {
        // Попробуем получить из разных источников
        const authData = localStorage.getItem("auth_data");
        if (authData) {
            try {
                const parsed = JSON.parse(authData);
                return parsed.phone;
            } catch (e) {
                console.error("Error parsing auth_data:", e);
            }
        }

        // Временно для демо - можно будет удалить после полной интеграции
        return "+992929929292";
    };

    // Загрузка профилей пользователя
    useEffect(() => {
        loadProfiles();
    }, []);

    const loadProfiles = async () => {
        try {
            setLoading(true);
            const phone = getPhoneFromStorage();

            const response = await fetch(`/api/profiles/${encodeURIComponent(phone)}`);
            const data = await response.json();

            if (data.success && data.profiles.length > 0) {
                setProfiles(data.profiles);
                selectProfile(data.profiles[0]);
            } else {
                // Создаем первый профиль автоматически
                await createDefaultProfile(phone);
            }
        } catch (error) {
            console.error("Load profiles error:", error);
            toast({
                title: "Ошибка",
                description: "Не удалось загрузить профили",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const createDefaultProfile = async (phone: string) => {
        try {
            const response = await fetch("/api/profiles", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    phone,
                    firstName: "",
                    lastName: "",
                    accountType: "adult"
                })
            });

            const data = await response.json();
            if (data.success) {
                setProfiles([data.profile]);
                selectProfile(data.profile);
            }
        } catch (error) {
            console.error("Create default profile error:", error);
        }
    };

    const selectProfile = (profile: Profile) => {
        setCurrentProfile(profile);
        setFirstName(profile.firstName);
        setLastName(profile.lastName);
        setAccountType(profile.accountType);
    };

    const handleAddProfile = async () => {
        try {
            const phone = getPhoneFromStorage();
            const response = await fetch("/api/profiles", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    phone,
                    firstName: "",
                    lastName: "",
                    accountType: "adult"
                })
            });

            const data = await response.json();
            if (data.success) {
                setProfiles([...profiles, data.profile]);
                selectProfile(data.profile);
                toast({
                    title: "Профиль добавлен",
                    description: "Новый профиль успешно создан",
                });
            }
        } catch (error) {
            console.error("Add profile error:", error);
            toast({
                title: "Ошибка",
                description: "Не удалось создать профиль",
                variant: "destructive",
            });
        }
    };

    const handleSaveProfile = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!currentProfile) return;

        setIsSaving(true);
        try {
            const response = await fetch(`/api/profiles/${currentProfile.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    firstName,
                    lastName,
                    accountType
                })
            });

            const data = await response.json();
            if (data.success) {
                // Обновляем локальный список
                setProfiles(profiles.map(p =>
                    p.id === currentProfile.id ? data.profile : p
                ));
                setCurrentProfile(data.profile);

                toast({
                    title: "Сохранено",
                    description: "Профиль успешно обновлен",
                });
            }
        } catch (error) {
            console.error("Save profile error:", error);
            toast({
                title: "Ошибка",
                description: "Не удалось сохранить изменения",
                variant: "destructive",
            });
        } finally {
            setIsSaving(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem("auth_token");
        localStorage.removeItem("auth_data");
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

    const getAccountTypeLabel = (type: string) => {
        switch (type) {
            case 'child': return 'Детский';
            case 'adult': return 'Взрослый';
            case 'senior': return 'Семейный';
            default: return 'Взрослый';
        }
    };

    if (loading) {
        return (
            <Layout>
                <div className="min-h-screen flex items-center justify-center text-white">
                    <div className="text-center">
                        <div className="w-12 h-12 border-4 border-white/20 border-t-[#3B59FF] rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-gray-400">Загрузка профилей...</p>
                    </div>
                </div>
            </Layout>
        );
    }

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
                                <div className="flex flex-col gap-4">
                                    {profiles.map((profile) => (
                                        <div
                                            key={profile.id}
                                            onClick={() => selectProfile(profile)}
                                            className={`flex items-center gap-4 group cursor-pointer p-4 rounded-2xl transition-all ${currentProfile?.id === profile.id
                                                    ? 'bg-[#3B59FF]/10 border border-[#3B59FF]/30'
                                                    : 'hover:bg-white/5 border border-transparent'
                                                }`}
                                        >
                                            <div className={`w-16 h-16 rounded-full flex items-center justify-center transition-all ${currentProfile?.id === profile.id
                                                    ? 'bg-[#3B59FF] text-white'
                                                    : 'bg-white/5 border border-white/10 text-gray-400 group-hover:border-[#3B59FF] group-hover:text-[#3B59FF]'
                                                }`}>
                                                <User size={32} />
                                            </div>
                                            <div className="flex-1">
                                                <h3 className={`text-lg font-semibold transition-colors ${currentProfile?.id === profile.id ? 'text-white' : 'group-hover:text-[#3B59FF]'
                                                    }`}>
                                                    {profile.firstName || profile.lastName
                                                        ? `${profile.firstName} ${profile.lastName}`.trim()
                                                        : "Имя Фамилия"}
                                                </h3>
                                                <p className="text-sm text-gray-400">
                                                    +992 {profile.phone.slice(0, 2)} {profile.phone.slice(2, 5)} {profile.phone.slice(5, 7)} {profile.phone.slice(7)}
                                                </p>
                                            </div>
                                            {currentProfile?.id === profile.id && (
                                                <div className="w-8 h-8 rounded-full bg-[#3B59FF] flex items-center justify-center">
                                                    <Check size={16} className="text-white" />
                                                </div>
                                            )}
                                        </div>
                                    ))}

                                    <button
                                        onClick={handleAddProfile}
                                        className="flex items-center gap-4 group text-gray-400 hover:text-white transition-all p-4 rounded-2xl hover:bg-white/5"
                                    >
                                        <div className="w-16 h-16 rounded-full bg-white/5 border border-dashed border-white/20 flex items-center justify-center group-hover:border-white/40 transition-all">
                                            <Plus size={32} className="text-gray-500 group-hover:text-white transition-colors" />
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

                                <form onSubmit={handleSaveProfile} className="space-y-8 max-w-md">
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
                                            value={currentProfile ? `+992 ${currentProfile.phone.slice(0, 2)} ${currentProfile.phone.slice(2, 5)} ${currentProfile.phone.slice(5, 7)} ${currentProfile.phone.slice(7)}` : ""}
                                            readOnly
                                            className="h-14 bg-white/5 border-white/10 rounded-2xl text-gray-400 cursor-not-allowed"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-gray-400 text-xs uppercase tracking-widest font-bold">Тип аккаунта</Label>
                                        <Select value={accountType} onValueChange={(val) => setAccountType(val as any)}>
                                            <SelectTrigger className="h-14 bg-white/5 border-white/10 rounded-2xl focus:ring-[#3B59FF]/30">
                                                <SelectValue placeholder="Выберите тип" />
                                            </SelectTrigger>
                                            <SelectContent className="bg-[#0A0F1E] border-white/10 text-white rounded-xl">
                                                <SelectItem value="child">Детский</SelectItem>
                                                <SelectItem value="adult">Взрослый</SelectItem>
                                                <SelectItem value="senior">Семейный</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <Button
                                        type="submit"
                                        disabled={isSaving}
                                        className="w-full h-14 bg-[#3B59FF] hover:bg-[#3B59FF]/90 text-white rounded-2xl text-lg font-semibold shadow-lg shadow-[#3B59FF]/20 transition-all"
                                    >
                                        {isSaving ? (
                                            <div className="flex items-center gap-2">
                                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                Сохранение...
                                            </div>
                                        ) : (
                                            "Сохранить изменения"
                                        )}
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
