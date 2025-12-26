import fullData from "../data/full-data.json";
import { filterWorkingMovies, getBrokenMoviesCount } from "./movie-filter";

const allRawMovies = fullData.movies || [];

console.log("=== Статистика фильтрации фильмов с ошибками 404 ===\n");
console.log(`Всего фильмов в базе: ${allRawMovies.length}`);

const workingMovies = filterWorkingMovies(allRawMovies);
const brokenCount = getBrokenMoviesCount(allRawMovies);

console.log(`Рабочих фильмов: ${workingMovies.length}`);
console.log(`Нерабочих фильмов (отфильтровано): ${brokenCount}`);
console.log(`Процент доступности: ${((workingMovies.length / allRawMovies.length) * 100).toFixed(1)}%\n`);

console.log("=== Список отфильтрованных фильмов ===");
allRawMovies.forEach((movie) => {
    const movieId = movie.id.toString();
    if (!workingMovies.find(m => m.id.toString() === movieId)) {
        console.log(`- ID ${movie.id}: "${movie.title}" (${movie.year || 'N/A'})`);
        console.log(`  URL: ${movie.streamUrl}`);
    }
});
