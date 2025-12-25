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
    { id: 'tictactoe', name: 'Tic-Tac-Toe', players: 2, Icon: X, iconColor: 'text-accent-primary' },
    { id: 'connect4', name: 'Connect 4', players: 2, Icon: Circle, iconColor: 'text-accent-primary' },
    { id: 'rps', name: 'Rock Paper Scissors', players: 2, Icon: Gamepad2, iconColor: 'text-accent-primary' },
    { id: 'dotsandboxes', name: 'Dots & Boxes', players: 2, Icon: Circle, iconColor: 'text-accent-primary' },
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
    <div className="max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-10 text-text-primary">Rooms</h1>

      {/* Mode Toggle */}
      <div className="flex gap-4 mb-8">
        <button
          onClick={() => setMode('create')}
          className={`flex-1 py-4 px-6 rounded-xl font-semibold transition-all ${
            mode === 'create'
              ? 'bg-accent-primary text-bg-main shadow-elevated'
              : 'bg-surface-2 text-text-secondary border border-border-subtle hover:bg-surface-3 shadow-soft'
          }`}
        >
          Create Room
        </button>
        <button
          onClick={() => setMode('join')}
          className={`flex-1 py-4 px-6 rounded-xl font-semibold transition-all ${
            mode === 'join'
              ? 'bg-accent-primary text-bg-main shadow-elevated'
              : 'bg-surface-2 text-text-secondary border border-border-subtle hover:bg-surface-3 shadow-soft'
          }`}
        >
          Join by Code
        </button>
      </div>

      {error && (
        <div className="bg-danger-soft border-2 border-danger text-danger px-6 py-4 rounded-xl mb-6 shadow-soft">
          {error}
        </div>
      )}

      {mode === 'create' ? (
        <div className="space-y-8">
          {/* Game Selection */}
          <div>
            <label className="block text-base font-bold mb-4 text-text-primary">Select Game</label>
            <div className="grid grid-cols-2 gap-4">
              {games.map((game) => (
                <button
                  key={game.id}
                  onClick={() => {
                    setGameType(game.id);
                    setMaxPlayers(game.players);
                  }}
                  className={`p-6 rounded-xl border-2 text-left transition-all cursor-pointer ${
                    gameType === game.id
                      ? 'border-accent-primary bg-accent-soft shadow-elevated'
                      : 'border-border-subtle bg-surface-2 hover:border-accent-primary shadow-soft'
                  }`}
                >
                  <game.Icon className={`w-10 h-10 mb-2 ${game.iconColor}`} fill="currentColor" />
                  <h3 className="font-bold mb-1 text-text-primary">{game.name}</h3>
                  <p className="text-sm text-text-secondary font-medium">
                    {game.players} players
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Room Type */}
          <div>
            <label className="block text-base font-bold mb-4 text-text-primary">Room Type</label>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setRoomType('private')}
                className={`p-6 rounded-xl border-2 text-left transition-all ${
                  roomType === 'private'
                    ? 'border-accent-primary bg-accent-soft shadow-elevated'
                    : 'border-border-subtle bg-surface-2 hover:border-accent-primary shadow-soft'
                }`}
              >
                <h3 className="font-bold mb-2 text-text-primary">Private</h3>
                <p className="text-sm text-text-secondary font-medium">Invite friends with code</p>
              </button>
              <button
                onClick={() => setRoomType('quickplay')}
                className={`p-6 rounded-xl border-2 text-left transition-all ${
                  roomType === 'quickplay'
                    ? 'border-accent-primary bg-accent-soft shadow-elevated'
                    : 'border-border-subtle bg-surface-2 hover:border-accent-primary shadow-soft'
                }`}
              >
                <h3 className="font-bold mb-2 text-text-primary">Quick Play</h3>
                <p className="text-sm text-text-secondary font-medium">Open to anyone</p>
              </button>
            </div>
          </div>

          {/* Game-Specific Settings */}
          {gameType === 'rps' && (
            <div className="bg-surface-2 p-4 rounded-lg border-2 border-accent-primary">
              <label className="block text-sm font-semibold mb-2 text-text-primary">
                ✊✋✌️ Best of: {rpsBestOf} rounds
              </label>
              <div className="flex gap-2">
                {[3, 5, 7, 9].map((value) => (
                  <button
                    key={value}
                    onClick={() => setRpsBestOf(value)}
                    className={`flex-1 py-2 px-4 rounded-lg font-semibold transition-all ${
                      rpsBestOf === value
                        ? 'bg-accent-primary text-bg-main shadow-lg'
                        : 'bg-surface-3 text-text-primary hover:bg-surface-2 border-2 border-border-subtle'
                    }`}
                  >
                    {value}
                  </button>
                ))}
              </div>
              <p className="text-xs text-text-muted mt-2">
                First to win {Math.ceil(rpsBestOf / 2)} rounds wins the game
              </p>
            </div>
          )}

          {gameType === 'dotsandboxes' && (
            <div className="bg-surface-2 p-4 rounded-lg border-2 border-accent-primary">
              <label className="block text-sm font-semibold mb-2 text-text-primary">
                ⚫📦 Grid Size: {dotsGridSize}x{dotsGridSize} ({(dotsGridSize-1) * (dotsGridSize-1)} boxes)
              </label>
              <input
                type="range"
                min="4"
                max="8"
                value={dotsGridSize}
                onChange={(e) => setDotsGridSize(parseInt(e.target.value))}
                className="w-full accent-accent-primary"
              />
              <div className="flex justify-between text-xs text-text-muted mt-1">
                <span>4x4 (9 boxes)</span>
                <span>5x5 (16 boxes)</span>
                <span>6x6 (25 boxes)</span>
                <span>7x7 (36 boxes)</span>
                <span>8x8 (49 boxes)</span>
              </div>
            </div>
          )}

          {gameType === 'tictactoe' && (
            <div className="bg-surface-2 p-4 rounded-lg border-2 border-accent-primary">
              <label className="block text-sm font-semibold mb-2 text-text-primary">
                ❌⭕ Grid Size: {tictactoeGridSize}x{tictactoeGridSize}
              </label>
              <div className="flex gap-2">
                {[3, 4, 5].map((size) => (
                  <button
                    key={size}
                    onClick={() => setTictactoeGridSize(size)}
                    className={`flex-1 py-2 px-4 rounded-lg font-semibold transition-all ${
                      tictactoeGridSize === size
                        ? 'bg-accent-primary text-bg-main shadow-lg'
                        : 'bg-surface-3 text-text-primary hover:bg-surface-2 border-2 border-border-subtle'
                    }`}
                  >
                    {size}x{size}
                  </button>
                ))}
              </div>
              <p className="text-xs text-text-muted mt-2">
                Win by getting {tictactoeGridSize} in a row
              </p>
            </div>
          )}

          {gameType === 'connect4' && (
            <div className="bg-surface-2 p-4 rounded-lg border-2 border-accent-primary">
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-semibold mb-2 text-text-primary">
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
                    className="w-full accent-accent-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2 text-text-primary">
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
                    className="w-full accent-accent-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2 text-text-primary">
                    🎯 Win Length: {connect4WinLength} in a row
                  </label>
                  <input
                    type="range"
                    min="4"
                    max={Math.min(6, Math.min(connect4Rows, connect4Cols))}
                    value={connect4WinLength}
                    onChange={(e) => setConnect4WinLength(parseInt(e.target.value))}
                    className="w-full accent-accent-primary"
                  />
                </div>
              </div>
              <p className="text-xs text-text-muted mt-2">
                Board: {connect4Rows}x{connect4Cols}, Win: {connect4WinLength} in a row
              </p>
            </div>
          )}

          <button
            onClick={createRoom}
            disabled={loading}
            className="w-full bg-accent-primary text-bg-main py-3 rounded-lg font-semibold hover:bg-accent-hover active:bg-accent-active disabled:bg-text-disabled disabled:cursor-not-allowed transition-all"
          >
            {loading ? 'Creating...' : 'Create Room'}
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-semibold mb-2 text-text-primary">Enter Join Code</label>
            <input
              type="text"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              maxLength={6}
              placeholder="ABC123"
              className="w-full px-4 py-3 bg-surface-3 border-2 border-border-subtle rounded-lg text-center text-2xl font-mono tracking-widest uppercase text-text-primary placeholder-text-disabled focus:border-accent-primary focus:outline-none transition-colors"
            />
            <p className="text-sm text-text-muted mt-2">
              Enter the 6-character code shared by the room host
            </p>
          </div>

          <button
            onClick={joinByCode}
            disabled={loading || joinCode.length !== 6}
            className="w-full bg-accent-primary text-bg-main py-3 rounded-lg font-semibold hover:bg-accent-hover active:bg-accent-active disabled:bg-text-disabled disabled:cursor-not-allowed transition-all"
          >
            {loading ? 'Joining...' : 'Join Room'}
          </button>
        </div>
      )}

      <div className="mt-8">
        <button
          onClick={() => navigate('/dashboard')}
          className="text-accent-primary hover:text-accent-hover"
        >
          ← Back to Dashboard
        </button>
      </div>
    </div>
  );
}
