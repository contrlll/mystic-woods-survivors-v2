const Enemy = {
  list: [],
  xpGems: [],

  createBoss: function(x, y) {
    return {
      x: Game.wrap(x), y: Game.wrap(y), type: 'boss', isBoss: true,
      hp: 80, maxHp: 80,
      speed: 40,
      xp: 20,
      width: 64, height: 64,
      dir: 2, animFrame: 0, animTimer: 0,
      alive: true,
    };
  },

  create(x, y, difficulty, type) {
    type = type || 'slime';
    const hpMul = 1 + difficulty * 0.15;
    return {
      x, y, type,
      hp: Math.ceil(2 * hpMul),
      maxHp: Math.ceil(2 * hpMul),
      speed: 55 + Math.random() * 10,
      xp: 1 + Math.floor(difficulty / 3),
      width: type === 'bat' ? 16 : 32,
      height: type === 'bat' ? 24 : 32,
      dir: 0,
      animFrame: 0,
      animTimer: 0,
      alive: true,
    };
  },

  spawnXpGem(x, y, value) {
    this.xpGems.push({ x: Game.wrap(x), y: Game.wrap(y), value, size: 6, bob: 0 });
  },

  updateAll(dt) {
    for (let i = this.xpGems.length - 1; i >= 0; i--) {
      const g = this.xpGems[i];
      g.bob += dt * 3;
      const dx = Player.x - g.x;
      const dy = Player.y - g.y;
      const distSq = dx * dx + dy * dy;
      var pickupRadius = 150 + Player.magnet;
      if (distSq < pickupRadius * pickupRadius) {
        if (distSq < 400) {
          Player.addXp(g.value);
          this.xpGems.splice(i, 1);
        } else {
          var dist = Math.sqrt(distSq);
          var speed = 300 + Player.magnet * 0.5;
          g.x += (dx / dist) * speed * dt;
          g.y += (dy / dist) * speed * dt;
        }
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
        e.x = Game.wrap(e.x);
        e.y = Game.wrap(e.y);
        if (Math.abs(dy) > Math.abs(dx)) {
          e.dir = dy < 0 ? 0 : 3;
        } else {
          e.dir = dx < 0 ? 1 : 2;
        }
      }
      e.animTimer += dt;
      if (e.isBoss) {
        if (e.animTimer > 0.15) { e.animFrame = (e.animFrame + 1) % 8; e.animTimer = 0; }
      } else {
        if (e.animTimer > 0.12) { e.animFrame = (e.animFrame + 1) % 5; e.animTimer = 0; }
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
      if (e.isBoss) {
        this._renderBoss(ctx, e);
      } else if (e.type === 'bat') {
        this._renderBat(ctx, e);
      } else {
        this._renderSlime(ctx, e);
      }
    }
  },

  _renderSlime(ctx, e) {
    const sprite = Game.sprites.slime;
    if (!sprite || sprite.width === 0) {
      ctx.fillStyle = '#0a8';
      ctx.fillRect(e.x - 12, e.y - 12, 24, 24);
      return;
    }
    const gs = 32;
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
  },

  _renderBat(ctx, e) {
    const sprite = Game.sprites.bat;
    if (!sprite || sprite.width === 0) {
      ctx.fillStyle = '#a0a';
      ctx.fillRect(e.x - 8, e.y - 12, 16, 24);
      return;
    }
    const fw = 16, fh = 24;
    var row = e.alive ? 0 : 2;
    var col = e.alive ? e.animFrame : 0;
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(sprite, col * fw, row * fh, fw, fh, e.x - fw / 2, e.y - fh / 2, fw, fh);
    ctx.imageSmoothingEnabled = true;
    ctx.restore();
  },

  _renderBoss: function(ctx, e) {
    const sprite = Game.sprites.boss;
    if (!sprite || sprite.width === 0) {
      ctx.fillStyle = '#c00';
      ctx.fillRect(e.x - 24, e.y - 24, 48, 48);
      ctx.fillStyle = '#fff';
      ctx.font = '10px monospace';
      ctx.fillText('BOSS', e.x - 16, e.y);
      return;
    }
    const fw = 64, fh = 64;
    var col = e.animFrame;
    var row = 0;
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(sprite, col * fw, row * fh, fw, fh, e.x - fw / 2, e.y - fh / 2, fw, fh);
    ctx.imageSmoothingEnabled = true;
    // HP bar
    var barW = 52, barH = 6;
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(e.x - barW / 2, e.y - fh / 2 - 10, barW, barH);
    ctx.fillStyle = '#e22';
    ctx.fillRect(e.x - barW / 2 + 1, e.y - fh / 2 - 9, (barW - 2) * (e.hp / e.maxHp), barH - 2);
    ctx.restore();
  },
};
