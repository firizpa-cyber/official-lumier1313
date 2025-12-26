<?php
/**
 * HLS File Browser Loader
 * Загружает HLS видео из структуры file-browser
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

// Получаем параметры
$lun = $_GET['lun'] ?? '';
$path = $_GET['path'] ?? '';
$action = $_GET['action'] ?? 'info';

if (empty($lun) || empty($path)) {
    echo json_encode(['error' => 'LUN и путь обязательны']);
    exit;
}

// Базовые URL
$baseBrowserUrl = "http://ant-tv.ddns.net:2223/file-browser.php";
$baseHlsUrl = "http://ant-tv.ddns.net/vod/hls";

/**
 * Получить содержимое директории
 */
function getDirectory($lun, $path) {
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

/**
 * Парсить ссылки из HTML
 */
function parseLinks($html) {
    $links = [];
    preg_match_all('/<a[^>]+href="([^"]+)"[^>]*>([^<]+)<\/a>/i', $html, $matches);
    
    for ($i = 0; $i < count($matches[1]); $i++) {
        $text = trim($matches[2][$i]);
        
        // Пропускаем навигацию
        if (in_array($text, ['LUN1', '..', 'Parent Directory'])) continue;
        
        $links[] = [
            'href' => $matches[1][$i],
            'name' => $text
        ];
    }
    
    return $links;
}

/**
 * Найти профили качества
 */
function findProfiles($lun, $path) {
    $html = getDirectory($lun, $path);
    $items = parseLinks($html);
    
    $profiles = [];
    foreach ($items as $item) {
        $name = $item['name'];
        
        // Ищем profile_X_YYYp
        if (preg_match('/profile_(\d+)_(\d+)p/', $name, $matches)) {
            $profiles[] = [
                'name' => $name,
                'number' => (int)$matches[1],
                'resolution' => (int)$matches[2],
                'height' => (int)$matches[2]
            ];
        }
    }
    
    // Сорт ируем по номеру
    usort($profiles, function($a, $b) {
        return $a['number'] - $b['number'];
    });
    
    return $profiles;
}

/**
 * Создать мастер плейлист
 */
function createMasterPlaylist($lun, $path, $profiles) {
    global $baseHlsUrl;
    
    $m3u8 = "#EXTM3U\n";
    $m3u8 .= "#EXT-X-VERSION:3\n\n";
    
    foreach ($profiles as $profile) {
        $resolutionStr = "{$profile['resolution']}p";
        $width = round($profile['height'] * 16 / 9);  // Примерное соотношение 16:9
        $bitrate = estimateBitrate($profile['height']);
        
        $profilePath = "$path/{$profile['name']}";
        $playlistUrl = "$baseHlsUrl/$lun/$profilePath/playlist.m3u8";
        
        $m3u8 .= "#EXT-X-STREAM-INF:BANDWIDTH=$bitrate,RESOLUTION={$width}x{$profile['height']},NAME=\"$resolutionStr\"\n";
        $m3u8 .= "$playlistUrl\n\n";
    }
    
    return $m3u8;
}

/**
 * Примерный расчёт битрейта
 */
function estimateBitrate($height) {
    $bitrates = [
        360 => 800000,
        480 => 1400000,
        720 => 2800000,
        1080 => 5000000
    ];
    
    return $bitrates[$height] ?? 1000000;
}

// Основная логика
switch ($action) {
    case 'info':
        // Получить информацию о видео
        $profiles = findProfiles($lun, $path);
        
        if (empty($profiles)) {
            echo json_encode(['error' => 'Профили не найдены']);
            exit;
        }
        
        $result = [
            'success' => true,
            'lun' => $lun,
            'path' => $path,
            'profiles' => $profiles,
            'masterUrl' => "?action=master&lun=$lun&path=" . urlencode($path)
        ];
        
        echo json_encode($result, JSON_PRETTY_PRINT);
        break;
        
    case 'master':
        // Сгенерировать master.m3u8
        $profiles = findProfiles($lun, $path);
        
        if (empty($profiles)) {
            header('HTTP/1.1 404 Not Found');
            echo "# Error: No profiles found\n";
            exit;
        }
        
        header('Content-Type: application/vnd.apple.mpegurl');
        echo createMasterPlaylist($lun, $path, $profiles);
        break;
        
    default:
        echo json_encode(['error' => 'Неизвестное действие']);
}
?>
