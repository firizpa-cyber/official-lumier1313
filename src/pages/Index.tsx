import { Layout } from "@/components/layout/Layout";
import { HeroCarousel } from "@/components/hero/HeroCarousel";
import { ContentRow } from "@/components/content/ContentRow";
import { MovieCard } from "@/components/cards/MovieCard";
import { heroSlides, popularMovies, freeMovies } from "@/data/movies";

const Index = () => {
  return (
    <Layout>
      {/* SEO */}
      <title>Lumiere - Смотрите фильмы и сериалы онлайн</title>
      <meta name="description" content="Смотрите фильмы, сериалы, мультфильмы и ТВ-каналы онлайн в отличном качестве на любых устройствах." />

      {/* Hero carousel */}
      <HeroCarousel slides={heroSlides} />

      {/* Popular for you */}
      <ContentRow title="Популярное для вас" showAllLink="/popular">
        {popularMovies.map((movie) => (
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

      {/* Free movies */}
      <ContentRow title="Бесплатные" showAllLink="/free">
        {freeMovies.map((movie) => (
          <MovieCard
            key={movie.id}
            id={movie.id}
            title={movie.title}
            image={movie.image}
            rating={movie.rating}
            type={movie.type}
            year={movie.year}
          />
        ))}
      </ContentRow>

      {/* More popular */}
      <ContentRow title="Сериалы недели">
        {[...popularMovies].reverse().map((movie) => (
          <MovieCard
            key={`week-${movie.id}`}
            id={movie.id}
            title={movie.title}
            image={movie.image}
            rating={movie.rating}
            type="series"
            year={movie.year}
          />
        ))}
      </ContentRow>

      {/* New releases */}
      <ContentRow title="Новинки">
        {[...freeMovies, ...popularMovies.slice(0, 2)].map((movie, index) => (
          <MovieCard
            key={`new-${movie.id}-${index}`}
            id={movie.id}
            title={movie.title}
            image={movie.image}
            rating={movie.rating}
            type={index % 2 === 0 ? "premiere" : movie.type}
            year={movie.year}
          />
        ))}
      </ContentRow>
    </Layout>
  );
};

export default Index;
