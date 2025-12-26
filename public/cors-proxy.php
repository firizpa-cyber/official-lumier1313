<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit;
}

$url = isset($_GET['url']) ? $_GET['url'] : null;

if (!$url) {
    die("No URL provided");
}

// Basic security: only proxy certain domains if needed, but for now allow any
// In a real app, you'd want to restrict this.

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
curl_setopt($ch, CURLOPT_USERAGENT, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');

$response = curl_exec($ch);
$contentType = curl_getinfo($ch, CURLINFO_CONTENT_TYPE);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$effectiveUrl = curl_getinfo($ch, CURLINFO_EFFECTIVE_URL);
curl_close($ch);

// If it's a manifest, rewrite relative URLs to absolute ones through this proxy
if (strpos($contentType, 'mpegurl') !== false || strpos($contentType, 'x-mpegURL') !== false) {
    $baseUrl = substr($effectiveUrl, 0, strrpos($effectiveUrl, '/') + 1);
    
    // Proxy URL pattern
    $proxyPrefix = "http://localhost:8000/cors-proxy.php?url=";

    // 1. Rewrite URI="..." attributes in tags
    $response = preg_replace_callback('/URI="([^"]+)"/', function($m) use ($baseUrl, $proxyPrefix) {
        $url = $m[1];
        if (!preg_match('/^https?:\/\//', $url)) $url = $baseUrl . $url;
        return 'URI="' . $proxyPrefix . urlencode($url) . '"';
    }, $response);

    // 2. Rewrite lines that are just URLs (segments or sub-manifests)
    $lines = explode("\n", $response);
    $newLines = [];
    foreach ($lines as $line) {
        $line = trim($line);
        if ($line && $line[0] !== '#' && !preg_match('/^https?:\/\//', $line)) {
            $newLines[] = $proxyPrefix . urlencode($baseUrl . $line);
        } else if ($line && $line[0] !== '#' && preg_match('/^https?:\/\//', $line)) {
            $newLines[] = $proxyPrefix . urlencode($line);
        } else {
            $newLines[] = $line;
        }
    }
    $response = implode("\n", $newLines);
}

http_response_code($httpCode);
header("Content-Type: " . $contentType);
echo $response;
