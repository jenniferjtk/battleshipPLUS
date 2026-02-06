<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>battleship++</title>
  <link rel="stylesheet" href="assets/css/main.css" />
</head>
<body>
  <div id="app">
    <header class="topbar">
      <h1>battleship++</h1>
      <div class="controls">
        <button id="btn-new">new game</button>
        <button id="btn-reroll">reroll ships</button>
        <button id="btn-save">save</button>
        <button id="btn-load">load</button>
        
      </div>
    </header>

    <main class="layout">
      <section class="panel">
        <h2>your fleet</h2>
        <div class="board-wrap" data-board="player">
        <div class="corner"></div>
        <div class="col-labels" id="cols-player"></div>
        <div class="row-labels" id="rows-player"></div>
        <div id="board-player" class="board" aria-label="player board"></div>
</div>
      </section>

      <section class="panel">
        <h2>enemy waters</h2>
        <div class="board-wrap" data-board="ai">
        <div class="corner"></div>
        <div class="col-labels" id="cols-ai"></div>
        <div class="row-labels" id="rows-ai"></div>
        <div id="board-ai" class="board" aria-label="ai board"></div>
</div>
      </section>

      <aside class="sidebar">
        <h2>status</h2>
        <div id="status" class="status">loading…</div>

        <h2>moves</h2>
        <ol id="move-log" class="move-log"></ol>
      </aside>
    </main>
  </div>

  <script type="module" src="assets/js/app.js"></script>
</body>
</html>