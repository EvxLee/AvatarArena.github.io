# Avatar Arena

This repository contains the **Avatar Arena** browser game.  All files have been
split into a simple directory structure so it is easier to maintain.

## Structure

```
AvatarArena/
├── index.html        - Main HTML page
├── style.css         - Page styles
├── game.js           - Game logic
├── data/
│   └── avatars.json  - Base stats for available avatars
├── assets/
│   ├── avatars/      - Placeholder for avatar graphics
│   └── items/        - Placeholder for future item art
└── .gitignore
```

The **data** folder keeps JSON data used by the game. Currently it stores
`avatars.json` which defines hit points, attack values and other starting stats
for each avatar class.

The **assets** folder contains placeholders for future images. Use the `assets/avatars` directory for avatar art and `assets/items` for gear images.

A `.gitignore` file is included to keep temporary files or editor caches out of
version control.

## Overview
Avatar Arena is a simple web-based 1v1 fighting game.  Pick from the Knight,
Mage or Rogue classes, each with their own stats and special move.  Battles are
turn based and award coins that can be spent in the shop on weapons, armor and
artifacts.  Items have rarity tiers and hovering over a shop button shows a
preview of a random piece of gear.  Winning fights grants experience to level up
your avatar and you can challenge a boss once you are ready.  Background colors
change based on the selected avatar to add a bit of personality.

## Playing
Simply open `index.html` in any modern browser or visit the live page below.
Use the Attack, Defend and Special buttons to defeat the CPU opponent and earn
rewards.

Play the latest build at: <https://evxlee.github.io/Test.github.io/>
