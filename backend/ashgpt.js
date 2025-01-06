import Groq from 'groq-sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';
import readline from 'readline';
import mysql from 'mysql2/promise';
import DatabaseInitializer from './database.js';

class PayloadHandler {
    static normalizeHistoryForStorage(messages) {
        return messages.map(msg => ({
            role: msg.role === 'model' ? 'assistant' : msg.role,
            content: typeof msg.parts === 'object' ? msg.parts[0].text : msg.content
        }));
    }

    static formatForGroq(messages) {
        return messages.map(msg => ({
            role: msg.role,
            content: msg.content
        }));
    }

    static formatForGemini(messages) {
        return messages.map(msg => ({
            role: msg.role === 'assistant' ? 'model' : msg.role,
            parts: [{text: msg.content}]
        }));
    }
}

class ConsoleRoleGPT {
    constructor() {
        this.dbConfig = {
            host: 'localhost',
            user: 'root',
            password: '',
            database: 'rolegpt_db'
        };
        this.connection = null;
        this.userData = {};
        this.characters = {};
        this.apiKeys = {
            groq: null,
            gemini: null
        };
        this.activeModel = 'groq';
        this.clients = {
            groq: null,
            gemini: null
        };
        this.currentUser = 'console-user';
        
        this.modelConfigs = {
            groq: {
                model: "llama-3.1-70b-versatile",
                init: (apiKey) => new Groq({ apiKey }),
                chat: async (client, messages) => {
                    const formattedMessages = PayloadHandler.formatForGroq(messages);
                    const response = await client.chat.completions.create({
                        messages: formattedMessages,
                        model: "llama-3.1-70b-versatile"
                    });
                    return response.choices[0]?.message?.content || null;
                }
            },
            gemini: {
                model: "gemini-1.5-flash",
                init: (apiKey) => new GoogleGenerativeAI(apiKey),
                chat: async (client, messages) => {
                    try {
                        const model = client.getGenerativeModel({ 
                            model: "gemini-1.5-flash"
                        });
            
                        const formattedMessages = PayloadHandler.formatForGemini(messages);
                        const systemPrompt = messages.find(m => m.role === 'system')?.content || '';
                        const chatHistory = formattedMessages.filter(m => m.role !== 'system');
                        
                        const chat = model.startChat({
                            history: chatHistory,
                            generationConfig: {
                                maxOutputTokens: 2048,
                            }
                        });
            
                        const lastMessage = messages[messages.length - 1].content;
                        const combinedMessage = systemPrompt 
                            ? `${systemPrompt}\n\nUser message: ${lastMessage}`
                            : lastMessage;
                        
                        const result = await chat.sendMessage([{ text: combinedMessage }]);
                        const response = await result.response;
                        return response.text();
                    } catch (error) {
                        console.error('Error in Gemini chat:', error);
                        throw error;
                    }
                }
            }
        };
    }

    // Character Management Methods
    async newCharacter(name, description, avatarUrl = 'default-avatar.jpg') {
        try {
            const [existing] = await this.connection.execute(
                'SELECT * FROM characters WHERE id = ?',
                [name]
            );
    
            if (existing.length > 0) {
                throw new Error('Karakter sudah ada');
            }
    
            await this.connection.execute(
                'INSERT INTO characters (id, name, description, avatar_url) VALUES (?, ?, ?, ?)',
                [name, name, description, avatarUrl]
            );
    
            this.characters[name] = {
                name: name,
                description: description,
                avatar_url: avatarUrl
            };
    
            return this.characters[name];
        } catch (error) {
            throw new Error(`Error creating character: ${error.message}`);
        }
    }

    async setCharacter(character) {
        try {
            const [exists] = await this.connection.execute(
                'SELECT * FROM characters WHERE id = ?',
                [character]
            );

            if (exists.length === 0) {
                throw new Error('Karakter tidak ditemukan');
            }

            await this.connection.execute(
                'UPDATE user_data SET character_id = ? WHERE user_id = ?',
                [character, this.currentUser]
            );

            // Clear chat history
            await this.connection.execute(
                'DELETE FROM chat_history WHERE user_id = ?',
                [this.currentUser]
            );

            this.userData[this.currentUser].character = character;
            this.userData[this.currentUser].history = [];

            return exists[0];
        } catch (error) {
            throw new Error(`Error setting character: ${error.message}`);
        }
    }

    async deleteCharacter(character) {
        try {
            if (character === 'default') {
                throw new Error('Karakter default tidak bisa dihapus');
            }

            const [exists] = await this.connection.execute(
                'SELECT * FROM characters WHERE id = ?',
                [character]
            );

            if (exists.length === 0) {
                throw new Error('Karakter tidak ditemukan');
            }

            // Reset users using this character to default
            await this.connection.execute(
                'UPDATE user_data SET character_id = "default" WHERE character_id = ?',
                [character]
            );

            // Delete the character
            await this.connection.execute(
                'DELETE FROM characters WHERE id = ?',
                [character]
            );

            delete this.characters[character];

            // Reset current user if they were using this character
            if (this.userData[this.currentUser].character === character) {
                this.userData[this.currentUser].character = 'default';
                this.userData[this.currentUser].history = [];
            }

            return character;
        } catch (error) {
            throw new Error(`Error deleting character: ${error.message}`);
        }
    }

    async listCharacters() {
        try {
            const [characters] = await this.connection.execute('SELECT * FROM characters');
            return characters;
        } catch (error) {
            throw new Error(`Error listing characters: ${error.message}`);
        }
    }

    async getCurrentCharacter() {
        try {
            const [userData] = await this.connection.execute(
                'SELECT c.* FROM characters c JOIN user_data u ON c.id = u.character_id WHERE u.user_id = ?',
                [this.currentUser]
            );
            
            if (userData.length === 0) {
                throw new Error('Karakter tidak ditemukan');
            }

            return userData[0];
        } catch (error) {
            throw new Error(`Error getting current character: ${error.message}`);
        }
    }

    //inisiasi database ketika jika table database belum ada di mysql lokal
    async initDatabase() {
        try {
            const dbInitializer = new DatabaseInitializer(this.dbConfig);
            await dbInitializer.initialize();
            this.connection = await mysql.createConnection(this.dbConfig);
        } catch (error) {
            console.error('Error initializing database:', error);
            throw error;
        }
    }

    async loadData() {
        try {
            // Load API keys
            const [apiKeys] = await this.connection.execute('SELECT * FROM api_keys');
            apiKeys.forEach(key => {
                this.apiKeys[key.model] = key.api_key;
            });

            // Load characters
            const [characters] = await this.connection.execute('SELECT * FROM characters');
            characters.forEach(char => {
                this.characters[char.id] = {
                    name: char.name,
                    description: char.description,
                    avatar_url: char.avatar_url
                };
            });

            // Load user data
            const [userData] = await this.connection.execute(
                'SELECT * FROM user_data WHERE user_id = ?',
                [this.currentUser]
            );

            if (userData.length === 0) {
                await this.connection.execute(
                    'INSERT INTO user_data (user_id, character_id) VALUES (?, ?)',
                    [this.currentUser, 'default']
                );
                this.userData[this.currentUser] = {
                    character: 'default',
                    history: []
                };
            } else {
                const [history] = await this.connection.execute(
                    'SELECT role, content FROM chat_history WHERE user_id = ? ORDER BY timestamp',
                    [this.currentUser]
                );
                this.userData[this.currentUser] = {
                    character: userData[0].character_id,
                    history: history
                };
            }
        } catch (error) {
            console.error('Error loading data:', error);
            throw error;
        }
    }

    async saveHistory(messages) {
        try {
            await this.connection.execute(
                'DELETE FROM chat_history WHERE user_id = ?',
                [this.currentUser]
            );

            for (const msg of messages) {
                await this.connection.execute(
                    'INSERT INTO chat_history (user_id, role, content) VALUES (?, ?, ?)',
                    [this.currentUser, msg.role, msg.content]
                );
            }
        } catch (error) {
            console.error('Error saving history:', error);
            throw error;
        }
    }

    async chat(prompt) {
        try {
            if (!prompt || typeof prompt !== 'string') {
                throw new Error('Invalid prompt provided');
            }

            if (!this.clients[this.activeModel]) {
                if (!this.apiKeys[this.activeModel]) {
                    throw new Error(`API key for ${this.activeModel} is not set`);
                }
                this.clients[this.activeModel] = this.modelConfigs[this.activeModel].init(this.apiKeys[this.activeModel]);
            }

            let payload = this.userData[this.currentUser];
            if (!payload) {
                throw new Error('User data not found');
            }

            if (prompt.toLowerCase() === "!newchat") {
                await this.connection.execute(
                    'DELETE FROM chat_history WHERE user_id = ?',
                    [this.currentUser]
                );
                this.userData[this.currentUser].history = [];
                return "Percakapan baru dimulai. Silakan lanjutkan.";
            }

            if (!Array.isArray(payload.history)) {
                payload.history = [];
            }

            if (payload.history.length === 0) {
                const character = this.characters[payload.character];
                if (!character) {
                    throw new Error('Character not found');
                }
                payload.history.push({
                    role: "system",
                    content: character.description
                });
            }

            payload.history.push({
                role: "user",
                content: prompt
            });

            const response = await this.modelConfigs[this.activeModel].chat(
                this.clients[this.activeModel],
                payload.history
            );

            if (!response) {
                throw new Error('No response received from AI model');
            }

            const updatedHistory = [
                ...payload.history,
                { role: "assistant", content: response }
            ];
            
            this.userData[this.currentUser].history = PayloadHandler.normalizeHistoryForStorage(updatedHistory);
            await this.saveHistory(this.userData[this.currentUser].history);

            return response;
        } catch (error) {
            console.error('Error in chat:', error);
            throw new Error(`Chat error: ${error.message}`);
        }
    }

    async setApiKey(model, apiKey) {
        if (!this.modelConfigs[model]) {
            throw new Error(`Model ${model} tidak didukung`);
        }
        await this.connection.execute(
            'INSERT INTO api_keys (model, api_key) VALUES (?, ?) ON DUPLICATE KEY UPDATE api_key = ?',
            [model, apiKey, apiKey]
        );
        this.apiKeys[model] = apiKey;
        return `API key untuk ${model} berhasil diatur`;
    }

    async setModel(model) {
        if (!this.modelConfigs[model]) {
            throw new Error(`Model ${model} tidak didukung`);
        }
        this.activeModel = model;
        return `Model diubah ke ${model}`;
    }

    getAvailableModels() {
        return Object.keys(this.modelConfigs);
    }

    showCommands() {
        console.log('\nPerintah yang tersedia:');
        console.log('!help - Menampilkan bantuan ini');
        console.log('!newchat - Memulai percakapan baru');
        console.log('!setmodel <model> - Mengubah model AI (groq/gemini)');
        console.log('!setkey <model> <apikey> - Mengatur API key');
        console.log('!newchar <name> <description> - Membuat karakter baru');
        console.log('!setchar <name> - Mengubah karakter aktif');
        console.log('!delchar <name> - Menghapus karakter');
        console.log('!listchar - Menampilkan daftar karakter');
        console.log('!currentchar - Menampilkan karakter aktif');
        console.log('!exit - Keluar dari program');
        console.log('');
    }
}

async function startConsoleChat() {
    const rolegpt = new ConsoleRoleGPT();
    
    try {
        await rolegpt.initDatabase();
        await rolegpt.loadData();

        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        console.log('\nSelamat datang di ConsoleRoleGPT!');
        console.log('Ketik !help untuk melihat perintah yang tersedia\n');

        const askQuestion = () => {
            rl.question('Anda: ', async (input) => {
                try {
                    if (input.toLowerCase() === '!exit') {
                        console.log('Terima kasih telah menggunakan ConsoleRoleGPT!');
                        await rolegpt.connection.end();
                        rl.close();
                        return;
                    }

                    if (input.toLowerCase() === '!help') {
                        rolegpt.showCommands();
                    }
                    else if (input.startsWith('!setkey')) {
                        const [_, model, apiKey] = input.split(' ');
                        const result = await rolegpt.setApiKey(model, apiKey);
                        console.log(result);
                    }
                    else if (input.startsWith('!setmodel')) {
                        const [_, model] = input.split(' ');
                        const result = await rolegpt.setModel(model);
                        console.log(result);
                    }
                    else if (input.startsWith('!newchar')) {
                        const [_, name, ...descParts] = input.split(' ');
                        const description = descParts.join(' ');
                        if (!name || !description) {
                            console.log('Format: !newchar <name> <description>');
                        } else {
                            const result = await rolegpt.newCharacter(name, description);
                            console.log(`Karakter "${name}" berhasil dibuat`);
                        }
                    }
                    else if (input.startsWith('!setchar')) {
                        const [_, name] = input.split(' ');
                        if (!name) {
                            console.log('Format: !setchar <name>');
                        } else {
                            const result = await rolegpt.setCharacter(name);
                            console.log(`Karakter diubah ke "${name}"`);
                        }
                    }
                    else if (input.startsWith('!delchar')) {
                        const [_, name] = input.split(' ');
                        if (!name) {
                            console.log('Format: !delchar <name>');
                        } else {
                            const result = await rolegpt.deleteCharacter(name);
                            console.log(`Karakter "${name}" berhasil dihapus`);
                        }
                    }
                    else if (input.toLowerCase() === '!listchar') {
                        const characters = await rolegpt.listCharacters();
                        console.log('\nDaftar Karakter:');
                        characters.forEach(char => {
                            console.log(`- ${char.name}: ${char.description}`);
                        });
                        console.log('');
                    }
                    else if (input.toLowerCase() === '!currentchar') {
                        const character = await rolegpt.getCurrentCharacter();
                        console.log(`\nKarakter aktif: ${character.name}`);
                        console.log(`Deskripsi: ${character.description}\n`);
                    }
                    else {
                        const response = await rolegpt.chat(input);
                        console.log('\nAI:', response, '\n');
                    }
                } catch (error) {
                    console.error('Error:', error.message);
                }
                askQuestion();
            });
        };

        askQuestion();
    } catch (error) {
        console.error('Failed to start ConsoleRoleGPT:', error);
        process.exit(1);
    }
}

startConsoleChat();

export { ConsoleRoleGPT };