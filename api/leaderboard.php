<?php
// api/leaderboard.php
//
// purpose:
// - persistent leaderboard stored in ../data/leaderboard.json
//
// routes:
// - GET  /api/leaderboard.php
// - POST /api/leaderboard.php   body: { "winner": "player" | "ai" }

header('content-type: application/json; charset=utf-8');

$path = __DIR__ . '/../data/leaderboard.json';

function respond($code, $payload) {
  http_response_code($code);
  echo json_encode($payload);
  exit;
}

function default_board() {
  return [
    'player_wins' => 0,
    'ai_wins' => 0,
    'total_games' => 0
  ];
}

function read_board($path) {
  if (!file_exists($path) || filesize($path) === 0) {
    $b = default_board();
    file_put_contents($path, json_encode($b, JSON_PRETTY_PRINT));
    return $b;
  }

  $raw = file_get_contents($path);
  if ($raw === false) respond(500, [ 'ok' => false, 'message' => 'failed to read leaderboard' ]);

  $data = json_decode($raw, true);
  if (!is_array($data)) $data = default_board();

  // defensive defaults
  if (!isset($data['player_wins'])) $data['player_wins'] = 0;
  if (!isset($data['ai_wins'])) $data['ai_wins'] = 0;
  if (!isset($data['total_games'])) $data['total_games'] = 0;

  return $data;
}

function write_board($path, $board) {
  $ok = file_put_contents($path, json_encode($board, JSON_PRETTY_PRINT));
  if ($ok === false) respond(500, [ 'ok' => false, 'message' => 'failed to write leaderboard' ]);
}

function get_json_body() {
  $raw = file_get_contents('php://input');
  if ($raw === false || trim($raw) === '') return null;

  $data = json_decode($raw, true);
  if ($data === null && json_last_error() !== JSON_ERROR_NONE) {
    respond(400, [ 'ok' => false, 'message' => 'invalid json body', 'error' => json_last_error_msg() ]);
  }
  return $data;
}

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
  $board = read_board($path);
  respond(200, [ 'ok' => true, 'leaderboard' => $board ]);
}

if ($method === 'POST') {
  $body = get_json_body();
  if (!is_array($body)) respond(400, [ 'ok' => false, 'message' => 'missing json body' ]);

  $winner = $body['winner'] ?? '';
  if ($winner !== 'player' && $winner !== 'ai') {
    respond(400, [ 'ok' => false, 'message' => 'winner must be player or ai' ]);
  }

  $board = read_board($path);

  $board['total_games'] = (int)$board['total_games'] + 1;
  if ($winner === 'player') $board['player_wins'] = (int)$board['player_wins'] + 1;
  if ($winner === 'ai') $board['ai_wins'] = (int)$board['ai_wins'] + 1;

  write_board($path, $board);

  respond(200, [ 'ok' => true, 'leaderboard' => $board ]);
}

respond(405, [ 'ok' => false, 'message' => 'method not allowed' ]);