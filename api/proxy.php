<?php
// Simple CORS Proxy for HLS/DASH streams using file_get_contents
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: *");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$url = $_GET['url'] ?? '';

if (empty($url)) {
    http_response_code(400);
    echo "Missing URL parameter";
    exit;
}

// Validate URL
if (!filter_var($url, FILTER_VALIDATE_URL)) {
    http_response_code(400);
    echo "Invalid URL";
    exit;
}

// Use file_get_contents instead of curl
$context = stream_context_create([
    'http' => [
        'method' => 'GET',
        'header' => "User-Agent: Mozilla/5.0\r\n",
        'follow_location' => true,
        'ignore_errors' => true
    ]
]);

$body = @file_get_contents($url, false, $context);

if ($body === false) {
    http_response_code(500);
    echo "Failed to fetch URL";
    exit;
}

// Detect and set appropriate content type from URL
if (strpos($url, '.m3u8') !== false) {
    header("Content-Type: application/vnd.apple.mpegurl");
} elseif (strpos($url, '.mpd') !== false) {
    header("Content-Type: application/dash+xml");
} elseif (strpos($url, '.ts') !== false) {
    header("Content-Type: video/MP2T");
} else {
    header("Content-Type: application/octet-stream");
}

http_response_code(200);
echo $body;
