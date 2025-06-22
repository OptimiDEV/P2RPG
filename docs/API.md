# P2RPG Modding API

Welcome to the P2RPG Modding API! This document explains how to create mods for the game, what you can do, and how to use the modding API.

---

## 📁 Mod Folder Structure
Each mod should be placed in its own folder inside `~/Documents/P2RPG/Mods/`:

```
Mods/
  MyCoolMod/
    node_modules/
    src/
      main.js
      ... (other files)
    package.js
    Modconf.conf
```

- `Modconf.conf`: JSON file with mod metadata and dependencies.
- `src/main.js`: Main entry point for your mod.

---

## 📝 Modconf.conf Example
```json
{
  "name": "MyCoolMod",
  "description": "Adds a magic sword and a secret cave.",
  "dependencies": []
}
```
- `name`: Unique name for your mod.
- `description`: Short description.
- `dependencies`: Array of mod names your mod depends on.

---

## 🚀 main.js Example
```js
// src/main.js
module.exports = function(api) {
  // Register a new item
  api.registerItem({
    name: 'Magic Sword',
    type: 'weapon',
    icon: '🗡️',
    damage: 25,
    effect: 'restore 10 health'
  });

  // Register a new location
  api.registerLocation({
    name: 'Secret Cave',
    symbol: '🕸️',
    x: 6,
    y: 2,
    description: 'A hidden cave full of mysteries.',
    type: 'cave',
    connections: ['Village of Eldoria'],
    activities: ['explore', 'quest'],
    npcs: ['Mysterious Hermit']
  });

  // Register a new quest
  api.registerQuest({
    id: 'find_magic_sword',
    title: 'Find the Magic Sword',
    description: 'Seek out the legendary Magic Sword in the Secret Cave.',
    progress: 0,
    maxProgress: 1,
    rewards: { experience: 200, items: ['Magic Sword'] },
    completed: false
  });
};
```

---

## 🧩 Modding API Reference

### `api.registerItem(itemObj)`
- Adds a new item to the game.
- Example:
  ```js
  api.registerItem({
    name: 'Magic Sword',
    type: 'weapon',
    icon: '🗡️',
    damage: 25,
    effect: 'restore 10 health'
  });
  ```
- **Fields:**
  - `name` (string): Item name (must be unique)
  - `type` (string): e.g. 'weapon', 'food', 'potion', etc.
  - `icon` (string): Emoji or character for UI
  - `damage` (number, optional): Weapon damage
  - `effect` (string, optional): e.g. 'restore 10 health'

### `api.registerLocation(locationObj)`
- Adds a new location to the world map.
- Example:
  ```js
  api.registerLocation({
    name: 'Secret Cave',
    symbol: '🕸️',
    x: 6,
    y: 2,
    description: 'A hidden cave full of mysteries.',
    type: 'cave',
    connections: ['Village of Eldoria'],
    activities: ['explore', 'quest'],
    npcs: ['Mysterious Hermit']
  });
  ```
- **Fields:**
  - `name` (string): Location name (must be unique)
  - `symbol` (string): Emoji or character for map
  - `x`, `y` (number): Map coordinates (0-7, 0-5)
  - `description` (string): Description
  - `type` (string): e.g. 'village', 'cave', etc.
  - `connections` (array): Names of connected locations
  - `activities` (array): e.g. ['explore', 'quest']
  - `npcs` (array): List of NPC names

### `api.registerQuest(questObj)`
- Adds a new quest to the quest list.
- Example:
  ```js
  api.registerQuest({
    id: 'find_magic_sword',
    title: 'Find the Magic Sword',
    description: 'Seek out the legendary Magic Sword in the Secret Cave.',
    progress: 0,
    maxProgress: 1,
    rewards: { experience: 200, items: ['Magic Sword'] },
    completed: false
  });
  ```
- **Fields:**
  - `id` (string): Unique quest ID
  - `title` (string): Quest title
  - `description` (string): Quest description
  - `progress` (number): Initial progress (usually 0)
  - `maxProgress` (number): Progress needed to complete
  - `rewards` (object): e.g. `{ experience: 200, items: ['Magic Sword'] }`
  - `completed` (bool): Usually `false` at start

---

## 🛠️ Tips
- Use unique names/IDs for your items, locations, and quests.
- You can use any valid JavaScript in your `main.js`.
- You can require Node.js modules (install them in your mod's `node_modules`).

---

## 🧪 Testing Your Mod
1. Place your mod folder in `~/Documents/P2RPG/Mods/`.
2. Restart the game.
3. Your items, locations, and quests should appear in-game!

---

## ❓ Need More?
Want to add custom events, NPCs, or hooks? Let us know! 