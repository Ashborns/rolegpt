import mysql from 'mysql2/promise';

class DatabaseInitializer {
    constructor(dbConfig) {
        this.dbConfig = dbConfig;
    }

    async initialize() {
        try {
            const connection = await mysql.createConnection(this.dbConfig);

            // Create tables
            await this.createCharactersTable(connection);
            await this.createApiKeysTable(connection);
            await this.createUserDataTable(connection);
            await this.createChatHistoryTable(connection);
            
            // Insert default character
            await this.insertDefaultCharacter(connection);

            await connection.end();
            console.log('Database initialization completed successfully');
        } catch (error) {
            console.error('Database initialization failed:', error);
            throw error;
        }
    }

    async createCharactersTable(connection) {
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS characters (
                id VARCHAR(255) PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                description TEXT,
                avatar_url VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `);
    }

    async createApiKeysTable(connection) {
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS api_keys (
                model VARCHAR(50) PRIMARY KEY,
                api_key TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `);
    }

    async createUserDataTable(connection) {
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS user_data (
                user_id VARCHAR(255),
                character_id VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                PRIMARY KEY (user_id),
                FOREIGN KEY (character_id) REFERENCES characters(id)
                ON DELETE SET DEFAULT
                ON UPDATE CASCADE
            )
        `);
    }

    async createChatHistoryTable(connection) {
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS chat_history (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id VARCHAR(255),
                role VARCHAR(50) NOT NULL,
                content TEXT NOT NULL,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES user_data(user_id)
                ON DELETE CASCADE
                ON UPDATE CASCADE,
                INDEX idx_user_timestamp (user_id, timestamp)
            )
        `);
    }

    async insertDefaultCharacter(connection) {
        await connection.execute(`
            INSERT IGNORE INTO characters (id, name, description, avatar_url)
            VALUES ('default', 'Assistant', 'Saya adalah asisten AI yang membantu.', 'default-avatar.jpg')
        `);
    }
}

export default DatabaseInitializer;