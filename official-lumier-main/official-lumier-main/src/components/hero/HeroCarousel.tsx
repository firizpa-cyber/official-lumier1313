import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { Play, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getProxiedUrl } from "@/lib/image-proxy";

export interface HeroSlide {
  id: string;
  title: string;
  subtitle?: string;
  description?: string;
  image: string;
  logo?: string;
  type?: "film" | "series" | "premiere";
  rating?: number;
  year?: string;
  duration?: string;
  country?: string;
}

interface HeroCarouselProps {
  slides: HeroSlide[];
  autoPlayInterval?: number;
}

export function HeroCarousel({ slides, autoPlayInterval = 6000 }: HeroCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [failedLogos, setFailedLogos] = useState<Set<string>>(new Set());

  const goToSlide = useCallback((index: number) => {
    setCurrentIndex(index);
  }, []);

  const goToPrevious = useCallback(() => {
    setCurrentIndex((prev) => (prev === 0 ? slides.length - 1 : prev - 1));
  }, [slides.length]);

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
  }, [slides.length]);

  useEffect(() => {
    if (!isAutoPlaying) return;

    const interval = setInterval(goToNext, autoPlayInterval);
    return () => clearInterval(interval);
  }, [isAutoPlaying, autoPlayInterval, goToNext]);

  const currentSlide = slides[currentIndex];

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
    <section
      className="relative h-[500px] md:h-[600px] lg:h-[650px] overflow-hidden"
      onMouseEnter={() => setIsAutoPlaying(false)}
      onMouseLeave={() => setIsAutoPlaying(true)}
    >
      {/* Slides */}
      <div className="absolute inset-0">
        {slides.map((slide, index) => (
          <div
            key={slide.id}
            className={cn(
              "absolute inset-0 transition-opacity duration-700",
              index === currentIndex ? "opacity-100 z-10" : "opacity-0 z-0"
            )}
          >
            {/* Background image */}
            <img
              src={getProxiedUrl(slide.image)}
              alt={slide.title}
              className="w-full h-full object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                const proxiedLogo = getProxiedUrl(slide.logo);
                if (proxiedLogo && target.src !== proxiedLogo) target.src = proxiedLogo;
              }}
            />

            {/* Gradient overlays */}
            <div className="absolute inset-0 hero-overlay" />
            <div className="absolute inset-0 hero-overlay-bottom" />
          </div>
        ))}
      </div>

      {/* Content */}
      <div className="relative z-20 container mx-auto px-4 h-full flex items-center">
        <div className="max-w-xl animate-fade-in" key={currentIndex}>
          {/* Badge */}
          {currentSlide.type && (
            <span className={cn(badgeClasses[currentSlide.type], "mb-4 inline-block")}>
              {badgeLabels[currentSlide.type]}
            </span>
          )}

          {/* Title or Logo */}
          {currentSlide.logo && !failedLogos.has(currentSlide.logo) ? (
            <img
              src={getProxiedUrl(currentSlide.logo)}
              alt={currentSlide.title}
              className="max-h-24 md:max-h-32 mb-6 object-contain drop-shadow-[0_8px_24px_rgba(0,0,0,0.5)] animate-fade-in"
              onError={() => {
                setFailedLogos(prev => new Set(prev).add(currentSlide.logo!));
              }}
            />
          ) : (
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">
              {currentSlide.title}
            </h1>
          )}

          {/* Subtitle */}
          {currentSlide.subtitle && (
            <p className="text-lg text-muted-foreground mb-2">{currentSlide.subtitle}</p>
          )}

          {/* Meta info */}
          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground mb-4">
            {currentSlide.rating && (
              <span className="rating-badge">{currentSlide.rating.toFixed(1)}</span>
            )}
            {currentSlide.duration && <span>{currentSlide.duration}</span>}
            {currentSlide.year && <span>{currentSlide.year}</span>}
            {currentSlide.country && <span>{currentSlide.country}</span>}
          </div>

          {/* Description */}
          {currentSlide.description && (
            <p className="text-foreground/80 text-sm md:text-base mb-6 line-clamp-3">
              {currentSlide.description}
            </p>
          )}

          {/* Actions */}
          <div className="flex items-center gap-3">
            <Link to={`/watch/${currentSlide.id}`}>
              <Button className="bg-gradient-primary hover:opacity-90 gap-2 px-6">
                <Play className="w-5 h-5 fill-current" />
                Смотреть
              </Button>
            </Link>
            <Link to={`/movie/${currentSlide.id}`}>
              <Button variant="outline" className="border-foreground/30 hover:bg-foreground/10 gap-2">
                <Info className="w-5 h-5" />
                Подробнее
              </Button>
            </Link>
          </div>
        </div>
      </div>


      {/* Side previews */}
      <div className="absolute right-8 top-1/2 -translate-y-1/2 z-20 hidden xl:flex flex-col gap-3">
        {slides.map((slide, index) => {
          const isActive = index === currentIndex;
          const isPrev = index === (currentIndex === 0 ? slides.length - 1 : currentIndex - 1);
          const isNext = index === (currentIndex === slides.length - 1 ? 0 : currentIndex + 1);

          if (!isPrev && !isActive && !isNext) return null;

          return (
            <button
              key={slide.id}
              onClick={() => goToSlide(index)}
              className={cn(
                "relative w-48 aspect-[16/10] rounded-lg overflow-hidden transition-all duration-300",
                isActive
                  ? "ring-2 ring-primary scale-105 shadow-glow"
                  : "opacity-60 hover:opacity-100"
              )}
            >
              <img
                src={getProxiedUrl(slide.image)}
                alt={slide.title}
                className="w-full h-full object-cover"
              />
              {slide.logo && !failedLogos.has(slide.logo) && (
                <div className="absolute inset-0 flex items-center justify-center p-4 bg-black/10">
                  <img
                    src={getProxiedUrl(slide.logo)}
                    alt={slide.title}
                    className="max-h-full object-contain drop-shadow-md"
                    onError={() => {
                      setFailedLogos(prev => new Set(prev).add(slide.logo!));
                    }}
                  />
                </div>
              )}
              {slide.rating && (
                <span className="absolute top-2 right-2 rating-badge text-xs">
                  {slide.rating.toFixed(1)}
                </span>
              )}
              {slide.type && (
                <span className={cn(badgeClasses[slide.type], "absolute top-2 left-2 text-xs")}>
                  {badgeLabels[slide.type]}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Dots indicator */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={cn(
              "w-2 h-2 rounded-full transition-all duration-300",
              index === currentIndex
                ? "w-8 bg-primary"
                : "bg-foreground/30 hover:bg-foreground/50"
            )}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </section>
  );
}
