import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { matchmakingApi } from '../lib/api';
import type { QueueEntry } from '../types/matchmaking';

export default function Matchmaking() {
  const navigate = useNavigate();
  const [selectedGame, setSelectedGame] = useState<string>('');
  const [inQueue, setInQueue] = useState(false);
  const [queueEntry, setQueueEntry] = useState<QueueEntry | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [queueTime, setQueueTime] = useState(0);

  const games = [
    { id: 'tictactoe', name: 'Tic-Tac-Toe', description: 'Classic 3×3 grid', emoji: '❌⭕' },
    { id: 'connect4', name: 'Connect 4', description: 'Standard 6×7 board', emoji: '🔴🟡' },
    { id: 'rps', name: 'Rock Paper Scissors', description: 'Best of 5 rounds', emoji: '✊✋✌️' },
    { id: 'dotsandboxes', name: 'Dots & Boxes', description: 'Classic 5×5 grid', emoji: '⚫📦' },
  ];

  // Check queue status on mount
  useEffect(() => {
    checkQueueStatus();
  }, []);

  // Queue timer
  useEffect(() => {
    let interval: number | undefined;
    if (inQueue && queueEntry) {
      const startTime = new Date(queueEntry.queued_at).getTime();
      interval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        setQueueTime(elapsed);
      }, 1000) as unknown as number;
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [inQueue, queueEntry]);

  const checkQueueStatus = async () => {
    try {
      const response = await matchmakingApi.getQueueStatus();
      if (response.in_queue && response.queue_entry) {
        setInQueue(true);
        setQueueEntry(response.queue_entry);
        setSelectedGame(response.queue_entry.game_type);
        
        // Check if matched
        if (response.queue_entry.status === 'matched' && response.queue_entry.matched_room_id) {
          navigate(`/room/${response.queue_entry.matched_room_id}`);
        }
      }
    } catch (err: any) {
      console.error('Failed to check queue status:', err);
    }
  };

  const joinQueue = async () => {
    if (!selectedGame) {
      setError('Please select a game');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await matchmakingApi.joinQueue({ game_type: selectedGame });
      setInQueue(true);
      setQueueEntry(response.queue_entry);
      
      // Poll for match
      const pollInterval = setInterval(async () => {
        try {
          const status = await matchmakingApi.getQueueStatus();
          if (status.queue_entry) {
            setQueueEntry(status.queue_entry);
            
            if (status.queue_entry.status === 'matched' && status.queue_entry.matched_room_id) {
              clearInterval(pollInterval);
              navigate(`/room/${status.queue_entry.matched_room_id}`);
            } else if (status.queue_entry.status === 'timeout') {
              clearInterval(pollInterval);
              setError('Matchmaking timed out. Please try again.');
              setInQueue(false);
              setQueueEntry(null);
            }
          }
        } catch (err) {
          console.error('Poll error:', err);
        }
      }, 2000);

      // Store interval ID for cleanup
      (window as any).matchmakingPollInterval = pollInterval;
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to join queue');
    } finally {
      setLoading(false);
    }
  };

  const leaveQueue = async () => {
    setLoading(true);
    setError(null);

    try {
      await matchmakingApi.leaveQueue();
      setInQueue(false);
      setQueueEntry(null);
      setQueueTime(0);
      
      // Clear poll interval
      if ((window as any).matchmakingPollInterval) {
        clearInterval((window as any).matchmakingPollInterval);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to leave queue');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Quick Play Matchmaking</h1>
      
      <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 mb-6">
        <p className="text-sm text-blue-800">
          <strong>ℹ️ Standard Rules:</strong> All games use default settings (3×3 for Tic-Tac-Toe, 6×7 for Connect 4, Best of 5 for RPS, etc.). 
          Want custom settings? Use <button onClick={() => navigate('/rooms')} className="underline font-semibold">Custom Game Rooms</button> instead.
        </p>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {!inQueue ? (
        <div>
          <h2 className="text-xl font-semibold mb-4">Select a Game</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {games.map((game) => (
              <button
                key={game.id}
                onClick={() => setSelectedGame(game.id)}
                className={`p-6 rounded-lg border-2 text-left transition-all cursor-pointer ${
                  selectedGame === game.id
                    ? 'border-blue-500 bg-blue-50 shadow-lg scale-105'
                    : 'border-gray-300 hover:border-blue-400 hover:shadow-md'
                }`}
              >
                <div className="text-3xl mb-2">{game.emoji}</div>
                <h3 className="text-lg font-semibold mb-1">{game.name}</h3>
                <p className="text-sm text-gray-600">{game.description}</p>
              </button>
            ))}
          </div>

          <button
            onClick={joinQueue}
            disabled={!selectedGame || loading}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loading ? 'Joining...' : 'Find Match'}
          </button>
        </div>
      ) : (
        <div className="text-center">
          <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-8 mb-6">
            <div className="animate-pulse mb-4">
              <div className="w-16 h-16 bg-blue-600 rounded-full mx-auto mb-4"></div>
            </div>
            <h2 className="text-2xl font-bold mb-2">Finding Opponent...</h2>
            <p className="text-gray-600 mb-4">
              {games.find(g => g.id === selectedGame)?.name}
            </p>
            <div className="text-3xl font-mono text-blue-600 mb-4">
              {formatTime(queueTime)}
            </div>
            <p className="text-sm text-gray-500">
              Rating: {queueEntry?.rating || 1200}
            </p>
          </div>

          <button
            onClick={leaveQueue}
            disabled={loading}
            className="w-full bg-red-600 text-white py-3 rounded-lg font-semibold hover:bg-red-700 disabled:bg-gray-400"
          >
            {loading ? 'Leaving...' : 'Cancel'}
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

