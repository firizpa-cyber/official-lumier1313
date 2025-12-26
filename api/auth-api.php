<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json; charset=utf-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$baseUrl = "http://ant-tv.ddns.net:2223/api";
$masterToken = "Bearer Z4Q2f+QZ97DVto7NlqsvQszwDlB0SSqa8SWlWlmh8LY.WuenZtHmSXTMiDhsIJ8F26vh/p+OJUz7Ecq0JVqpvw4=";

// Get input data
$input = json_decode(file_get_contents('php://input'), true);
$action = $input['action'] ?? '';
$phone = $input['phone'] ?? ''; // Expecting 9-digit phone number (no +992)
$code = $input['code'] ?? '';

// Clean phone (remove +992 if provided by mistake)
$phone = str_replace('+992', '', $phone);
$phone = preg_replace('/\D/', '', $phone);

if (!$action || !$phone) {
    echo json_encode(['success' => false, 'message' => 'Missing required fields']);
    exit;
}

$targetUrl = "$baseUrl/validate/";
$postData = [
    'iptv' => 'true'
];

if ($action === 'send_code') {
    $postData['sendcode'] = 'true';
    $postData['phone'] = $phone;
} elseif ($action === 'verify_code') {
    $postData['phone'] = $phone;
    $postData['code'] = $code;
} else {
    echo json_encode(['success' => false, 'message' => 'Invalid action']);
    exit;
}

// Forward to external API
$opts = [
    'http' => [
        'method' => 'POST',
        'header' => [
            "Authorization: $masterToken",
            "Content-Type: application/x-www-form-urlencoded",
            "User-Agent: Mozilla/5.0"
        ],
        'content' => http_build_query($postData),
        'ignore_errors' => true
    ]
];

$context = stream_context_create($opts);
$response = @file_get_contents($targetUrl, false, $context);

if ($response === false) {
    echo json_encode(['success' => false, 'message' => 'Failed to connect to API server']);
} else {
    // Return API response directly to frontend
    echo $response;
}
