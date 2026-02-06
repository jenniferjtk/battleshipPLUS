<?php
header('content-type: application/json');

$path = __DIR__ . '/../data/current_game.json';
if (!file_exists($path) || filesize($path) === 0) {
  echo json_encode(['ok' => false, 'state' => null]);
  exit;
}

$raw = file_get_contents($path);
if ($raw === false) {
  http_response_code(500);
  echo json_encode(['error' => 'failed to read save file']);
  exit;
}

$state = json_decode($raw, true);
if ($state === null) {
  http_response_code(500);
  echo json_encode(['error' => 'save file contains invalid json']);
  exit;
}

echo json_encode(['ok' => true, 'state' => $state]);