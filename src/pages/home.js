import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { chatService } from '../services/api';

const HomePage = () => {
  const [characters, setCharacters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load characters when component mounts
  useEffect(() => {
    loadCharacters();
  }, []);

  const loadCharacters = async () => {
    try {
      setLoading(true);
      const charactersList = await chatService.getCharacters();
      setCharacters(charactersList);
    } catch (err) {
      console.error('Error loading characters:', err);
      setError('Failed to load characters');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <button 
            onClick={loadCharacters}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">AI Characters</h1>
            <Link 
              to="/chat"
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              Open Chat
            </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {characters.map((character) => (
            <Link
              key={character.id}
              to={`/chat?character=${character.id}`}
              className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow p-4"
            >
              <div className="aspect-square mb-4 rounded-lg overflow-hidden bg-gray-100">
                <img
                  src={character.avatar || '/default-avatar.jpg'}
                  alt={character.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = '/default-avatar.jpg';
                  }}
                />
              </div>
              <h3 className="font-semibold text-lg mb-2">{character.name}</h3>
              <p className="text-gray-600 text-sm line-clamp-2">
                {character.description || 'No description available'}
              </p>
            </Link>
          ))}

          <Link
            to="/chat?settings=true"
            className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow p-4 flex flex-col items-center justify-center text-gray-400 hover:text-gray-600"
          >
            <Plus className="w-12 h-12 mb-2" />
            <span className="text-sm font-medium">Create New Character</span>
          </Link>
        </div>
      </main>
    </div>
  );
};

export default HomePage;