import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

export interface TVChannelCardProps {
  id: string;
  name: string;
  logo: string;
  currentShow?: string;
  showTime?: string;
  progress?: number;
  timeRemaining?: string;
  ageRating?: string;
  className?: string;
}

export function TVChannelCard({
  id,
  name,
  logo,
  currentShow,
  progress = 0,
  className,
}: TVChannelCardProps) {
  return (
    <Link
      to={`/watch/${id}`}
      className={cn(
        "group relative flex flex-col rounded-[20px] overflow-hidden bg-card border border-border/30 hover:border-primary/50 transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:shadow-black/40",
        className
      )}
    >
      {/* Banner Container */}
      <div className="relative h-40 bg-gradient-to-br from-white/5 to-white/[0.02] flex items-center justify-center p-8 overflow-hidden">
        {/* Glow behind logo */}
        <div className="absolute inset-0 bg-radial-gradient from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

        <img
          src={logo}
          alt={name}
          className="max-w-full max-h-24 object-contain contrast-125 brightness-110 drop-shadow-[0_0_15px_rgba(0,0,0,0.5)] z-10 transition-transform duration-500 group-hover:scale-110"
        />

        {/* Live Badge */}
        <div className="absolute top-3 right-3 bg-red-600 text-[10px] font-black text-white px-2 py-0.5 rounded shadow-lg shadow-red-600/40 tracking-wider z-20">
          LIVE
        </div>
      </div>

      {/* Channel Info */}
      <div className="p-5 bg-black/20 border-t border-white/5">
        <div className="h-1 bg-white/10 rounded-full mb-3 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary to-primary/60 shadow-[0_0_10px_rgba(var(--primary-rgb),0.5)]"
            style={{ width: `${progress}%` }}
          />
        </div>

        <h3 className="font-bold text-white text-base truncate mb-1">
          {name}
        </h3>

        <div className="flex items-center gap-2 mt-1">
          <span className="text-[10px] bg-white/10 text-white/70 px-1 rounded border border-white/10 font-bold shrink-0">0+</span>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground truncate">
            <span className="w-1 h-1 rounded-full bg-red-500 animate-pulse shrink-0" />
            <span>{name.toLowerCase().includes('premium') || name.toLowerCase().includes('match') || name.toLowerCase().includes('спорт') ? 'Спорт' : 'ТВ Канал'}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
