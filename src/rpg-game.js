class RPGGame {
    constructor() {
        this.gameState = {
            isPlaying: false,
            character: this.createCharacter(),
            companion: this.createCompanion(),
            location: this.createLocation('Village of Eldoria'),
            inventory: this.createInventory(),
            equipment: this.createEquipment(),
            quests: this.createQuests(),
            world: this.createWorld(),
            events: []
        };
        
        this.ttsEnabled = true;
        this.isConnected = false;
        this.staminaTimeout = null;
        this.hungerTimeout = null;
        // --- Modded content storage ---
        this.moddedItems = [];
        this.moddedLocations = [];
        this.moddedQuests = [];
        // --- End modded content storage ---
        this.init();
    }

    createCharacter() {
        return {
            name: 'Adventurer',
            level: 1,
            class: 'Wanderer',
            health: { current: 100, max: 100 },
            stamina: { current: 100, max: 100 },
            hunger: { current: 100, max: 100 },
            experience: { current: 0, max: 100 },
            attributes: {
                strength: 10,
                dexterity: 10,
                intelligence: 10,
                wisdom: 10,
                charisma: 10,
                constitution: 10
            },
            avatar: '🧙‍♂️'
        };
    }

    createCompanion() {
        return {
            name: 'Aria',
            role: 'Mystic Guide',
            status: 'Ready to assist',
            avatar: '🤖',
            personality: 'wise and helpful',
            knowledge: ['world lore', 'magic', 'strategy', 'healing']
        };
    }

    createLocation(name) {
        const locations = {
            'Village of Eldoria': {
                name: 'Village of Eldoria',
                description: 'A peaceful village nestled in the rolling hills. The air is filled with the scent of fresh bread and the sound of children playing.',
                type: 'village',
                connections: ['Forest Path', 'Mountain Trail'],
                activities: ['explore', 'rest', 'shop', 'quest'],
                npcs: ['Village Elder', 'Merchant', 'Guard Captain']
            },
            'Forest Path': {
                name: 'Forest Path',
                description: 'A winding path through ancient trees. Sunlight filters through the canopy, creating dancing shadows on the forest floor.',
                type: 'forest',
                connections: ['Village of Eldoria', 'Dark Cave'],
                activities: ['explore', 'rest', 'craft'],
                npcs: ['Forest Ranger', 'Traveling Merchant']
            },
            'Dark Cave': {
                name: 'Dark Cave',
                description: 'A mysterious cave entrance carved into the mountainside. Strange sounds echo from within, hinting at ancient secrets.',
                type: 'cave',
                connections: ['Forest Path'],
                activities: ['explore', 'quest'],
                npcs: ['Cave Dweller'],
                danger: 'high'
            }
        };
        
        return locations[name] || locations['Village of Eldoria'];
    }

    createInventory() {
        const slots = [];
        for (let i = 0; i < 24; i++) {
            slots.push({ id: i, item: null });
        }
        
        // Add some starting items
        slots[0].item = { name: 'Bread', type: 'food', icon: '🍞', effect: 'restore 15 hunger' };
        slots[1].item = { name: 'Water Flask', type: 'drink', icon: '💧', effect: 'restore 10 stamina' };
        slots[2].item = { name: 'Simple Dagger', type: 'weapon', icon: '🗡️', damage: 5 };
        
        return slots;
    }

    createEquipment() {
        return {
            weapon: null,
            armor: null,
            accessory: null,
            shield: null
        };
    }

    createQuests() {
        return [
            {
                id: 'welcome',
                title: 'Welcome to Adventure',
                description: 'Begin your journey and explore the world',
                progress: 0,
                maxProgress: 100,
                rewards: { experience: 50, items: ['Simple Sword'] },
                completed: false
            },
            {
                id: 'explore_village',
                title: 'Explore the Village',
                description: 'Discover the secrets of Eldoria village',
                progress: 0,
                maxProgress: 3,
                rewards: { experience: 100, items: ['Village Map'] },
                completed: false
            }
        ];
    }

    createWorld() {
        const discovered = ['Village of Eldoria'];
        return {
            map: this.generateWorldMap(discovered),
            discovered: discovered,
            currentPosition: { x: 3, y: 2 }
        };
    }

    async init() {
        // Fetch modded content from main process
        this.moddedItems = await window.rpgAPI.getModdedItems();
        this.moddedLocations = await window.rpgAPI.getModdedLocations();
        this.moddedQuests = await window.rpgAPI.getModdedQuests();
        // Merge modded content into game data
        this.injectModdedContent();
        this.bindEvents();
        await this.checkConnection();
        await this.initTTS();
        this.renderGame();
        this.updateUI();
        this.showWelcomeModal();
    }

    injectModdedContent() {
        // --- Inject modded items into inventory options ---
        if (this.moddedItems && this.moddedItems.length > 0) {
            // Add one of each modded item to the inventory (for demo)
            let idx = 3;
            for (const item of this.moddedItems) {
                if (idx < this.gameState.inventory.length) {
                    this.gameState.inventory[idx].item = item;
                    idx++;
                }
            }
        }
        // --- Inject modded locations into world map ---
        if (this.moddedLocations && this.moddedLocations.length > 0) {
            // Add to world map locations array for generateWorldMap
            if (!this.extraLocations) this.extraLocations = [];
            this.extraLocations = this.moddedLocations;
        }
        // --- Inject modded quests into quest list ---
        if (this.moddedQuests && this.moddedQuests.length > 0) {
            this.gameState.quests = this.gameState.quests.concat(this.moddedQuests.map(q => ({...q, progress: 0, completed: false})));
        }
    }

    // Patch generateWorldMap to include modded locations
    generateWorldMap(discovered) {
        const map = [];
        const baseLocations = [
            { name: 'Village of Eldoria', symbol: '🏘️', x: 3, y: 2 },
            { name: 'Forest Path', symbol: '🌲', x: 2, y: 3 },
            { name: 'Dark Cave', symbol: '🕳️', x: 1, y: 4 },
            { name: 'Mountain Trail', symbol: '⛰️', x: 4, y: 1 },
            { name: 'Ancient Ruins', symbol: '🏛️', x: 5, y: 3 },
            { name: 'Mystic Grove', symbol: '🌳', x: 0, y: 2 }
        ];
        // Add modded locations
        let allLocations = baseLocations;
        if (this.extraLocations && this.extraLocations.length > 0) {
            allLocations = baseLocations.concat(this.extraLocations);
        }
        for (let y = 0; y < 6; y++) {
            map[y] = [];
            for (let x = 0; x < 8; x++) {
                const location = allLocations.find(loc => loc.x === x && loc.y === y);
                map[y][x] = {
                    type: location ? 'location' : 'empty',
                    name: location ? location.name : '',
                    symbol: location ? location.symbol : '·',
                    discovered: location ? discovered.includes(location.name) : false
                };
            }
        }
        return map;
    }

    async checkConnection() {
        try {
            await window.rpgAPI.getCharacters();
            this.isConnected = true;
            this.updateConnectionStatus();
            this.addEvent('Connected to Player2 API successfully!');
        } catch (error) {
            this.isConnected = false;
            this.updateConnectionStatus();
            this.addEvent('⚠️ Player2 API not available. AI companion responses will be limited.');
        }
    }

    async initTTS() {
        if (!this.isConnected) return;
        
        try {
            const voices = await window.rpgAPI.getTTSVoices();
            console.log('Available TTS voices:', voices);
            this.addEvent(`TTS initialized with ${voices.length || 0} available voices`);
        } catch (error) {
            console.error('TTS initialization error:', error);
            this.addEvent('TTS voices not available');
        }
    }

    bindEvents() {
        console.log('Binding events...');
        
        // Game controls
        const newGameBtn = document.getElementById('new-game-btn');
        if (newGameBtn) newGameBtn.addEventListener('click', () => this.showWelcomeModal());

        const saveBtn = document.getElementById('save-btn');
        if (saveBtn) saveBtn.addEventListener('click', () => this.saveGame());
        const loadBtn = document.getElementById('load-btn');
        if (loadBtn) loadBtn.addEventListener('click', () => this.loadGame());

        // Chat
        const sendChatBtn = document.getElementById('send-chat-btn');
        const chatInput = document.getElementById('chat-input');
        
        console.log('Found chat elements:', { sendChatBtn, chatInput });
        
        if (sendChatBtn) sendChatBtn.addEventListener('click', () => this.sendChatMessage());
        if (chatInput) chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.sendChatMessage();
        });

        // Actions
        document.querySelectorAll('.action-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const action = e.target.dataset.action;
                this.performAction(action);
            });
        });

        // Voice controls
        const ttsToggle = document.getElementById('tts-toggle');
        const voiceInputBtn = document.getElementById('voice-input-btn');
        
        if (ttsToggle) ttsToggle.addEventListener('click', () => this.toggleTTS());
        if (voiceInputBtn) voiceInputBtn.addEventListener('click', () => this.toggleVoiceInput());

        // Map clicks
        const worldMap = document.getElementById('world-map');
        if (worldMap) {
            worldMap.addEventListener('click', (e) => {
                if (e.target.classList.contains('map-cell')) {
                    this.handleMapClick(e.target);
                }
            });
        }
        
        // Village overlay exit
        const exitVillageBtn = document.getElementById('exit-village-btn');
        if (exitVillageBtn) {
            exitVillageBtn.onclick = () => this.hideVillageOverlay();
        }
        
        console.log('Events bound successfully');

        document.addEventListener('click', (e) => {
            console.log('Global click:', e.target);
        });
    }

    startGame(isNewGame) {
        console.log('Starting game...');
        this.gameState.isPlaying = true;
        this.enableChat();
        this.startStaminaDrain();
        this.startHungerDrain();

        if (isNewGame) {
            this.addEvent(`Welcome, ${this.gameState.character.name}! Your adventure begins.`);
            this.sendCompanionMessage(`Greetings, ${this.gameState.character.name}! I am Aria. Let's embark on this journey together.`);
        } else {
            this.addEvent(`Welcome back, ${this.gameState.character.name}! Your adventure continues.`);
            this.sendCompanionMessage(`It is good to see you again, ${this.gameState.character.name}. Let us continue where we left off.`);
        }
        console.log('Game started successfully');
    }

    startNewGame(playerName) {
        this.gameState = {
            isPlaying: false, // Will be set to true by startGame
            character: this.createCharacter(),
            companion: this.createCompanion(),
            location: this.createLocation('Village of Eldoria'),
            inventory: this.createInventory(),
            equipment: this.createEquipment(),
            quests: this.createQuests(),
            world: this.createWorld(),
            events: []
        };
        this.gameState.character.name = playerName;
        
        this.renderGame();
        this.updateUI();
        this.startGame(true);
    }

    async sendChatMessage() {
        const input = document.getElementById('chat-input');
        const message = input.value.trim();
        
        if (!message) return;
        
        this.addChatMessage('You', message, 'player');
        input.value = '';
        
        // Get AI response
        await this.getCompanionResponse(message);
    }

    async getCompanionResponse(playerMessage) {
        if (!this.isConnected) {
            this.sendCompanionMessage('I\'m having trouble connecting to my knowledge base right now, but I\'m still here to help you!');
            return;
        }
        
        try {
            const gameContext = this.getGameContext();
            const response = await window.rpgAPI.sendMessageToAI(playerMessage, gameContext);
            this.sendCompanionMessage(response);
        } catch (error) {
            console.error('Error getting companion response:', error);
            this.sendCompanionMessage('I\'m experiencing some difficulties with my connection. Let me try to help you with what I know.');
        }
    }

    getGameContext() {
        return `You are Aria, a mystical AI companion in a fantasy RPG. 
        Current location: ${this.gameState.location.name} - ${this.gameState.location.description}
        Player character: Level ${this.gameState.character.level} ${this.gameState.character.class}
        Player stats: Health ${this.gameState.character.health.current}/${this.gameState.character.health.max}, 
        Stamina ${this.gameState.character.stamina.current}/${this.gameState.character.stamina.max},
        Hunger: ${this.gameState.character.hunger.current}/${this.gameState.character.hunger.max}
        Available activities: ${this.gameState.location.activities.join(', ')}
        Active quests: ${this.gameState.quests.filter(q => !q.completed).length}
        Respond as Aria would, being helpful and knowledgeable about the world.`;
    }

    sendCompanionMessage(message) {
        this.addChatMessage(this.gameState.companion.name, message, 'companion');
        
        if (this.ttsEnabled && this.isConnected) {
            this.speakText(message);
        }
    }

    async speakText(text) {
        if (!this.ttsEnabled || !this.isConnected) return;
        
        try {
            const result = await window.rpgAPI.speakText(text);
            if (result && result.audio_base64) {
                const audio = new Audio(`data:audio/mp3;base64,${result.audio_base64}`);
                audio.play();
            }
        } catch (error) {
            console.error('TTS error:', error);
        }
    }

    performAction(action) {
        switch (action) {
            case 'explore':
                this.explore();
                break;
            case 'rest':
                this.rest();
                break;
            case 'craft':
                this.craft();
                break;
            case 'quest':
                this.quest();
                break;
            case 'shop':
                this.shop();
                break;
            case 'travel':
                this.travel();
                break;
            case 'discover':
                this.discoverNearby();
                break;
        }
    }

    explore() {
        const events = [
            'You discover a hidden path leading deeper into the area.',
            'A mysterious object catches your eye in the distance.',
            'You find some useful herbs growing nearby.',
            'The area seems peaceful and undisturbed.',
            'You notice some interesting footprints on the ground.'
        ];
        
        const event = events[Math.floor(Math.random() * events.length)];
        this.addEvent(event);
        
        // Update quest progress
        const exploreQuest = this.gameState.quests.find(q => q.id === 'explore_village');
        if (exploreQuest && !exploreQuest.completed) {
            exploreQuest.progress++;
            if (exploreQuest.progress >= exploreQuest.maxProgress) {
                exploreQuest.completed = true;
                this.addEvent(`Quest completed: ${exploreQuest.title}!`);
                this.gainExperience(exploreQuest.rewards.experience);
            }
        }
        
        this.updateUI();
        this.sendCompanionMessage(`I sense something interesting in this area. ${event}`);
    }

    rest() {
        const healthGain = 20;
        const staminaGain = 30;
        
        this.gameState.character.health.current = Math.min(
            this.gameState.character.health.max,
            this.gameState.character.health.current + healthGain
        );
        this.gameState.character.stamina.current = Math.min(
            this.gameState.character.stamina.max,
            this.gameState.character.stamina.current + staminaGain
        );
        
        this.addEvent(`You rest and recover ${healthGain} health and ${staminaGain} stamina.`);
        this.updateUI();
        this.sendCompanionMessage('Rest is important for any adventurer. You should feel refreshed now!');
    }

    craft() {
        this.addEvent('You attempt to craft something, but you need more materials and knowledge.');
        this.sendCompanionMessage('Crafting requires specific materials and recipes. Perhaps we should explore more to find what you need?');
    }

    quest() {
        const availableQuests = this.gameState.quests.filter(q => !q.completed);
        if (availableQuests.length > 0) {
            this.addEvent(`You check your quest log. You have ${availableQuests.length} active quest(s).`);
            this.sendCompanionMessage(`I can help you with your quests! You currently have ${availableQuests.length} active quest(s).`);
        } else {
            this.addEvent('You have no active quests at the moment.');
            this.sendCompanionMessage('You\'ve completed all available quests! Let\'s explore to find new adventures.');
        }
    }

    shop() {
        this.addEvent('You look around for merchants, but none are currently available in this area.');
        this.sendCompanionMessage('Merchants can be found in villages and towns. Let\'s travel to find one!');
    }

    travel() {
        this.addEvent('You consider your travel options. Where would you like to go?');
        this.sendCompanionMessage('I can help you navigate to different locations. Click on the map to see where you can travel!');
    }

    discoverNearby() {
        const { x, y } = this.gameState.world.currentPosition;
        const directions = [
            { dx: 0, dy: -1 }, // up
            { dx: 0, dy: 1 },  // down
            { dx: -1, dy: 0 }, // left
            { dx: 1, dy: 0 }   // right
        ];
        const map = this.gameState.world.map;
        const undiscovered = [];
        for (const dir of directions) {
            const nx = x + dir.dx;
            const ny = y + dir.dy;
            if (ny >= 0 && ny < map.length && nx >= 0 && nx < map[0].length) {
                const cell = map[ny][nx];
                if (cell.type === 'location' && !cell.discovered) {
                    undiscovered.push({ x: nx, y: ny, cell });
                }
            }
        }
        if (undiscovered.length === 0) {
            this.addEvent('No undiscovered locations nearby!');
            return;
        }
        // Randomly pick one to discover
        const pick = undiscovered[Math.floor(Math.random() * undiscovered.length)];
        pick.cell.discovered = true;
        this.addEvent(`You discovered a new place: ${pick.cell.name}!`);
        this.updateUI();
    }

    handleMapClick(cell) {
        const x = parseInt(cell.dataset.x);
        const y = parseInt(cell.dataset.y);
        const map = this.gameState.world.map;

        if (map[y][x].type === 'location' && map[y][x].discovered) {
            this.travelToLocation(map[y][x].name);
        }
    }

    travelToLocation(locationName) {
        this.gameState.location = this.createLocation(locationName);
        this.gameState.world.currentPosition = this.getLocationPosition(locationName);
        
        this.addEvent(`You travel to ${locationName}.`);
        this.updateUI();
        this.sendCompanionMessage(`Welcome to ${locationName}! ${this.gameState.location.description}`);
    }

    getLocationPosition(locationName) {
        const positions = {
            'Village of Eldoria': { x: 3, y: 2 },
            'Forest Path': { x: 2, y: 3 },
            'Dark Cave': { x: 1, y: 4 },
            'Mountain Trail': { x: 4, y: 1 },
            'Ancient Ruins': { x: 5, y: 3 },
            'Mystic Grove': { x: 0, y: 2 }
        };
        return positions[locationName] || { x: 3, y: 2 };
    }

    gainExperience(amount) {
        this.gameState.character.experience.current += amount;
        
        if (this.gameState.character.experience.current >= this.gameState.character.experience.max) {
            this.levelUp();
        }
        
        this.updateUI();
    }

    levelUp() {
        this.gameState.character.level++;
        this.gameState.character.experience.current -= this.gameState.character.experience.max;
        this.gameState.character.experience.max = Math.floor(this.gameState.character.experience.max * 1.5);
        
        // Increase stats
        this.gameState.character.health.max += 10;
        this.gameState.character.health.current = this.gameState.character.health.max;
        this.gameState.character.stamina.max += 5;
        this.gameState.character.stamina.current = this.gameState.character.stamina.max;
        this.gameState.character.hunger.current = this.gameState.character.hunger.max; // Refill hunger on level up
        
        this.addEvent(`🎉 Level Up! You are now level ${this.gameState.character.level}!`);
        this.sendCompanionMessage(`Congratulations on reaching level ${this.gameState.character.level}! You're growing stronger with each adventure.`);
    }

    renderGame() {
        this.renderCharacter();
        this.renderWorld();
        this.renderInventory();
        this.renderEquipment();
        this.renderQuests();
    }

    renderCharacter() {
        document.getElementById('char-name').textContent = this.gameState.character.name;
        document.getElementById('char-level').textContent = this.gameState.character.level;
        document.getElementById('char-class').textContent = this.gameState.character.class;
        document.getElementById('character-avatar').innerHTML = `<div class="avatar-placeholder">${this.gameState.character.avatar}</div>`;
        
        // Update stats
        document.getElementById('health-text').textContent = `${this.gameState.character.health.current}/${this.gameState.character.health.max}`;
        document.getElementById('stamina-text').textContent = `${this.gameState.character.stamina.current}/${this.gameState.character.stamina.max}`;
        document.getElementById('hunger-text').textContent = `${this.gameState.character.hunger.current}/${this.gameState.character.hunger.max}`;
        document.getElementById('exp-text').textContent = `${this.gameState.character.experience.current}/${this.gameState.character.experience.max}`;
        
        // Update bars
        document.getElementById('health-bar').style.width = `${(this.gameState.character.health.current / this.gameState.character.health.max) * 100}%`;
        document.getElementById('stamina-bar').style.width = `${(this.gameState.character.stamina.current / this.gameState.character.stamina.max) * 100}%`;
        document.getElementById('hunger-bar').style.width = `${(this.gameState.character.hunger.current / this.gameState.character.hunger.max) * 100}%`;
        document.getElementById('exp-bar').style.width = `${(this.gameState.character.experience.current / this.gameState.character.experience.max) * 100}%`;
        
        // Update attributes
        document.getElementById('str-value').textContent = this.gameState.character.attributes.strength;
        document.getElementById('dex-value').textContent = this.gameState.character.attributes.dexterity;
        document.getElementById('int-value').textContent = this.gameState.character.attributes.intelligence;
        document.getElementById('wis-value').textContent = this.gameState.character.attributes.wisdom;
        document.getElementById('cha-value').textContent = this.gameState.character.attributes.charisma;
        document.getElementById('con-value').textContent = this.gameState.character.attributes.constitution;
    }

    renderWorld() {
        document.getElementById('location-name').textContent = this.gameState.location.name;
        document.getElementById('location-desc').textContent = this.gameState.location.description;
        
        // Render map
        const mapGrid = document.querySelector('.map-grid');
        mapGrid.innerHTML = '';
        
        for (let y = 0; y < 6; y++) {
            for (let x = 0; x < 8; x++) {
                const cell = document.createElement('div');
                cell.className = 'map-cell';
                cell.dataset.x = x;
                cell.dataset.y = y;
                
                const mapData = this.gameState.world.map[y][x];
                cell.textContent = mapData.discovered ? mapData.symbol : '?';
                
                if (x === this.gameState.world.currentPosition.x && y === this.gameState.world.currentPosition.y) {
                    cell.classList.add('current');
                }
                
                if (!mapData.discovered) {
                    cell.style.opacity = '0.3';
                }
                
                mapGrid.appendChild(cell);
            }
        }
    }

    renderInventory() {
        const inventoryGrid = document.getElementById('inventory-grid');
        inventoryGrid.innerHTML = '';
        
        this.gameState.inventory.forEach((slot, index) => {
            const slotElement = document.createElement('div');
            slotElement.className = 'inventory-slot';
            slotElement.dataset.slot = index;
            
            if (slot.item) {
                slotElement.classList.add('filled');
                slotElement.textContent = slot.item.icon;
                slotElement.title = slot.item.name;
            }
            
            slotElement.addEventListener('click', () => this.handleInventoryClick(index));
            inventoryGrid.appendChild(slotElement);
        });
    }

    renderEquipment() {
        const equipmentSlots = document.getElementById('equipment-slots');
        equipmentSlots.innerHTML = '';
        
        const slots = [
            { name: 'Weapon', key: 'weapon', icon: '⚔️' },
            { name: 'Armor', key: 'armor', icon: '🛡️' },
            { name: 'Accessory', key: 'accessory', icon: '💍' },
            { name: 'Shield', key: 'shield', icon: '🛡️' }
        ];
        
        slots.forEach(slot => {
            const slotElement = document.createElement('div');
            slotElement.className = 'equipment-slot';
            slotElement.dataset.slot = slot.key;
            
            const item = this.gameState.equipment[slot.key];
            if (item) {
                slotElement.classList.add('filled');
                slotElement.textContent = item.icon;
                slotElement.title = item.name;
            } else {
                slotElement.textContent = slot.icon;
                slotElement.title = slot.name;
            }
            
            equipmentSlots.appendChild(slotElement);
        });
    }

    renderQuests() {
        const questList = document.getElementById('quest-list');
        questList.innerHTML = '';
        
        this.gameState.quests.forEach(quest => {
            if (!quest.completed) {
                const questElement = document.createElement('div');
                questElement.className = 'quest-item';
                questElement.innerHTML = `
                    <div class="quest-title">${quest.title}</div>
                    <div class="quest-desc">${quest.description}</div>
                    <div class="quest-progress">${Math.floor((quest.progress / quest.maxProgress) * 100)}% Complete</div>
                `;
                questList.appendChild(questElement);
            }
        });
    }

    updateUI() {
        this.renderCharacter();
        this.renderWorld();
        this.renderInventory();
        this.renderEquipment();
        this.renderQuests();
    }

    showWelcomeModal() {
        this.stopStaminaDrain();
        this.stopHungerDrain();

        const modal = document.getElementById('welcome-modal');
        const initialView = document.getElementById('welcome-initial-view');
        const nameView = document.getElementById('welcome-name-view');
        const newBtn = document.getElementById('welcome-new-btn');
        const loadBtn = document.getElementById('welcome-load-btn');
        const confirmBtn = document.getElementById('confirm-name-btn');
        const nameInput = document.getElementById('player-name-input');
        
        initialView.style.display = 'block';
        nameView.style.display = 'none';
        modal.style.display = 'flex';

        newBtn.onclick = () => {
            initialView.style.display = 'none';
            nameView.style.display = 'block';
            nameInput.focus();
        };

        loadBtn.onclick = async () => {
            modal.style.display = 'none';
            await this.loadGame();
        };

        const confirmNameAction = () => {
            const name = nameInput.value.trim();
            if (name) {
                modal.style.display = 'none';
                this.startNewGame(name);
            }
        };

        confirmBtn.onclick = confirmNameAction;
        nameInput.onkeypress = (e) => {
            if (e.key === 'Enter') {
                confirmNameAction();
            }
        };
    }

    addEvent(message) {
        this.gameState.events.unshift(message);
        if (this.gameState.events.length > 10) {
            this.gameState.events.pop();
        }
        
        const eventsLog = document.getElementById('events-log');
        const eventElement = document.createElement('div');
        eventElement.className = 'event-entry';
        eventElement.textContent = message;
        eventsLog.insertBefore(eventElement, eventsLog.firstChild);
        
        if (eventsLog.children.length > 5) {
            eventsLog.removeChild(eventsLog.lastChild);
        }
    }

    addChatMessage(sender, message, type) {
        const chatContainer = document.getElementById('chat-container');
        const messageElement = document.createElement('div');
        messageElement.className = `chat-message ${type}`;
        
        messageElement.innerHTML = `
            <div class="message-avatar">${type === 'player' ? '👤' : '🤖'}</div>
            <div class="message-content">
                <div class="message-sender">${sender}</div>
                <div class="message-text">${message}</div>
            </div>
        `;
        
        chatContainer.appendChild(messageElement);
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }

    handleInventoryClick(slotIndex) {
        const slot = this.gameState.inventory[slotIndex];
        if (!slot || !slot.item) return;

        const item = slot.item;
        let itemUsed = false;

        if (item.effect) {
            const parts = item.effect.split(' ');
            const action = parts[0];
            const amount = parseInt(parts[1]);
            const stat = parts[2];

            if (action === 'restore') {
                switch (stat) {
                    case 'health':
                        this.gameState.character.health.current = Math.min(this.gameState.character.health.max, this.gameState.character.health.current + amount);
                        itemUsed = true;
                        break;
                    case 'stamina':
                        this.gameState.character.stamina.current = Math.min(this.gameState.character.stamina.max, this.gameState.character.stamina.current + amount);
                        itemUsed = true;
                        break;
                    case 'hunger':
                        this.gameState.character.hunger.current = Math.min(this.gameState.character.hunger.max, this.gameState.character.hunger.current + amount);
                        itemUsed = true;
                        break;
                }
            }
        }

        if (itemUsed) {
            this.addEvent(`You used the ${item.name} and ${item.effect}.`);
            
            if (item.type === 'food' || item.type === 'drink' || item.type === 'potion') {
                this.gameState.inventory[slotIndex].item = null;
            }

            this.updateUI();
            this.renderInventory();
        } else {
            this.addEvent(`You examine ${item.name}.`);
            this.sendCompanionMessage(`That's a ${item.name}. It might be useful later!`);
        }
    }

    enableChat() {
        console.log('Enabling chat...');
        const chatInput = document.getElementById('chat-input');
        const sendBtn = document.getElementById('send-chat-btn');
        
        if (chatInput && sendBtn) {
            chatInput.disabled = false;
            sendBtn.disabled = false;
            chatInput.focus();
            console.log('Chat enabled successfully');
        } else {
            console.error('Chat elements not found:', { chatInput, sendBtn });
        }
    }

    updateConnectionStatus() {
        const indicator = document.getElementById('connection-indicator');
        if (this.isConnected) {
            indicator.textContent = '🟢 Connected';
            indicator.className = 'status-indicator connected';
        } else {
            indicator.textContent = '🔴 Disconnected';
            indicator.className = 'status-indicator disconnected';
        }
    }

    toggleTTS() {
        this.ttsEnabled = !this.ttsEnabled;
        const button = document.getElementById('tts-toggle');
        button.textContent = `🔊 TTS: ${this.ttsEnabled ? 'ON' : 'OFF'}`;
    }

    toggleVoiceInput() {
        this.addEvent('Voice input feature coming soon!');
    }

    saveGame() {
        console.log('Save game called');
        try {
            const saveData = {
                character: this.gameState.character,
                companion: this.gameState.companion,
                location: this.gameState.location,
                inventory: this.gameState.inventory,
                equipment: this.gameState.equipment,
                quests: this.gameState.quests,
                world: this.gameState.world,
                events: this.gameState.events.slice(0, 10) // Save last 10 events
            };

            console.log('Calling rpgAPI.saveGame...');
            window.rpgAPI.saveGame(saveData).then(result => {
                console.log('Save result:', result);
                if (result.success) {
                    const fileName = result.filePath.split(/[/\\]/).pop(); // Extract filename
                    this.addEvent(`Game saved successfully to: ${fileName}`);
                    this.sendCompanionMessage('Your adventure has been safely recorded. You can continue your journey anytime!');
                } else if (result.canceled) {
                    this.addEvent('Save cancelled.');
                } else {
                    this.addEvent(`Failed to save game: ${result.error}`);
                }
            }).catch(error => {
                console.error('Save error:', error);
                this.addEvent(`Save error: ${error.message}`);
            });
        } catch (error) {
            console.error('Save preparation error:', error);
            this.addEvent('Failed to prepare save data.');
        }
    }

    async loadGame() {
        console.log('Load game called');
        try {
            console.log('Calling rpgAPI.loadGame...');
            const result = await window.rpgAPI.loadGame();
            console.log('Load result:', result);
            
            if (result.success) {
                // Validate and restore game state
                if (result.data.character && result.data.location) {
                    this.gameState.character = result.data.character;
                    this.gameState.companion = result.data.companion || this.createCompanion();
                    this.gameState.location = result.data.location;
                    this.gameState.inventory = result.data.inventory || this.createInventory();
                    this.gameState.equipment = result.data.equipment || this.createEquipment();
                    this.gameState.quests = result.data.quests || this.createQuests();
                    this.gameState.world = result.data.world || this.createWorld();
                    this.gameState.events = result.data.events || [];
                    
                    this.renderGame();
                    this.updateUI();
                    this.startGame(false); // Start game, not as new
                } else {
                    this.addEvent('Invalid save file format.');
                }
            } else if (result.canceled) {
                this.addEvent('Load cancelled.');
            } else {
                this.addEvent(`Failed to load game: ${result.error}`);
            }
        } catch (error) {
            console.error('Load error:', error);
            this.addEvent(`Load error: ${error.message}`);
        }
    }

    showSaveInfo() {
        const info = {
            character: `${this.gameState.character.name} (Level ${this.gameState.character.level} ${this.gameState.character.class})`,
            location: this.gameState.location.name,
            health: `${this.gameState.character.health.current}/${this.gameState.character.health.max}`,
            experience: `${this.gameState.character.experience.current}/${this.gameState.character.experience.max}`,
            activeQuests: this.gameState.quests.filter(q => !q.completed).length,
            inventoryItems: this.gameState.inventory.filter(slot => slot.item).length,
            playTime: this.getPlayTime()
        };
        
        const infoText = `
Character: ${info.character}
Location: ${info.location}
Health: ${info.health}
Experience: ${info.experience}
Active Quests: ${info.activeQuests}
Inventory Items: ${info.inventoryItems}
Play Time: ${info.playTime}
        `.trim();
        
        this.addEvent('Current Game Info:');
        infoText.split('\n').forEach(line => {
            if (line.trim()) this.addEvent(`  ${line.trim()}`);
        });
        
        this.sendCompanionMessage(`Here's your current status: You're ${info.character} currently in ${info.location}. You have ${info.activeQuests} active quests and ${info.inventoryItems} items in your inventory.`);
    }

    getPlayTime() {
        // Simple play time calculation (could be enhanced with actual start time tracking)
        const level = this.gameState.character.level;
        const exp = this.gameState.character.experience.current;
        const estimatedMinutes = Math.floor((level - 1) * 30 + exp / 10);
        const hours = Math.floor(estimatedMinutes / 60);
        const minutes = estimatedMinutes % 60;
        return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
    }

    startStaminaDrain() {
        this.stopStaminaDrain(); // Ensure no multiple timers are running
        const drain = () => {
            if (this.gameState.character.stamina.current > 0) {
                this.gameState.character.stamina.current = Math.max(0, this.gameState.character.stamina.current - 1);
                this.updateUI();
            }
            // Slower and random interval: between 5 and 15 seconds
            const randomInterval = Math.random() * 10000 + 5000;
            this.staminaTimeout = setTimeout(drain, randomInterval);
        };
        drain();
    }

    stopStaminaDrain() {
        if (this.staminaTimeout) {
            clearTimeout(this.staminaTimeout);
            this.staminaTimeout = null;
        }
    }

    startHungerDrain() {
        this.stopHungerDrain();
        const drain = () => {
            if (this.gameState.character.hunger.current > 0) {
                this.gameState.character.hunger.current = Math.max(0, this.gameState.character.hunger.current - 1);
                this.updateUI();
            }
            const randomInterval = Math.random() * 15000 + 10000; // between 10 and 25 seconds
            this.hungerTimeout = setTimeout(drain, randomInterval);
        };
        drain();
    }

    stopHungerDrain() {
        if (this.hungerTimeout) {
            clearTimeout(this.hungerTimeout);
            this.hungerTimeout = null;
        }
    }

    showVillageOverlay() {
        const overlay = document.getElementById('village-map-overlay');
        overlay.style.display = 'flex';
        this.generateVillageNPCs();
    }

    hideVillageOverlay() {
        const overlay = document.getElementById('village-map-overlay');
        overlay.style.display = 'none';
    }

    generateVillageNPCs() {
        const npcContainer = document.getElementById('village-npcs');
        npcContainer.innerHTML = '';
        const npcs = [
            { icon: '🧑‍🌾', name: 'Villager' },
            { icon: '👧', name: 'Child' },
            { icon: '🧙‍♂️', name: 'Elder' },
            { icon: '🧑‍🍳', name: 'Baker' }
        ];
        npcs.forEach((npc, i) => {
            const el = document.createElement('div');
            el.className = 'npc';
            el.textContent = npc.icon;
            el.title = npc.name;
            // Random start position
            el.style.left = (20 + Math.random() * 80 * i) + 'px';
            el.style.top = (Math.random() * 20) + 'px';
            npcContainer.appendChild(el);
            this.animateNPC(el);
        });
    }

    animateNPC(el) {
        const move = () => {
            const left = Math.random() * 500;
            const top = Math.random() * 20;
            el.style.left = left + 'px';
            el.style.top = top + 'px';
            setTimeout(move, 1200 + Math.random() * 1800);
        };
        move();
    }
}

// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new RPGGame();
}); 