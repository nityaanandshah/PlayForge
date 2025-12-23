import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { Tournament, TournamentListResponse, CreateTournamentRequest } from '../types/tournament';

export default function Tournaments() {
  const navigate = useNavigate();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinCodeModal, setShowJoinCodeModal] = useState(false);
  const [selectedTournamentId, setSelectedTournamentId] = useState<string>('');
  const [joinCode, setJoinCode] = useState('');
  
  // Create tournament form state
  const [name, setName] = useState('');
  const [gameType, setGameType] = useState('tictactoe');
  const [maxParticipants, setMaxParticipants] = useState(8);
  const [isPrivate, setIsPrivate] = useState(false);
  const [creating, setCreating] = useState(false);
  
  // Game-specific settings
  const [rpsBestOf, setRpsBestOf] = useState(5);
  const [dotsGridSize, setDotsGridSize] = useState(5);
  const [tictactoeGridSize, setTictactoeGridSize] = useState(3);
  const [connect4Rows, setConnect4Rows] = useState(6);
  const [connect4Cols, setConnect4Cols] = useState(7);
  const [connect4WinLength, setConnect4WinLength] = useState(4);
  
  // Filter state
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    loadTournaments();
  }, [statusFilter]);

  const loadTournaments = async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      // Don't pass 'private' to backend - we'll filter client-side
      if (statusFilter !== 'all' && statusFilter !== 'private') {
        params.append('status', statusFilter);
      }
      params.append('limit', '50');
      
      const response = await api.get<TournamentListResponse>(`/tournaments?${params.toString()}`);
      
      // Ensure participants is always an array
      let tournamentsData = (response.data.tournaments || []).map(tournament => ({
        ...tournament,
        participants: tournament.participants || []
      }));
      
      // Filter for private tournaments if that filter is selected
      if (statusFilter === 'private') {
        tournamentsData = tournamentsData.filter(t => t.is_private);
      }
      
      setTournaments(tournamentsData);
    } catch (err: any) {
      console.error('Failed to load tournaments:', err.response?.data?.error || err.message);
      setError(err.response?.data?.error || 'Failed to load tournaments');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTournament = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Tournament name is required');
      return;
    }

    setCreating(true);
    setError('');

    try {
      // Build game settings based on selected game type
      const gameSettings: any = {};
      
      if (gameType === 'rps') {
        gameSettings.rps_best_of = rpsBestOf;
      } else if (gameType === 'dotsandboxes') {
        gameSettings.dots_grid_size = dotsGridSize;
      } else if (gameType === 'tictactoe') {
        gameSettings.tictactoe_grid_size = tictactoeGridSize;
        gameSettings.tictactoe_win_length = tictactoeGridSize;
      } else if (gameType === 'connect4') {
        gameSettings.connect4_rows = connect4Rows;
        gameSettings.connect4_cols = connect4Cols;
        gameSettings.connect4_win_length = connect4WinLength;
      }

      const request: CreateTournamentRequest = {
        name: name.trim(),
        game_type: gameType,
        tournament_type: 'single_elimination',
        max_participants: maxParticipants,
        is_private: isPrivate,
        game_settings: Object.keys(gameSettings).length > 0 ? gameSettings : undefined,
      };

      const response = await api.post('/tournaments/create', request);
      const tournament = response.data.tournament;
      
      // Close modal
      setShowCreateModal(false);
      setName('');
      
      // Navigate to tournament lobby
      navigate(`/tournament/${tournament.id}`);
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 
                          err.response?.data?.message || 
                          err.message || 
                          'Failed to create tournament. Please try again.';
      console.error('Failed to create tournament:', errorMessage);
      setError(errorMessage);
    } finally {
      setCreating(false);
    }
  };

  const handleJoinTournament = async (tournament: Tournament) => {
    // If private, show code modal
    if (tournament.is_private) {
      setSelectedTournamentId(tournament.id);
      setShowJoinCodeModal(true);
      return;
    }
    
    // Public tournament - join directly
    try {
      await api.post(`/tournaments/${tournament.id}/join`);
      navigate(`/tournament/${tournament.id}`);
    } catch (err: any) {
      console.error('Failed to join tournament:', err.response?.data?.error || err.message);
      setError(err.response?.data?.error || 'Failed to join tournament');
    }
  };

  const handleJoinWithCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCode.trim()) {
      setError('Please enter a join code');
      return;
    }

    try {
      await api.post(`/tournaments/${selectedTournamentId}/join`, { join_code: joinCode });
      setShowJoinCodeModal(false);
      setJoinCode('');
      navigate(`/tournament/${selectedTournamentId}`);
    } catch (err: any) {
      console.error('Failed to join with code:', err.response?.data?.error || err.message);
      setError(err.response?.data?.error || 'Invalid join code');
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'complete':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getGameEmoji = (gameType: string) => {
    switch (gameType) {
      case 'tictactoe':
        return '❌';
      case 'connect4':
        return '🔴';
      case 'rps':
        return '✊';
      case 'dotsandboxes':
        return '📦';
      default:
        return '🎮';
    }
  };

  const getGameName = (gameType: string) => {
    switch (gameType) {
      case 'tictactoe':
        return 'Tic-Tac-Toe';
      case 'connect4':
        return 'Connect-4';
      case 'rps':
        return 'Rock Paper Scissors';
      case 'dotsandboxes':
        return 'Dots & Boxes';
      default:
        return gameType;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">🏆 Tournaments</h1>
          <p className="text-gray-600">
            Join or create competitive tournaments
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-4 mb-6 justify-between items-center">
          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Tournaments</option>
              <option value="pending">Open for Join</option>
              <option value="in_progress">In Progress</option>
              <option value="complete">Completed</option>
              <option value="private">Private</option>
            </select>
            
            <button
              onClick={loadTournaments}
              className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 transition"
            >
              🔄 Refresh
            </button>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg font-semibold hover:from-indigo-600 hover:to-purple-700 transition shadow-lg"
          >
            ➕ Create Tournament
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            <p className="mt-4 text-gray-600">Loading tournaments...</p>
          </div>
        )}

        {/* Tournaments Grid */}
        {!loading && tournaments.length === 0 && (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <p className="text-gray-500 text-lg">No tournaments found</p>
            <p className="text-gray-400 mt-2">Create one to get started!</p>
          </div>
        )}

        {!loading && tournaments.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tournaments.map((tournament) => (
              <div
                key={tournament.id}
                className="bg-white rounded-lg shadow-md hover:shadow-xl transition p-6 cursor-pointer border border-gray-200"
                onClick={() => navigate(`/tournament/${tournament.id}`)}
              >
                {/* Tournament Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-3xl">{getGameEmoji(tournament.game_type)}</span>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-lg text-gray-800">{tournament.name}</h3>
                        {tournament.is_private && (
                          <span className="text-xs px-2 py-1 bg-gray-200 text-gray-700 rounded">🔒 Private</span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500">{getGameName(tournament.game_type)}</p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadgeColor(tournament.status)}`}>
                    {tournament.status.replace('_', ' ').toUpperCase()}
                  </span>
                </div>

                {/* Tournament Info */}
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Participants:</span>
                    <span className="font-semibold text-gray-800">
                      {tournament.participants?.length || 0} / {tournament.max_participants || 0}
                    </span>
                  </div>
                  
                  {tournament.status === 'in_progress' && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Round:</span>
                      <span className="font-semibold text-gray-800">
                        {tournament.current_round} / {tournament.total_rounds}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Format:</span>
                    <span className="font-semibold text-gray-800">Single Elimination</span>
                  </div>
                </div>

                {/* Join/View Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (tournament.status === 'pending') {
                      handleJoinTournament(tournament);
                    } else {
                      navigate(`/tournament/${tournament.id}`);
                    }
                  }}
                  className={`w-full py-2 rounded-lg font-semibold transition ${
                    tournament.status === 'pending'
                      ? 'bg-indigo-500 text-white hover:bg-indigo-600'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {tournament.status === 'pending' ? (tournament.is_private ? '🔒 Join with Code' : '➕ Join') : '👁️ View'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Tournament Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-2xl max-w-md w-full p-6 my-8 max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4 text-gray-800">Create Tournament</h2>
            
            <form onSubmit={handleCreateTournament}>
              <div className="space-y-4">
                {/* Tournament Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tournament Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g., Friday Night Championship"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>

                {/* Game Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Game Type
                  </label>
                  <select
                    value={gameType}
                    onChange={(e) => setGameType(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="tictactoe">❌ Tic-Tac-Toe</option>
                    <option value="connect4">🔴 Connect-4</option>
                    <option value="rps">✊ Rock Paper Scissors</option>
                    <option value="dotsandboxes">📦 Dots & Boxes</option>
                  </select>
                </div>

                {/* Max Participants */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Max Participants (Power of 2)
                  </label>
                  <select
                    value={maxParticipants}
                    onChange={(e) => setMaxParticipants(parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="4">4 Players</option>
                    <option value="8">8 Players</option>
                    <option value="16">16 Players</option>
                    <option value="32">32 Players</option>
                  </select>
                </div>

                {/* Privacy Toggle */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tournament Privacy
                  </label>
                  <div className="flex gap-4">
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="radio"
                        name="privacy"
                        checked={!isPrivate}
                        onChange={() => setIsPrivate(false)}
                        className="mr-2"
                      />
                      <span className="text-sm">🌍 Public (Anyone can join)</span>
                    </label>
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="radio"
                        name="privacy"
                        checked={isPrivate}
                        onChange={() => setIsPrivate(true)}
                        className="mr-2"
                      />
                      <span className="text-sm">🔒 Private (Requires code)</span>
                    </label>
                  </div>
                </div>

                {/* Game-Specific Settings */}
                {gameType === 'tictactoe' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Grid Size
                    </label>
                    <select
                      value={tictactoeGridSize}
                      onChange={(e) => setTictactoeGridSize(parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="3">3×3 (Classic)</option>
                      <option value="4">4×4</option>
                      <option value="5">5×5</option>
                    </select>
                  </div>
                )}

                {gameType === 'connect4' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Board Size
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-xs text-gray-500">Rows</label>
                          <input
                            type="number"
                            min="4"
                            max="10"
                            value={connect4Rows}
                            onChange={(e) => setConnect4Rows(parseInt(e.target.value) || 6)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-500">Columns</label>
                          <input
                            type="number"
                            min="4"
                            max="10"
                            value={connect4Cols}
                            onChange={(e) => setConnect4Cols(parseInt(e.target.value) || 7)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Win Length
                      </label>
                      <input
                        type="number"
                        min="3"
                        max="7"
                        value={connect4WinLength}
                        onChange={(e) => setConnect4WinLength(parseInt(e.target.value) || 4)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </>
                )}

                {gameType === 'rps' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Best Of
                    </label>
                    <select
                      value={rpsBestOf}
                      onChange={(e) => setRpsBestOf(parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="3">Best of 3</option>
                      <option value="5">Best of 5 (Recommended)</option>
                      <option value="7">Best of 7</option>
                      <option value="9">Best of 9</option>
                    </select>
                  </div>
                )}

                {gameType === 'dotsandboxes' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Grid Size (Dots)
                    </label>
                    <select
                      value={dotsGridSize}
                      onChange={(e) => setDotsGridSize(parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="4">4×4 dots (3×3 boxes)</option>
                      <option value="5">5×5 dots (4×4 boxes) - Classic</option>
                      <option value="6">6×6 dots (5×5 boxes)</option>
                      <option value="7">7×7 dots (6×6 boxes)</option>
                      <option value="8">8×8 dots (7×7 boxes)</option>
                    </select>
                  </div>
                )}
              </div>

              {/* Buttons */}
              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setName('');
                    setError('');
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                  disabled={creating}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition disabled:bg-gray-400"
                  disabled={creating}
                >
                  {creating ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Join Code Modal */}
      {showJoinCodeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-md w-full p-6">
            <h2 className="text-2xl font-bold mb-4 text-gray-800">🔒 Enter Join Code</h2>
            <p className="text-gray-600 mb-4">This is a private tournament. Please enter the join code to participate.</p>
            
            <form onSubmit={handleJoinWithCode}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Join Code
                </label>
                <input
                  type="text"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  placeholder="Enter code..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-lg tracking-wider uppercase"
                  required
                  autoFocus
                />
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowJoinCodeModal(false);
                    setJoinCode('');
                    setError('');
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition font-semibold"
                >
                  Join Tournament
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

