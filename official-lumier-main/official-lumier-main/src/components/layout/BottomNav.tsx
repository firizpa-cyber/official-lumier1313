import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { User, LogOut, Star } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const navItems = [
  {
    label: "Главная",
    href: "/",
    iconNormal: "https://cdn.builder.io/api/v1/image/assets%2F0d77b54bf9a14a4f80a323f36080e67b%2Fb0b9026a99054e3dbf3449e57d54d588?format=webp&width=800",
    iconActive: "https://cdn.builder.io/api/v1/image/assets%2F0d77b54bf9a14a4f80a323f36080e67b%2F891742d1d96344a3bedb37ce7ccb60d8?format=webp&width=800",
  },
  {
    label: "Детям",
    href: "/kids",
    iconNormal: "https://cdn.builder.io/api/v1/image/assets%2F0d77b54bf9a14a4f80a323f36080e67b%2F57da6f0e10a24080a6140e62470461ea?format=webp&width=800",
    iconActive: "https://cdn.builder.io/api/v1/image/assets%2F0d77b54bf9a14a4f80a323f36080e67b%2F42037a02cc254fd0abc8aade24d05b53?format=webp&width=800",
  },
  {
    label: "Бесплатно",
    href: "/free",
    iconNormal: "https://cdn.builder.io/api/v1/image/assets%2F0d77b54bf9a14a4f80a323f36080e67b%2Fdc3a10171cdb49188396331cd6cce8ad?format=webp&width=800",
    iconActive: "https://cdn.builder.io/api/v1/image/assets%2F0d77b54bf9a14a4f80a323f36080e67b%2F588c99cf62c54bfa91e0bec8a534b390?format=webp&width=800",
  },
  {
    label: "Спорт",
    href: "/sports",
    iconNormal: "https://cdn.builder.io/api/v1/image/assets%2F0d77b54bf9a14a4f80a323f36080e67b%2Fadd46c706e974358b4e2e70c21ad42ed?format=webp&width=800",
    iconActive: "https://cdn.builder.io/api/v1/image/assets%2F0d77b54bf9a14a4f80a323f36080e67b%2F8e618fb6e7d34d61bc9223b386f487c5?format=webp&width=800",
  },
  {
    label: "Коллекции",
    href: "/collections",
    iconNormal: "https://cdn.builder.io/api/v1/image/assets%2F0d77b54bf9a14a4f80a323f36080e67b%2F6f2fb373133c4c9498c1e92be38fe4f0?format=webp&width=800",
    iconActive: "https://cdn.builder.io/api/v1/image/assets%2F0d77b54bf9a14a4f80a323f36080e67b%2F5e3f0868ba1a4ce7bad23cc392765e83?format=webp&width=800",
  },
  {
    label: "ТВ каналы",
    href: "/tv",
    iconNormal: "https://cdn.builder.io/api/v1/image/assets%2F0d77b54bf9a14a4f80a323f36080e67b%2Fc0f701fa7ce644508a74fefc419cc679?format=webp&width=800",
    iconActive: "https://cdn.builder.io/api/v1/image/assets%2F0d77b54bf9a14a4f80a323f36080e67b%2F1ece459a70494a90b606ef033acd44ba?format=webp&width=800",
  },
];

export function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const [profileOpen, setProfileOpen] = useState(false);

  return (
    <nav className="fixed bottom-0 left-0 right-0 lg:hidden z-50 bg-card/80 backdrop-blur-2xl border-t border-border/30">
      <div className="flex items-center justify-between h-[68px] px-2">
        {/* Navigation items - scrollable on mobile */}
        <div className="flex items-center gap-1 flex-1 overflow-x-auto scrollbar-hide">
          {navItems.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.href}
                to={item.href}
                className="flex flex-col items-center justify-center gap-1 px-3 py-2 min-w-fit flex-shrink-0 transition-colors"
              >
                <img
                  src={isActive ? item.iconActive : item.iconNormal}
                  alt={item.label}
                  className={cn(
                    "w-6 h-6",
                    isActive ? "opacity-100" : "opacity-70"
                  )}
                />
                <span className={cn(
                  "text-[0.6rem] font-medium whitespace-nowrap",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>

        {/* Profile button */}
        {localStorage.getItem("auth_token") ? (
          <Sheet open={profileOpen} onOpenChange={setProfileOpen}>
            <SheetTrigger asChild>
              <button className="flex flex-col items-center justify-center gap-1 px-3 py-2 text-muted-foreground hover:text-foreground transition-colors flex-shrink-0 min-w-fit">
                <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                  <User className="w-3.5 h-3.5 text-primary" />
                </div>
                <span className="text-[0.6rem] font-medium whitespace-nowrap">Профиль</span>
              </button>
            </SheetTrigger>
            <SheetContent side="bottom" className="max-h-[50vh] p-0 flex flex-col rounded-t-2xl">
              {/* Handle bar */}
              <div className="flex justify-center pt-3 pb-2">
                <div className="w-12 h-1 bg-muted-foreground/30 rounded-full" />
              </div>

              {/* Profile content */}
              <div className="overflow-y-auto flex-1 px-4">
                <div className="py-4 space-y-4">
                  {/* User info placeholder */}
                  <div className="flex items-center gap-3 pb-4 border-b border-border/30">
                    <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                      <User className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-foreground">Мой аккаунт</p>
                      <p className="text-xs text-muted-foreground">user@example.com</p>
                    </div>
                  </div>

                  {/* Profile menu items */}
                  <div className="space-y-2">
                    <Link
                      to="/profile"
                      onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 rounded-lg text-foreground/80 hover:bg-muted hover:text-foreground transition-colors"
                    >
                      <User className="w-5 h-5" />
                      <span className="text-sm font-medium">Мой профиль</span>
                    </Link>

                    <Link
                      to="/pricing"
                      onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 rounded-lg text-foreground/80 hover:bg-muted hover:text-foreground transition-colors"
                    >
                      <Star className="w-5 h-5 text-primary" />
                      <span className="text-sm font-medium">Подписка</span>
                    </Link>

                    <button
                      onClick={() => {
                        localStorage.removeItem("auth_token");
                        navigate("/");
                        setProfileOpen(false);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-destructive/80 hover:bg-destructive/10 hover:text-destructive transition-colors"
                    >
                      <LogOut className="w-5 h-5" />
                      <span className="text-sm font-medium">Выход</span>
                    </button>
                  </div>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        ) : (
          <button
            onClick={() => navigate("/auth")}
            className="flex flex-col items-center justify-center gap-1 px-3 py-2 text-muted-foreground hover:text-foreground transition-colors flex-shrink-0 min-w-fit"
          >
            <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center">
              <User className="w-3.5 h-3.5" />
            </div>
            <span className="text-[0.6rem] font-medium whitespace-nowrap">Войти</span>
          </button>
        )}
      </div>
    </nav>
  );
}
