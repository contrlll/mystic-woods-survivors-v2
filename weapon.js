function findClosestEnemy(x, y, range) {
  let closest = null;
  let minDist = Infinity;
  for (const e of Enemy.list) {
    if (!e.alive) continue;
    const dx = e.x - x;
    const dy = e.y - y;
    const distSq = dx * dx + dy * dy;
    if (distSq < minDist && distSq < range * range) {
      minDist = distSq;
      closest = e;
    }
  }
  return closest;
}

function findEnemiesInRadius(x, y, radius) {
  const result = [];
  for (const e of Enemy.list) {
    if (!e.alive) continue;
    const dx = e.x - x;
    const dy = e.y - y;
    if (dx * dx + dy * dy < radius * radius) result.push(e);
  }
  return result;
}

function damageEnemy(e, dmg) {
  e.hp -= dmg;
  if (e.hp <= 0) {
    e.alive = false;
    Player.kills++;
    Enemy.spawnXpGem(e.x, e.y, e.xp);
  }
}

const WeaponManager = {
  weapons: [],
  projectiles: [],
  vfx: [],
  zones: [],
  globalDamage: 0,
  globalRange: 0,
  globalCooldownMult: 1,

  reset() {
    this.weapons = [];
    this.projectiles = [];
    this.vfx = [];
    this.zones = [];
    this.globalDamage = 0;
    this.globalRange = 0;
    this.globalCooldownMult = 1;
    this.addWeapon('magicArrow');
  },

  hasWeapon(id) {
    return this.weapons.some(function(w) { return w.id === id; });
  },

  addWeapon(id) {
    if (this.hasWeapon(id)) return;
    var fn = WEAPON_FACTORIES[id];
    if (fn) this.weapons.push(fn());
  },

  update(dt) {
    for (var wi = 0; wi < this.weapons.length; wi++) {
      var w = this.weapons[wi];
      w.timer += dt;
      var cd = w.cooldown * this.globalCooldownMult;
      if (w.timer >= cd) {
        w.timer -= cd;
        w.attack();
      }
    }
    this._updateProjectiles(dt);
    this._updateZones(dt);
    this._updateVfx(dt);
  },

  render(ctx) {
    this._renderZones(ctx);
    this._renderProjectiles(ctx);
    this._renderVfx(ctx);
  },

  addProjectile(cfg) {
    this.projectiles.push(cfg);
  },

  addVfx(cfg) {
    this.vfx.push(cfg);
  },

  addZone(cfg) {
    this.zones.push(cfg);
  },

  _updateProjectiles(dt) {
    var list = this.projectiles;
    for (var i = list.length - 1; i >= 0; i--) {
      var p = list[i];

      if (p.type === 'orbital') {
        p.angle += p.speed * dt;
        p.x = Player.x + Math.cos(p.angle) * p.radius;
        p.y = Player.y + Math.sin(p.angle) * p.radius;
        p.hitTimer -= dt;
        if (p.hitTimer <= 0) {
          for (var ei = 0; ei < Enemy.list.length; ei++) {
            var e = Enemy.list[ei];
            if (!e.alive) continue;
            var dx = p.x - e.x;
            var dy = p.y - e.y;
            if (dx * dx + dy * dy < 22 * 22) {
              damageEnemy(e, p.damage);
              p.hitTimer = 0.3;
            }
          }
        }
        continue;
      }

      if (p.type === 'homing') {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.distTraveled += Math.sqrt(p.vx * p.vx + p.vy * p.vy) * dt;
        if (p.distTraveled >= p.maxDist) { list.splice(i, 1); continue; }
        var target = findClosestEnemy(p.x, p.y, 250);
        if (target) {
          var tdx = target.x - p.x;
          var tdy = target.y - p.y;
          var td = Math.sqrt(tdx * tdx + tdy * tdy);
          if (td > 0) {
            p.vx += (tdx / td) * p.seek * dt;
            p.vy += (tdy / td) * p.seek * dt;
            var spd = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
            if (spd > p.maxSpeed) { p.vx = (p.vx / spd) * p.maxSpeed; p.vy = (p.vy / spd) * p.maxSpeed; }
          }
        }
        for (var ei = 0; ei < Enemy.list.length; ei++) {
          var e = Enemy.list[ei];
          if (!e.alive) continue;
          var dx = p.x - e.x;
          var dy = p.y - e.y;
          if (dx * dx + dy * dy < 18 * 18) {
            damageEnemy(e, p.damage);
            list.splice(i, 1);
            break;
          }
        }
        continue;
      }

      p.x += p.vx * dt;
      p.y += p.vy * dt;
      var moved = Math.sqrt(p.vx * p.vx + p.vy * p.vy) * dt;

      if (p.trail) {
        if (!p._trailPoints) p._trailPoints = [];
        p._trailPoints.push({ x: p.x, y: p.y });
        if (p._trailPoints.length > 6) p._trailPoints.shift();
      }

      if (p.type === 'boomerang') {
        if (!p.returning) {
          p.distFromStart += moved;
          if (p.distFromStart >= p.maxDist) p.returning = true;
        }
        if (p.returning) {
          var bdx = Player.x - p.x;
          var bdy = Player.y - p.y;
          var bd = Math.sqrt(bdx * bdx + bdy * bdy);
          if (bd < 20) { list.splice(i, 1); continue; }
          p.vx = (bdx / bd) * p.speed;
          p.vy = (bdy / bd) * p.speed;
        }
        for (var ei = 0; ei < Enemy.list.length; ei++) {
          var e = Enemy.list[ei];
          if (!e.alive) continue;
          var dx = p.x - e.x;
          var dy = p.y - e.y;
          if (dx * dx + dy * dy < 20 * 20) {
            damageEnemy(e, p.damage);
          }
        }
        continue;
      }

      p.distTraveled += moved;
      if (p.distTraveled >= p.maxDist) {
        if (p.explosionRadius) {
          this._explode(p.x, p.y, p.explosionRadius, p.damage * 0.5);
        }
        list.splice(i, 1);
        continue;
      }

      if (p.type === 'piercing') {
        for (var ei = 0; ei < Enemy.list.length; ei++) {
          var e = Enemy.list[ei];
          if (!e.alive || p.hitEnemies.indexOf(e) !== -1) continue;
          var dx = p.x - e.x;
          var dy = p.y - e.y;
          if (dx * dx + dy * dy < 18 * 18) {
            damageEnemy(e, p.damage);
            p.hitEnemies.push(e);
            p.remainingPierce--;
            if (p.remainingPierce <= 0) { list.splice(i, 1); break; }
          }
        }
        continue;
      }

      if (p.type === 'explosive') {
        var hit = false;
        for (var ei = 0; ei < Enemy.list.length; ei++) {
          var e = Enemy.list[ei];
          if (!e.alive) continue;
          var dx = p.x - e.x;
          var dy = p.y - e.y;
          if (dx * dx + dy * dy < 20 * 20) {
            damageEnemy(e, p.damage);
            this._explode(p.x, p.y, p.explosionRadius, p.damage * 0.6);
            hit = true;
            break;
          }
        }
        if (hit) { list.splice(i, 1); continue; }
        continue;
      }

      // Standard projectile
      for (var ei = 0; ei < Enemy.list.length; ei++) {
        var e = Enemy.list[ei];
        if (!e.alive) continue;
        var dx = p.x - e.x;
        var dy = p.y - e.y;
        if (dx * dx + dy * dy < 18 * 18) {
          damageEnemy(e, p.damage);
          list.splice(i, 1);
          break;
        }
      }
    }
  },

  _explode(x, y, radius, dmg) {
    this.addVfx({ type: 'explosion', x: x, y: y, timer: 0, duration: 0.3, maxRadius: radius });
    var enemies = findEnemiesInRadius(x, y, radius);
    for (var i = 0; i < enemies.length; i++) {
      damageEnemy(enemies[i], dmg);
    }
  },

  _updateZones(dt) {
    for (var i = this.zones.length - 1; i >= 0; i--) {
      var z = this.zones[i];
      z.timer += dt;
      z.tickTimer += dt;
      if (z.tickTimer >= z.tickInterval) {
        z.tickTimer = 0;
        var enemies = findEnemiesInRadius(z.x, z.y, z.radius);
        for (var ei = 0; ei < enemies.length; ei++) {
          damageEnemy(enemies[ei], z.damage);
        }
      }
      if (z.timer >= z.lifetime) this.zones.splice(i, 1);
    }
  },

  _updateVfx(dt) {
    for (var i = this.vfx.length - 1; i >= 0; i--) {
      var v = this.vfx[i];
      v.timer += dt;
      if (v.timer >= v.duration) this.vfx.splice(i, 1);
    }
  },

  _renderZones(ctx) {
    for (var i = 0; i < this.zones.length; i++) {
      var z = this.zones[i];
      var alpha = 0.4 * (1 - z.timer / z.lifetime);
      ctx.fillStyle = 'rgba(100, 180, 255, ' + alpha + ')';
      ctx.beginPath();
      ctx.arc(z.x, z.y, z.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(100, 180, 255, ' + (alpha * 1.5) + ')';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  },

  _renderProjectiles(ctx) {
    for (var i = 0; i < this.projectiles.length; i++) {
      var p = this.projectiles[i];

      if (p.type === 'orbital') {
        ctx.fillStyle = '#6af';
        ctx.beginPath();
        ctx.arc(p.x, p.y, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#8cf';
        ctx.beginPath();
        ctx.arc(p.x - 1, p.y - 1, 3, 0, Math.PI * 2);
        ctx.fill();
        continue;
      }

      if (p.type === 'homing') {
        ctx.fillStyle = '#f84';
        ctx.beginPath();
        ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fa6';
        ctx.beginPath();
        ctx.arc(p.x - 1, p.y - 2, 3, 0, Math.PI * 2);
        ctx.fill();
        continue;
      }

      if (p.type === 'boomerang') {
        ctx.fillStyle = '#4c4';
        ctx.beginPath();
        ctx.arc(p.x, p.y, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#6e6';
        ctx.beginPath();
        ctx.arc(p.x - 1, p.y - 1, 4, 0, Math.PI * 2);
        ctx.fill();
        continue;
      }

      if (p.type === 'piercing') {
        ctx.fillStyle = '#4cf';
        ctx.beginPath();
        ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#8ef';
        ctx.beginPath();
        ctx.arc(p.x - 1, p.y - 1, 2, 0, Math.PI * 2);
        ctx.fill();
        continue;
      }

      if (p.type === 'explosive') {
        ctx.fillStyle = '#f60';
        ctx.beginPath();
        ctx.arc(p.x, p.y, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#f90';
        ctx.beginPath();
        ctx.arc(p.x - 1, p.y - 1, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(255,100,0,0.3)';
        ctx.beginPath();
        ctx.arc(p.x, p.y, 11, 0, Math.PI * 2);
        ctx.fill();
        continue;
      }

      // Standard projectile with trail
      if (p._trailPoints) {
        for (var t = 0; t < p._trailPoints.length; t++) {
          var alpha = (t / p._trailPoints.length) * 0.5;
          ctx.fillStyle = 'rgba(255, 220, 50, ' + alpha + ')';
          ctx.beginPath();
          ctx.arc(p._trailPoints[t].x, p._trailPoints[t].y, 2 + t * 0.3, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.fillStyle = '#fe4';
      ctx.beginPath();
      ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffa';
      ctx.beginPath();
      ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
      ctx.fill();
    }
  },

  _renderVfx(ctx) {
    for (var i = 0; i < this.vfx.length; i++) {
      var v = this.vfx[i];
      if (v.type === 'explosion') {
        var progress = v.timer / v.duration;
        var r = v.maxRadius * progress;
        var alpha = 0.6 * (1 - progress);
        ctx.fillStyle = 'rgba(255, 120, 20, ' + alpha + ')';
        ctx.beginPath();
        ctx.arc(v.x, v.y, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(255, 200, 50, ' + (alpha * 0.7) + ')';
        ctx.beginPath();
        ctx.arc(v.x, v.y, r * 0.5, 0, Math.PI * 2);
        ctx.fill();
      }
      if (v.type === 'lightning') {
        var lalpha = 1 - v.timer / v.duration;
        ctx.strokeStyle = 'rgba(200, 220, 255, ' + lalpha + ')';
        ctx.lineWidth = 3;
        ctx.beginPath();
        for (var li = 0; li < v.points.length; li++) {
          var pt = v.points[li];
          if (li === 0) ctx.moveTo(pt.x, pt.y);
          else {
            var ox = (Math.random() - 0.5) * 10;
            var oy = (Math.random() - 0.5) * 10;
            ctx.lineTo(pt.x + ox, pt.y + oy);
          }
        }
        ctx.stroke();
      }
      if (v.type === 'slash') {
        var salpha = 1 - v.timer / v.duration;
        var sdir = v.dir;
        var sa;
        if (sdir === 0) sa = -Math.PI / 2;
        else if (sdir === 1) sa = Math.PI;
        else if (sdir === 2) sa = 0;
        else sa = Math.PI / 2;
        ctx.strokeStyle = 'rgba(255, 255, 255, ' + salpha + ')';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(v.x, v.y, 60, sa - 0.6, sa + 0.6);
        ctx.stroke();
      }
    }
  },
};

// ----- Weapon Factory Functions -----

var WEAPON_FACTORIES = {};

WEAPON_FACTORIES.magicArrow = function() {
  return {
    id: 'magicArrow', name: 'Magic Arrow', icon: '\u2192',
    cooldown: 0.6, timer: 0.6, range: 400, damage: 10,
    attack: function() {
      var rng = this.range + WeaponManager.globalRange;
      var target = findClosestEnemy(Player.x, Player.y, rng);
      if (!target) return;
      var dmg = this.damage + WeaponManager.globalDamage;
      var dx = target.x - Player.x;
      var dy = target.y - Player.y;
      var dist = Math.sqrt(dx * dx + dy * dy);
      if (dist === 0) return;
      WeaponManager.addProjectile({
        type: 'standard', trail: true,
        x: Player.x, y: Player.y,
        vx: (dx / dist) * 500, vy: (dy / dist) * 500,
        damage: dmg, maxDist: rng, distTraveled: 0,
      });
    },
  };
};

WEAPON_FACTORIES.fireball = function() {
  return {
    id: 'fireball', name: 'Fireball', icon: '*',
    cooldown: 1.8, timer: 0, range: 300, damage: 25,
    attack: function() {
      var rng = this.range + WeaponManager.globalRange;
      var target = findClosestEnemy(Player.x, Player.y, rng);
      if (!target) return;
      var dmg = this.damage + WeaponManager.globalDamage;
      var dx = target.x - Player.x;
      var dy = target.y - Player.y;
      var dist = Math.sqrt(dx * dx + dy * dy);
      if (dist === 0) return;
      WeaponManager.addProjectile({
        type: 'explosive',
        x: Player.x, y: Player.y,
        vx: (dx / dist) * 350, vy: (dy / dist) * 350,
        damage: dmg, maxDist: rng, distTraveled: 0,
        explosionRadius: 60,
      });
    },
  };
};

WEAPON_FACTORIES.throwingKnife = function() {
  return {
    id: 'throwingKnife', name: 'Throwing Knife', icon: '|',
    cooldown: 0.8, timer: 0, range: 350, damage: 15,
    attack: function() {
      var rng = this.range + WeaponManager.globalRange;
      var target = findClosestEnemy(Player.x, Player.y, rng);
      if (!target) return;
      var dmg = this.damage + WeaponManager.globalDamage;
      var dx = target.x - Player.x;
      var dy = target.y - Player.y;
      var dist = Math.sqrt(dx * dx + dy * dy);
      if (dist === 0) return;
      WeaponManager.addProjectile({
        type: 'piercing',
        x: Player.x, y: Player.y,
        vx: (dx / dist) * 600, vy: (dy / dist) * 600,
        damage: dmg, maxDist: rng, distTraveled: 0,
        remainingPierce: 3, hitEnemies: [],
      });
    },
  };
};

WEAPON_FACTORIES.axe = function() {
  return {
    id: 'axe', name: 'Axe', icon: '\u21A9',
    cooldown: 2.0, timer: 0, range: 300, damage: 30,
    attack: function() {
      var rng = this.range + WeaponManager.globalRange;
      var target = findClosestEnemy(Player.x, Player.y, rng);
      if (!target) return;
      var dmg = this.damage + WeaponManager.globalDamage;
      var dx = target.x - Player.x;
      var dy = target.y - Player.y;
      var dist = Math.sqrt(dx * dx + dy * dy);
      if (dist === 0) return;
      WeaponManager.addProjectile({
        type: 'boomerang',
        x: Player.x, y: Player.y,
        vx: (dx / dist) * 300, vy: (dy / dist) * 300,
        damage: dmg, speed: 300,
        maxDist: 250, distFromStart: 0, returning: false,
      });
    },
  };
};

WEAPON_FACTORIES.lightning = function() {
  return {
    id: 'lightning', name: 'Lightning', icon: '\u26A1',
    cooldown: 2.5, timer: 0, range: 300, damage: 30,
    chainCount: 2,
    attack: function() {
      var rng = this.range + WeaponManager.globalRange;
      var target = findClosestEnemy(Player.x, Player.y, rng);
      if (!target) return;
      var dmg = this.damage + WeaponManager.globalDamage;
      var chain = [target];
      var last = target;
      for (var c = 0; c < this.chainCount; c++) {
        var next = findClosestEnemy(last.x, last.y, 100);
        if (next && chain.indexOf(next) === -1) {
          chain.push(next);
          last = next;
        } else break;
      }
      for (var ci = 0; ci < chain.length; ci++) {
        var mult = ci === 0 ? 1 : 0.6;
        damageEnemy(chain[ci], Math.ceil(dmg * mult));
      }
      WeaponManager.addVfx({ type: 'lightning', points: chain, timer: 0, duration: 0.15 });
    },
  };
};

WEAPON_FACTORIES.holyWater = function() {
  return {
    id: 'holyWater', name: 'Holy Water', icon: '~',
    cooldown: 3.0, timer: 0, range: 200, damage: 12,
    zoneLifetime: 3,
    attack: function() {
      var rng = this.range + WeaponManager.globalRange;
      var target = findClosestEnemy(Player.x, Player.y, rng);
      var zx, zy;
      if (target) {
        zx = target.x;
        zy = target.y;
      } else {
        var angle = Math.random() * Math.PI * 2;
        zx = Player.x + Math.cos(angle) * 60;
        zy = Player.y + Math.sin(angle) * 60;
      }
      var dmg = this.damage + WeaponManager.globalDamage;
      WeaponManager.addZone({
        x: zx, y: zy, radius: 50,
        damage: dmg, lifetime: this.zoneLifetime,
        timer: 0, tickTimer: 0, tickInterval: 0.5,
      });
    },
  };
};

WEAPON_FACTORIES.bible = function() {
  return {
    id: 'bible', name: 'Bible', icon: '\u25CB',
    cooldown: 0.5, timer: 0, range: 80, damage: 15,
    orbitCount: 2, orbitSpeed: 4,
    attack: function() {
      var dmg = this.damage + WeaponManager.globalDamage;
      var r = 65 + Math.random() * 10;
      var startAngle = Math.random() * Math.PI * 2;
      for (var oi = 0; oi < this.orbitCount; oi++) {
        WeaponManager.addProjectile({
          type: 'orbital',
          x: Player.x, y: Player.y,
          angle: startAngle + (oi / this.orbitCount) * Math.PI * 2,
          radius: r + oi * 8,
          speed: this.orbitSpeed,
          damage: dmg,
          hitTimer: 0,
        });
      }
    },
  };
};

WEAPON_FACTORIES.birds = function() {
  return {
    id: 'birds', name: 'Birds', icon: 'V',
    cooldown: 2.0, timer: 0, range: 400, damage: 25,
    birdCount: 2,
    attack: function() {
      var dmg = this.damage + WeaponManager.globalDamage;
      var rng = this.range + WeaponManager.globalRange;
      for (var bi = 0; bi < this.birdCount; bi++) {
        var target = findClosestEnemy(Player.x, Player.y, rng);
        if (!target) break;
        var dx = target.x - Player.x + (Math.random() - 0.5) * 40;
        var dy = target.y - Player.y + (Math.random() - 0.5) * 40;
        var dist = Math.sqrt(dx * dx + dy * dy);
        if (dist === 0) continue;
        WeaponManager.addProjectile({
          type: 'homing',
          x: Player.x, y: Player.y,
          vx: (dx / dist) * 400, vy: (dy / dist) * 400,
          damage: dmg, maxDist: rng, distTraveled: 0,
          seek: 200, maxSpeed: 450,
        });
      }
    },
  };
};

WEAPON_FACTORIES.whip = function() {
  return {
    id: 'whip', name: 'Whip', icon: '/',
    cooldown: 0.7, timer: 0, range: 75, damage: 20,
    attack: function() {
      var dmg = this.damage + WeaponManager.globalDamage;
      var rng = this.range + WeaponManager.globalRange * 0.3;
      var arcAngle = 1.2;
      var dir = Player.dir;
      var angle;
      if (dir === 0) angle = -Math.PI / 2;
      else if (dir === 1) angle = Math.PI;
      else if (dir === 2) angle = 0;
      else angle = Math.PI / 2;
      var hitAny = false;
      for (var ei = 0; ei < Enemy.list.length; ei++) {
        var e = Enemy.list[ei];
        if (!e.alive) continue;
        var dx = e.x - Player.x;
        var dy = e.y - Player.y;
        var dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > rng || dist < 10) continue;
        var ea = Math.atan2(dy, dx);
        var diff = ea - angle;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        if (Math.abs(diff) < arcAngle / 2) {
          damageEnemy(e, dmg);
          hitAny = true;
        }
      }
      if (hitAny) {
        WeaponManager.addVfx({ type: 'slash', x: Player.x, y: Player.y, dir: dir, timer: 0, duration: 0.15 });
      }
    },
  };
};
