import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { ContentRow } from "@/components/content/ContentRow";
import { MovieCard } from "@/components/cards/MovieCard";
import { freeMovies, popularMovies, heroSlides } from "@/data/movies";
import { Play, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const FreePage = () => {
  const heroMovie = heroSlides[1];
  const [logoFailed, setLogoFailed] = useState(false);
  const [bannerFailed, setBannerFailed] = useState(false);

  return (
    <Layout>
      {/* Hero section */}
      <section className="relative h-[500px] md:h-[550px] overflow-hidden">
        <img
          src={bannerFailed ? (heroMovie.logo || heroMovie.image) : heroMovie.image}
          alt={heroMovie.title}
          className="w-full h-full object-cover"
          onError={() => setBannerFailed(true)}
        />
        <div className="absolute inset-0 hero-overlay" />
        <div className="absolute inset-0 hero-overlay-bottom" />

        <div className="absolute inset-0 container mx-auto px-4 flex items-center">
          <div className="max-w-xl">
            <span className="badge-premiere mb-4 inline-block">Премьера</span>

            {heroMovie.logo && !logoFailed ? (
              <img
                src={heroMovie.logo}
                alt={heroMovie.title}
                className="max-h-24 md:max-h-32 mb-6 object-contain drop-shadow-[0_8px_24px_rgba(0,0,0,0.5)]"
                onError={() => setLogoFailed(true)}
              />
            ) : (
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">
                {heroMovie.title}
              </h1>
            )}

            <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground mb-4">
              <span className="rating-badge">{heroMovie.rating}</span>
              <span>{heroMovie.duration}</span>
              <span>•</span>
              <span>{heroMovie.year}</span>
              <span>•</span>
              <span>{heroMovie.country}</span>
            </div>

            <p className="text-foreground/80 text-sm md:text-base mb-6 line-clamp-4">
              {heroMovie.description}
            </p>

            <div className="flex items-center gap-3">
              <Link to={`/watch/${heroMovie.id}`}>
                <Button className="bg-gradient-primary hover:opacity-90 gap-2 px-6">
                  <Play className="w-5 h-5 fill-current" />
                  Смотреть бесплатно
                </Button>
              </Link>
              <Link to={`/movie/${heroMovie.id}`}>
                <Button variant="outline" className="border-foreground/30 hover:bg-foreground/10 gap-2">
                  <Info className="w-5 h-5" />
                  Подробнее
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* First episode free */}
      <ContentRow title="Первая серия бесплатно">
        {freeMovies.map((movie) => (
          <MovieCard
            key={movie.id}
            id={movie.id}
            title={movie.title}
            image={movie.image}
            logo={movie.logo}
            rating={movie.rating}
            type={movie.type}
            year={movie.year}
          />
        ))}
      </ContentRow>

      {/* Watch free */}
      <ContentRow title="Смотрите бесплатно">
        {[...popularMovies].reverse().map((movie) => (
          <MovieCard
            key={`free-${movie.id}`}
            id={movie.id}
            title={movie.title}
            image={movie.image}
            logo={movie.logo}
            rating={movie.rating}
            type={movie.type}
            year={movie.year}
          />
        ))}
      </ContentRow>

      {/* Free films */}
      <ContentRow title="Бесплатные фильмы">
        {freeMovies.map((movie) => (
          <MovieCard
            key={`films-${movie.id}`}
            id={movie.id}
            title={movie.title}
            image={movie.image}
            rating={movie.rating}
            type="film"
            year={movie.year}
          />
        ))}
      </ContentRow>
    </Layout>
  );
};

export default FreePage;
