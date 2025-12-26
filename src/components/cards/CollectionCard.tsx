import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

export interface CollectionCardProps {
  id: string;
  title: string;
  icon?: LucideIcon;
  images?: string[];
  gradient: string;
  className?: string;
}

export function CollectionCard({
  id,
  title,
  icon: Icon,
  images,
  gradient,
  className,
}: CollectionCardProps) {
  return (
    <Link
      to={`/collection/${id}`}
      className={cn(
        "group relative rounded-2xl overflow-hidden aspect-[4/3] card-hover",
        gradient,
        className
      )}
    >
      {/* Background pattern/images */}
      {images && images.length > 0 ? (
        <div className="absolute inset-0 flex items-center justify-center p-4">
          <div className="flex gap-2 transform group-hover:scale-105 transition-transform duration-500">
            {images.slice(0, 3).map((img, index) => (
              <img
                key={index}
                src={img}
                alt=""
                className={cn(
                  "w-20 h-28 object-cover rounded-lg shadow-lg",
                  index === 1 && "transform -translate-y-2"
                )}
              />
            ))}
          </div>
        </div>
      ) : Icon ? (
        <div className="absolute inset-0 flex items-center justify-center">
          <Icon className="w-16 h-16 text-white/30 group-hover:text-white/50 transition-colors" />
        </div>
      ) : null}

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

      {/* Title */}
      <div className="absolute bottom-0 left-0 right-0 p-4">
        <h3 className="text-white font-semibold text-lg">{title}</h3>
      </div>
    </Link>
  );
}
