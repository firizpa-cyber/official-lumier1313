<?php
// debug_parsing.php - Сохраняет HTML страницы редактирования для анализа

$baseUrl = 'http://ant-tv.ddns.net:2223';
$login = 'admin';
$password = 'content';

// 1. Авторизация
$opts = [
    'http' => [
        'method' => 'POST',
        'header' => ['Content-Type: application/x-www-form-urlencoded'],
        'content' => http_build_query(['login' => $login, 'password' => $password])
    ]
];
$context = stream_context_create($opts);
file_get_contents($baseUrl, false, $context);

// Получаем cookie
$headers = http_get_last_response_headers();
$cookie = '';
foreach ($headers as $h) {
    if (preg_match('/PHPSESSID=([^;]+)/', $h, $m)) {
        $cookie = 'PHPSESSID=' . $m[1];
        break;
    }
}

// 2. Загружаем страницу редактирования ID 249
$opts = [
    'http' => [
        'method' => 'GET',
        'header' => "Cookie: $cookie"
    ]
];
$context = stream_context_create($opts);
$html = file_get_contents("$baseUrl/content?page=edit_film&id=249", false, $context);

// Сохраняем в файл для проверки
file_put_contents('debug_page_249.html', $html);

echo "HTML saved to debug_page_249.html. Size: " . strlen($html) . " bytes.\n";
?>
