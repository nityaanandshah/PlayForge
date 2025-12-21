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
        <div className="text-xl">Loading room...</div>
      </div>
    );
  }

  if (error || !room) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error || 'Room not found'}
        </div>
        <button
          onClick={() => navigate('/dashboard')}
          className="text-blue-600 hover:underline"
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
        <h1 className="text-3xl font-bold mb-2">Room Lobby</h1>
        <div className="flex items-center gap-4">
          <span className="text-gray-600">{getGameTypeName(room.game_type)}</span>
          <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
            {getRoomTypeLabel(room.type)}
          </span>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Join Code */}
      {room.type === 'private' && (
        <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-1">Join Code</p>
              <p className="text-3xl font-mono font-bold text-gray-900">{room.join_code}</p>
            </div>
            <button
              onClick={copyJoinCode}
              className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
            >
              Copy Code
            </button>
          </div>
          <p className="text-sm text-gray-600 mt-2">
            Share this code with friends to invite them
          </p>
        </div>
      )}

      {/* Participants */}
      <div className="bg-white border-2 border-gray-200 rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">
          Players ({room.participants.length}/{room.max_players})
        </h2>
        <div className="space-y-3">
          {room.participants.map((participant: Participant) => (
            <div
              key={participant.user_id}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                  {participant.username.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold">
                    {participant.username}
                    {participant.role === 'host' && (
                      <span className="ml-2 text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
                        Host
                      </span>
                    )}
                    {participant.user_id === user?.id && (
                      <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                        You
                      </span>
                    )}
                  </p>
                  <p className="text-sm text-gray-500 capitalize">{participant.role}</p>
                </div>
              </div>
              <div>
                {participant.is_ready ? (
                  <span className="text-green-600 font-semibold">✓ Ready</span>
                ) : (
                  <span className="text-gray-400">Not Ready</span>
                )}
              </div>
            </div>
          ))}

          {/* Empty slots */}
          {Array.from({ length: room.max_players - room.participants.length }).map((_, i) => (
            <div
              key={`empty-${i}`}
              className="flex items-center p-3 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300"
            >
              <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center text-gray-500">
                ?
              </div>
              <span className="ml-3 text-gray-500">Waiting for player...</span>
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
              ? 'bg-gray-600 text-white hover:bg-gray-700'
              : 'bg-green-600 text-white hover:bg-green-700'
          }`}
        >
          {isReady ? 'Not Ready' : 'Ready'}
        </button>

        {isHost && (
          <button
            onClick={startGame}
            disabled={!canStart}
            className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
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
          className="w-full bg-red-600 text-white py-3 rounded-lg font-semibold hover:bg-red-700"
        >
          Leave Room
        </button>
      </div>

      <div className="mt-6">
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

