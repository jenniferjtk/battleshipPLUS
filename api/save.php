<?php
header('content-type: application/json');

$raw = file_get_contents('php://input');
$state = json_decode($raw, true);

if (!$state) {
  echo json_encode(['ok' => false, 'error' => 'invalid json']);
  exit;
}

function normalize_shots($shots) {
  // If shots is already a numeric array, keep it.
  if (is_array($shots)) {
    // numeric array => good
    $is_list = array_keys($shots) === range(0, count($shots) - 1);
    if ($is_list) return $shots;

    // associative array (Set got serialized weird) => use keys as shot strings
    return array_keys($shots);
  }

  // anything else => empty
  return [];
}

foreach (['player', 'ai'] as $who) {
  if (!isset($state['boards'][$who])) continue;

  $shots = $state['boards'][$who]['shots'] ?? [];
  $state['boards'][$who]['shots'] = normalize_shots($shots);
}

$path = __DIR__ . '/../data/current_game.json';
$result = file_put_contents($path, json_encode($state, JSON_PRETTY_PRINT));

if ($result === false) {
  echo json_encode([
    'ok' => false,
    'error' => 'file_put_contents failed',
    'path' => $path,
    'writable' => is_writable(dirname($path))
  ]);
  exit;
}

echo json_encode([
  'ok' => true,
  'bytes' => $result
]);