/**
 * Утилита для фильтрации и валидации фильмов
 * Исключает фильмы с известными нерабочими ссылками
 */

// Известные нерабочие пути на ant-tv.ddns.net
const BROKEN_PATHS = [
    '/000new/babuli/',
    '/000new/belosnejka/',
    '/000new/artek.skvoz.stoletia/',
    '/000new/abbadstvo.daunton/',
    '/000new/Bez.pravil/',
    '/Gladiator.2.2024.BDRip.1080p/'
];

// Известные нерабочие ID фильмов (обновится автоматически)
const BROKEN_MOVIE_IDS = new Set([
    '261', // Бабули
    '259', // Белоснежка  
    '258', // Артек. Сквозь столетия
    '257', // Аббатство Даунтон 3
    '256', // Без правил
    '210', // Гладиатор 2
]);

/**
 * Проверяет, является ли URL фильма нерабочим
 */
export function isMovieUrlBroken(streamUrl?: string): boolean {
    if (!streamUrl) return true;

    // Проверяем известные нерабочие пути
    return BROKEN_PATHS.some(path => streamUrl.includes(path));
}

/**
 * Проверяет, является ли фильм нерабочим по ID
 */
export function isMovieBroken(id: string): boolean {
    return BROKEN_MOVIE_IDS.has(id);
}

/**
 * Фильтрует массив фильмов, удаляя нерабочие
 */
export function filterWorkingMovies<T extends { id: number | string; streamUrl?: string }>(movies: T[]): T[] {
    return movies.filter(movie => {
        const movieId = movie.id.toString();

        // Пропускаем фильмы без streamUrl
        if (!movie.streamUrl) return false;

        // Пропускаем фильмы с нерабочими ID
        if (isMovieBroken(movieId)) return false;

        // Пропускаем фильмы с нерабочими URL
        if (isMovieUrlBroken(movie.streamUrl)) return false;

        return true;
    });
}

/**
 * Получает количество нерабочих фильмов
 */
export function getBrokenMoviesCount<T extends { id: number | string; streamUrl?: string }>(movies: T[]): number {
    return movies.length - filterWorkingMovies(movies).length;
}
