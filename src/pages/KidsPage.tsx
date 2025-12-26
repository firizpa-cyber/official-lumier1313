import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { ContentRow } from "@/components/content/ContentRow";
import { MovieCard } from "@/components/cards/MovieCard";
import { kidsMovies, popularMovies, kids0Plus, kids6Plus, kids12Plus } from "@/data/movies";
import heroKids from "@/assets/hero-kids.jpg";
import { Play, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const KidsPage = () => {
  const [bannerFailed, setBannerFailed] = useState(false);
  const heroMovie = kidsMovies[0]; // Assume first kids movie for hero data
  return (
    <Layout>
      {/* Hero section */}
      <section className="relative h-[500px] md:h-[550px] overflow-hidden">
        <img
          src={bannerFailed ? (heroMovie?.logo || heroKids) : heroKids}
          alt="Kids Hero"
          className="w-full h-full object-cover"
          onError={() => setBannerFailed(true)}
        />
        <div className="absolute inset-0 hero-overlay" />
        <div className="absolute inset-0 hero-overlay-bottom" />

        <div className="absolute inset-0 container mx-auto px-4 flex items-center">
          <div className="max-w-xl">
            <span className="badge-premiere mb-4 inline-block">Премьера</span>

            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">
              Лунтик и его друзья
            </h1>

            <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground mb-4">
              <span>1ч 56 минут</span>
              <span>•</span>
              <span>2003</span>
              <span>•</span>
              <span>Великобритания</span>
            </div>

            <p className="text-foreground/80 text-sm md:text-base mb-6 line-clamp-4">
              «Лунтик и его друзья» — российский многосерийный мультсериал, созданный студией «Меломаньяк».
              В оcьмилетний Кевин остаётся один в большом доме после того, как его родители в спешке забывают взять его с собой в отпуск.
            </p>

            <div className="flex items-center gap-3">
              <Link to="/watch/kids-1">
                <Button className="bg-gradient-primary hover:opacity-90 gap-2 px-6">
                  <Play className="w-5 h-5 fill-current" />
                  Смотреть
                </Button>
              </Link>
              <Link to="/movie/kids-1">
                <Button variant="outline" className="border-foreground/30 hover:bg-foreground/10 gap-2">
                  <Info className="w-5 h-5" />
                  Подробнее
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 0+ Category */}
      {kids0Plus.length > 0 && (
        <ContentRow title="Для самых маленьких (0+)">
          {kids0Plus.map((movie) => (
            <MovieCard
              key={`kids0-${movie.id}`}
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
      )}

      {/* 6+ Category */}
      {kids6Plus.length > 0 && (
        <ContentRow title="Для детей постарше (6+)">
          {kids6Plus.map((movie) => (
            <MovieCard
              key={`kids6-${movie.id}`}
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
      )}

      {/* 12+ Category */}
      {kids12Plus.length > 0 && (
        <ContentRow title="Для всей семьи (12+)">
          {kids12Plus.map((movie) => (
            <MovieCard
              key={`kids12-${movie.id}`}
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
      )}
    </Layout>
  );
};

export default KidsPage;
