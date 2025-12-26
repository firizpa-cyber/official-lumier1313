import { useState, useMemo, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { MovieCard } from "@/components/cards/MovieCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, X, Clock, TrendingUp, Film, Tv, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { popularMovies, freeMovies, kidsMovies } from "@/data/movies";

const searchCategories = [
  { id: "all", label: "Все", icon: Search },
  { id: "films", label: "Фильмы", icon: Film },
  { id: "series", label: "Сериалы", icon: Tv },
  { id: "actors", label: "Актёры", icon: Users },
];

const popularSearches = [
  "Мажор",
  "Сваты",
  "Игра престолов",
  "Во все тяжкие",
  "Друзья",
  "Шерлок",
  "Ведьмак",
  "Холоп",
];

const recentSearches = [
  "Комедия 2024",
  "Российские сериалы",
  "Мультфильмы для детей",
];

const SearchPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get("q") || "";

  const [query, setQuery] = useState(initialQuery);
  const [activeCategory, setActiveCategory] = useState("all");
  const [isFocused, setIsFocused] = useState(false);

  // Combine all movies for search
  const allContent = useMemo(() => {
    return [...popularMovies, ...freeMovies, ...kidsMovies];
  }, []);

  // Filter based on search query
  const searchResults = useMemo(() => {
    if (!query.trim()) return [];

    const lowerQuery = query.toLowerCase();
    return allContent.filter((item) =>
      item.title.toLowerCase().includes(lowerQuery) ||
      item.genres?.some(g => g.toLowerCase().includes(lowerQuery))
    );
  }, [allContent, query]);

  // Update URL when query changes
  useEffect(() => {
    if (query) {
      setSearchParams({ q: query });
    } else {
      setSearchParams({});
    }
  }, [query, setSearchParams]);

  const clearSearch = () => {
    setQuery("");
  };

  const handlePopularSearch = (term: string) => {
    setQuery(term);
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6">
        {/* Search header */}
        <div className="max-w-3xl mx-auto mb-8">
          {/* Search input */}
          <div className="relative mb-6">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Фильмы, сериалы, актёры..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setTimeout(() => setIsFocused(false), 200)}
              className="pl-12 pr-12 py-6 text-lg bg-card border-border rounded-xl focus:ring-2 focus:ring-primary"
            />
            {query && (
              <button
                onClick={clearSearch}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Category tabs */}
          <div className="flex items-center justify-center gap-2">
            {searchCategories.map((cat) => (
              <Button
                key={cat.id}
                variant={activeCategory === cat.id ? "default" : "ghost"}
                size="sm"
                onClick={() => setActiveCategory(cat.id)}
                className={cn(
                  "gap-2 rounded-full",
                  activeCategory === cat.id && "bg-primary"
                )}
              >
                <cat.icon className="w-4 h-4" />
                {cat.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Content */}
        {query ? (
          // Search results
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-foreground">
                Результаты поиска
                <span className="text-muted-foreground ml-2">({searchResults.length})</span>
              </h2>
            </div>

            {searchResults.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {searchResults.map((item, index) => (
                  <MovieCard
                    key={`search-${item.id}-${index}`}
                    id={item.id}
                    title={item.title}
                    image={item.image}
                    logo={item.logo}
                    rating={item.rating}
                    type={item.type}
                    year={item.year}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <Search className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  Ничего не найдено
                </h3>
                <p className="text-muted-foreground mb-6">
                  Попробуйте изменить запрос или проверьте написание
                </p>
                <Button onClick={clearSearch} variant="outline">
                  Очистить поиск
                </Button>
              </div>
            )}
          </div>
        ) : (
          // Empty state - show suggestions
          <div className="max-w-3xl mx-auto">
            {/* Recent searches */}
            {recentSearches.length > 0 && (
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                  <Clock className="w-5 h-5 text-muted-foreground" />
                  <h3 className="font-semibold text-foreground">Недавние поиски</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {recentSearches.map((term) => (
                    <button
                      key={term}
                      onClick={() => handlePopularSearch(term)}
                      className="px-4 py-2 rounded-full bg-muted hover:bg-muted/80 text-foreground text-sm transition-colors"
                    >
                      {term}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Popular searches */}
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-5 h-5 text-muted-foreground" />
                <h3 className="font-semibold text-foreground">Популярные запросы</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {popularSearches.map((term) => (
                  <button
                    key={term}
                    onClick={() => handlePopularSearch(term)}
                    className="px-4 py-2 rounded-full bg-card border border-border hover:bg-muted text-foreground text-sm transition-colors"
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>

            {/* Trending content */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-5 h-5 text-primary" />
                <h3 className="font-semibold text-foreground">Сейчас в тренде</h3>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {popularMovies.slice(0, 8).map((movie, index) => (
                  <MovieCard
                    key={`trending-${movie.id}-${index}`}
                    id={movie.id}
                    title={movie.title}
                    image={movie.image}
                    logo={movie.logo}
                    rating={movie.rating}
                    type={movie.type}
                    year={movie.year}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default SearchPage;
