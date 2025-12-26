import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

export interface MovieCardProps {
  id: string;
  title: string;
  image: string;
  logo?: string;
  poster?: string;
  banner?: string;
  rating?: number;
  type?: "film" | "series" | "premiere";
  year?: string;
  className?: string;
}

export function MovieCard({
  id,
  title,
  image,
  logo,
  rating,
  type = "film",
  year,
  className
}: MovieCardProps) {
  const badgeClasses = {
    film: "badge-film",
    series: "badge-series",
    premiere: "badge-premiere",
  };

  const badgeLabels = {
    film: "Фильм",
    series: "Сериал",
    premiere: "Премьера",
  };

  return (
    <Link
      to={`/movie/${id}`}
      className={cn(
        "group relative flex-shrink-0 w-[280px] sm:w-[320px] md:w-[360px] rounded-xl overflow-hidden card-hover",
        className
      )}
    >
      {/* Image */}
      <div className="aspect-video relative overflow-hidden rounded-xl bg-muted/20">
        <img
          src={image}
          alt={title}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          loading="lazy"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            if (logo && target.src !== logo) {
              target.src = logo;
            }
          }}
        />

        {/* Logo Overlay - if available */}
        {logo && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/5 group-hover:bg-black/0 transition-colors duration-300 z-10">
            <img
              src={logo}
              alt={title}
              className="w-full h-full p-2 object-contain drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)] transition-transform duration-500 group-hover:scale-105"
              onError={(e) => {
                (e.target as HTMLImageElement).parentElement!.style.display = 'none';
              }}
            />
          </div>
        )}

        {/* Gradient overlay - only if no logo to keep it clean, or keep it subtle */}
        <div className={cn(
          "absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent transition-opacity duration-300",
          logo ? "opacity-40 group-hover:opacity-60" : "opacity-0 group-hover:opacity-100"
        )} />

        {/* Type badge */}
        <div className="absolute top-2 left-2 z-10">
          <span className={cn(badgeClasses[type], "text-[10px] py-0.5 px-1.5")}>{badgeLabels[type]}</span>
        </div>

        {/* Rating badge */}
        {rating && (
          <div className="absolute top-2 right-2 z-10">
            <span className="rating-badge text-[10px] py-0.5 px-1.5">{rating.toFixed(1)}</span>
          </div>
        )}

        {/* Title/Meta - Hidden if logo is present and it's not hovered, or show it only on hover */}
        <div className={cn(
          "absolute bottom-0 left-0 right-0 p-3 z-10 transition-transform duration-500",
          logo ? "translate-y-full group-hover:translate-y-0" : "translate-y-full group-hover:translate-y-0"
        )}>
          {!logo && <h3 className="text-white font-bold text-sm line-clamp-1 mb-1">{title}</h3>}
          {year && <p className="text-white/60 text-[10px] font-medium uppercase tracking-wider">{year} • {type === 'film' ? 'Фильм' : 'Сериал'}</p>}
        </div>
      </div>
    </Link>
  );
}
