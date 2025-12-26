<?php
/**
 * Films API - Автоматическая загрузка данных о фильмах
 * Прокси к content-api.php
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');

$action = $_GET['action'] ?? 'all';

if ($action === 'all') {
    // Получаем все фильмы из content-api.php
    $url = 'http://localhost:8000/player/content-api.php?action=all';
    
    $opts = [
        'http' => [
            'method' => 'GET',
            'header' => 'Accept: application/json'
        ]
    ];
    
    $context = stream_context_create($opts);
    $response = @file_get_contents($url, false, $context);
    
    if ($response === false) {
        // Fallback если не удалось получить данные
        echo json_encode([
            'error' => 'Unable to fetch movies',
            'movies' => []
        ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    } else {
        // Просто возвращаем то, что получили
        echo $response;
    }

} elseif ($action === 'get' && isset($_GET['id'])) {
    // Получить конкретный фильм
    $id = $_GET['id'];
    
    // Сначала получаем все фильмы
    $url = 'http://localhost:8000/player/content-api.php?action=all';
    $response = @file_get_contents($url);
    
    if ($response) {
        $movies = json_decode($response, true);
        
        // Ищем по ID
        foreach ($movies as $movie) {
            if (isset($movie['id']) && $movie['id'] == $id) {
                echo json_encode($movie, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
                exit;
            }
        }
    }
    
    echo json_encode(['error' => 'Movie not found'], JSON_UNESCAPED_UNICODE);

} else {
    echo json_encode(['error' => 'Invalid action']);
}
?>
