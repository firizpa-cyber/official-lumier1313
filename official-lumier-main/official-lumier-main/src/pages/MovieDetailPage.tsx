import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { ContentRow } from "@/components/content/ContentRow";
import { MovieCard } from "@/components/cards/MovieCard";
import { popularMovies, freeMovies } from "@/data/movies";
import { Play, Plus, Share2, ThumbsUp, Star, Clock, Globe, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import hero2 from "@/assets/hero-2.jpg";
import { getProxiedUrl } from "@/lib/image-proxy";

import { getMovieById } from "@/data/movies";

const MovieDetailPage = () => {
  const { id } = useParams();
  const [logoFailed, setLogoFailed] = useState(false);

  const movieData = id ? getMovieById(id) : null;

  if (!movieData) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-20 text-center">
          <h1 className="text-2xl font-bold">Фильм не найден</h1>
          <Link to="/" className="text-primary hover:underline mt-4 block">Вернуться на главную</Link>
        </div>
      </Layout>
    );
  }

  const movie = {
    ...movieData,
    image: getProxiedUrl(movieData.image) || movieData.image,
    poster: getProxiedUrl(movieData.poster) || movieData.poster,
    logo: getProxiedUrl(movieData.logo) || movieData.logo,
    originalTitle: "",
    seasons: 1,
    episodes: 1,
    quality: "4K UltraHD",
    subtitles: "Русские",
    ageRating: "18+",
  };

  return (
    <Layout>
      {/* Hero section with movie backdrop */}
      <section className="relative min-h-[500px] md:min-h-[600px]">
        <div className="absolute inset-0">
          <img
            src={movie.image}
            alt={movie.title}
            className="w-full h-full object-cover"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              if (movie.poster && target.src !== movie.poster) target.src = movie.poster;
            }}
          />
          <div className="absolute inset-0 hero-overlay" />
          <div className="absolute inset-0 hero-overlay-bottom" />
        </div>

        <div className="relative container mx-auto px-4 py-12 flex flex-col md:flex-row gap-8">
          {/* Poster */}
          <div className="flex-shrink-0 w-[200px] md:w-[280px] mx-auto md:mx-0">
            <div className="aspect-[2/3] rounded-xl overflow-hidden shadow-card">
              <img
                src={movie.image}
                alt={movie.title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  if (movie.logo && target.src !== movie.logo) target.src = movie.logo;
                }}
              />
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 flex flex-col justify-center">
            <div className="flex items-center gap-3 mb-4">
              <span className={movie.type === 'series' ? 'badge-series' : 'badge-film'}>
                {movie.type === 'series' ? 'Сериал' : 'Фильм'}
              </span>
              <span className="text-sm font-medium px-2 py-0.5 bg-muted rounded text-muted-foreground border border-muted-foreground/20">
                {movie.ageRating}
              </span>
            </div>

            {movie.logo && !logoFailed ? (
              <img
                src={movie.logo}
                alt={movie.title}
                className="max-h-24 md:max-h-32 mb-6 object-contain drop-shadow-[0_8px_24px_rgba(0,0,0,0.5)]"
                onError={() => setLogoFailed(true)}
              />
            ) : (
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-2">
                {movie.title}
              </h1>
            )}

            {movie.originalTitle && (
              <p className="text-muted-foreground mb-4">{movie.originalTitle}</p>
            )}

            {/* Rating and meta */}
            <div className="flex flex-wrap items-center gap-4 mb-6">
              <div className="flex items-center gap-2">
                <span className="rating-badge text-lg">{movie.rating}</span>
                <div className="text-sm">
                  <div className="text-foreground font-medium">Рейтинг Lumiere</div>
                </div>
              </div>

              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {movie.year}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {movie.seasons} сезона
                </span>
                <span className="flex items-center gap-1">
                  <Globe className="w-4 h-4" />
                  {movie.country}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap items-center gap-3 mb-6">
              <Link to={`/watch/${movie.id}`}>
                <Button className="bg-gradient-primary hover:opacity-90 gap-2 px-6">
                  <Play className="w-5 h-5 fill-current" />
                  Смотреть сериал
                </Button>
              </Link>
              <Button variant="outline" className="border-foreground/30 hover:bg-foreground/10 gap-2">
                <Play className="w-5 h-5" />
                Трейлер
              </Button>
              <Button variant="ghost" size="icon" className="w-10 h-10 rounded-full bg-muted/50">
                <Plus className="w-5 h-5" />
              </Button>
              <Button variant="ghost" size="icon" className="w-10 h-10 rounded-full bg-muted/50">
                <ThumbsUp className="w-5 h-5" />
              </Button>
              <Button variant="ghost" size="icon" className="w-10 h-10 rounded-full bg-muted/50">
                <Share2 className="w-5 h-5" />
              </Button>
            </div>

            {/* Quality and Language badges */}
            <div className="flex flex-wrap gap-2 mb-6">
              <span className="px-3 py-1 bg-muted rounded-full text-sm text-foreground">
                {movie.quality}
              </span>
              {movie.language?.map(lang => (
                <span key={lang} className="px-3 py-1 bg-muted rounded-full text-sm text-foreground">
                  {lang}
                </span>
              ))}
            </div>

            {/* Description */}
            <p className="text-foreground/80 max-w-2xl">
              {movie.description}
            </p>
          </div>
        </div>
      </section>

      {/* Tabs */}
      <section className="container mx-auto px-4 py-8">
        <Tabs defaultValue={movie.type === 'series' ? "episodes" : "details"} className="w-full">
          <TabsList className="bg-muted/50 mb-6">
            {movie.type === 'series' && <TabsTrigger value="episodes">Серии</TabsTrigger>}
            <TabsTrigger value="details">Детали</TabsTrigger>
            <TabsTrigger value="similar">Похожие</TabsTrigger>
          </TabsList>

          {movie.type === 'series' && (
            <TabsContent value="episodes">
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-foreground mb-4">Сезон 1</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {Array.from({ length: 8 }).map((_, index) => (
                    <Link
                      key={index}
                      to={`/watch/${movie.id}?season=1&episode=${index + 1}`}
                      className="group relative aspect-video rounded-lg overflow-hidden bg-muted"
                    >
                      <img
                        src={movie.image}
                        alt={`Серия ${index + 1}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          if (movie.poster && target.src !== movie.poster) target.src = movie.poster;
                        }}
                      />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Play className="w-8 h-8 text-white" />
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
                        <span className="text-white text-sm">Серия {index + 1}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </TabsContent>
          )}

          <TabsContent value="details">
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-4">О сериале</h3>
                <p className="text-muted-foreground mb-6">{movie.description}</p>

                <div className="space-y-3">
                  <div className="flex gap-4">
                    <span className="text-muted-foreground w-32">Жанр:</span>
                    <span className="text-foreground">{movie.genres?.join(", ")}</span>
                  </div>
                  <div className="flex gap-4">
                    <span className="text-muted-foreground w-32">Год:</span>
                    <span className="text-foreground">{movie.year}</span>
                  </div>
                  <div className="flex gap-4">
                    <span className="text-muted-foreground w-32">Страна:</span>
                    <span className="text-foreground">{movie.country}</span>
                  </div>
                  <div className="flex gap-4">
                    <span className="text-muted-foreground w-32">Длительность:</span>
                    <span className="text-foreground">{movie.duration}</span>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="similar">
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {popularMovies.map((m) => (
                <MovieCard
                  key={m.id}
                  id={m.id}
                  title={m.title}
                  image={m.image}
                  logo={m.logo}
                  rating={m.rating}
                  type={m.type}
                  year={m.year}
                />
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </section>

      {/* Similar content */}
      <ContentRow title="Вам также понравится">
        {[...popularMovies, ...freeMovies.slice(0, 2)].map((m, index) => (
          <MovieCard
            key={`similar-${m.id}-${index}`}
            id={m.id}
            title={m.title}
            image={m.image}
            logo={m.logo}
            rating={m.rating}
            type={m.type}
            year={m.year}
          />
        ))}
      </ContentRow>
    </Layout>
  );
};

export default MovieDetailPage;
