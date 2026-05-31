const Game = {
  canvas: null,
  ctx: null,
  width: 0,
  height: 0,
  camera: { x: 0, y: 0 },
  mapSize: 3000,
  state: 'PLAYING',
  sprites: {},
  lastTime: 0,
  accumulator: 0,
  fixedDt: 1 / 60,
  decorations: [],

  wrap: function(v) {
    var ms = this.mapSize;
    return ((v % ms) + ms) % ms;
  },

  wrapTile: function(v) {
    var numTiles = this.mapSize / this.GRASS_TS;
    return ((v % numTiles) + numTiles) % numTiles;
  },

  // Unwrap position to nearest copy relative to reference
  unwrap: function(pos, ref) {
    var ms = this.mapSize;
    return pos + Math.round((ref - pos) / ms) * ms;
  },

  // Grass tileset: 8x8 grid of 32x32 tiles
  GRASS_COLS: 8,
  GRASS_ROWS: 8,
  GRASS_TS: 32,

  // Decoration definitions: { spriteKey, srcX, srcY, w, h, category }
  DECOR_DEFS: [
    // Trees (from TX Plant.png)
    { key: 'txPlant', sx: 24, sy: 14, w: 113, h: 139, cat: 'tree' },
    { key: 'txPlant', sx: 161, sy: 17, w: 97, h: 136, cat: 'tree' },
    { key: 'txPlant', sx: 295, sy: 31, w: 79, h: 120, cat: 'tree' },
    // Bushes
    { key: 'txPlant', sx: 216, sy: 185, w: 47, h: 42, cat: 'bush' },
    { key: 'txPlant', sx: 282, sy: 186, w: 39, h: 45, cat: 'bush' },
    { key: 'txPlant', sx: 156, sy: 190, w: 38, h: 32, cat: 'bush' },
    { key: 'txPlant', sx: 346, sy: 190, w: 40, h: 35, cat: 'bush' },
    // Flowers
    { key: 'txPlant', sx: 98, sy: 195, w: 27, h: 25, cat: 'flower' },
    { key: 'txPlant', sx: 38, sy: 198, w: 22, h: 19, cat: 'flower' },
    // Rocks/props (from TX Props.png)
    { key: 'txProps', sx: 387, sy: 2, w: 27, h: 61, cat: 'rock' },
    { key: 'txProps', sx: 227, sy: 9, w: 26, h: 52, cat: 'rock' },
    { key: 'txProps', sx: 32, sy: 18, w: 32, h: 46, cat: 'rock' },
    { key: 'txProps', sx: 160, sy: 18, w: 32, h: 46, cat: 'rock' },
    { key: 'txProps', sx: 292, sy: 19, w: 56, h: 41, cat: 'rock' },
    { key: 'txProps', sx: 96, sy: 30, w: 32, h: 31, cat: 'smallrock' },
    { key: 'txProps', sx: 96, sy: 76, w: 32, h: 49, cat: 'rock' },
    { key: 'txProps', sx: 288, sy: 87, w: 64, h: 36, cat: 'rock' },
    { key: 'txProps', sx: 27, sy: 103, w: 41, h: 50, cat: 'rock' },
    { key: 'txProps', sx: 288, sy: 158, w: 32, h: 57, cat: 'rock' },
    { key: 'txProps', sx: 352, sy: 174, w: 32, h: 77, cat: 'rock' },
    // Small rocks/pebbles
    { key: 'txProps', sx: 165, sy: 217, w: 21, h: 34, cat: 'smallrock' },
    { key: 'txProps', sx: 96, sy: 224, w: 27, h: 32, cat: 'smallrock' },
    { key: 'txProps', sx: 225, sy: 239, w: 30, h: 41, cat: 'smallrock' },
    { key: 'txProps', sx: 289, sy: 251, w: 30, h: 29, cat: 'smallrock' },
    { key: 'txProps', sx: 164, sy: 288, w: 25, h: 27, cat: 'smallrock' },
    { key: 'txProps', sx: 227, sy: 303, w: 26, h: 40, cat: 'smallrock' },
    { key: 'txProps', sx: 165, sy: 348, w: 21, h: 32, cat: 'smallrock' },
    { key: 'txProps', sx: 162, sy: 482, w: 27, h: 27, cat: 'smallrock' },
    { key: 'txProps', sx: 68, sy: 487, w: 24, h: 19, cat: 'smallrock' },
    { key: 'txProps', sx: 100, sy: 487, w: 24, h: 19, cat: 'smallrock' },
  ],

  init() {
    this.canvas = document.getElementById('gameCanvas');
    this.ctx = this.canvas.getContext('2d');
    this.resize();
    window.addEventListener('resize', () => this.resize());
  },

  resize() {
    const dpr = window.devicePixelRatio || 1;
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.canvas.width = this.width * dpr;
    this.canvas.height = this.height * dpr;
    this.canvas.style.width = this.width + 'px';
    this.canvas.style.height = this.height + 'px';
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  },

  hash: function(x, y) {
    var h = x * 374761393 + y * 668265263;
    h = (h ^ (h >> 13)) * 1274126177;
    return (h ^ (h >> 16)) & 0x7fffffff;
  },

  loadAssets() {
    const assets = {
      plains: 'assets/sprites/tilesets/grass_new.png',
      player: 'assets/sprites/characters/player.png',
      slime: 'assets/sprites/characters/slime.png',
      bat: 'assets/sprites/characters/bat.png',
      crystalsword: 'assets/sprites/weapons/weapon01crystalsword.png',
      dagger: 'assets/sprites/weapons/weapon02dagger.png',
      longsword: 'assets/sprites/weapons/weapon03longsword.png',
      flail: 'assets/sprites/weapons/weapon04rustyflail.png',
      doubleaxe: 'assets/sprites/weapons/weapon05doubleaxe.png',
      bow: 'assets/sprites/weapons/weapon06bow.png',
      spear: 'assets/sprites/weapons/weapon07spear.png',
      txPlant: 'assets/sprites/decor/tx_plant.png',
      txProps: 'assets/sprites/decor/tx_props.png',
      boss: 'assets/sprites/enemies/boss.png',
      lightning: 'assets/sprites/weapons/lightning.png',
      holyWater: 'assets/sprites/weapons/holyWater.png',
      bora: 'assets/sprites/weapons/bora.png',
      loop: 'assets/sprites/weapons/loop.png',
      unholyVespers: 'assets/sprites/weapons/unholyVespers.png',
    };
    for (const [key, src] of Object.entries(assets)) {
      const img = new Image();
      img.src = src;
      this.sprites[key] = img;
    }
  },

  generateDecorations: function() {
    this.decorations = [];
    var seed = 12345;
    var minDist = 80;
    for (var i = 0; i < 300; i++) {
      seed = (seed * 1103515245 + 12345) & 0x7fffffff;
      var x = (seed / 0x7fffffff) * this.mapSize;
      seed = (seed * 1103515245 + 12345) & 0x7fffffff;
      var y = (seed / 0x7fffffff) * this.mapSize;
      // Keep decorations away from player start
      var dx = x - 1500;
      var dy = y - 1500;
      if (dx * dx + dy * dy < 250 * 250) { i--; continue; }
      // Check distance from other decorations
      var tooClose = false;
      for (var j = 0; j < this.decorations.length; j++) {
        var d = this.decorations[j];
        var cx = d.x + d.def.w / 2;
        var cy = d.y + d.def.h / 2;
        var distX = x - cx;
        var distY = y - cy;
        if (distX * distX + distY * distY < minDist * minDist) {
          tooClose = true;
          break;
        }
      }
      if (tooClose) { i--; continue; }
      // Pick a random decor def
      var def = this.DECOR_DEFS[Math.floor((seed / 0x7fffffff) * this.DECOR_DEFS.length)];
      this.decorations.push({ x: x - def.w / 2, y: y - def.h / 2, def: def });
    }
  },

  start() {
    this.camera.x = Player.x - this.width / 2;
    this.camera.y = Player.y - this.height / 2;
    WeaponManager.reset();
    this.generateDecorations();
    this.lastTime = performance.now();
    this.loop(this.lastTime);
  },

  loop(time) {
    const dt = Math.min((time - this.lastTime) / 1000, 0.05);
    this.lastTime = time;
    this.accumulator += dt;
    while (this.accumulator >= this.fixedDt) {
      this.update(this.fixedDt);
      this.accumulator -= this.fixedDt;
    }
    this.render();
    requestAnimationFrame((t) => this.loop(t));
  },

  reset() {
    Enemy.list.length = 0;
    Enemy.xpGems.length = 0;
    PassiveManager.reset();
    Spawner.reset();
    WeaponManager.reset();

    Player.dead = false;
    Player.xp = 0;
    Player.level = 1;
    Player.kills = 0;
    Player.xpToNext = 10;
    Player.moveSpeed = 1;
    Player.power = 1;
    Player.cooldown = 0.667;
    Player.area = 1;
    Player.speed = 1;
    Player.duration = 1;
    Player.amount = 0;
    Player.magnet = 0;
    Player.growth = 1;
    Player.xpDiscount = 0;
    Player.armor = 0;
    Player.regen = 0;
    Player.maxHp = 10;
    Player.hp = Player.maxHp;
    Player.x = 1500;
    Player.y = 1500;
    UI.reset();
    this.state = 'PLAYING';
  },

  update(dt) {
    if (this.state !== 'PLAYING') return;
    Player.update(dt);
    Spawner.update(dt);
    Enemy.updateAll(dt);
    WeaponManager.update(dt);
    UI.gameTime += dt;
    if (UI.message) { UI.messageTimer -= dt; if (UI.messageTimer <= 0) { UI.message = null; } }

    // Regen tick every 5s
    UI._regenTimer = (UI._regenTimer || 0) + dt;
    if (UI._regenTimer >= 5) {
      UI._regenTimer -= 5;
      var regenAmt = Player.regen;
      if (regenAmt > 0 && Player.hp < Player.maxHp) {
        Player.hp = Math.min(Player.maxHp, Player.hp + Math.max(1, Math.ceil(regenAmt)));
      }
    }

    // Enemy contact damage with armor reduction
    for (const e of Enemy.list) {
      if (!e.alive) continue;
      const dx = Player.x - e.x;
      const dy = Player.y - e.y;
      const threshold = 16;
      if (dx * dx + dy * dy < threshold * threshold) {
        var dmg = 1;
        if (Player.armor > 0 && Math.random() < Player.armor * 0.15) {
          dmg = 0;
        }
        if (dmg > 0) Player.takeDamage(dmg);
        e.alive = false;
      }
    }
    // Boss contact damage (doesn't die on contact)
    for (const e of Enemy.list) {
      if (!e.alive || !e.isBoss) continue;
      const dx = Player.x - e.x;
      const dy = Player.y - e.y;
      const threshold = 32;
      if (dx * dx + dy * dy < threshold * threshold) {
        var dmg = 2;
        if (Player.armor > 0 && Math.random() < Player.armor * 0.15) {
          dmg = 0;
        }
        if (dmg > 0) Player.takeDamage(dmg);
      }
    }
  },

  render() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);
    ctx.fillStyle = '#1a2a1a';
    ctx.fillRect(0, 0, this.width, this.height);
    ctx.save();
    ctx.translate(-this.camera.x, -this.camera.y);
    this.renderMap(ctx);
    Enemy.renderAll(ctx);
    WeaponManager.render(ctx);
    Enemy.renderXpGems(ctx);
    Player.render(ctx);
    ctx.restore();
    UI.render(ctx);
  },

    renderMap(ctx) {
        const grass = this.sprites.plains;
        if (!grass || grass.width === 0) return;
        const ts = this.GRASS_TS;
        const gCols = this.GRASS_COLS;
        // Increased buffer to prevent visible world loading
        const buffer = ts * 3; // Render 3 tiles beyond visible area
        const sx = Math.floor((this.camera.x - buffer) / ts) * ts;
        const sy = Math.floor((this.camera.y - buffer) / ts) * ts;
        const ex = this.camera.x + this.width + buffer + ts;
        const ey = this.camera.y + this.height + buffer + ts;

    for (let y = sy; y < ey; y += ts) {
      for (let x = sx; x < ex; x += ts) {
        var tileX = Math.floor(x / ts);
        var tileY = Math.floor(y / ts);
        var h = this.hash(tileX, tileY);
        var gx = (h % gCols) * ts;
        var gy = (Math.floor(h / gCols) % this.GRASS_ROWS) * ts;
        ctx.drawImage(grass, gx, gy, ts, ts, x, y, ts, ts);
      }
    }

    var cx = this.camera.x;
    var cy = this.camera.y;
    var cw = this.width;
    var ch = this.height;
    for (var i = 0; i < this.decorations.length; i++) {
      var d = this.decorations[i];
      if (d.x + d.def.w < cx || d.x > cx + cw || d.y + d.def.h < cy || d.y > cy + ch) continue;
      var sprite = this.sprites[d.def.key];
      if (!sprite || sprite.width === 0) continue;
      ctx.drawImage(sprite, d.def.sx, d.def.sy, d.def.w, d.def.h, d.x, d.y, d.def.w, d.def.h);
    }
  },
};
