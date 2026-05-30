const Enemy = {
  list: [],
  xpGems: [],
  spawnTimer: 0,
  spawnInterval: 3,
  totalSpawned: 0,

  create(x, y, difficulty) {
    const hpMul = 1 + difficulty * 0.15;
    return {
      x, y,
      hp: Math.ceil(2 * hpMul),
      maxHp: Math.ceil(2 * hpMul),
      speed: 55 + Math.random() * 10,
      xp: 1 + Math.floor(difficulty / 3),
      width: 32,
      height: 32,
      dir: 0,
      animFrame: 0,
      animTimer: 0,
      alive: true,
    };
  },

  spawnWave() {
    const difficulty = Math.floor(this.totalSpawned / 8);
    const count = 3 + difficulty;
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
      this.list.push(this.create(x, y, difficulty));
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
        if (Math.abs(dy) > Math.abs(dx)) {
          e.dir = dy < 0 ? 0 : 3;
        } else {
          e.dir = dx < 0 ? 1 : 2;
        }
      }
      e.animTimer += dt;
      if (e.animTimer > 0.12) {
        e.animFrame = (e.animFrame + 1) % 5;
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
    const sprite = Game.sprites.slime;
    if (!sprite || sprite.width === 0) {
      for (const e of this.list) {
        ctx.fillStyle = '#0a8';
        ctx.fillRect(e.x - 12, e.y - 12, 24, 24);
      }
      return;
    }
    const gs = 32;
    for (const e of this.list) {
      let row, flipped = false;
      if (!e.alive) {
        row = 12;
      } else {
        switch (e.dir) {
          case 0: row = 5; break;
          case 1: row = 4; flipped = true; break;
          case 2: row = 4; break;
          case 3: row = 6; break;
          default: row = 0;
        }
      }
      const col = e.animFrame;
      ctx.save();
      if (flipped) {
        ctx.translate(e.x, e.y);
        ctx.scale(-1, 1);
        ctx.drawImage(sprite, col * gs, row * gs, gs, gs, -gs / 2, -gs / 2, gs, gs);
      } else {
        ctx.drawImage(sprite, col * gs, row * gs, gs, gs, e.x - gs / 2, e.y - gs / 2, gs, gs);
      }
      ctx.restore();
    }
  },
};
