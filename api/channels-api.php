<?php
/**
 * Proxy для получения списка ТВ каналов из админ-панели ANT-TV
 */
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');

set_time_limit(120);

$baseUrl = 'http://ant-tv.ddns.net:2223';
$streamBaseUrl = 'http://ant-tv.ddns.net';
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

// 3. Получаем список каналов
$opts = [
    'http' => [
        'method' => 'GET',
        'header' => ["Cookie: $cookie","User-Agent: Mozilla/5.0"]
    ]
];
$context = stream_context_create($opts);
$html = @file_get_contents($baseUrl.'/channels', false, $context);

if (!$html) {
    echo json_encode(['error'=>'Не удалось получить список каналов']);
    exit;
}

$dom   = new DOMDocument(); @$dom->loadHTML($html);
$xpath = new DOMXPath($dom);
// Ищем ссылки на редактирование канала
$links = $xpath->query("//a[contains(@href,'page=edit_channel') and contains(@href,'id=')]");

$ids = [];
foreach ($links as $l){
    $href = $l->getAttribute('href');
    if (preg_match('/id=(\d+)/',$href,$m)) {
        $ids[] = (int)$m[1];
    }
}
$ids = array_unique($ids);

// 4. Проходим по каждому ID и собираем данные
$channels = [];
foreach ($ids as $id){
    $editHtml = @file_get_contents("$baseUrl/channels?page=edit_channel&id=$id", false, $context);
    if (!$editHtml) continue;

    $doc = new DOMDocument(); @$doc->loadHTML($editHtml);
    $xp  = new DOMXPath($doc);
    
    $getAttr = function($q, $attr) use ($xp){
        $node = $xp->query($q)->item(0);
        return $node ? trim($node->getAttribute($attr)) : '';
    };

    $name         = $getAttr("//input[@id='name']", 'value');
    if (!$name) $name = $getAttr("//input[@name='name']", 'value');
    
    $channel_name = $getAttr("//input[@id='channel_name']", 'value');
    if (!$channel_name) $channel_name = $getAttr("//input[@name='channel_name']", 'value');

    // Если channel_name есть, строим URL
    $url = $channel_name ? "$streamBaseUrl/$channel_name/index.m3u8" : "";

    $channels[] = [
        'id'          => $id,
        'title'       => $name ?: "Канал ID $id",
        'logo'        => "$baseUrl/img/channel_logo/{$id}.png",
        'streamUrl'   => $url,
        'category'    => 'ТВ Каналы' // Можно спарсить из селекта если нужно
    ];
}

echo json_encode($channels, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
