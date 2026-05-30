var PASSIVE_DEFS = {
  POWER:     { name: 'Might',        nameRu: 'Мощь',        maxLevel: 5, bonuses: { power: 0.1 } },
  ARMOR:     { name: 'Armor',        nameRu: 'Броня',       maxLevel: 3, bonuses: { armor: 1 } },
  MAXHEALTH: { name: 'Hollow Heart', nameRu: 'Пустое сердце', maxLevel: 3, bonuses: { maxHpMult: 0.1 } },
  REGEN:     { name: 'Recovery',     nameRu: 'Восстановление', maxLevel: 5, bonuses: { regen: 0.1 } },
  COOLDOWN:  { name: 'Empty Tome',   nameRu: 'Пустой фолиант', maxLevel: 5, bonuses: { cooldown: -0.025 } },
  AREA:      { name: 'Candelabrador',nameRu: 'Канделябр',   maxLevel: 5, bonuses: { area: 0.05 } },
  SPEED:     { name: 'Bracer',       nameRu: 'Наручи',      maxLevel: 5, bonuses: { speed: 0.1 } },
  DURATION:  { name: 'Spellbinder',  nameRu: 'Заклинатель',  maxLevel: 5, bonuses: { duration: 0.15 } },
  AMOUNT:    { name: 'Duplicator',   nameRu: 'Удвоитель',   maxLevel: 3, bonuses: { amount: 1 } },
  MOVESPEED: { name: 'Wings',        nameRu: 'Крылья',      maxLevel: 5, bonuses: { moveSpeed: 0.05 } },
  LUCK:      { name: 'Clover',       nameRu: 'Клевер',      maxLevel: 5, bonuses: { luck: 0.1 } },
  MAGNET:    { name: 'Attractorb',   nameRu: 'Магнит',      maxLevel: 5, bonuses: { magnet: 100 } },
  GROWTH:    { name: 'Crown',        nameRu: 'Корона',      maxLevel: 3, bonuses: { xpDiscount: 0.1 } },
};

var EVOLUTION_MAP = {
  magicArrow:    { synergy: 'COOLDOWN',  evoId: 'holyMissile' },
  whip:          { synergy: 'MAXHEALTH', evoId: 'bloodyTear' },
  axe:           { synergy: 'AREA',      evoId: 'deathSpiral' },
  throwingKnife: { synergy: 'SPEED',     evoId: 'thousandEdge' },
  lightning:     { synergy: 'AMOUNT',    evoId: 'loop' },
  fireball:      { synergy: 'POWER',     evoId: 'hellfire' },
  holyWater:     { synergy: 'MAGNET',    evoId: 'bora' },
  bible:         { synergy: 'DURATION',  evoId: 'unholyVespers' },
  birds:         { synergy: 'LUCK',      evoId: 'stigraGatti' },
};

var PassiveManager = {
  items: [],

  reset() {
    for (var i = 0; i < this.items.length; i++) {
      var item = this.items[i];
      var def = PASSIVE_DEFS[item.id];
      if (!def) continue;
      for (var l = 0; l < item.level; l++) {
        for (var k in def.bonuses) {
          if (k === 'maxHpMult') continue; // handled by Game.reset
          Player[k] -= def.bonuses[k];
        }
      }
    }
    this.items = [];
  },

  has(id) {
    for (var i = 0; i < this.items.length; i++) {
      if (this.items[i].id === id) return true;
    }
    return false;
  },

  get(id) {
    for (var i = 0; i < this.items.length; i++) {
      if (this.items[i].id === id) return this.items[i];
    }
    return null;
  },

  getLevel(id) {
    var item = this.get(id);
    return item ? item.level : 0;
  },

  isMaxed(id) {
    var item = this.get(id);
    return item ? item.level >= PASSIVE_DEFS[id].maxLevel : false;
  },

  add(id) {
    var item = this.get(id);
    var def = PASSIVE_DEFS[id];
    if (!def) return;
    if (item) {
      if (item.level >= def.maxLevel) return;
      item.level++;
    } else {
      this.items.push({ id: id, level: 1 });
      item = this.get(id);
    }
    for (var k in def.bonuses) {
      if (k === 'maxHpMult') {
        Player.maxHp = Math.ceil(Player.maxHp * (1 + def.bonuses[k]));
        Player.hp = Player.maxHp;
      } else {
        Player[k] += def.bonuses[k];
      }
    }
  },
};
