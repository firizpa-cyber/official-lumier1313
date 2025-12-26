import fullData from "./full-data.json";
import { filterWorkingMovies } from "@/lib/movie-filter";

export interface Movie {
  id: string;
  title: string;
  image: string;
  logo?: string;
  poster?: string;
  banner?: string;
  rating?: number;
  type: "film" | "series" | "premiere";
  year?: string;
  duration?: string;
  description?: string;
  genres?: string[];
  streamUrl?: string;
  ageRating?: string;
  language?: string[];
  country?: string;
  skipIntro?: number;
}

export interface HeroSlide {
  id: string;
  title: string;
  subtitle?: string;
  description?: string;
  image: string;
  logo?: string;
  poster?: string;
  banner?: string;
  type?: "film" | "series" | "premiere";
  rating?: number;
  year?: string;
  duration?: string;
  country?: string;
  streamUrl?: string;
}

// Transform the JSON data into the platform's format
const allRawMovies = fullData.movies || [];

const transformMovie = (m: any): Movie => ({
  id: m.id.toString(),
  title: m.title,
  image: m.banner || m.poster || "",
  logo: m.logo,
  poster: m.poster,
  banner: m.banner,
  rating: parseFloat(m.rating) || 0,
  type: m.title.toLowerCase().includes("сериал") ? "series" : "film",
  year: m.year,
  duration: m.duration ? `${m.duration} мин` : undefined,
  description: m.description,
  genres: m.categories && m.categories.length > 0 ? m.categories : ["Драма"],
  streamUrl: m.streamUrl,
  ageRating: m.age || "12+",
  language: m.language || ["Русский"],
  country: m.country || "Россия",
  skipIntro: m.skip_intro || m.skipIntro
});

export const allMovies: Movie[] = filterWorkingMovies(allRawMovies.map(transformMovie));


export const heroSlides: HeroSlide[] = filterWorkingMovies(
  allRawMovies.map(m => ({
    ...m,
    streamUrl: m.streamUrl
  }))
).slice(0, 5).map(m => ({
  id: m.id.toString(),
  title: m.title,
  subtitle: "Премьера",
  description: m.description,
  image: m.banner || m.poster || "",
  logo: m.logo,
  poster: m.poster,
  banner: m.banner,
  type: m.title.toLowerCase().includes("сериал") ? "series" : "premiere",
  rating: parseFloat(m.rating) || 0,
  year: m.year,
  duration: m.duration ? `${m.duration} мин` : undefined,
  country: "Россия",
  streamUrl: m.streamUrl
}));

export const popularMovies: Movie[] = filterWorkingMovies(
  allRawMovies
    .sort((a, b) => parseFloat(b.rating) - parseFloat(a.rating))
    .slice(0, 20) // Берем больше, чтобы после фильтрации осталось достаточно
    .map(transformMovie)
).slice(0, 12);

export const freeMovies: Movie[] = filterWorkingMovies(
  allRawMovies
    .slice(12, 36) // Берем больше для резерва
    .map(transformMovie)
).slice(0, 12);

export const kidsMovies: Movie[] = filterWorkingMovies(
  allRawMovies
    .map(transformMovie)
    .filter(m => {
      const isKidsContent = m.title.toLowerCase().includes("мульт") ||
        m.genres?.includes("Детский") ||
        m.genres?.includes("Мультфильм");
      const isAgeAppropriate = !m.ageRating || ["0+", "6+", "12+"].includes(m.ageRating);
      return isKidsContent && isAgeAppropriate;
    })
).slice(0, 12);

export const kids0Plus: Movie[] = filterWorkingMovies(
  allRawMovies
    .map(transformMovie)
    .filter(m => m.ageRating === "0+")
).slice(0, 12);

export const kids6Plus: Movie[] = filterWorkingMovies(
  allRawMovies
    .map(transformMovie)
    .filter(m => m.ageRating === "6+" || m.ageRating === "0+")
).slice(0, 12);

export const kids12Plus: Movie[] = filterWorkingMovies(
  allRawMovies
    .map(transformMovie)
    .filter(m => m.ageRating === "12+" || m.ageRating === "6+" || m.ageRating === "0+")
).slice(0, 12);

// Fallback if no specific kids movies found
if (kidsMovies.length === 0) {
  kidsMovies.push(...allRawMovies.slice(24, 36).map(transformMovie));
}

export interface TVChannel {
  id: string;
  name: string;
  logo: string;
  currentShow?: string;
  showTime?: string;
  progress?: number;
  timeRemaining?: string;
  ageRating?: string;
}

// In a real app, these would come from an API too
export const tvChannels: TVChannel[] = [
  {
    id: "tv1",
    name: "Первый канал",
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/23/Channel_One_Russia.svg/200px-Channel_One_Russia.svg.png",
    currentShow: "Новости",
    showTime: "00:00",
    progress: 45,
    timeRemaining: "13 минут осталось",
    ageRating: "12+",
  },
  {
    id: "tv2",
    name: "Россия 1",
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d7/Rossiya-1_Logo.svg/200px-Rossiya-1_Logo.svg.png",
    currentShow: "Утро России",
    showTime: "00:00",
    progress: 60,
    timeRemaining: "13 минут осталось",
    ageRating: "16+",
  },
  {
    id: "tv3",
    name: "НТВ",
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/22/NTV_logo.svg/200px-NTV_logo.svg.png",
    currentShow: "Название шоу",
    showTime: "00:00",
    progress: 30,
    timeRemaining: "13 минут осталось",
    ageRating: "18+",
  },
  {
    id: "tv4",
    name: "СТС",
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/45/CTC_logo_%282023%29.svg/200px-CTC_logo_%282023%29.svg.png",
    currentShow: "Сериал",
    showTime: "00:00",
    progress: 75,
    timeRemaining: "13 минут осталось",
    ageRating: "6+",
  },
];

export interface Collection {
  id: string;
  title: string;
  gradient: string;
  images?: string[];
}

export const collections: Collection[] = [
  { id: "films", title: "Фильмы", gradient: "collection-gradient-red" },
  { id: "series", title: "Сериалы", gradient: "collection-gradient-purple" },
  { id: "popular", title: "Популярное", gradient: "collection-gradient-blue" },
  { id: "kids", title: "Для детей", gradient: "collection-gradient-cyan" },
];

export interface SportMatch {
  id: string;
  league: string;
  homeTeam: string;
  awayTeam: string;
  homeLogo?: string;
  awayLogo?: string;
  time: string;
  isLive?: boolean;
}

export const sportMatches: SportMatch[] = [
  {
    id: "s1",
    league: "UEFA Champions League",
    homeTeam: "Матч ТВ",
    awayTeam: "LIVE",
    time: "Сейчас",
    isLive: true,
  }
];

// Helper to get movie by ID
export const getMovieById = (id: string): Movie | undefined => {
  const raw = allRawMovies.find(m => m.id.toString() === id);
  return raw ? transformMovie(raw) : undefined;
};
