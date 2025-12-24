import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { roomApi } from '../lib/api';
import type { RoomType, GameSettings } from '../types/room';
import { X, Circle, Gamepad2 } from 'lucide-react';

export default function CreateRoom() {
  const navigate = useNavigate();
  const [gameType, setGameType] = useState<string>('tictactoe');
  const [roomType, setRoomType] = useState<RoomType>('private');
  const [maxPlayers, setMaxPlayers] = useState<number>(2);
  const [joinCode, setJoinCode] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<'create' | 'join'>('create');
  
  // Game-specific settings
  const [rpsBestOf, setRpsBestOf] = useState<number>(5);
  const [dotsGridSize, setDotsGridSize] = useState<number>(5);
  const [tictactoeGridSize, setTictactoeGridSize] = useState<number>(3);
  const [connect4Rows, setConnect4Rows] = useState<number>(6);
  const [connect4Cols, setConnect4Cols] = useState<number>(7);
  const [connect4WinLength, setConnect4WinLength] = useState<number>(4);

  const games = [
    { id: 'tictactoe', name: 'Tic-Tac-Toe', players: 2, Icon: X, iconColor: 'text-blue-500' },
    { id: 'connect4', name: 'Connect 4', players: 2, Icon: Circle, iconColor: 'text-red-500' },
    { id: 'rps', name: 'Rock Paper Scissors', players: 2, Icon: Gamepad2, iconColor: 'text-purple-500' },
    { id: 'dotsandboxes', name: 'Dots & Boxes', players: 2, Icon: Circle, iconColor: 'text-indigo-500' },
  ];

  const createRoom = async () => {
    setLoading(true);
    setError(null);

    try {
      // Build game settings based on selected game type
      const gameSettings: GameSettings = {};
      
      if (gameType === 'rps') {
        gameSettings.rps_best_of = rpsBestOf;
      } else if (gameType === 'dotsandboxes') {
        gameSettings.dots_grid_size = dotsGridSize;
      } else if (gameType === 'tictactoe') {
        gameSettings.tictactoe_grid_size = tictactoeGridSize;
        gameSettings.tictactoe_win_length = tictactoeGridSize; // Same as grid size for standard rules
      } else if (gameType === 'connect4') {
        gameSettings.connect4_rows = connect4Rows;
        gameSettings.connect4_cols = connect4Cols;
        gameSettings.connect4_win_length = connect4WinLength;
      }
      
      const response = await roomApi.createRoom({
        game_type: gameType,
        type: roomType,
        max_players: maxPlayers,
        game_settings: Object.keys(gameSettings).length > 0 ? gameSettings : undefined,
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
                  <game.Icon className={`w-8 h-8 mb-1 ${game.iconColor}`} fill="currentColor" />
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

          {/* Game-Specific Settings */}
          {gameType === 'rps' && (
            <div className="bg-purple-50 p-4 rounded-lg border-2 border-purple-200">
              <label className="block text-sm font-semibold mb-2">
                ✊✋✌️ Best of: {rpsBestOf} rounds
              </label>
              <div className="flex gap-2">
                {[3, 5, 7, 9].map((value) => (
                  <button
                    key={value}
                    onClick={() => setRpsBestOf(value)}
                    className={`flex-1 py-2 px-4 rounded-lg font-semibold transition-all ${
                      rpsBestOf === value
                        ? 'bg-purple-600 text-white shadow-lg'
                        : 'bg-white text-gray-700 hover:bg-purple-100 border-2 border-purple-300'
                    }`}
                  >
                    {value}
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-600 mt-2">
                First to win {Math.ceil(rpsBestOf / 2)} rounds wins the game
              </p>
            </div>
          )}

          {gameType === 'dotsandboxes' && (
            <div className="bg-green-50 p-4 rounded-lg border-2 border-green-200">
              <label className="block text-sm font-semibold mb-2">
                ⚫📦 Grid Size: {dotsGridSize}x{dotsGridSize} ({(dotsGridSize-1) * (dotsGridSize-1)} boxes)
              </label>
              <input
                type="range"
                min="4"
                max="8"
                value={dotsGridSize}
                onChange={(e) => setDotsGridSize(parseInt(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-600 mt-1">
                <span>4x4 (9 boxes)</span>
                <span>5x5 (16 boxes)</span>
                <span>6x6 (25 boxes)</span>
                <span>7x7 (36 boxes)</span>
                <span>8x8 (49 boxes)</span>
              </div>
            </div>
          )}

          {gameType === 'tictactoe' && (
            <div className="bg-indigo-50 p-4 rounded-lg border-2 border-indigo-200">
              <label className="block text-sm font-semibold mb-2">
                ❌⭕ Grid Size: {tictactoeGridSize}x{tictactoeGridSize}
              </label>
              <div className="flex gap-2">
                {[3, 4, 5].map((size) => (
                  <button
                    key={size}
                    onClick={() => setTictactoeGridSize(size)}
                    className={`flex-1 py-2 px-4 rounded-lg font-semibold transition-all ${
                      tictactoeGridSize === size
                        ? 'bg-indigo-600 text-white shadow-lg'
                        : 'bg-white text-gray-700 hover:bg-indigo-100 border-2 border-indigo-300'
                    }`}
                  >
                    {size}x{size}
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-600 mt-2">
                Win by getting {tictactoeGridSize} in a row
              </p>
            </div>
          )}

          {gameType === 'connect4' && (
            <div className="bg-orange-50 p-4 rounded-lg border-2 border-orange-200">
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-semibold mb-2">
                    🔴🟡 Rows: {connect4Rows}
                  </label>
                  <input
                    type="range"
                    min="4"
                    max="10"
                    value={connect4Rows}
                    onChange={(e) => {
                      const newRows = parseInt(e.target.value);
                      setConnect4Rows(newRows);
                      // Adjust win length if needed
                      if (connect4WinLength > Math.min(newRows, connect4Cols)) {
                        setConnect4WinLength(Math.min(newRows, connect4Cols));
                      }
                    }}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">
                    🔴🟡 Columns: {connect4Cols}
                  </label>
                  <input
                    type="range"
                    min="4"
                    max="10"
                    value={connect4Cols}
                    onChange={(e) => {
                      const newCols = parseInt(e.target.value);
                      setConnect4Cols(newCols);
                      // Adjust win length if needed
                      if (connect4WinLength > Math.min(connect4Rows, newCols)) {
                        setConnect4WinLength(Math.min(connect4Rows, newCols));
                      }
                    }}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">
                    🎯 Win Length: {connect4WinLength} in a row
                  </label>
                  <input
                    type="range"
                    min="4"
                    max={Math.min(6, Math.min(connect4Rows, connect4Cols))}
                    value={connect4WinLength}
                    onChange={(e) => setConnect4WinLength(parseInt(e.target.value))}
                    className="w-full"
                  />
                </div>
              </div>
              <p className="text-xs text-gray-600 mt-2">
                Board: {connect4Rows}x{connect4Cols}, Win: {connect4WinLength} in a row
              </p>
            </div>
          )}

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

