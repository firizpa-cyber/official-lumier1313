<?php
/**
 * Movie Posters API
 * Получение постеров фильмов из системы управления
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

// Базовый URL к серверу контента
$contentServer = 'http://ant-tv.ddns.net:2223';

// Данные фильмов с их ID
$movies = [
    'Adrenaline' => [
        'id' => 214,
        'title' => 'Адреналин',
        'year' => 2006,
        'poster' => '/uploads/posters/adrenaline.jpg',  // Примерный путь
        'logo' => '/uploads/logos/adrenaline.png'
    ],
    'Balerina.2025' => [
        'id' => null,
        'title' => 'Балерина',
        'year' => 2025,
        'poster' => '/uploads/posters/balerina.jpg',
        'logo' => '/uploads/logos/balerina.png'
    ],
    'Argay_lsupershpion_2024' => [
        'id' => null,
        'title' => 'Аргайл: Супершпион',
        'year' => 2024,
        'poster' => '/uploads/posters/argylle.jpg',
        'logo' => '/uploads/logos/argylle.png'
    ],
    'Apgreyd.2018' => [
        'id' => null,
        'title' => 'Апгрейд',
        'year' => 2018,
        'poster' => '/uploads/posters/upgrade.jpg',
        'logo' => '/uploads/logos/upgrade.png'
    ],
    'Anna.2019' => [
        'id' => null,
        'title' => 'Анна',
        'year' => 2019,
        'poster' => '/uploads/posters/anna.jpg',
        'logo' => '/uploads/logos/anna.png'
    ],
    'Ali.ruli' => [
        'id' => null,
        'title' => 'Али, рули!',
        'year' => 2023,
        'poster' => '/uploads/posters/ali_ruli.jpg',
        'logo' => '/uploads/logos/ali_ruli.png'
    ]
];

// Получаем параметр
$action = $_GET['action'] ?? 'all';

if ($action === 'all') {
    // Возвращаем все фильмы с полными URL к постерам
    $result = [];
    foreach ($movies as $slug => $movie) {
        $result[] = [
            'slug' => $slug,
            'title' => $movie['title'],
            'year' => $movie['year'],
            'poster' => $contentServer . $movie['poster'],
            'logo' => $contentServer . $movie['logo'],
            'posterFallback' => "https://via.placeholder.com/500x750/667eea/ffffff?text=" . urlencode($movie['title'])
        ];
    }
    
    echo json_encode($result, JSON_PRETTY_PRINT);
} else {
    echo json_encode(['error' => 'Unknown action']);
}
?>
