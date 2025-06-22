const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

// --- P2RPG Folders and Mod Scanning ---
const userDocuments = app.getPath('documents');
const P2RPG_ROOT = path.join(userDocuments, 'P2RPG');
const P2RPG_SAVES = path.join(P2RPG_ROOT, 'Saves');
const P2RPG_MODS = path.join(P2RPG_ROOT, 'Mods');

function ensureP2RPGFolders() {
  if (!fs.existsSync(P2RPG_ROOT)) fs.mkdirSync(P2RPG_ROOT);
  if (!fs.existsSync(P2RPG_SAVES)) fs.mkdirSync(P2RPG_SAVES);
  if (!fs.existsSync(P2RPG_MODS)) fs.mkdirSync(P2RPG_MODS);
}

// Parse Modconf.conf (expects JSON format)
function parseModConfig(confStr, modFolder) {
  try {
    const conf = JSON.parse(confStr);
    return {
      name: conf.name || modFolder,
      description: conf.description || '',
      dependencies: Array.isArray(conf.dependencies) ? conf.dependencies : [],
      raw: conf
    };
  } catch (e) {
    return { name: modFolder, description: '', dependencies: [], error: 'Invalid config format' };
  }
}

function scanModsFolder() {
  if (!fs.existsSync(P2RPG_MODS)) return [];
  const modFolders = fs.readdirSync(P2RPG_MODS).filter(f => {
    const modPath = path.join(P2RPG_MODS, f);
    return fs.statSync(modPath).isDirectory();
  });
  const mods = [];
  for (const folder of modFolders) {
    const modPath = path.join(P2RPG_MODS, folder);
    const confPath = path.join(modPath, 'Modconf.conf');
    let conf = null;
    let parsed = null;
    if (fs.existsSync(confPath)) {
      try {
        conf = fs.readFileSync(confPath, 'utf8');
        parsed = parseModConfig(conf, folder);
      } catch (e) {
        parsed = { name: folder, description: '', dependencies: [], error: 'Failed to read config' };
      }
    } else {
      parsed = { name: folder, description: '', dependencies: [], error: 'Missing Modconf.conf' };
    }
    mods.push({ name: folder, path: modPath, config: parsed });
  }
  return mods;
}

// --- Modding API and Content Storage ---
// Global arrays to store mod-registered content
const MODDED_ITEMS = [];
const MODDED_LOCATIONS = [];
const MODDED_QUESTS = [];

// The API object passed to mods
const P2RPGModAPI = {
  registerItem(item) {
    MODDED_ITEMS.push(item);
    console.log(`[P2RPG] Mod registered item:`, item);
  },
  registerLocation(location) {
    MODDED_LOCATIONS.push(location);
    console.log(`[P2RPG] Mod registered location:`, location);
  },
  registerQuest(quest) {
    MODDED_QUESTS.push(quest);
    console.log(`[P2RPG] Mod registered quest:`, quest);
  },
  // Add more API methods as needed
};
// --- End Modding API and Content Storage ---

// Ensure folders and scan mods before window creation
ensureP2RPGFolders();
const foundMods = scanModsFolder();
console.log('[P2RPG] Found mods:', foundMods.map(m => ({ name: m.name, config: m.config })));

// --- Dependency check ---
const loadedModNames = foundMods.map(m => m.config.name);
let missingDeps = [];
for (const mod of foundMods) {
  if (mod.config.dependencies && mod.config.dependencies.length > 0) {
    const missing = mod.config.dependencies.filter(dep => !loadedModNames.includes(dep));
    if (missing.length > 0) {
      missingDeps.push({ mod: mod.config.name, missing });
    }
  }
}

if (missingDeps.length > 0) {
  // Show dialog and block game start
  const depMsg = missingDeps.map(md => `Mod "${md.mod}" is missing dependencies: ${md.missing.join(', ')}`).join('\n');
  app.whenReady().then(() => {
    dialog.showMessageBoxSync({
      type: 'error',
      title: 'Missing Mod Dependencies',
      message: 'Some mods are missing required dependencies and the game cannot start.',
      detail: depMsg
    });
    app.quit();
  });
} else {
  // Load and execute main.js for each mod with all dependencies met
  for (const mod of foundMods) {
    const mainPath = path.join(mod.path, 'src', 'main.js');
    if (fs.existsSync(mainPath)) {
      try {
        // Use require to load the mod, passing the API
        const modMain = require(mainPath);
        if (typeof modMain === 'function') {
          modMain(P2RPGModAPI);
          console.log(`[P2RPG] Executed mod: ${mod.config.name}`);
        } else {
          console.log(`[P2RPG] main.js for mod ${mod.config.name} does not export a function.`);
        }
      } catch (err) {
        console.error(`[P2RPG] Error loading mod ${mod.config.name}:`, err);
      }
    } else {
      console.log(`[P2RPG] Mod ${mod.config.name} has no main.js, skipping execution.`);
    }
  }
}
// --- End P2RPG Folders and Mod Scanning ---

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'rpg-preload.js'),
      enableRemoteModule: false,
      webSecurity: true
    },
    title: 'AI RPG Adventure - by OptimiDev Studios',
    icon: null,
    show: false,
    frame: true,
    resizable: true,
    center: true,
    autoHideMenuBar: true
  });

  // Load test game directly for debugging
  mainWindow.loadFile(path.join(__dirname, 'rpg-game.html'));

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Open DevTools in development
  if (process.argv.includes('--dev')) {
    mainWindow.webContents.openDevTools();
    systemPreferences.Console.log('oOo | Hi, developer! | oOo');
  }
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// Handle IPC messages from renderer
ipcMain.handle('get-player2-characters', async () => {
  try {
    const axios = require('axios');
    const response = await axios.get('http://127.0.0.1:4315/v1/selected_characters', {
      headers: {
        'player2-game-key': 'ai-rpg-adventure'
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching characters:', error.message);
    throw error;
  }
});

ipcMain.handle('check-player2-health', async () => {
  try {
    const axios = require('axios');
    const response = await axios.get('http://127.0.0.1:4315/v1/health', {
      headers: {
        'player2-game-key': 'ai-rpg-adventure'
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error checking Player2 health:', error.message);
    throw error;
  }
});

ipcMain.handle('get-tts-voices', async () => {
  try {
    const axios = require('axios');
    const response = await axios.get('http://127.0.0.1:4315/v1/tts/voices', {
      headers: {
        'player2-game-key': 'ai-rpg-adventure'
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching TTS voices:', error.message);
    throw error;
  }
});

ipcMain.handle('send-message-to-ai', async (event, message, gameContext) => {
  try {
    const axios = require('axios');
    const response = await axios.post('http://127.0.0.1:4315/v1/chat/completions', {
      messages: [
        {
          role: 'system',
          content: `You are an AI companion in a fantasy RPG adventure. You are helpful, knowledgeable about the world, and make strategic decisions. 
          Current game context: ${gameContext}
          Respond as your character would, being helpful but also having your own personality and opinions. 
          Keep responses engaging and game-focused.`
        },
        {
          role: 'user',
          content: message
        }
      ]
    }, {
      headers: {
        'player2-game-key': 'ai-rpg-adventure',
        'Content-Type': 'application/json'
      }
    });
    return response.data.choices[0].message.content;
  } catch (error) {
    console.error('Error sending message to AI:', error.message);
    throw error;
  }
});

ipcMain.handle('speak-text', async (event, payload) => {
  try {
    const axios = require('axios');
    const response = await axios.post('http://127.0.0.1:4315/v1/tts/speak', payload, {
      headers: {
        'player2-game-key': 'ai-rpg-adventure',
        'Content-Type': 'application/json'
      }
    });
    // Return as { audio_base64: ... }
    return { audio_base64: response.data.data };
  } catch (error) {
    console.error('Error speaking text:', error.message);
    throw error;
  }
});

ipcMain.handle('stop-speaking', async () => {
  try {
    const axios = require('axios');
    await axios.post('http://127.0.0.1:4315/v1/tts/stop', {}, {
      headers: {
        'player2-game-key': 'ai-rpg-adventure'
      }
    });
    return true;
  } catch (error) {
    console.error('Error stopping speech:', error.message);
    throw error;
  }
});

// Save game functionality
ipcMain.handle('save-game', async (event, gameData) => {
  try {
    const saveData = {
      version: '1.0.0',
      game: 'AI RPG Adventure',
      developer: 'OptimiDev Studios',
      timestamp: new Date().toISOString(),
      data: gameData
    };

    const result = await dialog.showSaveDialog(mainWindow, {
      title: 'Save Game',
      defaultPath: path.join(app.getPath('documents'), 'AI RPG Adventure'),
      filters: [
        { name: 'RPG Adventure Save Files', extensions: ['rp2game'] },
        { name: 'All Files', extensions: ['*'] }
      ],
      properties: ['createDirectory']
    });

    if (!result.canceled && result.filePath) {
      const filePath = result.filePath.endsWith('.rp2game') ? result.filePath : result.filePath + '.rp2game';
      fs.writeFileSync(filePath, JSON.stringify(saveData, null, 2));
      return { success: true, filePath: filePath };
    } else {
      return { success: false, canceled: true };
    }
  } catch (error) {
    console.error('Error saving game:', error);
    return { success: false, error: error.message };
  }
});

// Load game functionality
ipcMain.handle('load-game', async () => {
  try {
    const result = await dialog.showOpenDialog(mainWindow, {
      title: 'Load Game',
      defaultPath: path.join(app.getPath('documents'), 'AI RPG Adventure'),
      filters: [
        { name: 'RPG Adventure Save Files', extensions: ['rp2game'] },
        { name: 'All Files', extensions: ['*'] }
      ],
      properties: ['openFile']
    });

    if (!result.canceled && result.filePaths.length > 0) {
      const filePath = result.filePaths[0];
      const fileContent = fs.readFileSync(filePath, 'utf8');
      const saveData = JSON.parse(fileContent);
      
      // Validate save file format
      if (saveData.game !== 'AI RPG Adventure' || !saveData.data) {
        throw new Error('Invalid save file format');
      }
      
      return { success: true, data: saveData.data, filePath: filePath };
    } else {
      return { success: false, canceled: true };
    }
  } catch (error) {
    console.error('Error loading game:', error);
    return { success: false, error: error.message };
  }
});

// Get save file info
ipcMain.handle('get-save-info', async (event, filePath) => {
  try {
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const saveData = JSON.parse(fileContent);
    
    return {
      success: true,
      info: {
        game: saveData.game,
        version: saveData.version,
        timestamp: saveData.timestamp,
        character: saveData.data.character,
        location: saveData.data.location
      }
    };
  } catch (error) {
    console.error('Error reading save info:', error);
    return { success: false, error: error.message };
  }
});

// IPC handlers for modded content
ipcMain.handle('get-modded-items', () => {
  return MODDED_ITEMS;
});
ipcMain.handle('get-modded-locations', () => {
  return MODDED_LOCATIONS;
});
ipcMain.handle('get-modded-quests', () => {
  return MODDED_QUESTS;
});

console.log('bindEvents called'); 