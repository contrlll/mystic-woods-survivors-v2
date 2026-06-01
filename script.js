Game.init();
Player.init();
Game.loadAssets();

document.addEventListener('DOMContentLoaded', function() {
  var menuMusic = document.getElementById('menuMusic');
  if (menuMusic) menuMusic.play();
});

function startGame() {
  document.getElementById('mainMenu').style.display = 'none';
  var menuMusic = document.getElementById('menuMusic');
  var gameplayMusic = document.getElementById('gameplayMusic');
  if (menuMusic) { menuMusic.pause(); menuMusic.currentTime = 0; }
  if (gameplayMusic) { gameplayMusic.currentTime = 0; gameplayMusic.play(); }
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
