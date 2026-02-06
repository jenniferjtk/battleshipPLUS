<?php
header('content-type: application/json');

$path = __DIR__ . '/../data/current_game.json';
$exists = file_exists($path) && filesize($path) > 0;

echo json_encode([
  'ok' => true,
  'saves' => $exists ? ['current_game'] : []
]);