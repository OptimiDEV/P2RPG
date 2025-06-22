const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('rpgAPI', {
  getCharacters: () => ipcRenderer.invoke('get-player2-characters'),
  checkHealth: () => ipcRenderer.invoke('check-player2-health'),
  getTTSVoices: () => ipcRenderer.invoke('get-tts-voices'),
  sendMessageToAI: (message, gameContext) => ipcRenderer.invoke('send-message-to-ai', message, gameContext),
  speakText: (text, options = {}) => {
    // Use defaults, but allow override via options
    const payload = {
      audio_format: options.audio_format || 'mp3',
      play_in_app: options.play_in_app !== undefined ? options.play_in_app : false,
      speed: options.speed || 1,
      text: text,
      voice_gender: options.voice_gender || 'female',
      voice_ids: options.voice_ids || ['01955d76-ed5b-73e0-a88d-cbeb3c5b499d'],
      voice_language: options.voice_language || 'en_US'
    };
    return ipcRenderer.invoke('speak-text', payload);
  },
  stopSpeaking: () => ipcRenderer.invoke('stop-speaking'),
  saveGame: (gameData) => ipcRenderer.invoke('save-game', gameData),
  loadGame: () => ipcRenderer.invoke('load-game'),
  getSaveInfo: (filePath) => ipcRenderer.invoke('get-save-info', filePath),
  // --- Modded content ---
  getModdedItems: () => ipcRenderer.invoke('get-modded-items'),
  getModdedLocations: () => ipcRenderer.invoke('get-modded-locations'),
  getModdedQuests: () => ipcRenderer.invoke('get-modded-quests')
}); 