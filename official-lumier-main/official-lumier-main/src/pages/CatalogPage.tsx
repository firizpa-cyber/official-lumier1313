import { useState, useMemo } from "react";
import axios from "axios";
import { useSearchParams } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { MovieCard } from "@/components/cards/MovieCard";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { X, RotateCcw, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { popularMovies, freeMovies, kidsMovies, allMovies } from "@/data/movies";
import { getProxiedUrl } from "@/lib/image-proxy";

const contentTypes = [
  { id: "films", label: "Фильмы" },
  { id: "cartoons", label: "Мульт" },
  { id: "series", label: "Сериалы" },
  { id: "shows", label: "Шоу" },
];

const genres = [
  "Все жанры",
  "Боевик",
  "Комедия",
  "Драма",
  "Триллер",
  "Ужасы",
  "Фантастика",
  "Мелодрама",
  "Детектив",
  "Приключения",
  "Семейный",
  "Документальный",
];

const countries = [
  "Все страны",
  "Россия",
  "США",
  "Таджикистан",
  "Узбекистан",
  "Индия",
  "Великобритания",
  "Франция",
  "Германия",
  "Корея",
  "Япония",
];

const years = [
  "Все годы",
  "2024",
  "2023",
  "2022",
  "2021",
  "2020",
  "2019",
  "2018",
  "2010-2017",
  "2000-2009",
  "До 2000",
];

const plots = [
  "Любой сюжет",
  "Основано на реальных событиях",
  "По книге",
  "Ремейк",
  "Продолжение",
  "Оригинальный",
];

const CatalogPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const [activeType, setActiveType] = useState(searchParams.get("type") || "films");
  const [genre, setGenre] = useState("Все жанры");
  const [country, setCountry] = useState("Все страны");
  const [year, setYear] = useState("Все годы");
  const [plot, setPlot] = useState("Любой сюжет");
  const [hideWatched, setHideWatched] = useState(false);
  const [freeOnly, setFreeOnly] = useState(false);
  const [madeInAnt, setMadeInAnt] = useState(false);

  // Combine all movies for the catalog
  const allContent = useMemo(() => {
    return allMovies.map((movie, index) => ({
      ...movie,
      contentType: index % 4 === 0 ? "films" : index % 4 === 1 ? "cartoons" : index % 4 === 2 ? "series" : "shows",
    }));
  }, []);


  const filteredContent = useMemo(() => {
    return allContent.filter((item) => {
      if (activeType !== "all" && item.contentType !== activeType) {
        return false;
      }
      return true;
    });
  }, [allContent, activeType]);

  const resetFilters = () => {
    setGenre("Все жанры");
    setCountry("Все страны");
    setYear("Все годы");
    setPlot("Любой сюжет");
    setHideWatched(false);
    setFreeOnly(false);
    setMadeInAnt(false);
  };

  const hasActiveFilters = genre !== "Все жанры" || country !== "Все страны" ||
    year !== "Все годы" || plot !== "Любой сюжет" || hideWatched || freeOnly || madeInAnt;

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6">
        {/* Type tabs */}
        <div className="flex flex-wrap items-center gap-2 mb-6">
          {contentTypes.map((type) => (
            <Button
              key={type.id}
              variant={activeType === type.id ? "default" : "outline"}
              onClick={() => setActiveType(type.id)}
              className={cn(
                "rounded-full px-6",
                activeType === type.id
                  ? "bg-primary hover:bg-primary/90"
                  : "bg-transparent border-border hover:bg-muted"
              )}
            >
              {type.label}
            </Button>
          ))}
        </div>

        {/* Filters row */}
        <div className="flex flex-wrap items-center gap-3 mb-4">
          {/* Genre */}
          <Select value={genre} onValueChange={setGenre}>
            <SelectTrigger className="w-[160px] bg-card border-border">
              <SelectValue placeholder="Жанр" />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border z-50">
              {genres.map((g) => (
                <SelectItem key={g} value={g}>{g}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Country */}
          <Select value={country} onValueChange={setCountry}>
            <SelectTrigger className="w-[160px] bg-card border-border">
              <SelectValue placeholder="Страна" />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border z-50">
              {countries.map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Year */}
          <Select value={year} onValueChange={setYear}>
            <SelectTrigger className="w-[140px] bg-card border-border">
              <SelectValue placeholder="Год" />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border z-50">
              {years.map((y) => (
                <SelectItem key={y} value={y}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Plot */}
          <Select value={plot} onValueChange={setPlot}>
            <SelectTrigger className="w-[180px] bg-card border-border">
              <SelectValue placeholder="Сюжет" />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border z-50">
              {plots.map((p) => (
                <SelectItem key={p} value={p}>{p}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Checkbox filters */}
        <div className="flex flex-wrap items-center gap-6 mb-8">
          <label className="flex items-center gap-2 cursor-pointer">
            <Checkbox
              checked={madeInAnt}
              onCheckedChange={(checked) => setMadeInAnt(checked as boolean)}
            />
            <span className="text-sm text-foreground">Сделано в АНТ</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <Checkbox
              checked={freeOnly}
              onCheckedChange={(checked) => setFreeOnly(checked as boolean)}
            />
            <span className="text-sm text-foreground">Бесплатно</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <Checkbox
              checked={hideWatched}
              onCheckedChange={(checked) => setHideWatched(checked as boolean)}
            />
            <span className="text-sm text-foreground">Скрыть просмотренные</span>
          </label>

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={resetFilters}
              className="text-muted-foreground hover:text-foreground gap-1"
            >
              <RotateCcw className="w-4 h-4" />
              Сбросить
            </Button>
          )}
        </div>

        {/* Content grid - horizontal cards like in reference */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {filteredContent.map((item, index) => (
            <CatalogCard
              key={`${item.id}-${index}`}
              id={item.id}
              title={item.title}
              image={item.image}
              logo={item.logo}
              rating={item.rating}
              type={item.type}
              year={item.year}
              streamUrl={item.streamUrl}
            />
          ))}
        </div>

        {/* Load more */}
        {filteredContent.length > 0 && (
          <div className="flex justify-center mt-10">
            <Button variant="outline" className="px-8">
              Показать ещё
            </Button>
          </div>
        )}
      </div>
    </Layout>
  );
};

// Horizontal card component for catalog
interface CatalogCardProps {
  id: string;
  title: string;
  image: string;
  logo?: string;
  rating?: number;
  type: "film" | "series" | "premiere";
  year?: string;
  streamUrl?: string;
}

function CatalogCard({ id, title, image, logo, rating, type, year, streamUrl }: CatalogCardProps) {
  const proxiedImage = getProxiedUrl(image) || image;
  const proxiedLogo = getProxiedUrl(logo);

  const badgeClasses = {
    film: "badge-film",
    series: "badge-series",
    premiere: "badge-premiere",
  };

  const badgeLabels = {
    film: "Фильм",
    series: "Сериал",
    premiere: "Мульт",
  };

  return (
    <a
      href={`/movie/${id}`}
      onMouseEnter={() => {
        if (streamUrl && streamUrl.includes('.m3u8')) {
          axios.get(`/api/cors-proxy?url=${encodeURIComponent(streamUrl)}`).catch(() => { });
        }
      }}
      className="group relative rounded-xl overflow-hidden card-hover"
    >
      {/* Horizontal aspect ratio */}
      <div className="aspect-[16/10] relative overflow-hidden rounded-xl bg-muted/20">
        <img
          src={proxiedImage}
          alt={title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          loading="lazy"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            if (proxiedLogo && target.src !== proxiedLogo) {
              target.src = proxiedLogo;
            }
          }}
        />

        {/* Logo Overlay - if available */}
        {proxiedLogo && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/5 group-hover:bg-black/0 transition-colors duration-300 z-10">
            <img
              src={proxiedLogo}
              alt={title}
              className="w-full h-full p-2 object-contain drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)] transition-transform duration-500 group-hover:scale-105"
              onError={(e) => {
                (e.target as HTMLImageElement).parentElement!.style.display = 'none';
              }}
            />
          </div>
        )}


        {/* Gradient overlay */}
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

        {/* Title */}
        <div className={cn(
          "absolute bottom-0 left-0 right-0 p-3 z-10 transition-transform duration-500",
          logo ? "translate-y-full group-hover:translate-y-0" : ""
        )}>
          {!logo && <h3 className="text-white font-medium text-xs line-clamp-1">{title}</h3>}
          {logo && <h3 className="text-white font-medium text-xs line-clamp-1">{title}</h3>}
        </div>
      </div>
    </a>
  );
}

export default CatalogPage;
