function findClosestEnemy(x, y, range) {
  var closest = null;
  var minDist = Infinity;
  for (var i = 0; i < Enemy.list.length; i++) {
    var e = Enemy.list[i];
    if (!e.alive) continue;
    var dx = e.x - x;
    var dy = e.y - y;
    var distSq = dx * dx + dy * dy;
    if (distSq < minDist && distSq < range * range) {
      minDist = distSq;
      closest = e;
    }
  }
  return closest;
}

function findEnemiesInRadius(x, y, radius) {
  var result = [];
  for (var i = 0; i < Enemy.list.length; i++) {
    var e = Enemy.list[i];
    if (!e.alive) continue;
    var dx = e.x - x;
    var dy = e.y - y;
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

var WEAPON_SPRITE_MAP = {
  magicArrow: 'bow',
  fireball: 'crystalsword',
  throwingKnife: 'dagger',
  axe: 'doubleaxe',
  lightning: null,
  holyWater: null,
  bible: 'longsword',

  whip: 'flail',
  holyMissile: 'bow',
  bloodyTear: 'flail',
  deathSpiral: 'doubleaxe',
  thousandEdge: 'dagger',
  hellfire: 'crystalsword',
  bora: null,
  loop: null,
  unholyVespers: null,

};

function getSpawnPos() {
  var side = Math.floor(Math.random() * 4);
  var cam = Game.camera;
  var w = Game.width;
  var h = Game.height;
  var margin = Math.max(w, h) * 0.6;
  var spread = Math.max(w, h) * 0.4;
  var x, y;
  if (side === 0) { x = cam.x + Math.random() * w; y = cam.y - margin - Math.random() * spread; }
  else if (side === 1) { x = cam.x + w + margin + Math.random() * spread; y = cam.y + Math.random() * h; }
  else if (side === 2) { x = cam.x + Math.random() * w; y = cam.y + h + margin + Math.random() * spread; }
  else { x = cam.x - margin - Math.random() * spread; y = cam.y + Math.random() * h; }
  return { x: x, y: y };
}

var _currentWeaponId = null;

function createWeapon(config) {
  return {
    id: config.id,
    name: config.name,
    nameRu: config.nameRu || config.name,
    level: 1,
    maxLevel: 8,
    timer: config.base.interval ? (config.base.interval / 1000) : 0,
    base: config.base,
    bonuses: config.bonuses || [],
    evoSynergy: config.evoSynergy || null,
    evoId: config.evoId || null,
    hitDelay: config.hitDelay || 0,
    intervalDependsOnDuration: config.intervalDependsOnDuration || false,

    getStat: function(name) {
      var val = this.base[name] || 0;
      for (var i = 0; i < this.level - 1 && i < this.bonuses.length; i++) {
        val += this.bonuses[i][name] || 0;
      }
      return val;
    },

    canEvolve: function() {
      if (this.level < this.maxLevel || !this.evoSynergy) return false;
      return PassiveManager.isMaxed(this.evoSynergy);
    },

    attack: function() {
      _currentWeaponId = this.id;
      config.attack.call(this);
      _currentWeaponId = null;
    },
  };
}

var WEAPON_FACTORIES = {};

WEAPON_FACTORIES.magicArrow = function() {
  return createWeapon({
    id: 'magicArrow', name: 'Magic Wand', nameRu: 'Волшебная палочка',
    base: { power: 1, interval: 1200, area: 1, speed: 1, amount: 1, penetrating: 1 },
    bonuses: [
      { amount: 1 }, { interval: -200 }, { amount: 1 },
      { power: 1 }, { amount: 1 }, { penetrating: 1 }, { power: 1 },
    ],
    evoSynergy: 'COOLDOWN', evoId: 'holyMissile',
    attack: function() {
      var range = 400 * Player.area;
      var target = findClosestEnemy(Player.x, Player.y, range);
      if (!target) return;
      var dmg = Math.ceil(10 * this.getStat('power') * Player.power) + WeaponManager.globalDamage;
      var amt = this.getStat('amount') + Player.amount;
      for (var ai = 0; ai < amt; ai++) {
        var spd = 500 * Player.speed;
        var dx = target.x - Player.x + (Math.random() - 0.5) * 30 * ai;
        var dy = target.y - Player.y + (Math.random() - 0.5) * 30 * ai;
        var dist = Math.sqrt(dx * dx + dy * dy);
        if (dist === 0) continue;
        WeaponManager.addProjectile({
          type: 'standard', trail: true,
          x: Player.x, y: Player.y,
          vx: (dx / dist) * spd, vy: (dy / dist) * spd,
          damage: dmg, maxDist: range, distTraveled: 0,
        });
      }
    },
  });
};

WEAPON_FACTORIES.fireball = function() {
  return createWeapon({
    id: 'fireball', name: 'Fire Wand', nameRu: 'Огненный жезл',
    base: { power: 2, interval: 3000, area: 1, speed: 0.75, amount: 3, duration: 100 },
    bonuses: [
      { power: 1 }, { power: 1, speed: 0.2 }, { power: 1 },
      { power: 1, speed: 0.2 }, { power: 1 }, { power: 1, speed: 0.2 }, { power: 1 },
    ],
    evoSynergy: 'POWER', evoId: 'hellfire',
    attack: function() {
      var range = 300 * Player.area;
      var target = findClosestEnemy(Player.x, Player.y, range);
      if (!target) return;
      var dmg = Math.ceil(10 * this.getStat('power') * Player.power) + WeaponManager.globalDamage;
      var amt = this.getStat('amount') + Player.amount;
      for (var ai = 0; ai < amt; ai++) {
        var spd = 350 * Player.speed;
        var dx = target.x - Player.x + (Math.random() - 0.5) * 50;
        var dy = target.y - Player.y + (Math.random() - 0.5) * 50;
        var dist = Math.sqrt(dx * dx + dy * dy);
        if (dist === 0) continue;
        WeaponManager.addProjectile({
          type: 'explosive',
          x: Player.x, y: Player.y,
          vx: (dx / dist) * spd, vy: (dy / dist) * spd,
          damage: dmg, maxDist: range, distTraveled: 0,
          explosionRadius: 60 * Player.area,
        });
      }
    },
  });
};

WEAPON_FACTORIES.throwingKnife = function() {
  return createWeapon({
    id: 'throwingKnife', name: 'Knife', nameRu: 'Нож',
    base: { power: 0.65, interval: 1000, area: 1, speed: 1, amount: 1, penetrating: 1 },
    bonuses: [
      { amount: 1 }, { amount: 1, power: 0.5 }, { amount: 1 },
      { penetrating: 1 }, { amount: 1, power: 0.5 }, { amount: 1 }, { penetrating: 1 },
    ],
    evoSynergy: 'SPEED', evoId: 'thousandEdge',
    attack: function() {
      var range = 350 * Player.area;
      var target = findClosestEnemy(Player.x, Player.y, range);
      if (!target) return;
      var dmg = Math.ceil(10 * this.getStat('power') * Player.power) + WeaponManager.globalDamage;
      var amt = this.getStat('amount') + Player.amount;
      for (var ai = 0; ai < amt; ai++) {
        var spd = 600 * Player.speed;
        var dx = target.x - Player.x + (Math.random() - 0.5) * 20;
        var dy = target.y - Player.y + (Math.random() - 0.5) * 20;
        var dist = Math.sqrt(dx * dx + dy * dy);
        if (dist === 0) continue;
        WeaponManager.addProjectile({
          type: 'piercing',
          x: Player.x, y: Player.y,
          vx: (dx / dist) * spd, vy: (dy / dist) * spd,
          damage: dmg, maxDist: range, distTraveled: 0,
          remainingPierce: Math.max(1, this.getStat('penetrating')),
          hitEnemies: [],
        });
      }
    },
  });
};

WEAPON_FACTORIES.axe = function() {
  return createWeapon({
    id: 'axe', name: 'Axe', nameRu: 'Топор',
    base: { power: 2, interval: 4000, area: 1, speed: 1, amount: 1, penetrating: 3, duration: 2000 },
    bonuses: [
      { amount: 1 }, { power: 2 }, { penetrating: 2 },
      { amount: 1 }, { power: 2 }, { penetrating: 2 }, { power: 2 },
    ],
    evoSynergy: 'AREA', evoId: 'deathSpiral',
    attack: function() {
      var range = 300 * Player.area;
      var target = findClosestEnemy(Player.x, Player.y, range);
      if (!target) return;
      var dmg = Math.ceil(10 * this.getStat('power') * Player.power) + WeaponManager.globalDamage;
      var amt = this.getStat('amount') + Player.amount;
      for (var ai = 0; ai < amt; ai++) {
        var spd = 300 * Player.speed;
        var dx = target.x - Player.x + (Math.random() - 0.5) * 40;
        var dy = target.y - Player.y + (Math.random() - 0.5) * 40;
        var dist = Math.sqrt(dx * dx + dy * dy);
        if (dist === 0) continue;
        WeaponManager.addProjectile({
          type: 'boomerang',
          x: Player.x, y: Player.y,
          vx: (dx / dist) * spd, vy: (dy / dist) * spd,
          damage: dmg, speed: spd,
          maxDist: 250 * Player.area, distFromStart: 0, returning: false,
        });
      }
    },
  });
};

WEAPON_FACTORIES.lightning = function() {
  return createWeapon({
    id: 'lightning', name: 'Lightning Ring', nameRu: 'Кольцо молний',
    base: { power: 1.5, interval: 4500, area: 1, speed: 1, amount: 2 },
    bonuses: [
      { amount: 1 }, { area: 1, power: 1 }, { amount: 1 },
      { area: 1, power: 2 }, { amount: 1 }, { area: 1, power: 2 }, { amount: 1 },
    ],
    evoSynergy: 'AMOUNT', evoId: 'loop',
    attack: function() {
      var range = 300 * Player.area;
      var dmg = Math.ceil(10 * this.getStat('power') * Player.power) + WeaponManager.globalDamage;
      var chains = this.getStat('amount') + Player.amount;
      var target = findClosestEnemy(Player.x, Player.y, range);
      if (!target) return;
      var chain = [target];
      var last = target;
      for (var c = 0; c < chains; c++) {
        var next = findClosestEnemy(last.x, last.y, 100);
        if (next && chain.indexOf(next) === -1) { chain.push(next); last = next; }
        else break;
      }
      for (var ci = 0; ci < chain.length; ci++) {
        damageEnemy(chain[ci], Math.ceil(dmg * (ci === 0 ? 1 : 0.6)));
      }
      WeaponManager.addVfx({ type: 'lightning', points: chain, timer: 0, duration: 0.15 });
    },
  });
};

WEAPON_FACTORIES.loop = function() {
  return createWeapon({
    id: 'loop', name: 'Thunder Loop', nameRu: 'Громовая петля',
    base: { power: 3, interval: 3000, area: 1.5, speed: 1, amount: 4 },
    bonuses: [],
    attack: function() {
      var range = 400 * Player.area;
      var dmg = Math.ceil(10 * this.getStat('power') * Player.power) + WeaponManager.globalDamage;
      var chains = this.getStat('amount') + Player.amount;
      var target = findClosestEnemy(Player.x, Player.y, range);
      if (!target) return;
      var chain = [target];
      var last = target;
      for (var c = 0; c < chains; c++) {
        var next = findClosestEnemy(last.x, last.y, 120);
        if (next && chain.indexOf(next) === -1) { chain.push(next); last = next; }
        else break;
      }
      for (var ci = 0; ci < chain.length; ci++) {
        damageEnemy(chain[ci], Math.ceil(dmg * (ci === 0 ? 1 : 0.7)));
      }
      WeaponManager.addVfx({ type: 'lightning', points: chain, timer: 0, duration: 0.2 });
    },
  });
};

WEAPON_FACTORIES.holyWater = function() {
  return createWeapon({
    id: 'holyWater', name: 'Santa Water', nameRu: 'Святая вода',
    base: { power: 1, interval: 4500, area: 1, speed: 1, amount: 1, duration: 2000 },
    bonuses: [
      { amount: 1, area: 0.2 }, { power: 1, duration: 500 },
      { amount: 1, area: 0.2 }, { power: 1, duration: 250 },
      { amount: 1, area: 0.2 }, { power: 0.5, duration: 250 }, { power: 0.5, area: 0.2 },
    ],
    evoSynergy: 'MAGNET', evoId: 'bora',
    attack: function() {
      var range = 200 * Player.area;
      var target = findClosestEnemy(Player.x, Player.y, range);
      var zx, zy;
      if (target) { zx = target.x; zy = target.y; }
      else {
        var angle = Math.random() * Math.PI * 2;
        zx = Player.x + Math.cos(angle) * 60;
        zy = Player.y + Math.sin(angle) * 60;
      }
      var dmg = Math.ceil(10 * this.getStat('power') * Player.power) + WeaponManager.globalDamage;
      var zoneRadius = 50 * Player.area;
      var lifetime = (this.getStat('duration') / 1000) * Player.duration;
        WeaponManager.addZone({
          x: Game.wrap(zx), y: Game.wrap(zy), radius: zoneRadius,
          damage: dmg, lifetime: Math.max(1, lifetime),
          timer: 0, tickTimer: 0, tickInterval: 0.5,
        });
    },
  });
};

WEAPON_FACTORIES.bible = function() {
  return createWeapon({
    id: 'bible', name: 'King Bible', nameRu: 'Королевская библия',
    base: { power: 1, interval: 3000, area: 1, speed: 1, amount: 1, duration: 3000 },
    bonuses: [
      { amount: 1 },
      { speed: 0.3, area: 0.25 },
      { duration: 500, power: 1 },
      { amount: 1 },
      { speed: 0.3, area: 0.25 },
      { duration: 500, power: 1 },
      { amount: 1 },
    ],
    hitDelay: 1.7,
    evoSynergy: 'DURATION', evoId: 'unholyVespers',
    attack: function() {
      var dmg = Math.ceil(10 * this.getStat('power') * Player.power) + WeaponManager.globalDamage;
      var amt = this.getStat('amount') + Player.amount;
      var lifetime = (this.getStat('duration') / 1000) * Player.duration;
      for (var oi = 0; oi < amt; oi++) {
        var r = 65 * Player.area + Math.random() * 10;
        var startAngle = Math.random() * Math.PI * 2;
        WeaponManager.addProjectile({
          type: 'orbital',
          x: Player.x, y: Player.y,
          angle: startAngle + (oi / amt) * Math.PI * 2,
          radius: r + oi * 8,
          speed: 4 * Player.speed,
          damage: dmg,
          lifetime: Math.max(0.5, lifetime),
          timer: 0,
          hitDelay: this.hitDelay,
          hitTimer: 0,
        });
      }
    },
  });
};



WEAPON_FACTORIES.whip = function() {
  return createWeapon({
    id: 'whip', name: 'Whip', nameRu: 'Кнут',
    base: { power: 1, interval: 1350, area: 1, speed: 1, amount: 1 },
    bonuses: [
      { amount: 1 }, { power: 0.5 }, { power: 0.5, area: 0.1 },
      { power: 0.5 }, { power: 0.5, area: 0.1 }, { power: 0.5 }, { power: 0.5 },
    ],
    evoSynergy: 'MAXHEALTH', evoId: 'bloodyTear',
    attack: function() {
      var dmg = Math.ceil(10 * this.getStat('power') * Player.power) + WeaponManager.globalDamage;
      var range = 75 * Player.area;
      var arcAngle = 1.2;
      var dir = Player.dir;
      var angle;
      if (dir === 0) angle = -Math.PI / 2;
      else if (dir === 1) angle = Math.PI;
      else if (dir === 2) angle = 0;
      else angle = Math.PI / 2;
      var amt = this.getStat('amount') + Player.amount;
      var hitAny = false;
      for (var ai = 0; ai < amt; ai++) {
        var offsetAngle = (ai - (amt - 1) / 2) * 0.3;
        for (var ei = 0; ei < Enemy.list.length; ei++) {
          var e = Enemy.list[ei];
          if (!e.alive) continue;
          var dx = e.x - Player.x;
          var dy = e.y - Player.y;
          var dist = Math.sqrt(dx * dx + dy * dy);
          if (dist > range || dist < 10) continue;
          var ea = Math.atan2(dy, dx);
          var diff = ea - (angle + offsetAngle);
          while (diff > Math.PI) diff -= Math.PI * 2;
          while (diff < -Math.PI) diff += Math.PI * 2;
          if (Math.abs(diff) < arcAngle / 2) {
            damageEnemy(e, Math.ceil(dmg / amt));
            hitAny = true;
          }
        }
      }
      if (hitAny) {
        WeaponManager.addVfx({ type: 'slash', x: Player.x, y: Player.y, dir: dir, timer: 0, duration: 0.15 });
      }
    },
  });
};

// ===== Evolved Weapons =====

WEAPON_FACTORIES.holyMissile = function() {
  return createWeapon({
    id: 'holyMissile', name: 'Holy Wand', nameRu: 'Святая палочка',
    base: { power: 3, interval: 500, area: 1, speed: 2, amount: 4, penetrating: 2 },
    bonuses: [],
    attack: function() {
      var range = 500 * Player.area;
      var target = findClosestEnemy(Player.x, Player.y, range);
      if (!target) return;
      var dmg = Math.ceil(10 * this.getStat('power') * Player.power) + WeaponManager.globalDamage;
      var amt = this.getStat('amount') + Player.amount;
      for (var ai = 0; ai < amt; ai++) {
        var spd = 700 * Player.speed;
        var dx = target.x - Player.x + (Math.random() - 0.5) * 20;
        var dy = target.y - Player.y + (Math.random() - 0.5) * 20;
        var dist = Math.sqrt(dx * dx + dy * dy);
        if (dist === 0) continue;
        WeaponManager.addProjectile({
          type: 'standard', trail: true,
          x: Player.x, y: Player.y,
          vx: (dx / dist) * spd, vy: (dy / dist) * spd,
          damage: dmg, maxDist: range, distTraveled: 0,
        });
      }
    },
  });
};

WEAPON_FACTORIES.bloodyTear = function() {
  return createWeapon({
    id: 'bloodyTear', name: 'Bloody Tear', nameRu: 'Кровавая слеза',
    base: { power: 4, interval: 1350, area: 1.3, speed: 1, amount: 2 },
    bonuses: [],
    attack: function() {
      var dmg = Math.ceil(10 * this.getStat('power') * Player.power) + WeaponManager.globalDamage;
      var range = 90 * Player.area;
      var dir = Player.dir;
      var angle;
      if (dir === 0) angle = -Math.PI / 2;
      else if (dir === 1) angle = Math.PI;
      else if (dir === 2) angle = 0;
      else angle = Math.PI / 2;
      var amt = this.getStat('amount') + Player.amount;
      var hitAny = false;
      for (var ai = 0; ai < amt; ai++) {
        var offset = (ai - (amt - 1) / 2) * 0.3;
        for (var ei = 0; ei < Enemy.list.length; ei++) {
          var e = Enemy.list[ei];
          if (!e.alive) continue;
          var dx = e.x - Player.x;
          var dy = e.y - Player.y;
          var dist = Math.sqrt(dx * dx + dy * dy);
          if (dist > range || dist < 10) continue;
          var ea = Math.atan2(dy, dx);
          var diff = ea - (angle + offset);
          while (diff > Math.PI) diff -= Math.PI * 2;
          while (diff < -Math.PI) diff += Math.PI * 2;
          if (Math.abs(diff) < 0.6) {
            damageEnemy(e, dmg);
            Player.hp = Math.min(Player.maxHp, Player.hp + 1);
            hitAny = true;
          }
        }
      }
      if (hitAny) {
        WeaponManager.addVfx({ type: 'slash', x: Player.x, y: Player.y, dir: dir, timer: 0, duration: 0.15 });
      }
    },
  });
};

WEAPON_FACTORIES.deathSpiral = function() {
  return createWeapon({
    id: 'deathSpiral', name: 'Death Spiral', nameRu: 'Спираль смерти',
    base: { power: 6, interval: 4000, area: 1.2, speed: 0.8, amount: 9, penetrating: 1000 },
    bonuses: [],
    attack: function() {
      var range = 350 * Player.area;
      var dmg = Math.ceil(10 * this.getStat('power') * Player.power) + WeaponManager.globalDamage;
      var amt = this.getStat('amount') + Player.amount;
      for (var ai = 0; ai < amt; ai++) {
        var angle = (ai / amt) * Math.PI * 2;
        var spd = 300 * Player.speed;
        WeaponManager.addProjectile({
          type: 'boomerang',
          x: Player.x, y: Player.y,
          vx: Math.cos(angle) * spd, vy: Math.sin(angle) * spd,
          damage: dmg, speed: spd,
          maxDist: 300 * Player.area, distFromStart: 0, returning: false,
        });
      }
    },
  });
};

WEAPON_FACTORIES.thousandEdge = function() {
  return createWeapon({
    id: 'thousandEdge', name: 'Thousand Edge', nameRu: 'Тысяча лезвий',
    base: { power: 1.65, interval: 350, area: 1, speed: 1.5, amount: 6, penetrating: 3 },
    bonuses: [],
    attack: function() {
      var range = 400 * Player.area;
      var dmg = Math.ceil(10 * this.getStat('power') * Player.power) + WeaponManager.globalDamage;
      var amt = this.getStat('amount') + Player.amount;
      for (var ai = 0; ai < amt; ai++) {
        var angle = (ai / amt) * Math.PI * 2 - Math.PI / 2;
        var spd = 700 * Player.speed;
        WeaponManager.addProjectile({
          type: 'piercing',
          x: Player.x, y: Player.y,
          vx: Math.cos(angle) * spd, vy: Math.sin(angle) * spd,
          damage: dmg, maxDist: range, distTraveled: 0,
          remainingPierce: 3, hitEnemies: [],
        });
      }
    },
  });
};

WEAPON_FACTORIES.hellfire = function() {
  return createWeapon({
    id: 'hellfire', name: 'Hellfire', nameRu: 'Адский огонь',
    base: { power: 5, interval: 2500, area: 1, speed: 0.6, amount: 6, duration: 200 },
    bonuses: [],
    attack: function() {
      var range = 350 * Player.area;
      var dmg = Math.ceil(10 * this.getStat('power') * Player.power) + WeaponManager.globalDamage;
      var amt = this.getStat('amount') + Player.amount;
      for (var ai = 0; ai < amt; ai++) {
        var target = findClosestEnemy(Player.x, Player.y, range);
        if (!target) break;
        var spd = 400 * Player.speed;
        var dx = target.x - Player.x + (Math.random() - 0.5) * 60;
        var dy = target.y - Player.y + (Math.random() - 0.5) * 60;
        var dist = Math.sqrt(dx * dx + dy * dy);
        if (dist === 0) continue;
        WeaponManager.addProjectile({
          type: 'explosive',
          x: Player.x, y: Player.y,
          vx: (dx / dist) * spd, vy: (dy / dist) * spd,
          damage: dmg, maxDist: range, distTraveled: 0,
          explosionRadius: 80 * Player.area,
        });
      }
    },
  });
};

WEAPON_FACTORIES.bora = function() {
  return createWeapon({
    id: 'bora', name: 'Bora', nameRu: 'Бора',
    base: { power: 2, interval: 3500, area: 1, speed: 1, amount: 3, duration: 3500 },
    bonuses: [],
    attack: function() {
      var dmg = Math.ceil(10 * this.getStat('power') * Player.power) + WeaponManager.globalDamage;
      var amt = this.getStat('amount') + Player.amount;
      for (var ai = 0; ai < amt; ai++) {
        var zx = Player.x + (Math.random() - 0.5) * 100;
        var zy = Player.y + (Math.random() - 0.5) * 100;
        var zoneRadius = 60 * Player.area;
        var lifetime = (this.getStat('duration') / 1000) * Player.duration;
        WeaponManager.addZone({
          x: zx, y: zy, radius: zoneRadius,
          damage: dmg, lifetime: Math.max(1, lifetime),
          timer: 0, tickTimer: 0, tickInterval: 0.4,
        });
      }
    },
  });
};

WEAPON_FACTORIES.unholyVespers = function() {
  return createWeapon({
    id: 'unholyVespers', name: 'Unholy Vespers', nameRu: 'Нечестивая вечерня',
    base: { power: 3, interval: 3000, area: 1.75, speed: 1.5, amount: 4, duration: 3000 },
    bonuses: [],
    hitDelay: 1.7,
    intervalDependsOnDuration: true,
    attack: function() {
      var dmg = Math.ceil(10 * this.getStat('power') * Player.power) + WeaponManager.globalDamage;
      var amt = this.getStat('amount') + Player.amount;
      var lifetime = (this.getStat('duration') / 1000) * Player.duration;
      for (var oi = 0; oi < amt; oi++) {
        var r = 80 * Player.area + Math.random() * 10;
        var startAngle = Math.random() * Math.PI * 2;
        WeaponManager.addProjectile({
          type: 'orbital',
          x: Player.x, y: Player.y,
          angle: startAngle + (oi / amt) * Math.PI * 2,
          radius: r + oi * 10,
          speed: 5 * Player.speed,
          damage: dmg,
          lifetime: Math.max(0.5, lifetime),
          timer: 0,
          hitDelay: this.hitDelay,
          hitTimer: 0,
        });
      }
    },
  });
};



// ===== Weapon Manager =====

var WeaponManager = {
  weapons: [],
  projectiles: [],
  vfx: [],
  zones: [],
  globalDamage: 0,

  reset: function() {
    this.weapons = [];
    this.projectiles = [];
    this.vfx = [];
    this.zones = [];
    this.globalDamage = 0;
    this.addWeapon('throwingKnife');
  },

  hasWeapon: function(id) {
    for (var i = 0; i < this.weapons.length; i++) {
      if (this.weapons[i].id === id) return true;
    }
    return false;
  },

  addWeapon: function(id) {
    if (this.hasWeapon(id)) return;
    var fn = WEAPON_FACTORIES[id];
    if (fn) this.weapons.push(fn());
  },

  getLevelableWeapons: function() {
    var result = [];
    for (var i = 0; i < this.weapons.length; i++) {
      var w = this.weapons[i];
      if (w.level < w.maxLevel) result.push(w);
    }
    return result;
  },

  getEvolvableWeapons: function() {
    var result = [];
    for (var i = 0; i < this.weapons.length; i++) {
      var w = this.weapons[i];
      if (w.canEvolve()) result.push(w);
    }
    return result;
  },

  evolveWeapon: function(oldWeapon) {
    var evoId = oldWeapon.evoId;
    if (!evoId) return;
    for (var i = 0; i < this.weapons.length; i++) {
      if (this.weapons[i] === oldWeapon) {
        var fn = WEAPON_FACTORIES[evoId];
        if (fn) this.weapons[i] = fn();
        break;
      }
    }
  },

  update: function(dt) {
    for (var wi = 0; wi < this.weapons.length; wi++) {
      var w = this.weapons[wi];
      w.timer += dt;
      var cd;
      if (w.intervalDependsOnDuration) {
        cd = (w.getStat('duration') / 1000) * Player.duration;
      } else {
        cd = (w.getStat('interval') / 1000) * Player.cooldown;
      }
      if (w.timer >= cd) {
        w.timer -= cd;
        w.attack();
      }
    }
    this._updateProjectiles(dt);
    this._updateZones(dt);
    this._updateVfx(dt);
  },

  render: function(ctx) {
    this._renderZones(ctx);
    this._renderProjectiles(ctx);
    this._renderVfx(ctx);
  },

  addProjectile: function(cfg) {
    if (_currentWeaponId) cfg._weapon = _currentWeaponId;
    this.projectiles.push(cfg);
  },
  addVfx: function(cfg) { this.vfx.push(cfg); },
  addZone: function(cfg) { this.zones.push(cfg); },

  _updateProjectiles: function(dt) {
    var list = this.projectiles;
    for (var i = list.length - 1; i >= 0; i--) {
      var p = list[i];

      if (p.type === 'orbital') {
        p.timer += dt;
        if (p.lifetime && p.timer >= p.lifetime) { list.splice(i, 1); continue; }
        p.angle += p.speed * dt;
        p.x = Player.x + Math.cos(p.angle) * p.radius;
        p.y = Player.y + Math.sin(p.angle) * p.radius;
        if (p.timer < p.hitDelay) continue;
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
        p.x = Game.wrap(p.x); p.y = Game.wrap(p.y);
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
      p.x = Game.wrap(p.x); p.y = Game.wrap(p.y);
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
          this._explode(p.x, p.y, p.explosionRadius, Math.ceil(p.damage * 0.4));
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
            this._explode(p.x, p.y, p.explosionRadius, Math.ceil(p.damage * 0.5));
            hit = true;
            break;
          }
        }
        if (hit) { list.splice(i, 1); continue; }
        continue;
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
    }
  },

  _explode: function(x, y, radius, dmg) {
    this.addVfx({ type: 'explosion', x: x, y: y, timer: 0, duration: 0.3, maxRadius: radius });
    var enemies = findEnemiesInRadius(x, y, radius);
    for (var i = 0; i < enemies.length; i++) {
      damageEnemy(enemies[i], dmg);
    }
  },

  _updateZones: function(dt) {
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

  _updateVfx: function(dt) {
    for (var i = this.vfx.length - 1; i >= 0; i--) {
      var v = this.vfx[i];
      v.timer += dt;
      if (v.timer >= v.duration) this.vfx.splice(i, 1);
    }
  },

  _renderZones: function(ctx) {
    for (var i = 0; i < this.zones.length; i++) {
      var z = this.zones[i];
      var alpha = 0.4 * (1 - z.timer / z.lifetime);
      if (alpha < 0) alpha = 0;
      ctx.fillStyle = 'rgba(100, 180, 255, ' + alpha + ')';
      ctx.beginPath();
      ctx.arc(z.x, z.y, z.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(100, 180, 255, ' + (alpha * 1.5) + ')';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  },

  _renderProjectileSprite: function(ctx, p) {
    var spriteName = p._weapon ? WEAPON_SPRITE_MAP[p._weapon] : null;
    var sprite = spriteName ? Game.sprites[spriteName] : null;
    if (sprite && sprite.width > 0) {
      var sz = 24;
      ctx.imageSmoothingEnabled = false;
      ctx.save();
      ctx.translate(p.x, p.y);
      if (p.type === 'piercing' && (p.vx !== undefined || p.vy !== undefined)) {
        ctx.rotate(Math.atan2(p.vy || 0, p.vx || 1));
      }
      ctx.drawImage(sprite, -sz / 2, -sz / 2, sz, sz);
      ctx.restore();
      ctx.imageSmoothingEnabled = true;
      return true;
    }
    return false;
  },

  _renderProjectiles: function(ctx) {
    for (var i = 0; i < this.projectiles.length; i++) {
      var p = this.projectiles[i];
      if (p.type === 'orbital') {
        if (this._renderProjectileSprite(ctx, p)) continue;
        ctx.fillStyle = '#6af';
        ctx.beginPath(); ctx.arc(p.x, p.y, 6, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#8cf';
        ctx.beginPath(); ctx.arc(p.x - 1, p.y - 1, 3, 0, Math.PI * 2); ctx.fill();
        continue;
      }
      if (p.type === 'homing') {
        if (this._renderProjectileSprite(ctx, p)) continue;
        ctx.fillStyle = '#f84';
        ctx.beginPath(); ctx.arc(p.x, p.y, 5, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#fa6';
        ctx.beginPath(); ctx.arc(p.x - 1, p.y - 2, 3, 0, Math.PI * 2); ctx.fill();
        continue;
      }
      if (p.type === 'boomerang') {
        if (this._renderProjectileSprite(ctx, p)) continue;
        ctx.fillStyle = '#4c4';
        ctx.beginPath(); ctx.arc(p.x, p.y, 7, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#6e6';
        ctx.beginPath(); ctx.arc(p.x - 1, p.y - 1, 4, 0, Math.PI * 2); ctx.fill();
        continue;
      }
      if (p.type === 'piercing') {
        if (this._renderProjectileSprite(ctx, p)) continue;
        ctx.fillStyle = '#4cf';
        ctx.beginPath(); ctx.arc(p.x, p.y, 4, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#8ef';
        ctx.beginPath(); ctx.arc(p.x - 1, p.y - 1, 2, 0, Math.PI * 2); ctx.fill();
        continue;
      }
      if (p.type === 'explosive') {
        if (this._renderProjectileSprite(ctx, p)) continue;
        ctx.fillStyle = '#f60';
        ctx.beginPath(); ctx.arc(p.x, p.y, 7, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#f90';
        ctx.beginPath(); ctx.arc(p.x - 1, p.y - 1, 4, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = 'rgba(255,100,0,0.3)';
        ctx.beginPath(); ctx.arc(p.x, p.y, 11, 0, Math.PI * 2); ctx.fill();
        continue;
      }
      if (this._renderProjectileSprite(ctx, p)) continue;
      if (p._trailPoints) {
        for (var t = 0; t < p._trailPoints.length; t++) {
          var alpha = (t / p._trailPoints.length) * 0.5;
          ctx.fillStyle = 'rgba(255, 220, 50, ' + alpha + ')';
          ctx.beginPath(); ctx.arc(p._trailPoints[t].x, p._trailPoints[t].y, 2 + t * 0.3, 0, Math.PI * 2); ctx.fill();
        }
      }
      ctx.fillStyle = '#fe4';
      ctx.beginPath(); ctx.arc(p.x, p.y, 5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ffa';
      ctx.beginPath(); ctx.arc(p.x, p.y, 2, 0, Math.PI * 2); ctx.fill();
    }
  },

  _renderVfx: function(ctx) {
    for (var i = 0; i < this.vfx.length; i++) {
      var v = this.vfx[i];
      if (v.type === 'explosion') {
        var progress = v.timer / v.duration;
        var r = v.maxRadius * progress;
        var alpha = 0.6 * (1 - progress);
        ctx.fillStyle = 'rgba(255, 120, 20, ' + alpha + ')';
        ctx.beginPath(); ctx.arc(v.x, v.y, r, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = 'rgba(255, 200, 50, ' + (alpha * 0.7) + ')';
        ctx.beginPath(); ctx.arc(v.x, v.y, r * 0.5, 0, Math.PI * 2); ctx.fill();
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
