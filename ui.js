const UI = {
  gameTime: 0,

  reset() {
    this.gameTime = 0;
  },

  render(ctx) {
    if (Game.state === 'LOADING') return;
    this.drawHpBar(ctx);
    this.drawXpBar(ctx);
    this.drawStats(ctx);
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

  showUpgrades() {
    const overlay = document.getElementById('upgradeOverlay');
    if (!overlay) return;
    const choices = this.getRandomUpgrades(3);
    overlay.innerHTML = `<div class="upgrade-title">LEVEL ${Player.level}</div><div class="upgrade-choices">`;
    for (const c of choices) {
      overlay.innerHTML += `<div class="upgrade-card" data-id="${c.id}">
        <div class="upgrade-icon">${c.icon}</div>
        <div class="upgrade-name">${c.name}</div>
        <div class="upgrade-desc">${c.desc}</div>
      </div>`;
    }
    overlay.innerHTML += '</div>';
    overlay.style.display = 'flex';
    overlay.querySelectorAll('.upgrade-card').forEach((card) => {
      card.addEventListener('click', () => {
        this.applyUpgrade(card.dataset.id);
        overlay.style.display = 'none';
        Game.state = 'PLAYING';
      });
    });
  },

  getRandomUpgrades(count) {
    var all = [
      { id: 'damage', name: 'Damage', icon: '+', desc: '+1 attack damage' },
      { id: 'attackSpeed', name: 'Attack Speed', icon: '>>', desc: '15% faster cooldown' },
      { id: 'range', name: 'Range', icon: '<->', desc: '+40 range' },
      { id: 'speed', name: 'Move Speed', icon: '->', desc: '+20 move speed' },
      { id: 'maxHp', name: 'Max HP', icon: '*', desc: '+5 max HP & heal' },
    ];
    for (var key in WEAPON_FACTORIES) {
      if (WEAPON_FACTORIES.hasOwnProperty(key) && key !== 'magicArrow' && !WeaponManager.hasWeapon(key)) {
        var def = WEAPON_FACTORIES[key]();
        all.push({ id: 'weapon_' + key, name: def.name, icon: def.icon, desc: 'New weapon!' });
      }
    }
    var shuffled = all.slice().sort(function() { return Math.random() - 0.5; });
    return shuffled.slice(0, count);
  },

  applyUpgrade(id) {
    if (id.indexOf('weapon_') === 0) {
      var weaponId = id.substring(7);
      WeaponManager.addWeapon(weaponId);
      return;
    }
    switch (id) {
      case 'damage': WeaponManager.globalDamage += 1; break;
      case 'attackSpeed': WeaponManager.globalCooldownMult = Math.max(0.2, WeaponManager.globalCooldownMult * 0.85); break;
      case 'range': WeaponManager.globalRange += 40; break;
      case 'speed': Player.speed += 20; break;
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
