import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { roomApi } from '../lib/api';
import type { RoomType } from '../types/room';

export default function CreateRoom() {
  const navigate = useNavigate();
  const [gameType, setGameType] = useState<string>('tictactoe');
  const [roomType, setRoomType] = useState<RoomType>('private');
  const [maxPlayers, setMaxPlayers] = useState<number>(2);
  const [joinCode, setJoinCode] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<'create' | 'join'>('create');

  const games = [
    { id: 'tictactoe', name: 'Tic-Tac-Toe', players: 2, emoji: '❌⭕' },
    { id: 'connect4', name: 'Connect 4', players: 2, emoji: '🔴🟡' },
    { id: 'rps', name: 'Rock Paper Scissors', players: 2, emoji: '✊✋✌️' },
    { id: 'dotsandboxes', name: 'Dots & Boxes', players: 2, emoji: '⚫📦' },
  ];

  const createRoom = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await roomApi.createRoom({
        game_type: gameType,
        type: roomType,
        max_players: maxPlayers,
      });

      // Navigate to room lobby
      navigate(`/room/${response.room.id}`);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create room');
    } finally {
      setLoading(false);
    }
  };

  const joinByCode = async () => {
    if (!joinCode || joinCode.length !== 6) {
      setError('Please enter a valid 6-character join code');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await roomApi.joinRoomByCode({ join_code: joinCode.toUpperCase() });
      navigate(`/room/${response.room.id}`);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to join room');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Rooms</h1>

      {/* Mode Toggle */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setMode('create')}
          className={`flex-1 py-2 px-4 rounded-lg font-semibold transition-colors ${
            mode === 'create'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Create Room
        </button>
        <button
          onClick={() => setMode('join')}
          className={`flex-1 py-2 px-4 rounded-lg font-semibold transition-colors ${
            mode === 'join'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Join by Code
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {mode === 'create' ? (
        <div className="space-y-6">
          {/* Game Selection */}
          <div>
            <label className="block text-sm font-semibold mb-2">Select Game</label>
            <div className="grid grid-cols-2 gap-3">
              {games.map((game) => (
                <button
                  key={game.id}
                  onClick={() => {
                    setGameType(game.id);
                    setMaxPlayers(game.players);
                  }}
                  className={`p-4 rounded-lg border-2 text-left transition-all cursor-pointer ${
                    gameType === game.id
                      ? 'border-blue-500 bg-blue-50 shadow-lg'
                      : 'border-gray-300 hover:border-blue-400'
                  }`}
                >
                  <div className="text-2xl mb-1">{game.emoji}</div>
                  <h3 className="font-semibold mb-1">{game.name}</h3>
                  <p className="text-sm text-gray-600">
                    {game.players} players
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Room Type */}
          <div>
            <label className="block text-sm font-semibold mb-2">Room Type</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setRoomType('private')}
                className={`p-4 rounded-lg border-2 text-left ${
                  roomType === 'private'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <h3 className="font-semibold mb-1">Private</h3>
                <p className="text-sm text-gray-600">Invite friends with code</p>
              </button>
              <button
                onClick={() => setRoomType('quickplay')}
                className={`p-4 rounded-lg border-2 text-left ${
                  roomType === 'quickplay'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <h3 className="font-semibold mb-1">Quick Play</h3>
                <p className="text-sm text-gray-600">Open to anyone</p>
              </button>
            </div>
          </div>

          {/* Max Players */}
          <div>
            <label className="block text-sm font-semibold mb-2">
              Maximum Players: {maxPlayers}
            </label>
            <input
              type="range"
              min="2"
              max="4"
              value={maxPlayers}
              onChange={(e) => setMaxPlayers(parseInt(e.target.value))}
              className="w-full"
              disabled={true}
            />
            <p className="text-sm text-gray-500 mt-1">
              Currently all games support 2 players
            </p>
          </div>

          <button
            onClick={createRoom}
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating...' : 'Create Room'}
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-semibold mb-2">Enter Join Code</label>
            <input
              type="text"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              maxLength={6}
              placeholder="ABC123"
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-center text-2xl font-mono tracking-widest uppercase focus:border-blue-500 focus:outline-none"
            />
            <p className="text-sm text-gray-500 mt-2">
              Enter the 6-character code shared by the room host
            </p>
          </div>

          <button
            onClick={joinByCode}
            disabled={loading || joinCode.length !== 6}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loading ? 'Joining...' : 'Join Room'}
          </button>
        </div>
      )}

      <div className="mt-8">
        <button
          onClick={() => navigate('/dashboard')}
          className="text-blue-600 hover:underline"
        >
          ← Back to Dashboard
        </button>
      </div>
    </div>
  );
}

