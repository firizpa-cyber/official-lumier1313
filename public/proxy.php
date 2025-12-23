<?php
// CORS Proxy for HLS/DASH streams and images with improved caching and error handling
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

// Extract file extension to determine content type
$parsedUrl = parse_url($url);
$path = $parsedUrl['path'] ?? '';
$extension = strtolower(pathinfo($path, PATHINFO_EXTENSION));

// Define content types for different file extensions
$contentTypes = [
    'm3u8' => 'application/vnd.apple.mpegurl',
    'mpd' => 'application/dash+xml',
    'ts' => 'video/MP2T',
    'mp4' => 'video/mp4',
    'webm' => 'video/webm',
    'jpg' => 'image/jpeg',
    'jpeg' => 'image/jpeg',
    'png' => 'image/png',
    'gif' => 'image/gif',
    'webp' => 'image/webp',
    'svg' => 'image/svg+xml',
    'json' => 'application/json',
    'xml' => 'application/xml',
    'txt' => 'text/plain',
];

// Use file extension to determine content type, default to octet-stream
$contentType = $contentTypes[$extension] ?? 'application/octet-stream';

// Set up context for the request with proper headers
$context = stream_context_create([
    'http' => [
        'method' => 'GET',
        'header' => [
            "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
            "Accept: " . ($contentType === 'application/vnd.apple.mpegurl' ? 'application/vnd.apple.mpegurl,*/*;q=0.9' : $contentType . ',*/*;q=0.8'),
            "Accept-Encoding: gzip, deflate",
            "Accept-Language: en-US,en;q=0.9",
            "Cache-Control: no-cache",
            "Pragma: no-cache",
        ],
        'timeout' => 30, // 30 second timeout
        'follow_location' => true,
        'max_redirects' => 5,
        'ignore_errors' => true
    ]
]);

// Attempt to fetch the content
$body = @file_get_contents($url, false, $context);

if ($body === false) {
    http_response_code(500);
    echo "Failed to fetch URL: " . $url;
    exit;
}

// Get response headers if available via get_headers
$headers = @get_headers($url, 1, $context);
if ($headers !== false) {
    // Try to get the real content type from the response if we couldn't determine it from extension
    if (isset($headers['Content-Type']) && $extension === '') {
        $actualContentType = is_array($headers['Content-Type']) ? $headers['Content-Type'][0] : $headers['Content-Type'];
        $contentType = $actualContentType;
    }
}

// Set appropriate content type
header("Content-Type: " . $contentType);

// Set caching headers for images to improve performance
if (in_array($extension, ['jpg', 'jpeg', 'png', 'gif', 'webp'])) {
    header("Cache-Control: public, max-age=3600"); // Cache images for 1 hour
    header("Expires: " . gmdate("D, d M Y H:i:s", time() + 3600) . " GMT");
} else {
    // For streams, prevent caching
    header("Cache-Control: no-cache, no-store, must-revalidate");
    header("Expires: 0");
}

// Set additional CORS headers for images
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: *");
header("Access-Control-Max-Age: 86400"); // Cache preflight for 24 hours

http_response_code(200);
echo $body;