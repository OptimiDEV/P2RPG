# R2RPG

A fantasy RPG adventure game with an AI companion powered by Player2. Developed by **OptimiDev**.

## 🎮 Game Features

- **AI Companion**: Chat with Aria, your mystical guide, for advice and assistance
- **Character System**: Level up, manage stats, and customize your character
- **World Exploration**: Discover new locations and embark on quests
- **Inventory Management**: Collect items and manage your equipment
- **Quest System**: Complete various quests to gain experience and rewards
- **Text-to-Speech**: AI companion speaks responses using Player2 TTS
- **Save/Load System**: Save your progress and continue your adventure

## 🚀 Getting Started

### Prerequisites

- **Node.js** (v16 or higher)
- **Player2 App** running at `http://127.0.0.1:4315`

### Installation

1. **Clone or download** this repository
2. **Navigate** to the game directory:
   ```bash
   cd game
   ```

3. **Install dependencies**:
   ```bash
   npm install
   ```

4. **Start Player2 App** and ensure it's running at `http://127.0.0.1:4315`

5. **Launch the game**:
   ```bash
   npm start
   ```

## How to Play

### Character Creation
- Start as a Level 1 Wanderer
- Manage your Health, Stamina, and Mana
- Level up by gaining experience through quests and exploration

### World Exploration
- **Explore**: Discover new areas and find hidden treasures
- **Rest**: Recover health and stamina
- **Travel**: Move between discovered locations on the world map
- **Quest**: Take on various quests to gain rewards

### AI Companion
- **Chat with Aria**: Ask for advice, get information about locations, or just chat
- **Strategic Guidance**: Get help with quests and exploration decisions
- **Voice Interaction**: Enable TTS to hear Aria speak her responses

### Game Controls
- **Action Buttons**: Use the action panel to perform various activities
- **World Map**: Click on discovered locations to travel
- **Inventory**: Click on items to examine them
- **Chat**: Type messages to interact with your AI companion

## Development

### Project Structure
```
game/
├── src/
│   ├── rpg-main.js          # Main Electron process
│   ├── rpg-preload.js       # Preload script for security
│   ├── rpg-game.html        # Main game interface
│   ├── rpg-game.js          # Game logic and mechanics
│   ├── rpg-styles.css       # RPG-specific styles
│   └── startup.html         # Startup screen
├── assets/
│   └── optimidev-logo.png   # Studio logo
├── styles.css               # Global styles
├── package.json             # Project configuration
```

### Development Mode
Run the game in development mode with DevTools:
```bash
npm run dev
```

### Building
Build the game for distribution:
```bash
npm run build
```

## Configuration

### Player2 API Integration
The game integrates with Player2 API for:
- **AI Chat Completions**: Intelligent companion responses
- **Text-to-Speech**: Voice synthesis for companion dialogue
- **Character Management**: Access to Player2 character system

### API Endpoints Used
- `GET /v1/health` - Check API status
- `GET /v1/selected_characters` - Get available characters
- `GET /v1/tts/voices` - Get available TTS voices
- `POST /v1/chat/completions` - Send messages to AI
- `POST /v1/tts/speak` - Convert text to speech
- `POST /v1/tts/stop` - Stop current speech

## 🎨 Features

### Character System
- **Attributes**: Strength, Dexterity, Intelligence, Wisdom, Charisma, Constitution
- **Stats**: Health, Stamina, Mana, Experience
- **Leveling**: Gain experience to level up and increase stats

### World System
- **Multiple Locations**: Village, Forest, Cave, Mountains, Ruins
- **Dynamic Map**: Interactive world map with discovered locations
- **Location Types**: Different areas with unique activities and NPCs

### Quest System
- **Progressive Quests**: Complete objectives to advance
- **Rewards**: Gain experience and items
- **Multiple Objectives**: Various types of quest goals

### AI Companion Features
- **Contextual Responses**: AI understands current game state
- **Strategic Advice**: Get help with decisions and quests
- **Personality**: Aria has her own character and knowledge
- **Voice Synthesis**: Hear responses with TTS

## 🐛 Troubleshooting

### Player2 API Connection Issues
- Ensure Player2 App is running at `http://127.0.0.1:4315`
- Check firewall settings
- Verify API is accessible in browser

### Game Performance
- Close other applications if experiencing lag
- Check system resources
- Restart the game if needed

### Save/Load Issues
- Game saves are stored in browser localStorage
- Clear browser data to reset saves
- Check browser permissions

## 📝 License

This project is licensed under the MIT License.

## 🤝 Contributing

This is a showcase project by OptimiDev Studios. For questions or feedback, please contact the development team.

---

**Developed with ❤️ by OptimiDev Studios**  
**Powered by Player2 Technology** 
<div style="
  display: inline-block;
  padding: 10px 20px;
  background-color: #4CAF50;
  color: white;
  border-radius: 12px;
  cursor: pointer;
  text-align: center;
  font-family: sans-serif;
">
   <a href="/docs/API.md">Modding -></a>
</div>
