import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { Tournament, TournamentListResponse, CreateTournamentRequest } from '../types/tournament';
import { Trophy, RefreshCw, Plus, X, Circle, Gamepad2, Lock, Eye } from 'lucide-react';

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
        return 'bg-surface-2 text-text-secondary';
      case 'in_progress':
        return 'bg-warning-soft text-warning';
      case 'complete':
        return 'bg-success-soft text-success';
      case 'cancelled':
        return 'bg-danger-soft text-danger';
      default:
        return 'bg-surface-2 text-text-secondary';
    }
  };

  const getGameIcons = (gameType: string) => {
    switch (gameType) {
      case 'tictactoe':
        return [
          { Icon: X, color: 'text-accent-primary' },
          { Icon: Circle, color: 'text-accent-primary' }
        ];
      case 'connect4':
        return [
          { Icon: Circle, color: 'text-accent-primary' },
          { Icon: Circle, color: 'text-warning' }
        ];
      case 'rps':
        return [
          { Icon: Gamepad2, color: 'text-accent-primary' }
        ];
      case 'dotsandboxes':
        return [
          { Icon: Circle, color: 'text-accent-primary' },
          { Icon: Circle, color: 'text-text-muted' }
        ];
      default:
        return [{ Icon: Gamepad2, color: 'text-text-muted' }];
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
    <>
      <div className="bg-surface-1 shadow-floating rounded-xl p-8 border border-border-subtle">
        {/* Header */}
        <h1 className="text-3xl font-bold text-text-primary mb-6 flex items-center gap-2">
          <Trophy className="w-8 h-8 text-accent-primary" fill="currentColor" />
          Tournaments
        </h1>
        <p className="text-text-secondary mb-6">
          Join or create competitive tournaments
        </p>

        {/* Actions */}
        <div className="flex flex-wrap gap-4 justify-between items-center mb-8">
          <div className="flex gap-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-5 py-3 border border-border-subtle rounded-xl bg-surface-2 focus:outline-none focus:ring-2 focus:ring-accent-primary focus:border-accent-primary shadow-soft font-medium text-text-primary"
            >
              <option value="all">All Tournaments</option>
              <option value="pending">Open for Join</option>
              <option value="in_progress">In Progress</option>
              <option value="complete">Completed</option>
              <option value="private">Private</option>
            </select>
            
            <button
              onClick={loadTournaments}
              className="px-5 py-3 bg-surface-2 border border-border-subtle rounded-xl hover:bg-surface-3 transition-all shadow-soft hover:shadow-elevated flex items-center gap-2 font-medium text-text-primary"
            >
              <RefreshCw className="w-5 h-5" fill="currentColor" />
              Refresh
            </button>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="px-8 py-4 bg-accent-primary text-bg-main rounded-xl font-semibold hover:bg-accent-hover transition-all shadow-elevated hover:shadow-lifted flex items-center gap-2"
          >
            <Plus className="w-6 h-6" fill="currentColor" />
            Create Tournament
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-5 bg-danger-soft border border-danger text-danger rounded-xl shadow-soft">
            {error}
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="py-16 text-center">
            <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-4 border-accent-primary"></div>
            <p className="mt-6 text-text-secondary text-lg font-medium">Loading tournaments...</p>
          </div>
        )}

        {/* Tournaments Grid */}
        {!loading && tournaments.length === 0 && (
          <div className="py-16 text-center">
            <Trophy className="w-24 h-24 mx-auto text-text-disabled mb-6" fill="currentColor" />
            <p className="text-text-secondary text-xl font-semibold mb-2">No tournaments found</p>
            <p className="text-text-muted">Create one to get started!</p>
          </div>
        )}

        {!loading && tournaments.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tournaments.map((tournament) => (
              <div
                key={tournament.id}
                className="bg-surface-2 rounded-xl shadow-soft hover:shadow-elevated transition-all p-6 cursor-pointer border border-border-subtle"
                onClick={() => navigate(`/tournament/${tournament.id}`)}
              >
                {/* Tournament Header */}
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {getGameIcons(tournament.game_type).map((iconConfig, index) => {
                        const { Icon, color } = iconConfig;
                        return (
                          <Icon 
                            key={index} 
                            className={`w-8 h-8 ${color}`} 
                            fill="currentColor"
                          />
                        );
                      })}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 
                        className="font-bold text-xl text-text-primary truncate cursor-default mb-1" 
                        title={tournament.name}
                      >
                        {tournament.name}
                      </h3>
                      <p className="text-sm text-text-muted">{getGameName(tournament.game_type)}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2 flex-shrink-0 ml-3">
                    {tournament.is_private && (
                      <span className="text-xs px-3 py-1.5 bg-surface-3 text-text-secondary rounded-lg flex items-center gap-1.5 font-semibold shadow-soft">
                        <Lock className="w-3.5 h-3.5" fill="currentColor" />
                        Private
                      </span>
                    )}
                    <span className={`px-4 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap shadow-soft ${getStatusBadgeColor(tournament.status)}`}>
                      {tournament.status.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                </div>

                {/* Tournament Info */}
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between">
                    <span className="text-text-secondary font-medium">Participants:</span>
                    <span className="font-bold text-text-primary">
                      {tournament.participants?.length || 0} / {tournament.max_participants || 0}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-text-secondary font-medium">Format:</span>
                    <span className="font-bold text-text-primary">Single Elimination</span>
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
                  className={`w-full py-3.5 rounded-xl font-bold transition-all shadow-soft hover:shadow-elevated flex items-center justify-center gap-2 ${
                    tournament.status === 'pending'
                      ? 'bg-accent-primary text-bg-main hover:bg-accent-hover'
                      : 'bg-surface-2 text-text-secondary hover:bg-surface-3'
                  }`}
                >
                  {tournament.status === 'pending' ? (
                    tournament.is_private ? (
                      <>
                        <Lock className="w-4 h-4" fill="currentColor" />
                        Join with Code
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4" fill="currentColor" />
                        Join
                      </>
                    )
                  ) : (
                    <>
                      <Eye className="w-4 h-4" fill="none" stroke="currentColor" />
                      View
                    </>
                  )}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Tournament Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-surface-1 rounded-lg shadow-floating border border-border-subtle max-w-md w-full p-6 my-8 max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4 text-text-primary">Create Tournament</h2>
            
            <form onSubmit={handleCreateTournament}>
              <div className="space-y-4">
                {/* Tournament Name */}
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">
                    Tournament Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g., Friday Night Championship"
                    className="w-full px-3 py-2 border border-border-subtle rounded-lg bg-surface-3 text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-primary"
                    required
                  />
                </div>

                {/* Game Type */}
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">
                    Game Type
                  </label>
                  <select
                    value={gameType}
                    onChange={(e) => setGameType(e.target.value)}
                    className="w-full px-3 py-2 border border-border-subtle rounded-lg bg-surface-3 text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-primary"
                  >
                    <option value="tictactoe">Tic-Tac-Toe</option>
                    <option value="connect4">Connect-4</option>
                    <option value="rps">Rock Paper Scissors</option>
                    <option value="dotsandboxes">Dots & Boxes</option>
                  </select>
                </div>

                {/* Max Participants */}
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">
                    Max Participants (Power of 2)
                  </label>
                  <select
                    value={maxParticipants}
                    onChange={(e) => setMaxParticipants(parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-border-subtle rounded-lg bg-surface-3 text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-primary"
                  >
                    <option value="4">4 Players</option>
                    <option value="8">8 Players</option>
                    <option value="16">16 Players</option>
                    <option value="32">32 Players</option>
                  </select>
                </div>

                {/* Privacy Toggle */}
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
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
                      <span className="text-sm text-text-primary">Public (Anyone can join)</span>
                    </label>
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="radio"
                        name="privacy"
                        checked={isPrivate}
                        onChange={() => setIsPrivate(true)}
                        className="mr-2"
                      />
                      <span className="text-sm text-text-primary">Private (Requires code)</span>
                    </label>
                  </div>
                </div>

                {/* Game-Specific Settings */}
                {gameType === 'tictactoe' && (
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">
                      Grid Size
                    </label>
                    <select
                      value={tictactoeGridSize}
                      onChange={(e) => setTictactoeGridSize(parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-border-subtle rounded-lg bg-surface-3 text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-primary"
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
                      <label className="block text-sm font-medium text-text-secondary mb-1">
                        Board Size
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-xs text-text-muted">Rows</label>
                          <input
                            type="number"
                            min="4"
                            max="10"
                            value={connect4Rows}
                            onChange={(e) => setConnect4Rows(parseInt(e.target.value) || 6)}
                            className="w-full px-3 py-2 border border-border-subtle rounded-lg bg-surface-3 text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-primary"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-text-muted">Columns</label>
                          <input
                            type="number"
                            min="4"
                            max="10"
                            value={connect4Cols}
                            onChange={(e) => setConnect4Cols(parseInt(e.target.value) || 7)}
                            className="w-full px-3 py-2 border border-border-subtle rounded-lg bg-surface-3 text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-primary"
                          />
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-1">
                        Win Length
                      </label>
                      <input
                        type="number"
                        min="3"
                        max="7"
                        value={connect4WinLength}
                        onChange={(e) => setConnect4WinLength(parseInt(e.target.value) || 4)}
                        className="w-full px-3 py-2 border border-border-subtle rounded-lg bg-surface-3 text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-primary"
                      />
                    </div>
                  </>
                )}

                {gameType === 'rps' && (
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">
                      Best Of
                    </label>
                    <select
                      value={rpsBestOf}
                      onChange={(e) => setRpsBestOf(parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-border-subtle rounded-lg bg-surface-3 text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-primary"
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
                    <label className="block text-sm font-medium text-text-secondary mb-1">
                      Grid Size (Dots)
                    </label>
                    <select
                      value={dotsGridSize}
                      onChange={(e) => setDotsGridSize(parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-border-subtle rounded-lg bg-surface-3 text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-primary"
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
                  className="flex-1 px-4 py-2 border border-border-subtle rounded-lg hover:bg-surface-2 transition text-text-primary"
                  disabled={creating}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-accent-primary text-bg-main rounded-lg hover:bg-accent-hover transition disabled:bg-text-disabled"
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
          <div className="bg-surface-1 rounded-lg shadow-floating border border-border-subtle max-w-md w-full p-6">
            <h2 className="text-2xl font-bold mb-4 text-text-primary">Enter Join Code</h2>
            <p className="text-text-secondary mb-4">This is a private tournament. Please enter the join code to participate.</p>
            
            <form onSubmit={handleJoinWithCode}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-text-secondary mb-1">
                  Join Code
                </label>
                <input
                  type="text"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  placeholder="Enter code..."
                  className="w-full px-4 py-3 border border-border-subtle rounded-lg bg-surface-3 text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-primary font-mono text-lg tracking-wider uppercase"
                  required
                  autoFocus
                />
              </div>

              {error && (
                <div className="mb-4 p-3 bg-danger-soft border border-danger text-danger rounded-lg text-sm">
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
                  className="flex-1 px-4 py-2 border border-border-subtle rounded-lg hover:bg-surface-2 transition text-text-primary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-accent-primary text-bg-main rounded-lg hover:bg-accent-hover transition font-semibold"
                >
                  Join Tournament
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

