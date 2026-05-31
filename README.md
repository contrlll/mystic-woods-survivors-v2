# Mystic Woods Survivors

A vampire survivors-inspired game with toroidal (wrap-around) world mechanics, pixel-art graphics, and local multiplayer-ready design.

## 🎮 Game Overview

Mystic Woods Survivors is a fast-paced action roguelite where you survive endless waves of monsters by collecting experience, leveling up, and choosing powerful upgrades. The game features a unique wrapping world mechanic where the map edges connect like a torus (donut), creating interesting strategic possibilities for positioning and combat.

## 🌟 Features

- **Toroidal World**: The game world wraps both horizontally and vertically - move off one edge and appear on the opposite side
- **16 Unique Weapons**: Each with distinct mechanics and upgrade paths
- **11 Passive Items**: Stat boosts that synergize with your weapons
- **Pixel Art Graphics**: Custom 32x32 pixel-art sprites for all weapons and passives
- **Progressive Difficulty**: Increasingly challenging enemy waves with bosses
- **Local Co-op Ready**: Designed for easy addition of second player
- **Responsive Design**: Works on desktop and mobile browsers

## 🎯 How to Play

1. Move your character with WASD or arrow keys
2. Weapons auto-fire at nearby enemies
3. Collect experience gems from defeated enemies to level up
4. Choose upgrades when you level up to enhance your build
5. Survive as long as possible against increasingly difficult waves
6. When you die, spend collected gold on permanent upgrades (future feature)

## 🛠️ Development

This game was built with vanilla JavaScript and HTML5 Canvas. No external dependencies or frameworks were used.

### Project Structure

```
game/
├── index.html          # Main HTML file
├── style.css           # All styling
├── script.js           # Game initialization and UI
├── player.js           # Player logic
├── enemy.js            # Enemy AI and behavior
├── spawner.js          # Enemy spawning system
├── weapon.js           # Weapon systems and attacks
├── passives.js         # Passive item systems
├── ui.js               # Rendering and visual effects
└── assets/
    ├── photos/         # Developer photos
    └── sprites/
        └── weapons/    # All weapon and passive pixel-art (33 sprites)
```

### Key Technical Features

- **Toroidal Math**: Custom `Game.wrap()` and `Game.unwrap()` functions handle world wrapping
- **Entity Management**: All game objects (player, enemies, projectiles) managed in centralized lists
- **Weapon Factory Pattern**: Each weapon is defined as a factory function returning configuration object
- **Passive Synergy System**: Items grant stat bonuses and can trigger weapon evolutions
- **Visual Effects**: Particle systems, screen shake, and Flash effects for impact

## 👥 Developers

This game was created by two exceptional programmers:

- **Артём** - Backend architecture, game systems, and core mechanics
- **Салават** - Frontend implementation, UI/UX, and visual polish

Their combined expertise resulted in a game that pushes the boundaries of what's possible in browser-based gaming.

## 📱 Play Now

Open `index.html` in any modern web browser to play. The game works best on desktop browsers but is also playable on mobile devices.

## 🔜 Future Plans

- Permanent upgrade system between runs
- Additional characters with unique starting loadouts
- More enemy types and boss battles
- Local two-player co-op mode
- Soundtrack and enhanced audio effects
- Leaderboards and achievements

---

*Mystic Woods Survivors v1.0*  
*Created with passion by Артём and Салават*