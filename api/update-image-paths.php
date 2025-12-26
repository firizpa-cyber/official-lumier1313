<?php
/**
 * Скрипт для исправления путей к изображениям в content-api.php
 * Меняет /uploads/films/{slug}/ на /img/{type}/{id}.jpg
 * Где ID извлекается из конца slug-а после последнего "_"
 */

// Читаем content-api.php
$content = file_get_contents(__DIR__ . '/content-api.php');

// Парсим массив фильмов
preg_match('/\$moviesDatabase = \[(.*?)\];/s', $content, $matches);

if (!isset($matches[1])) {
    die("❌ Не удалось найти массив \$moviesDatabase\n");
}

$moviesArray = $matches[1];

// Заменяем каждый фильм
$newMoviesArray = preg_replace_callback(
    "/'([^']+)' => \[(.*?)\],\s*(?='|])/s",
    function($match) {
        $slug = $match[1];
        $movieData = $match[2];
        
        // Извлекаем ID из slug (последнее число после подчеркивания)
        // Например: "007koordinati_2012" -> не содержит ID
        // "chelovek_pauk_vdali_ot_doma_249" -> ID = 249
        
        // Пробуем извлечь ID из конца slug
        if (preg_match('/_(\d+)$/', $slug, $idMatch)) {
            $id = $idMatch[1];
        } else {
            // Если нет ID в slug, оставляем null
            $id = null;
        }
        
        // Обновляем ID
        if ($id !== null) {
            $movieData = preg_replace("/'id' => null/", "'id' => $id", $movieData);
            
            // Обновляем пути к изображениям
            $baseUrl = 'http://ant-tv.ddns.net:2223';
            $movieData = preg_replace(
                "/'logo' => '[^']+'/",
                "'logo' => '{$baseUrl}/img/logos/{$id}.jpg'",
                $movieData
            );
            $movieData = preg_replace(
                "/'poster' => '[^']+'/",
                "'poster' => '{$baseUrl}/img/posters/{$id}.jpg'",
                $movieData
            );
            $movieData = preg_replace(
                "/'banner' => '[^']+'/",
                "'banner' => '{$baseUrl}/img/banners/{$id}.jpg'",
                $movieData
            );
        }
        
        return "'{$slug}' => [\n{$movieData}],\n    ";
    },
    $moviesArray
);

// Собираем новый файл
$newContent = str_replace($moviesArray, $newMoviesArray, $content);

// Сохраняем
file_put_contents(__DIR__ . '/content-api.php', $newContent);

echo "✅ Пути к изображениям обновлены!\n";
echo "📝 ID извлечены из slug-ов фильмов\n";
echo "🎬 Логотипы теперь по пути: /img/logos/{ID}.jpg\n";
?>
