import { useState, useRef, useEffect } from 'react';
import { Send, Settings, Mic, RefreshCw, X, Trash2, Plus } from 'lucide-react';
import { chatService } from '../services/api';
import { useSearchParams, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

export default function ChatbotApp() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(searchParams.get('settings') === 'true');
  const [characters, setCharacters] = useState([]);
  const [characterToDelete, setCharacterToDelete] = useState(null);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [currentCharacter, setCurrentCharacter] = useState(searchParams.get('character') || 'default');
  const [model, setModel] = useState('groq');
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [isAddingCharacter, setIsAddingCharacter] = useState(false);
  const [showDeleteCharacters, setShowDeleteCharacters] = useState(false);
  const messagesEndRef = useRef(null);
  
  const [newCharacter, setNewCharacter] = useState({
    name: '',
    description: '',
    avatarUrl: null
  });


  const handleAddCharacter = async () => {
    try {
      await chatService.createCharacter(
        newCharacter.name,
        newCharacter.description,
        newCharacter.avatarUrl || 'default-avatarUrl.jpg'
      );
      setIsAddingCharacter(false);
      setNewCharacter({ name: '', description: '', avatarUrl: null });
      await loadCharacters(); // Reload character list
    } catch (error) {
      console.error('Error adding character:', error);
    }
  };


  const handleDeleteCharacter = async (characterId) => {
    if (characterId === 'default') return; // Prevent deleting default character
    try {
      await chatService.deleteCharacter(characterId);
      await loadCharacters(); // Reload character list
      if (currentCharacter === characterId) {
        await handleCharacterChange('default');
      }
    } catch (error) {
      console.error('Error deleting character:', error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Load characters when component mounts
    loadCharacters();
  }, []);

  useEffect(() => {
    const initializeChat = async () => {
      await loadCharacters();
      const selectedCharacter = searchParams.get('character');
      if (selectedCharacter) {
        await handleCharacterChange(selectedCharacter);
      }
    };

    initializeChat();
  }, []);

  const loadCharacters = async () => {
    try {
      const charactersList = await chatService.getCharacters();
      setCharacters(charactersList);
    } catch (error) {
      console.error('Error loading characters:', error);
    }
  };

  const handleCharacterChange = async (character) => {
    try {
      await chatService.setCurrentCharacter(character);
      setCurrentCharacter(character);
      setMessages([]); // Clear chat history when changing character
      
      // Update URL without navigating
      const newParams = new URLSearchParams(searchParams);
      newParams.set('character', character);
      navigate(`/chat?${newParams.toString()}`, { replace: true });
    } catch (error) {
      console.error('Error changing character:', error);
    }
  };

  const createNewCharacter = async () => {
    if (!newCharacter.name.trim()) {
      console.error('Character name cannot be empty');
      return;
    }

    try {
      const characterData = {
        name: newCharacter.name.trim(),
        description: newCharacter.description.trim() || '',
        avatarUrl: newCharacter.avatarUrl || '/default-avatarUrl.jpg',
      };

      const createdCharacter = await chatService.createCharacter(
        characterData.name,
        characterData.description,
        characterData.avatarUrl
      );

      resetAddCharacterForm();
      await loadCharacters();
      
      // Optionally switch to the new character
      if (createdCharacter?.id) {
        await handleCharacterChange(createdCharacter.id);
      }
    } catch (error) {
      console.error('Error creating character:', error);
    }
  };

  const handleBackToHome = () => {
    navigate('/');
  };

  // Reset add character form
  const resetAddCharacterForm = () => {
    setIsAddingCharacter(false);
    setNewCharacter({
      name: '',
      description: '',
      avatarUrl: null
    });
  };

  // Improved delete character method
  const initiateCharacterDeletion = (character) => {
    setCharacterToDelete(character);
    setIsConfirmingDelete(true);
  };

  const cancelDeleteCharacter = () => {
    setCharacterToDelete(null);
    setIsConfirmingDelete(false);
  };


  const confirmDeleteCharacter = async () => {
    if (!characterToDelete) return;

    try {
      await chatService.deleteCharacter(characterToDelete.id); // Panggil API
      await loadCharacters(); // Perbarui daftar karakter
      setCharacterToDelete(null);
      setIsConfirmingDelete(false);
    } catch (error) {
      console.error('Error deleting character:', error);
    }
  };


  const resetDeleteConfirmation = () => {
    setCharacterToDelete(null);
    setIsConfirmingDelete(false);
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const newUserMessage = {
      role: 'user',
      content: inputMessage,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, newUserMessage]);
    setInputMessage('');
    setLoading(true);

    try {
      const { response } = await chatService.sendMessage(inputMessage);
      const aiResponse = {
        role: 'assistant',
        content: response,
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, aiResponse]);
    } catch (error) {
      console.error('Error sending message:', error);
      // Handle error (show error message to user)
    } finally {
      setLoading(false);
    }
  };

 
  const handleModelChange = async (newModel) => {
    try {
      await chatService.setModel(newModel);
      setModel(newModel);
    } catch (error) {
      console.error('Error changing model:', error);
    }
  };

  // Render method for character management section
  const renderCharacterManagement = () => (
    <div>
      {/* Dropdown Pilihan Model */}
      <div className="mb-4">
        <label className="block text-sm mb-1">Model</label>
        <select
          value={model}
          onChange={(e) => handleModelChange(e.target.value)}
          className="w-full bg-gray-700 rounded px-2 py-1 text-sm"
        >
          <option value="groq">Groq</option>
          <option value="gemini">Gemini</option>
        </select>
      </div>
  
      {/* Tombol Add dan Delete Characters */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setIsAddingCharacter(true)}
          className="flex-1 text-sm bg-gray-600 hover:bg-gray-700 text-white px-2 py-1 rounded"
        >
          Add Character
        </button>
        <button
          onClick={() => setShowDeleteCharacters((prev) => !prev)}
          className="flex-1 text-sm bg-gray-600 hover:bg-gray-700 text-white px-2 py-1 rounded"
        >
          Delete Characters
        </button>
      </div>
  
      {/* Form Tambah Karakter */}
      {isAddingCharacter && (
        <div className="mb-4 p-4 bg-gray-700 rounded">
          <input
            type="text"
            placeholder="Character name"
            value={newCharacter.name}
            onChange={(e) => setNewCharacter((prev) => ({ ...prev, name: e.target.value }))}
            className="w-full mb-2 bg-gray-600 rounded px-2 py-1 text-sm"
          />
          <textarea
            placeholder="Character description (optional)"
            value={newCharacter.description}
            onChange={(e) => setNewCharacter((prev) => ({ ...prev, description: e.target.value }))}
            className="w-full mb-2 bg-gray-600 rounded px-2 py-1 text-sm"
            rows={3}
          />
          <div className="flex justify-end gap-2">
            <button
              onClick={resetAddCharacterForm}
              className="text-sm bg-gray-600 hover:bg-gray-500 px-3 py-2 rounded"
            >
              Cancel
            </button>
            <button
              onClick={createNewCharacter}
              className="text-sm bg-blue-600 hover:bg-blue-700 px-3 py-2 rounded"
            >
              Save
            </button>
          </div>
        </div>
      )}
  
      {/* Daftar Karakter untuk Dihapus */}
      {showDeleteCharacters && (
        <div className="mb-4">
          <h3 className="text-sm font-medium mb-2">Delete Characters</h3>
          <div className="space-y-1">
            {characters
              .filter((char) => char.id !== 'default')
              .map((char) => (
                <div
                  key={char.id}
                  className="flex items-center justify-between bg-gray-700 rounded px-2 py-1"
                >
                  <span className="text-sm">{char.name}</span>
                  <button
                    onClick={() => initiateCharacterDeletion(char)}
                    className="text-red-500 hover:text-red-400"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
          </div>
        </div>
      )}
  
      {/* Form Konfirmasi Hapus Karakter */}
      {isConfirmingDelete && characterToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 text-white rounded-lg p-6 w-80">
            <h2 className="text-lg font-semibold mb-4">Hapus Karakter</h2>
            <p className="mb-4">
              Apakah Anda yakin ingin menghapus karakter <strong>{characterToDelete.name}</strong>?
              Tindakan ini tidak dapat dibatalkan.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={cancelDeleteCharacter}
                className="px-4 py-2 bg-gray-600 rounded hover:bg-gray-500"
              >
                Batal
              </button>
              <button
                onClick={confirmDeleteCharacter}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
  
  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-64 bg-gray-900 text-white p-4 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={handleBackToHome}
              className="text-xl font-bold hover:text-gray-300"
            >
              ← Home
            </button>
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 hover:bg-gray-700 rounded"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
  
          <button
            onClick={() => setMessages([])}
            className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-gray-800 hover:bg-gray-700 rounded mb-4"
          >
            <RefreshCw className="w-4 h-4" />
            New Chat
          </button>
  
          {showSettings && (
            <div className="mt-4 p-4 bg-gray-800 rounded">
              <h2 className="text-sm font-semibold mb-3">Settings</h2>
              {renderCharacterManagement()}
            </div>
          )}
        </div>
  
        {/* Dropdown Pilihan Karakter */}
        <div className="mt-4">
          <label className="block text-sm mb-1">Your Character</label>
          <select
            value={currentCharacter}
            onChange={(e) => handleCharacterChange(e.target.value)}
            className="w-full bg-gray-700 rounded px-2 py-1 text-sm"
          >
            {characters.map((char) => (
              <option key={char.id} value={char.id}>
                {char.name}
              </option>
            ))}
          </select>
        </div>
      </div>
  
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-4">
        
{messages.map((message, index) => (
  <div key={index} className={`mb-4 ${message.role === 'user' ? 'ml-auto' : ''}`}>
  <div className={`max-w-3xl rounded-lg p-4 ${
    message.role === 'user' ? 'bg-blue-600 text-white ml-auto' : 'bg-white shadow'
  }`}>
    <p className="text-sm mb-1">
      {message.role === 'user' ? 'You' : characters.find(char => char.id === currentCharacter)?.name || 'Assistant'}
    </p>
    <ReactMarkdown 
      components={{
        code: ({node, inline, className, children, ...props}) => (
          <code className="bg-gray-100 dark:bg-gray-800 rounded px-1 py-0.5" {...props}>
            {children}
          </code>
        ),
        strong: ({node, children}) => (
          <strong className="font-bold">{children}</strong>
        ),
        em: ({node, children}) => (
          <em className="italic">{children}</em>
        )
      }}
    >
      {message.content}
    </ReactMarkdown>
  </div>
</div>
))}
          {loading && (
            <div className="max-w-3xl rounded-lg p-4 bg-white shadow">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
  
        {/* Input Area */}
        <div className="border-t bg-white p-4">
          <div className="max-w-4xl mx-auto flex gap-2">
            <div className="flex-1 relative">
              <textarea
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder="Message..."
                className="w-full rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 p-3 pr-12 resize-none"
                rows={1}
              />
              {audioEnabled && (
                <button
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <Mic className="w-5 h-5" />
                </button>
              )}
            </div>
            <button
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || loading}
              className={`p-3 rounded-lg ${inputMessage.trim() && !loading
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-gray-100 text-gray-400'
                }`}
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}  