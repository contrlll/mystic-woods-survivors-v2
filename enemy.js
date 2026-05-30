const Enemy = {
  list: [],
  xpGems: [],
  spawnTimer: 0,
  spawnInterval: 3,
  totalSpawned: 0,

  create(x, y, type, difficulty) {
    const base = type === 'slime'
      ? { hp: 2, speed: 55, width: 32, height: 32, xp: 1 }
      : { hp: 4, speed: 65, width: 48, height: 48, xp: 2 };
    const hpMul = 1 + difficulty * 0.15;
    const spdMul = 1 + difficulty * 0.05;
    return {
      x, y, type,
      hp: Math.ceil(base.hp * hpMul),
      maxHp: Math.ceil(base.hp * hpMul),
      speed: base.speed * spdMul + Math.random() * 10,
      xp: base.xp + Math.floor(difficulty / 3),
      width: base.width,
      height: base.height,
      animFrame: 0,
      animTimer: 0,
      alive: true,
    };
  },

  spawnWave() {
    const difficulty = Math.floor(this.totalSpawned / 8);
    const count = 3 + difficulty;
    for (let i = 0; i < count; i++) {
    for (let i = 0; i < count; i++) {
      let x, y;
      const side = Math.floor(Math.random() * 4);
      const cam = Game.camera;
      const w = Game.width;
      const h = Game.height;
      const margin = Math.max(w, h) * 0.6;
      const spread = Math.max(w, h) * 0.4;
      if (side === 0) {
        x = cam.x + Math.random() * w;
        y = cam.y - margin - Math.random() * spread;
      } else if (side === 1) {
        x = cam.x + w + margin + Math.random() * spread;
        y = cam.y + Math.random() * h;
      } else if (side === 2) {
        x = cam.x + Math.random() * w;
        y = cam.y + h + margin + Math.random() * spread;
      } else {
        x = cam.x - margin - Math.random() * spread;
        y = cam.y + Math.random() * h;
      }
      const type = Math.random() < 0.35 ? 'slime' : 'skeleton';
      this.list.push(this.create(x, y, type, difficulty));
    }
    this.totalSpawned += count;
    this.spawnInterval = Math.max(0.8, 3 - difficulty * 0.15);
  },

  spawnXpGem(x, y, value) {
    this.xpGems.push({ x, y, value, size: 6, bob: 0 });
  },

  updateAll(dt) {
    this.spawnTimer += dt;
    if (this.spawnTimer >= this.spawnInterval) {
      this.spawnTimer = 0;
      this.spawnWave();
    }
    for (let i = this.xpGems.length - 1; i >= 0; i--) {
      const g = this.xpGems[i];
      g.bob += dt * 3;
      const dx = Player.x - g.x;
      const dy = Player.y - g.y;
      if (dx * dx + dy * dy < 900) {
        Player.addXp(g.value);
        this.xpGems.splice(i, 1);
      }
    }
    for (let i = this.list.length - 1; i >= 0; i--) {
      const e = this.list[i];
      if (!e.alive) {
        this.list.splice(i, 1);
        continue;
      }
      const dx = Player.x - e.x;
      const dy = Player.y - e.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > 0) {
        e.x += (dx / dist) * e.speed * dt;
        e.y += (dy / dist) * e.speed * dt;
      }
      e.animTimer += dt;
      if (e.animTimer > 0.15) {
        e.animFrame = (e.animFrame + 1) % 3;
        e.animTimer = 0;
      }
    }
  },

  renderXpGems(ctx) {
    for (const g of this.xpGems) {
      const bob = Math.sin(g.bob) * 2;
      ctx.fillStyle = 'rgba(50, 255, 100, 0.8)';
      ctx.beginPath();
      ctx.arc(g.x, g.y + bob, g.size + 1, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(180, 255, 180, 0.6)';
      ctx.beginPath();
      ctx.arc(g.x - 1, g.y - 1 + bob, g.size * 0.5, 0, Math.PI * 2);
      ctx.fill();
    }
  },

  renderAll(ctx) {
    for (const e of this.list) {
      const sprite = e.type === 'skeleton'
        ? Game.sprites.skeleton
        : Game.sprites.slime;
      if (!sprite || sprite.width === 0) {
        ctx.fillStyle = e.type === 'skeleton' ? '#888' : '#0a8';
        ctx.fillRect(e.x - 12, e.y - 12, 24, 24);
        continue;
      }
      const gridSize = e.type === 'slime' ? 32 : 48;
      const sy = (3 + e.animFrame) * gridSize;
      const sx = 2 * gridSize;
      ctx.drawImage(
        sprite, sx, sy, gridSize, gridSize,
        e.x - e.width / 2, e.y - e.height / 2, e.width, e.height
      );
    }
  },
};
