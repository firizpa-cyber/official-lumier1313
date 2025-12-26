<?php
/**
 * Скрипт для автоматического извлечения всех фильмов из админ-панели
 * и обновления content-api.php
 */

// Данные для авторизации
$baseUrl = 'http://ant-tv.ddns.net:2223';
$login = 'admin';
$password = 'content';

echo "🔐 Авторизация...\n";

// 1. Авторизуемся
$opts = [
    'http' => [
        'method' => 'POST',
        'header' => [
            'Content-Type: application/x-www-form-urlencoded',
            'User-Agent: Mozilla/5.0'
        ],
        'content' => http_build_query(['login' => $login, 'password' => $password]),
        'follow_location' => 0,
        'ignore_errors' => true
    ]
];

$context = stream_context_create($opts);
$response = @file_get_contents($baseUrl, false, $context);

// Получаем cookie из заголовков (используем новую функцию)
$headers = http_get_last_response_headers();
$cookie = '';

if ($headers) {
    foreach ($headers as $header) {
        if (stripos($header, 'Set-Cookie:') !== false) {
            if (preg_match('/PHPSESSID=([^;]+)/', $header, $matches)) {
                $cookie = 'PHPSESSID=' . $matches[1];
                break;
            }
        }
    }
}

if (!$cookie) {
    die("❌ Не удалось получить cookie авторизации\n");
}

echo "✅ Cookie получен: $cookie\n";

// 2. Попробуем авторизоваться через форму логина
echo "🔐 Отправка данных авторизации...\n";

$opts = [
    'http' => [
        'method' => 'POST',
        'header' => [
            "Cookie: $cookie\r\n",
            "Content-Type: application/x-www-form-urlencoded\r\n",
            "User-Agent: Mozilla/5.0"
        ],
        'content' => http_build_query(['login' => $login, 'password' => $password]),
        'follow_location' => 0,
        'ignore_errors' => true
    ]
];

$context = stream_context_create($opts);
$response = @file_get_contents($baseUrl, false, $context);

echo "✅ Авторизация отправлена\n";
echo "📥 Получение списка фильмов...\n";

// 3. Получаем страницу с контентом
$opts = [
    'http' => [
        'method' => 'GET',
        'header' => [
            "Cookie: $cookie",
            'User-Agent: Mozilla/5.0'
        ]
    ]
];

$context = stream_context_create($opts);
$html = @file_get_contents($baseUrl . '/content', false, $context);

if (!$html || strpos($html, 'name="login"') !== false) {
    die("❌ Не удалось получить список контента (возможно, неверные учетные данные)\n");
}

// 3. Парсим HTML для извлечения ID фильмов
$dom = new DOMDocument();
@$dom->loadHTML($html);
$xpath = new DOMXPath($dom);

// Ищем все ссылки на редактирование фильмов
$links = $xpath->query("//a[contains(@href, 'page=edit_film') and contains(@href, 'id=')]");

$movieIds = [];
foreach ($links as $link) {
    $href = $link->getAttribute('href');
    if (preg_match('/id=(\d+)/', $href, $matches)) {
        $movieIds[] = (int)$matches[1];
    }
}

$movieIds = array_unique($movieIds);
sort($movieIds);

echo "📊 Найдено фильмов: " . count($movieIds) . "\n";

if (count($movieIds) === 0) {
    die("❌ Не найдено ни одного фильма. Проверьте структуру страницы.\n");
}

// 4. Получаем информацию о каждом фильме
$moviesData = [];
$processed = 0;

foreach ($movieIds as $id) {
    $processed++;
    echo "  [$processed/" . count($movieIds) . "] Загрузка фильма ID: $id... ";
    
    $opts = [
        'http' => [
            'method' => 'GET',
            'header' => [
                "Cookie: $cookie",
                'User-Agent: Mozilla/5.0'
            ]
        ]
    ];
    
    $context = stream_context_create($opts);
    $movieHtml = @file_get_contents($baseUrl . "/content?page=edit_film&id=" . $id, false, $context);
    
    if (!$movieHtml) {
        echo "❌ Ошибка\n";
        continue;
    }
    
    $movieDom = new DOMDocument();
    @$movieDom->loadHTML($movieHtml);
    $movieXpath = new DOMXPath($movieDom);
    
    // Функция для извлечения значения
    $getValue = function($query) use ($movieXpath) {
        $node = $movieXpath->query($query)->item(0);
        return $node ? trim($node->nodeValue) : '';
    };
    
    // Извлекаем данные
    $title = $getValue("//input[@name='title']/@value");
    
    if (!$title) {
        echo "⚠️ Пропущен (нет названия)\n";
        continue;
    }
    
    $year = $getValue("//input[@name='year']/@value");
    $duration = $getValue("//input[@name='duration']/@value");
    $rating = $getValue("//input[@name='rating']/@value");
    $age = $getValue("//input[@name='age']/@value");
    $country = $getValue("//input[@name='country']/@value");
    $streamUrl = $getValue("//input[@name='stream_url']/@value");
    $trailerUrl = $getValue("//input[@name='trailer_url']/@value");
    $description = $getValue("//textarea[@name='description']");
    
    // Генерируем slug из ID и названия
    $slug = transliterate($title) . '_' . $id;
    
    $moviesData[$slug] = [
        'id' => $id,
        'title' => $title,
        'year' => $year ? (int)$year : null,
        'duration' => $duration ? (int)$duration : null,
        'rating' => $rating ?: null,
        'age' => $age ?: '',
        'country' => $country ?: '',
        'language' => ['Русский'],  // По умолчанию
        'description' => $description ?: '',
        'streamUrl' => $streamUrl ?: '',
        'trailerUrl' => $trailerUrl ?: '',
        'logo' => $baseUrl . "/img/logos/{$id}.jpg",
        'poster' => $baseUrl . "/img/posters/{$id}.jpg",
        'banner' => $baseUrl . "/img/banners/{$id}.jpg"
    ];
    
    echo "✅ $title\n";
    
    // Небольшая задержка чтобы не перегружать сервер
    usleep(100000); // 0.1 секунды
}

echo "\n✅ Загружено фильмов: " . count($moviesData) . "\n";

// 5. Генерируем PHP код для content-api.php
echo "💾 Генерация файла content-api.php...\n";

$phpCode = "<?php\n";
$phpCode .= "/**\n";
$phpCode .= " * Content API - Получение информации о фильмах\n";
$phpCode .= " * Автоматически обновлено: " . date('Y-m-d H:i:s') . "\n";
$phpCode .= " * Всего фильмов: " . count($moviesData) . "\n";
$phpCode .= " */\n\n";
$phpCode .= "header('Content-Type: application/json; charset=utf-8');\n";
$phpCode .= "header('Access-Control-Allow-Origin: *');\n\n";
$phpCode .= "// База данных фильмов с их ID в системе управления\n";
$phpCode .= "\$moviesDatabase = [\n";

foreach ($moviesData as $slug => $movie) {
    $phpCode .= "    '$slug' => [\n";
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

// 6. Сохраняем обновленный файл
file_put_contents(__DIR__ . '/content-api.php', $phpCode);

echo "✅ Файл content-api.php успешно обновлен!\n";
echo "🎬 Всего фильмов в базе: " . count($moviesData) . "\n";
echo "\n🚀 Теперь обновите страницу diagnostic.html чтобы увидеть все фильмы!\n";

// Функция транслитерации для создания slug
function transliterate($string) {
    $converter = [
        'а' => 'a', 'б' => 'b', 'в' => 'v', 'г' => 'g', 'д' => 'd',
        'е' => 'e', 'ё' => 'e', 'ж' => 'zh', 'з' => 'z', 'и' => 'i',
        'й' => 'y', 'к' => 'k', 'л' => 'l', 'м' => 'm', 'н' => 'n',
        'о' => 'o', 'п' => 'p', 'р' => 'r', 'с' => 's', 'т' => 't',
        'у' => 'u', 'ф' => 'f', 'х' => 'h', 'ц' => 'c', 'ч' => 'ch',
        'ш' => 'sh', 'щ' => 'sch', 'ь' => '', 'ы' => 'y', 'ъ' => '',
        'э' => 'e', 'ю' => 'yu', 'я' => 'ya',
    ];
    
    $string = mb_strtolower($string);
    $string = strtr($string, $converter);
    $string = preg_replace('/[^-a-z0-9_]+/', '_', $string);
    $string = preg_replace('/[-_]+/', '_', $string);
    $string = trim($string, '_');
    
    return $string;
}
?>
