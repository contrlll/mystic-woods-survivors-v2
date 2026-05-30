const Player = {
  x: 1500,
  y: 1500,
  speed: 200,
  maxHp: 10,
  hp: 10,
  xp: 0,
  xpToNext: 10,
  level: 1,
  kills: 0,
  dir: 0,
  animFrame: 0,
  animTimer: 0,
  moving: false,
  keys: {},

  init() {
    window.addEventListener('keydown', (e) => {
      this.keys[e.key.toLowerCase()] = true;
      if (e.key.startsWith('Arrow')) e.preventDefault();
    });
    window.addEventListener('keyup', (e) => {
      this.keys[e.key.toLowerCase()] = false;
    });
  },

  update(dt) {
    let dx = 0, dy = 0;
    if (this.keys['w'] || this.keys['arrowup']) dy = -1;
    if (this.keys['s'] || this.keys['arrowdown']) dy = 1;
    if (this.keys['a'] || this.keys['arrowleft']) dx = -1;
    if (this.keys['d'] || this.keys['arrowright']) dx = 1;
    this.moving = dx !== 0 || dy !== 0;
    if (this.moving) {
      const len = Math.sqrt(dx * dx + dy * dy);
      dx /= len;
      dy /= len;
      this.x += dx * this.speed * dt;
      this.y += dy * this.speed * dt;
      this.x = Math.max(24, Math.min(Game.mapSize - 24, this.x));
      this.y = Math.max(24, Math.min(Game.mapSize - 24, this.y));
      if (dy < 0) this.dir = 0;
      else if (dy > 0) this.dir = 3;
      if (dx > 0) this.dir = 2;
      else if (dx < 0) this.dir = 1;
      this.animTimer += dt;
      if (this.animTimer > 0.12) {
        this.animFrame = (this.animFrame + 1) % 4;
        this.animTimer = 0;
      }
    } else {
      this.animFrame = 0;
      this.animTimer = 0;
    }
    Game.camera.x = this.x - Game.width / 2;
    Game.camera.y = this.y - Game.height / 2;
  },

  render(ctx) {
    const sprite = Game.sprites.player;
    if (!sprite || sprite.width === 0) {
      ctx.fillStyle = '#0f0';
      ctx.fillRect(this.x - 12, this.y - 12, 24, 24);
      return;
    }
    const fw = 48, fh = 48;
    const row = (this.moving ? 3 : 0) + this.animFrame;
    const sy = row * fh;
    const dirCol = { 0: 4, 1: 2, 2: 2, 3: 0 }[this.dir] || 0;
    const sx = dirCol * fw;
    ctx.save();
    if (this.dir === 1) {
      ctx.translate(this.x, this.y);
      ctx.scale(-1, 1);
      ctx.drawImage(sprite, sx, sy, fw, fh, -fw / 2, -fh / 2, fw, fh);
    } else {
      ctx.drawImage(sprite, sx, sy, fw, fh, this.x - fw / 2, this.y - fh / 2, fw, fh);
    }
    ctx.restore();
  },

  addXp(amount) {
    this.xp += amount;
    if (this.xp >= this.xpToNext) {
      this.xp -= this.xpToNext;
      this.level++;
      this.xpToNext = Math.floor(this.xpToNext * 1.4);
      Game.state = 'LEVELING';
      UI.showUpgrades();
    }
  },

  takeDamage(amount) {
    this.hp -= amount;
    if (this.hp <= 0) {
      this.hp = 0;
      Game.state = 'GAME_OVER';
      UI.showGameOver();
    }
  },
};
