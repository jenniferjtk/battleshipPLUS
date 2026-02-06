<?php
header('content-type: application/json');

$path = __DIR__ . '/../data/current_game.json';
if (file_exists($path)) {
  file_put_contents($path, '');
}

echo json_encode(['ok' => true]);