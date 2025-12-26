import { useState, useEffect } from "react";
import { getBrokenMoviesCount } from "@/lib/movie-filter";
import fullData from "@/data/full-data.json";
import { AlertCircle, X } from "lucide-react";

export function FilteredMoviesNotice() {
    const [showNotice, setShowNotice] = useState(false);
    const [brokenCount, setBrokenCount] = useState(0);

    useEffect(() => {
        const allMovies = fullData.movies || [];
        const count = getBrokenMoviesCount(allMovies);
        setBrokenCount(count);

        // Показываем уведомление если есть недоступные фильмы
        if (count > 0) {
            setShowNotice(true);
        }
    }, []);

    if (!showNotice || brokenCount === 0) return null;

    return (
        <div className="fixed bottom-4 right-4 z-50 max-w-md">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 shadow-lg">
                <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                        <h4 className="font-semibold text-yellow-900 text-sm mb-1">
                            Контент временно недоступен
                        </h4>
                        <p className="text-yellow-800 text-xs">
                            {brokenCount} {brokenCount === 1 ? 'фильм' : 'фильма'} скрыт из каталога из-за проблем с источником видео.
                            Они будут автоматически восстановлены после устранения проблем.
                        </p>
                    </div>
                    <button
                        onClick={() => setShowNotice(false)}
                        className="text-yellow-600 hover:text-yellow-800 transition-colors"
                        aria-label="Закрыть"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}
