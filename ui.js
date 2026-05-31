const UI = {
  gameTime: 0,
  statsCache: null,
  message: null,
  messageTimer: 0,

  showMessage: function(text, duration) {
    this.message = text;
    this.messageTimer = duration || 2;
  },

  reset() {
    this.gameTime = 0;
    this.statsCache = null;
    this.message = null;
    this.messageTimer = 0;
  },

  render(ctx) {
    if (Game.state === 'LOADING') return;
    this.drawHpBar(ctx);
    this.drawXpBar(ctx);
    this.drawStats(ctx);
    this.drawMinimap(ctx);
    if (this.message) {
      ctx.save();
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(Game.width / 2 - 120, 80, 240, 40);
      ctx.fillStyle = '#f44';
      ctx.font = 'bold 20px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(this.message, Game.width / 2, 100);
      ctx.restore();
    }
  },

  drawStats(ctx) {
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.font = '13px monospace';
    ctx.textAlign = 'left';
    const mins = Math.floor(this.gameTime / 60);
    const secs = Math.floor(this.gameTime % 60);
    const timeStr = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    ctx.fillText(`${timeStr}  Kills: ${Player.kills}`, 16, 52);
  },

  drawHpBar(ctx) {
    const x = 16, y = 16, w = 200, h = 18;
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(x, y, w, h);
    const pct = Math.max(0, Player.hp / Player.maxHp);
    ctx.fillStyle = '#e03030';
    ctx.fillRect(x + 1, y + 1, (w - 2) * pct, h - 2);
    ctx.fillStyle = '#fff';
    ctx.font = '11px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`HP ${Player.hp}/${Player.maxHp}`, x + w / 2, y + 13);
  },

  drawXpBar(ctx) {
    const w = 260, h = 16;
    const x = (Game.width - w) / 2;
    const y = Game.height - 30;
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(x, y, w, h);
    const pct = Player.xp / Player.xpToNext;
    ctx.fillStyle = '#2a8';
    ctx.fillRect(x + 1, y + 1, (w - 2) * pct, h - 2);
    ctx.fillStyle = '#fff';
    ctx.font = '11px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`Lv.${Player.level} ${Player.xp}/${Player.xpToNext} XP`, x + w / 2, y + 12);
  },

  drawMinimap(ctx) {
    var mmSize = 150;
    var margin = 16;
    var mmX = Game.width - mmSize - margin;
    var mmY = Game.height - mmSize - margin;
    var scale = mmSize / Game.mapSize;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(mmX, mmY, mmSize, mmSize);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 1;
    ctx.strokeRect(mmX, mmY, mmSize, mmSize);

    ctx.save();
    ctx.translate(mmX, mmY);

    var px = Player.x * scale;
    var py = Player.y * scale;

    for (var ei = 0; ei < Enemy.list.length; ei++) {
      var e = Enemy.list[ei];
      if (!e.alive) continue;
      var ex = Game.unwrap(e.x, Player.x) * scale;
      var ey = Game.unwrap(e.y, Player.y) * scale;
      var edx = ex - px;
      var edy = ey - py;
      if (edx * edx + edy * edy > (mmSize * 0.7) * (mmSize * 0.7)) continue;
      ctx.fillStyle = e.isElite ? '#ff0' : '#e22';
      ctx.fillRect(ex - 1.5, ey - 1.5, 3, 3);
    }

    for (var gi = 0; gi < Enemy.xpGems.length; gi++) {
      var g = Enemy.xpGems[gi];
      if (!g.alive) continue;
      var gx = Game.unwrap(g.x, Player.x) * scale;
      var gy = Game.unwrap(g.y, Player.y) * scale;
      var gdx = gx - px;
      var gdy = gy - py;
      if (gdx * gdx + gdy * gdy > (mmSize * 0.7) * (mmSize * 0.7)) continue;
      ctx.fillStyle = '#8f8';
      ctx.fillRect(gx - 1, gy - 1, 2, 2);
    }

    ctx.fillStyle = '#4f4';
    ctx.beginPath();
    ctx.arc(px, py, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.restore();
  },

  _weaponSpriteTag(spriteKey) {
    if (!spriteKey) return '';
    var s = Game.sprites[spriteKey];
    if (!s || s.width === 0) return '';
    return `<img src="${s.src}" class="upgrade-weapon-img">`;
  },

  showUpgrades() {
    const overlay = document.getElementById('upgradeOverlay');
    if (!overlay) return;
    const choices = this.getRandomUpgrades(3);
    overlay.innerHTML = `<div class="upgrade-title">УРОВЕНЬ ${Player.level}</div><div class="upgrade-choices">`;
    for (const c of choices) {
      const descClass = c.type === 'evolution' ? 'upgrade-desc evolve' : 'upgrade-desc';
      var iconHtml = c._sprite ? this._weaponSpriteTag(c._sprite) : `<div class="upgrade-icon">${c.icon}</div>`;
      overlay.innerHTML += `<div class="upgrade-card" data-id="${c.id}" data-type="${c.type}">
        ${iconHtml}
        <div class="upgrade-name">${c.name}</div>
        <div class="${descClass}">${c.desc}</div>
      </div>`;
    }
    overlay.innerHTML += '</div>';
    overlay.style.display = 'flex';
    overlay.querySelectorAll('.upgrade-card').forEach((card) => {
      card.addEventListener('click', () => {
        this.applyUpgrade(card.dataset.id, card.dataset.type);
        overlay.style.display = 'none';
        Game.state = 'PLAYING';
      });
    });
  },

  getRandomUpgrades(count) {
    var pool = [];
    var oldUpgrades = [
      { type: 'stat', id: 'damage', name: 'Damage', icon: '+', desc: '+1 к урону', nameRu: 'Урон' },
      { type: 'stat', id: 'range', name: 'Range', icon: '<->', desc: '+40 к дальности', nameRu: 'Дальность' },
      { type: 'stat', id: 'maxHp', name: 'Max HP', icon: '*', desc: '+5 макс. HP и лечение', nameRu: 'Макс. HP' },
    ];
    pool = pool.concat(oldUpgrades);

    var PASSIVE_DESC_RU = {
      power:     'Урон +10%',
      armor:     'Броня +1',
      maxHpMult: 'Макс. HP +10%',
      regen:     'Регенерация +0.1',
      cooldown:  'Перезарядка -2.5%',
      area:      'Область +5%',
      speed:     'Скорость снарядов +10%',
      duration:  'Длительность +15%',
      amount:    'Количество +1',
      magnet:    'Магнит +20',
      growth:    'Рост +10%',
    };

    function passDescRu(pdef) {
      var keys = Object.keys(pdef.bonuses);
      return keys.map(function(k) { return PASSIVE_DESC_RU[k] || ''; }).filter(Boolean).join(', ');
    }

    // Add evolutions as first priority
    var evolvable = WeaponManager.getEvolvableWeapons();
    for (var ei = 0; ei < evolvable.length; ei++) {
      var w = evolvable[ei];
      var evoDef = WEAPON_FACTORIES[w.evoId];
      pool.push({
        type: 'evolution',
        id: w.id,
        name: 'Эволюция: ' + w.nameRu,
        icon: '\u2606',
        desc: 'Улучшается в ' + (evoDef ? evoDef().nameRu : '???'),
        _sprite: WEAPON_SPRITE_MAP[w.evoId] || WEAPON_SPRITE_MAP[w.id],
      });
    }

    // Add owned weapons that can level up
    var lvWeapons = WeaponManager.getLevelableWeapons();
    for (var wi = 0; wi < lvWeapons.length; wi++) {
      var w = lvWeapons[wi];
      pool.push({
        type: 'weaponLevel',
        id: w.id,
        name: w.nameRu + ' Ур.' + w.level,
        icon: '\u2191',
        desc: 'Атака +' + Math.round(10 * w.getStat('power') * Player.power * 0.15),
        _sprite: WEAPON_SPRITE_MAP[w.id],
      });
    }

    // Add unowned non-evolved weapons
    for (var key in WEAPON_FACTORIES) {
      if (key === 'holyMissile' || key === 'bloodyTear' || key === 'deathSpiral' ||
          key === 'thousandEdge' || key === 'hellfire' || key === 'bora' ||
          key === 'loop' || key === 'unholyVespers') continue;
      if (!WeaponManager.hasWeapon(key)) {
        var def = WEAPON_FACTORIES[key]();
        pool.push({ type: 'weaponNew', id: key, name: def.nameRu, icon: '\u2694', desc: 'Новое оружие', _sprite: WEAPON_SPRITE_MAP[key] });
      }
    }

    // Add passive items
    for (var pid in PASSIVE_DEFS) {
      var pdef = PASSIVE_DEFS[pid];
      if (!PassiveManager.has(pid)) {
        pool.push({ type: 'passive', id: pid, name: pdef.nameRu, icon: '\u25C8', desc: passDescRu(pdef) });
      } else if (!PassiveManager.isMaxed(pid)) {
        var level = PassiveManager.getLevel(pid);
        pool.push({ type: 'passive', id: pid, name: pdef.nameRu + ' Ур.' + (level + 1), icon: '\u25C8', desc: passDescRu(pdef) });
      }
    }

    var shuffled = pool.slice().sort(function() { return Math.random() - 0.5; });
    var result = [];
    var hasEvo = false;
    for (var si = 0; si < shuffled.length && result.length < count; si++) {
      if (shuffled[si].type === 'evolution') {
        if (!hasEvo) { result.push(shuffled[si]); hasEvo = true; }
        continue;
      }
      result.push(shuffled[si]);
    }
    return result;
  },

  applyUpgrade(id, type) {
    if (type === 'evolution') {
      var weapons = WeaponManager.weapons;
      for (var i = 0; i < weapons.length; i++) {
        if (weapons[i].id === id && weapons[i].canEvolve()) {
          WeaponManager.evolveWeapon(weapons[i]);
          break;
        }
      }
      return;
    }
    if (type === 'weaponLevel') {
      var weapons = WeaponManager.weapons;
      for (var i = 0; i < weapons.length; i++) {
        if (weapons[i].id === id) {
          weapons[i].level++;
          break;
        }
      }
      return;
    }
    if (type === 'weaponNew') {
      WeaponManager.addWeapon(id);
      return;
    }
    if (type === 'passive') {
      PassiveManager.add(id);
      return;
    }
    // Old stat upgrades
    switch (id) {
      case 'damage': WeaponManager.globalDamage += 1; break;
      case 'range': WeaponManager.globalDamage += 0.5; break;
      case 'maxHp': Player.maxHp += 5; Player.hp = Player.maxHp; break;
    }
  },

  showGameOver() {
    const overlay = document.getElementById('upgradeOverlay');
    if (!overlay) return;
    const mins = Math.floor(this.gameTime / 60);
    const secs = Math.floor(this.gameTime % 60);
    overlay.innerHTML = `<div class="gameover-title">GAME OVER</div>
      <div class="gameover-stats">
        <div>Survived: ${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}</div>
        <div>Kills: ${Player.kills}</div>
        <div>Level: ${Player.level}</div>
      </div>
      <button class="restart-btn" id="restartBtn">RESTART</button>`;
    overlay.style.display = 'flex';
    document.getElementById('restartBtn').addEventListener('click', () => {
      overlay.style.display = 'none';
      Game.reset();
    });
  },
};
