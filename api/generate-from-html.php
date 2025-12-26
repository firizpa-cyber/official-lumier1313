<?php
/**
 * Простой скрипт для извлечения всех фильмов из сохраненного HTML
 */

$htmlFile = __DIR__ . '/filebrowser.html';
$baseStreamUrl = 'http://ant-tv.ddns.net/vod/hls/lun4/KINOTK';
$baseImagesUrl = 'http://ant-tv.ddns.net:2223/uploads/films';

echo "📥 Чтение файла filebrowser.html...\n";

if (!file_exists($htmlFile)) {
    die("❌ Файл filebrowser.html не найден\n");
}

$html = file_get_contents($htmlFile);

// Извлекаем все data-name с помощью регулярного выражения
preg_match_all('/data-name="([^"]+)"/', $html, $matches);

$movieFolders = array_unique($matches[1]);
$movieFolders = array_filter($movieFolders, function($name) {
    return $name !== '..' && $name !== '.';
});
sort($movieFolders);

echo "📊 Найдено папок с фильмами: " . count($movieFolders) . "\n\n";

if (count($movieFolders) === 0) {
    die("❌ Не найдено ни одной папки\n");
}

// Генерируем базу данных
$moviesDatabase = [];

foreach ($movieFolders as $index => $folder) {
    echo "  [" . ($index + 1) . "/" . count($movieFolders) . "] $folder\n";
    
    // Получаем название фильма из имени папки
    $title = generateTitle($folder);
    
    // Пытаемся извлечь год из имени папки
    $year = null;
    if (preg_match('/(\d{4})/', $folder, $matches)) {
        $year = (int)$matches[1];
    }
    
    // Генерируем slug
    $slug = $folder;
    
    $moviesDatabase[$slug] = [
        'id' => null,
        'title' => $title,
        'year' => $year,
        'duration' => null,
        'rating' => null,
        'age' => '',
        'country' => '',
        'language' => ['Русский'],
        'description' => '',
        'streamUrl' => $baseStreamUrl . '/' . rawurlencode($folder) . '/master.m3u8',
        'trailerUrl' => '',
        'logo' => $baseImagesUrl . '/' . strtolower(str_replace(['.', ' ', '(', ')'], ['_', '_', '', ''], $folder)) . '/logo.jpg',
        'poster' => $baseImagesUrl . '/' . strtolower(str_replace(['.', ' ', '(', ')'], ['_', '_', '', ''], $folder)) . '/poster.jpg',
        'banner' => $baseImagesUrl . '/' . strtolower(str_replace(['.', ' ', '(', ')'], ['_', '_', '', ''], $folder)) . '/banner.jpg'
    ];
}

echo "\n✅ Обработано фильмов: " . count($moviesDatabase) . "\n";
echo "💾 Генерация файла content-api.php...\n";

// Генерируем PHP код
$phpCode = "<?php\n";
$phpCode .= "/**\n";
$phpCode .= " * Content API - Получение информации о фильмах\n";
$phpCode .= " * Автоматически сгенерировано: " . date('Y-m-d H:i:s') . "\n";
$phpCode .= " * Всего фильмов: " . count($moviesDatabase) . "\n";
$phpCode .= " */\n\n";
$phpCode .= "header('Content-Type: application/json; charset=utf-8');\n";
$phpCode .= "header('Access-Control-Allow-Origin: *');\n\n";
$phpCode .= "// База данных фильмов\n";
$phpCode .= "\$moviesDatabase = [\n";

foreach ($moviesDatabase as $slug => $movie) {
    $phpCode .= "    '" . addslashes($slug) . "' => [\n";
    foreach ($movie as $key => $value) {
        if (is_array($value)) {
            $phpCode .= "        '$key' => [" . implode(', ', array_map(function($v) {
                return "'" . addslashes($v) . "'";
            }, $value)) . "],\n";
        } elseif (is_null($value)) {
            $phpCode .= "        '$key' => null,\n";
        } elseif (is_int($value)) {
            $phpCode .= "        '$key' => $value,\n";
        } else {
            $phpCode .= "        '$key' => '" . addslashes($value) . "',\n";
        }
    }
    $phpCode .= "    ],\n";
}

$phpCode .= "];\n\n";
$phpCode .= "\$action = \$_GET['action'] ?? 'all';\n";
$phpCode .= "\$slug = \$_GET['slug'] ?? null;\n\n";
$phpCode .= "if (\$action === 'all') {\n";
$phpCode .= "    \$result = [];\n";
$phpCode .= "    foreach (\$moviesDatabase as \$key => \$movie) {\n";
$phpCode .= "        \$result[] = array_merge(['slug' => \$key], \$movie);\n";
$phpCode .= "    }\n";
$phpCode .= "    echo json_encode(\$result, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);\n";
$phpCode .= "} elseif (\$action === 'get' && \$slug) {\n";
$phpCode .= "    if (isset(\$moviesDatabase[\$slug])) {\n";
$phpCode .= "        \$movie = array_merge(['slug' => \$slug], \$moviesDatabase[\$slug]);\n";
$phpCode .= "        echo json_encode(\$movie, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);\n";
$phpCode .= "    } else {\n";
$phpCode .= "        http_response_code(404);\n";
$phpCode .= "        echo json_encode(['error' => 'Movie not found'], JSON_UNESCAPED_UNICODE);\n";
$phpCode .= "    }\n";
$phpCode .= "} else {\n";
$phpCode .= "    http_response_code(400);\n";
$phpCode .= "    echo json_encode(['error' => 'Invalid action'], JSON_UNESCAPED_UNICODE);\n";
$phpCode .= "}\n";

// Сохраняем файл
file_put_contents(__DIR__ . '/content-api.php', $phpCode);

echo "✅ Файл content-api.php успешно создан!\n";
echo "🎬 Всего фильмов в базе: " . count($moviesDatabase) . "\n";
echo "\n🚀 Обновите страницу diagnostic.html чтобы увидеть все фильмы!\n";

// Функция для генерации читаемого названия из имени папки
function generateTitle($folder) {
    // Убираем расширение года если есть
    $title = preg_replace('/\.\d{4}$/', '', $folder);
    
    // Заменяем точки и подчеркивания на пробелы
    $title = str_replace(['.', '_'], ' ', $title);
    
    // Убираем лишние пробелы
    $title = preg_replace('/\s+/', ' ', $title);
    
    // Первая буква заглавная
    $title = ucfirst(trim($title));
    
    return $title;
}
?>
