import { Link } from "react-router-dom";
import logo from "@/assets/logo-lumiere.png";
import { 
  Facebook, 
  Twitter, 
  Instagram, 
  Youtube,
  Mail,
  Phone,
  MapPin 
} from "lucide-react";

const footerLinks = {
  company: [
    { label: "О нас", href: "/about" },
    { label: "Вакансии", href: "/careers" },
    { label: "Партнёрам", href: "/partners" },
    { label: "Реклама", href: "/advertising" },
  ],
  support: [
    { label: "Помощь", href: "/help" },
    { label: "Условия использования", href: "/terms" },
    { label: "Политика конфиденциальности", href: "/privacy" },
    { label: "Обратная связь", href: "/feedback" },
  ],
  apps: [
    { label: "Smart TV", href: "/apps/tv" },
    { label: "Android", href: "/apps/android" },
    { label: "iOS", href: "/apps/ios" },
    { label: "Web", href: "/" },
  ],
};

const socialLinks = [
  { icon: Facebook, href: "#", label: "Facebook" },
  { icon: Twitter, href: "#", label: "Twitter" },
  { icon: Instagram, href: "#", label: "Instagram" },
  { icon: Youtube, href: "#", label: "Youtube" },
];

export function Footer() {
  return (
    <footer className="bg-background-elevated border-t border-border/30 mt-16">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Logo and description */}
          <div className="lg:col-span-2">
            <Link to="/" className="inline-block mb-4">
              <img src={logo} alt="Lumiere" className="h-10 w-auto" />
            </Link>
            <p className="text-muted-foreground text-sm mb-6 max-w-sm">
              Смотрите фильмы, сериалы, мультфильмы и ТВ-каналы онлайн в отличном качестве на любых устройствах.
            </p>
            
            {/* Social links */}
            <div className="flex items-center gap-3">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  className="w-10 h-10 rounded-full bg-muted/50 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  aria-label={social.label}
                >
                  <social.icon className="w-5 h-5" />
                </a>
              ))}
            </div>
          </div>

          {/* Company links */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">Компания</h3>
            <ul className="space-y-2">
              {footerLinks.company.map((link) => (
                <li key={link.href}>
                  <Link 
                    to={link.href}
                    className="text-muted-foreground hover:text-foreground text-sm transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support links */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">Поддержка</h3>
            <ul className="space-y-2">
              {footerLinks.support.map((link) => (
                <li key={link.href}>
                  <Link 
                    to={link.href}
                    className="text-muted-foreground hover:text-foreground text-sm transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Apps */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">Приложения</h3>
            <ul className="space-y-2">
              {footerLinks.apps.map((link) => (
                <li key={link.href}>
                  <Link 
                    to={link.href}
                    className="text-muted-foreground hover:text-foreground text-sm transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Contact info */}
        <div className="mt-10 pt-8 border-t border-border/30">
          <div className="flex flex-wrap gap-6 text-sm text-muted-foreground">
            <a href="tel:9911" className="flex items-center gap-2 hover:text-foreground transition-colors">
              <Phone className="w-4 h-4" />
              99-11
            </a>
            <a href="mailto:ant@lumier.tj" className="flex items-center gap-2 hover:text-foreground transition-colors">
              <Mail className="w-4 h-4" />
              ant@lumier.tj
            </a>
            <span className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Худжанд, ул. Сирдаря 1
            </span>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-8 pt-6 border-t border-border/30 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-muted-foreground text-sm">
            © 2025 Lumiere. Все права защищены.
          </p>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <Link to="/terms" className="hover:text-foreground transition-colors">
              Условия
            </Link>
            <Link to="/privacy" className="hover:text-foreground transition-colors">
              Конфиденциальность
            </Link>
            <Link to="/cookies" className="hover:text-foreground transition-colors">
              Cookies
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
