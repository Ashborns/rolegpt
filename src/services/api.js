const API_BASE_URL = 'http://localhost:5000/api';

export const chatService = {
  sendMessage: async (message) => {
    const response = await fetch(`${API_BASE_URL}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message }),
    });
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    return response.json();
  },

  getCharacters: async () => {
    const response = await fetch(`${API_BASE_URL}/characters`);
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    return response.json();
  },

  createCharacter: async (name, description) => {
    const response = await fetch(`${API_BASE_URL}/characters`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name, description }),
    });
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    return response.json();
  },

  setCurrentCharacter: async (character) => {
    const response = await fetch(`${API_BASE_URL}/characters/current`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ character }),
    });
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    return response.json();
  },

  deleteCharacter: async (name) => {
    const response = await fetch(`${API_BASE_URL}/characters/${name}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    return response.json();
  },

  setModel: async (model) => {
    const response = await fetch(`${API_BASE_URL}/settings/model`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ model }),
    });
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    return response.json();
  },

  setApiKey: async (model, apiKey) => {
    const response = await fetch(`${API_BASE_URL}/settings/apikey`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ model, apiKey }),
    });
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    return response.json();
  },
};