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

## Playing
Simply open `index.html` in any modern browser and choose an avatar. Battle the
CPU opponent using the provided Attack, Defend and Special buttons.
