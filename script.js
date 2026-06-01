Game.init();
Player.init();
Game.loadAssets();

function startGame() {
  document.getElementById('mainMenu').style.display = 'none';
  var music = document.getElementById('bgMusic');
  if (music.paused) music.play();
  if (Game.state === 'GAME_OVER') {
    Game.reset();
  } else {
    Game.start();
  }
}

function showAbout() {
  document.getElementById('mainMenu').style.display = 'none';
  document.getElementById('aboutOverlay').style.display = 'flex';
}

function hideAbout() {
  document.getElementById('aboutOverlay').style.display = 'none';
  document.getElementById('mainMenu').style.display = 'flex';
}
