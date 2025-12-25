import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { roomApi } from '../lib/api';
import { useAuth } from '../hooks/useAuth';
import type { Room, Participant } from '../types/room';

export default function RoomLobby() {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [room, setRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (roomId) {
      loadRoom();
      // Poll for room updates
      const interval = setInterval(loadRoom, 2000);
      return () => clearInterval(interval);
    }
  }, [roomId]);

  useEffect(() => {
    // Check if game has started
    if (room && room.status === 'active' && room.game_id) {
      navigate(`/game/${room.game_id}`);
    }
  }, [room, navigate]);

  const loadRoom = async () => {
    if (!roomId) return;

    try {
      const data = await roomApi.getRoom(roomId);
      setRoom(data);
      
      // Update local ready status
      const currentUser = data.participants.find(p => p.user_id === user?.id);
      if (currentUser) {
        setIsReady(currentUser.is_ready);
      }
      
      setLoading(false);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load room');
      setLoading(false);
    }
  };

  const toggleReady = async () => {
    if (!roomId) return;

    try {
      const response = await roomApi.setReady(roomId, !isReady);
      setRoom(response.room);
      setIsReady(!isReady);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update ready status');
    }
  };

  const startGame = async () => {
    if (!roomId) return;

    try {
      await roomApi.startGame(roomId);
      // Room status will update via polling, triggering navigation
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to start game');
    }
  };

  const leaveRoom = async () => {
    if (!roomId) return;

    try {
      await roomApi.leaveRoom(roomId);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to leave room');
    }
  };

  const copyJoinCode = () => {
    if (room) {
      navigator.clipboard.writeText(room.join_code);
      alert('Join code copied to clipboard!');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-xl text-text-primary">Loading room...</div>
      </div>
    );
  }

  if (error || !room) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-danger-soft border border-danger text-danger px-4 py-3 rounded mb-4">
          {error || 'Room not found'}
        </div>
        <button
          onClick={() => navigate('/dashboard')}
          className="text-accent-primary hover:text-accent-hover"
        >
          ← Back to Dashboard
        </button>
      </div>
    );
  }

  const isHost = room.host_id === user?.id;
  const allReady = room.participants.every(p => p.is_ready);
  const canStart = isHost && allReady && room.participants.length >= 2;

  const getGameTypeName = (type: string) => {
    const names: Record<string, string> = {
      tictactoe: 'Tic-Tac-Toe',
      connect4: 'Connect 4',
      rps: 'Rock Paper Scissors',
      dotsandboxes: 'Dots & Boxes',
    };
    return names[type] || type;
  };

  const getRoomTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      quickplay: 'Quick Play',
      private: 'Private',
      ranked: 'Ranked',
    };
    return labels[type] || type;
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2 text-text-primary">Room Lobby</h1>
        <div className="flex items-center gap-4">
          <span className="text-text-secondary">{getGameTypeName(room.game_type)}</span>
          <span className="px-3 py-1 bg-accent-soft text-accent-primary border border-accent-primary rounded-full text-sm">
            {getRoomTypeLabel(room.type)}
          </span>
        </div>
      </div>

      {error && (
        <div className="bg-danger-soft border border-danger text-danger px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Join Code */}
      {room.type === 'private' && (
        <div className="bg-surface-1 border-2 border-accent-primary rounded-lg p-4 mb-6 shadow-soft">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-text-secondary mb-1">Join Code</p>
              <p className="text-3xl font-mono font-bold text-accent-primary">{room.join_code}</p>
            </div>
            <button
              onClick={copyJoinCode}
              className="px-4 py-2 bg-accent-primary text-bg-main rounded-lg hover:bg-accent-hover transition-all"
            >
              Copy Code
            </button>
          </div>
          <p className="text-sm text-text-muted mt-2">
            Share this code with friends to invite them
          </p>
        </div>
      )}

      {/* Game Settings */}
      {room.game_settings && (
        <div className="bg-surface-1 border-2 border-border-subtle rounded-lg p-4 mb-6 shadow-soft">
          <p className="text-sm font-semibold text-text-primary mb-2">🎮 Game Settings</p>
          <div className="space-y-1">
            {room.game_type === 'tictactoe' && room.game_settings.tictactoe_grid_size && (
              <p className="text-text-secondary">
                <span className="font-semibold text-text-primary">Grid Size:</span> {room.game_settings.tictactoe_grid_size}x{room.game_settings.tictactoe_grid_size}
                <span className="text-sm text-text-muted ml-2">
                  (Get {room.game_settings.tictactoe_win_length || room.game_settings.tictactoe_grid_size} in a row to win)
                </span>
              </p>
            )}
            {room.game_type === 'connect4' && (room.game_settings.connect4_rows || room.game_settings.connect4_cols) && (
              <p className="text-text-secondary">
                <span className="font-semibold text-text-primary">Board:</span> {room.game_settings.connect4_rows || 6}x{room.game_settings.connect4_cols || 7}
                <span className="text-sm text-text-muted ml-2">
                  (Get {room.game_settings.connect4_win_length || 4} in a row to win)
                </span>
              </p>
            )}
            {room.game_type === 'rps' && room.game_settings.rps_best_of && (
              <p className="text-text-secondary">
                <span className="font-semibold text-text-primary">Best of:</span> {room.game_settings.rps_best_of} rounds
                <span className="text-sm text-text-muted ml-2">
                  (First to {Math.ceil(room.game_settings.rps_best_of / 2)} wins)
                </span>
              </p>
            )}
            {room.game_type === 'dotsandboxes' && room.game_settings.dots_grid_size && (
              <p className="text-text-secondary">
                <span className="font-semibold text-text-primary">Grid Size:</span> {room.game_settings.dots_grid_size}x{room.game_settings.dots_grid_size}
                <span className="text-sm text-text-muted ml-2">
                  ({(room.game_settings.dots_grid_size - 1) * (room.game_settings.dots_grid_size - 1)} boxes)
                </span>
              </p>
            )}
          </div>
        </div>
      )}

      {/* Participants */}
      <div className="bg-surface-1 border-2 border-border-subtle rounded-lg p-6 mb-6 shadow-soft">
        <h2 className="text-xl font-semibold mb-4 text-text-primary">
          Players ({room.participants.length}/{room.max_players})
        </h2>
        <div className="space-y-3">
          {room.participants.map((participant: Participant) => (
            <div
              key={participant.user_id}
              className="flex items-center justify-between p-3 bg-surface-2 rounded-lg border border-border-subtle"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-accent-primary rounded-full flex items-center justify-center text-bg-main font-bold">
                  {participant.username.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-text-primary">
                    {participant.username}
                    {participant.role === 'host' && (
                      <span className="ml-2 text-xs bg-accent-soft text-accent-primary border border-accent-primary px-2 py-1 rounded">
                        Host
                      </span>
                    )}
                    {participant.user_id === user?.id && (
                      <span className="ml-2 text-xs bg-success-soft text-success border border-success px-2 py-1 rounded">
                        You
                      </span>
                    )}
                  </p>
                  <p className="text-sm text-text-muted capitalize">{participant.role}</p>
                </div>
              </div>
              <div>
                {participant.is_ready ? (
                  <span className="text-success font-semibold">✓ Ready</span>
                ) : (
                  <span className="text-text-disabled">Not Ready</span>
                )}
              </div>
            </div>
          ))}

          {/* Empty slots */}
          {Array.from({ length: room.max_players - room.participants.length }).map((_, i) => (
            <div
              key={`empty-${i}`}
              className="flex items-center p-3 bg-surface-2 rounded-lg border-2 border-dashed border-border-subtle"
            >
              <div className="w-10 h-10 bg-surface-3 rounded-full flex items-center justify-center text-text-disabled">
                ?
              </div>
              <span className="ml-3 text-text-muted">Waiting for player...</span>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="space-y-3">
        <button
          onClick={toggleReady}
          className={`w-full py-3 rounded-lg font-semibold transition-colors ${
            isReady
              ? 'bg-text-muted text-bg-main hover:bg-text-disabled'
              : 'bg-success text-text-primary hover:bg-success/80'
          }`}
        >
          {isReady ? 'Not Ready' : 'Ready'}
        </button>

        {isHost && (
          <button
            onClick={startGame}
            disabled={!canStart}
            className="w-full bg-accent-primary text-bg-main py-3 rounded-lg font-semibold hover:bg-accent-hover active:bg-accent-active disabled:bg-text-disabled disabled:cursor-not-allowed transition-all"
          >
            {!allReady
              ? 'Waiting for all players to be ready...'
              : room.participants.length < 2
              ? 'Need at least 2 players'
              : 'Start Game'}
          </button>
        )}

        <button
          onClick={leaveRoom}
          className="w-full bg-danger text-text-primary py-3 rounded-lg font-semibold hover:bg-danger/80 transition-all"
        >
          Leave Room
        </button>
      </div>

      <div className="mt-6">
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
