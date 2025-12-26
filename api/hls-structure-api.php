<?php
/**
 * HLS Structure Parser API
 * Парсит структуру file-browser и находит master.m3u8, аудио-дорожки и субтитры
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

// Получаем параметры
$lun = $_GET['lun'] ?? 'lun1';
$path = $_GET['path'] ?? '';

if (empty($path)) {
    echo json_encode(['error' => 'Path is required']);
    exit;
}

// Базовый URL для file-browser
$baseBrowserUrl = "http://ant-tv.ddns.net:2223/file-browser.php";
$baseHlsUrl = "http://ant-tv.ddns.net/vod/hls";

// Функция для получения содержимого директории
function getDirectoryContents($lun, $path) {
    global $baseBrowserUrl;
    $url = "$baseBrowserUrl?lun=$lun&path=" . urlencode($path);
    
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 10);
    $html = curl_exec($ch);
    curl_close($ch);
    
    return $html;
}

// Функция для парсинга ссылок из HTML
function parseLinks($html) {
    $links = [];
    preg_match_all('/<a[^>]+href="([^"]+)"[^>]*>([^<]+)<\/a>/i', $html, $matches);
    
    for ($i = 0; $i < count($matches[1]); $i++) {
        $href = $matches[1][$i];
        $text = trim($matches[2][$i]);
        
        // Пропускаем навигационные ссылки
        if ($text === 'LUN1' || $text === '..') continue;
        
        $links[] = [
            'href' => $href,
            'name' => $text
        ];
    }
    
    return $links;
}

// Получаем содержимое основной директории
$html = getDirectoryContents($lun, $path);
$items = parseLinks($html);

// Ищем профили качества и другие папки
$profiles = [];
$subtitlesPath = null;

foreach ($items as $item) {
    $name = $item['name'];
    
    // Профили качества
    if (preg_match('/profile_(\d+)_(\d+)p/', $name, $matches)) {
        $profileNum = $matches[1];
        $resolution = $matches[2];
        $profiles[] = [
            'name' => $name,
            'number' => (int)$profileNum,
            'resolution' => (int)$resolution,
            'path' => $path . '/' . $name
        ];
    }
    
    // Папка субтитров
    if (strtolower($name) === 'subtitles') {
        $subtitlesPath = $path . '/subtitles';
    }
}

// Сортируем профили по номеру
usort($profiles, function($a, $b) {
    return $a['number'] - $b['number'];
});

// Формируем результат
$result = [
    'success' => true,
    'path' => $path,
    'lun' => $lun,
    'profiles' => [],
    'audioTracks' => [],
    'subtitles' => []
];

// Для каждого профиля создаем URL к master.m3u8
foreach ($profiles as $profile) {
    $masterUrl = "$baseHlsUrl/$lun/" . $profile['path'] . "/master.m3u8";
    
    $result['profiles'][] = [
        'name' => "{$profile['resolution']}p",
        'resolution' => $profile['resolution'],
        'number' => $profile['number'],
        'masterUrl' => $masterUrl,
        'profilePath' => $profile['path']
    ];
}

// Если есть папка субтитров, получаем их список
if ($subtitlesPath) {
    $subtitlesHtml = getDirectoryContents($lun, $subtitlesPath);
    $subtitleLinks = parseLinks($subtitlesHtml);
    
    foreach ($subtitleLinks as $link) {
        $name = $link['name'];
        
        // Ищем .vtt или .srt файлы
        if (preg_match('/\.(vtt|srt)$/i', $name, $matches)) {
            $ext = $matches[1];
            
            // Определяем язык из имени файла
            $lang = 'unknown';
            $label = $name;
            
            if (preg_match('/(russian|rus|ru)/i', $name)) {
                $lang = 'ru';
                $label = 'Русский';
            } elseif (preg_match('/(english|eng|en)/i', $name)) {
                $lang = 'en';
                $label = 'English';
            }
            
            $subtitleUrl = "$baseHlsUrl/$lun/$subtitlesPath/$name";
            
            $result['subtitles'][] = [
                'lang' => $lang,
                'label' => $label,
                'src' => $subtitleUrl,
                'kind' => 'subtitles'
            ];
        }
    }
}

// Определяем основной master.m3u8 (берём самый высокий профиль)
if (!empty($result['profiles'])) {
    $highestProfile = end($result['profiles']);
    $result['masterUrl'] = $highestProfile['masterUrl'];
}

echo json_encode($result, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
