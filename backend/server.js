import express from 'express';
import cors from 'cors';
import { ConsoleRoleGPT } from './ashgpt.js';

const app = express();
const port = 5000;

// Initialize ConsoleRoleGPT
const rolegpt = new ConsoleRoleGPT();
await rolegpt.initDatabase();
await rolegpt.loadData();

app.use(cors());
app.use(express.json());

// API Endpoints
app.post('/api/chat', async (req, res) => {
  try {
    const { message } = req.body;
    const response = await rolegpt.chat(message);
    res.json({ response });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/characters', async (req, res) => {
  try {
    const characters = await rolegpt.listCharacters();
    res.json(characters);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/characters', async (req, res) => {
  try {
    const { name, description } = req.body;
    const character = await rolegpt.newCharacter(name, description);
    res.json(character);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/characters/current', async (req, res) => {
  try {
    const { character } = req.body;
    const result = await rolegpt.setCharacter(character);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/characters/:name', async (req, res) => {
  try {
    const result = await rolegpt.deleteCharacter(req.params.name);
    res.json({ message: `Character ${result} deleted successfully` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/settings/model', async (req, res) => {
  try {
    const { model } = req.body;
    const result = await rolegpt.setModel(model);
    res.json({ message: result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/settings/apikey', async (req, res) => {
  try {
    const { model, apiKey } = req.body;
    const result = await rolegpt.setApiKey(model, apiKey);
    res.json({ message: result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});