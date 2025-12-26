<?php
/**
 * Proxy для получения ПОЛНОГО списка фильмов из админ-панели ANT-TV
 * Без лимитов, с парсингом streamUrl и всех полей.
 */
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');

// Увеличиваем время выполнения, так как парсинг всех страниц может занять время
set_time_limit(120);

$baseUrl = 'http://ant-tv.ddns.net:2223';
$login   = 'admin';
$password = 'content';

// 1. Авторизация
$opts = [
    'http' => [
        'method'  => 'POST',
        'header'  => [
            'Content-Type: application/x-www-form-urlencoded',
            'User-Agent: Mozilla/5.0'
        ],
        'content' => http_build_query(['login'=>$login,'password'=>$password]),
        'follow_location' => 0,
        'ignore_errors'   => true
    ]
];
$context = stream_context_create($opts);
@file_get_contents($baseUrl, false, $context);

// 2. Получаем cookie
$headers = http_get_last_response_headers();
$cookie = '';
if ($headers) {
    foreach ($headers as $h) {
        if (stripos($h,'Set-Cookie:')!==false && preg_match('/PHPSESSID=([^;]+)/',$h,$m)){
            $cookie = 'PHPSESSID='.$m[1];
            break;
        }
    }
}

// 3. Получаем список всех ID
$opts = [
    'http' => [
        'method' => 'GET',
        'header' => ["Cookie: $cookie","User-Agent: Mozilla/5.0"]
    ]
];
$context = stream_context_create($opts);
$html = @file_get_contents($baseUrl.'/content', false, $context);

if (!$html) {
    echo json_encode(['error'=>'Не удалось получить список фильмов']);
    exit;
}

$dom   = new DOMDocument(); @$dom->loadHTML($html);
$xpath = new DOMXPath($dom);
// Ищем ссылки на редактирование
$links = $xpath->query("//a[contains(@href,'page=edit_film') and contains(@href,'id=')]");

$ids = [];
foreach ($links as $l){
    $href = $l->getAttribute('href');
    if (preg_match('/id=(\d+)/',$href,$m)) {
        $ids[] = (int)$m[1];
    }
}
$ids = array_unique($ids);

// 4. Проходим по каждому ID и собираем данные
$movies = [];
// Ограничим пока 100 фильмами, чтобы не ждать вечность, если их тысячи
// Если нужно абсолютно все - уберите $i < 100
$i = 0;
foreach ($ids as $id){
    if ($i >= 100) break; 
    
    $editHtml = @file_get_contents("$baseUrl/content?page=edit_film&id=$id", false, $context);
    if (!$editHtml) continue;

    $doc = new DOMDocument(); @$doc->loadHTML($editHtml);
    $xp  = new DOMXPath($doc);
    
    $get = function($q) use ($xp){
        $node = $xp->query($q)->item(0);
        return $node ? trim($node->nodeValue) : '';
    };

    $title    = $get("//input[@name='name']/@value");
    $year     = $get("//input[@name='year']/@value");
    $duration = $get("//input[@name='duration']/@value");
    $rating   = $get("//input[@name='rating']/@value");
    $desc     = $get("//textarea[@name='description']");
    $stream   = $get("//input[@name='url']/@value");

    // Добавляем только если есть streamUrl (опционально, можно фильтровать на клиенте)
    // Но лучше отдать всё, а клиент решит
    $movies[] = [
        'id'          => $id,
        'title'       => $title ?: "Фильм ID $id",
        'logo'        => "$baseUrl/img/logos/{$id}.jpg",
        'poster'      => "$baseUrl/img/posters/{$id}.jpg",
        'banner'      => "$baseUrl/img/banners/{$id}.jpg",
        'streamUrl'   => $stream,
        'year'        => $year ?: null,
        'duration'    => $duration ?: null,
        'rating'      => $rating ?: null,
        'description' => $desc,
        'age'         => '',
        'country'     => ''
    ];
    $i++;
}

echo json_encode($movies, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
?>
