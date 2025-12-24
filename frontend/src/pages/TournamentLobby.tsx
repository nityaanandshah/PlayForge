import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { Tournament, BracketMatch, BracketRound } from '../types/tournament';
import { useAuth } from '../hooks/useAuth';

export default function TournamentLobby() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [starting, setStarting] = useState(false);
  const [showJoinCodeModal, setShowJoinCodeModal] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteUsername, setInviteUsername] = useState('');
  const [inviting, setInviting] = useState(false);
  const [inviteSuccess, setInviteSuccess] = useState('');

  useEffect(() => {
    if (id) {
      loadTournament();
      // Poll for updates every 5 seconds
      const interval = setInterval(loadTournament, 5000);
      return () => clearInterval(interval);
    }
  }, [id]);

  const loadTournament = async () => {
    if (!id) return;
    
    try {
      const response = await api.get<{ tournament: Tournament }>(`/tournaments/${id}`);
      
      // Ensure participants is always an array
      const tournamentData = {
        ...response.data.tournament,
        participants: response.data.tournament.participants || []
      };
      
      setTournament(tournamentData);
      setError('');
    } catch (err: any) {
      console.error('Failed to load tournament:', err.response?.data?.error || err.message);
      setError(err.response?.data?.error || 'Failed to load tournament');
    } finally {
      setLoading(false);
    }
  };

  const handleStartTournament = async () => {
    if (!id || !tournament) return;
    
    setStarting(true);
    setError('');
    
    try {
      await api.post(`/tournaments/${id}/start`);
      await loadTournament();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to start tournament');
    } finally {
      setStarting(false);
    }
  };

  const handleJoinTournament = async () => {
    if (!id || !tournament) return;
    
    // If private, show code modal
    if (tournament.is_private) {
      setShowJoinCodeModal(true);
      return;
    }
    
    // Public tournament - join directly
    try {
      await api.post(`/tournaments/${id}/join`);
      await loadTournament();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to join tournament');
    }
  };

  const handleJoinWithCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !joinCode.trim()) {
      setError('Please enter a join code');
      return;
    }

    try {
      await api.post(`/tournaments/${id}/join`, { join_code: joinCode });
      setShowJoinCodeModal(false);
      setJoinCode('');
      setError('');
      await loadTournament();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Invalid join code');
    }
  };

  const handleInviteUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteUsername.trim() || !id) return;
    
    setInviting(true);
    setError('');
    setInviteSuccess('');
    
    try {
      await api.post(`/tournaments/${id}/invite`, { username: inviteUsername });
      setInviteSuccess(`Invitation sent to ${inviteUsername}`);
      setInviteUsername('');
      setTimeout(() => {
        setInviteSuccess('');
        setShowInviteModal(false);
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to send invitation');
    } finally {
      setInviting(false);
    }
  };

  const isHost = tournament && user && tournament.created_by === user.id;
  const isParticipant = tournament && user && tournament.participants?.some(p => p.user_id === user.id);

  const getGameName = (gameType: string) => {
    switch (gameType) {
      case 'tictactoe': return 'Tic-Tac-Toe';
      case 'connect4': return 'Connect-4';
      case 'rps': return 'Rock Paper Scissors';
      case 'dotsandboxes': return 'Dots & Boxes';
      default: return gameType;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'complete': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mb-4"></div>
          <p className="text-gray-600">Loading tournament...</p>
        </div>
      </div>
    );
  }

  if (error && !tournament) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
          <div className="text-red-500 text-5xl mb-4 text-center">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2 text-center">Error</h2>
          <p className="text-gray-600 text-center mb-4">{error}</p>
          <button
            onClick={() => navigate('/tournaments')}
            className="w-full px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition"
          >
            Back to Tournaments
          </button>
        </div>
      </div>
    );
  }

  if (!tournament) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-1">{tournament.name}</h1>
              <p className="text-gray-600">{getGameName(tournament.game_type)} • Single Elimination</p>
            </div>
            <span className={`px-4 py-2 rounded-full text-sm font-semibold ${getStatusColor(tournament.status)}`}>
              {tournament.status.replace('_', ' ').toUpperCase()}
            </span>
          </div>

          {/* Join Code for Private Tournaments */}
          {tournament.is_private && tournament.join_code && (isHost || isParticipant) && (
            <div className="mt-4 p-4 bg-amber-50 border-2 border-amber-300 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm text-amber-800 font-semibold mb-1">🔒 Private Tournament - Join Code:</p>
                  <p className="text-2xl font-mono font-bold text-amber-900 tracking-wider">{tournament.join_code}</p>
                  <p className="text-xs text-amber-700 mt-1">Share this code with participants to join</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(tournament.join_code || '');
                      alert('Join code copied to clipboard!');
                    }}
                    className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition text-sm font-semibold"
                  >
                    📋 Copy Code
                  </button>
                  {isHost && tournament.status === 'pending' && (
                    <button
                      onClick={() => setShowInviteModal(true)}
                      className="px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition text-sm font-semibold"
                    >
                      ✉️ Invite Players
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <p className="text-gray-600 text-sm">Participants</p>
              <p className="text-2xl font-bold text-gray-800">{tournament.participants?.length || 0}</p>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <p className="text-gray-600 text-sm">Total Rounds</p>
              <p className="text-2xl font-bold text-gray-800">{tournament.total_rounds || '-'}</p>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <p className="text-gray-600 text-sm">Current Round</p>
              <p className="text-2xl font-bold text-gray-800">{tournament.current_round || '-'}</p>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <p className="text-gray-600 text-sm">Status</p>
              <p className="text-2xl font-bold text-gray-800">
                {tournament.status === 'complete' ? '🏆' : tournament.status === 'in_progress' ? '▶️' : '⏸️'}
              </p>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mt-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
              {error}
            </div>
          )}

          {/* Action Buttons */}
          <div className="mt-4 flex gap-3">
            <button
              onClick={() => navigate('/tournaments')}
              className="flex-1 px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-semibold"
            >
              ← Back
            </button>

            {tournament.status === 'pending' && !isParticipant && (
              <button
                onClick={handleJoinTournament}
                className="flex-1 px-6 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition font-semibold"
              >
                {tournament.is_private ? '🔒 Join with Code' : '➕ Join Tournament'}
              </button>
            )}

            {tournament.status === 'pending' && isHost && (
              <button
                onClick={handleStartTournament}
                disabled={starting || (tournament.participants?.length || 0) < tournament.max_participants}
                className="flex-1 px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition font-semibold disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {starting ? '⏳ Starting...' : '🚀 Start Tournament'}
              </button>
            )}
          </div>

          {tournament.status === 'pending' && isHost && (tournament.participants?.length || 0) < tournament.max_participants && (
            <p className="text-sm text-gray-600 mt-2 text-center">
              Need {tournament.max_participants - (tournament.participants?.length || 0)} more participant(s) to start (must be full: {tournament.participants?.length || 0}/{tournament.max_participants})
            </p>
          )}

          {tournament.status === 'pending' && (tournament.participants?.length || 0) < 2 && (
            <p className="mt-2 text-sm text-gray-500 text-center">
              Need at least 2 participants to start (must be power of 2: 2, 4, 8, 16, 32)
            </p>
          )}
        </div>

        {/* Participants (if pending) */}
        {tournament.status === 'pending' && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Participants ({tournament.participants?.length || 0})</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {(tournament.participants || []).map((participant, idx) => (
                <div key={participant.user_id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-10 h-10 bg-indigo-500 text-white rounded-full flex items-center justify-center font-bold">
                    {participant.username.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-800">
                      {participant.username}
                      {participant.user_id === tournament.created_by && (
                        <span className="ml-2 text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded">HOST</span>
                      )}
                    </p>
                    <p className="text-sm text-gray-600">Seed #{participant.seed} • ELO {participant.elo_rating}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Bracket Visualization */}
        {tournament.bracket_data && tournament.bracket_data.rounds.length > 0 && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Tournament Bracket</h2>
            
            <div className="overflow-x-auto">
              <div className="flex gap-8 min-w-max pb-4">
                {tournament.bracket_data.rounds.map((round: BracketRound, roundIdx: number) => (
                  <div key={roundIdx} className="flex flex-col gap-4" style={{ minWidth: '250px' }}>
                    <h3 className="text-center font-bold text-gray-700 mb-2">
                      {round.round_name}
                    </h3>
                    
                    <div className="space-y-8">
                      {round.matches.map((match: BracketMatch, matchIdx: number) => (
                        <div
                          key={matchIdx}
                          className={`border-2 rounded-lg p-4 ${
                            match.status === 'complete'
                              ? 'border-green-400 bg-green-50'
                              : match.status === 'in_progress'
                              ? 'border-blue-400 bg-blue-50'
                              : match.status === 'ready'
                              ? 'border-indigo-400 bg-indigo-50'
                              : 'border-gray-300 bg-white'
                          }`}
                        >
                          <div className="text-xs text-gray-500 mb-2 text-center">
                            Match {match.match_number}
                          </div>
                          
                          {/* Player 1 */}
                          <div className={`flex items-center gap-2 p-2 rounded mb-2 ${
                            match.winner_id === match.player1_id
                              ? 'bg-green-200 font-bold'
                              : 'bg-gray-100'
                          }`}>
                            <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs">
                              {match.player1_name ? match.player1_name.charAt(0).toUpperCase() : '?'}
                            </div>
                            <span className="text-sm flex-1">
                              {match.player1_name || 'TBD'}
                            </span>
                            {match.winner_id === match.player1_id && <span>🏆</span>}
                          </div>
                          
                          <div className="text-center text-gray-400 text-xs my-1">vs</div>
                          
                          {/* Player 2 */}
                          <div className={`flex items-center gap-2 p-2 rounded ${
                            match.winner_id === match.player2_id
                              ? 'bg-green-200 font-bold'
                              : 'bg-gray-100'
                          }`}>
                            <div className="w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs">
                              {match.player2_name ? match.player2_name.charAt(0).toUpperCase() : '?'}
                            </div>
                            <span className="text-sm flex-1">
                              {match.player2_name || 'TBD'}
                            </span>
                            {match.winner_id === match.player2_id && <span>🏆</span>}
                          </div>

                          {/* Match Actions */}
                          {match.status === 'ready' && match.match_id && (
                            <>
                              {/* Play button for match participants */}
                              {(match.player1_id === user?.id || match.player2_id === user?.id) ? (
                                <button
                                  onClick={() => navigate(`/game/${match.match_id}`)}
                                  className="w-full mt-3 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 transition shadow-md"
                                >
                                  ▶️ Play Game
                                </button>
                              ) : (
                                /* Watch button for spectators */
                                <button
                                  onClick={() => navigate(`/game/${match.match_id}?spectate=true`)}
                                  className="w-full mt-3 px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-semibold hover:bg-purple-700 transition shadow-md"
                                >
                                  👁️ Watch Match
                                </button>
                              )}
                            </>
                          )}
                          
                          {/* Watch in-progress match */}
                          {match.status === 'in_progress' && match.match_id && (
                            <button
                              onClick={() => navigate(`/game/${match.match_id}?spectate=true`)}
                              className="w-full mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition shadow-md flex items-center justify-center gap-2"
                            >
                              <span className="animate-pulse">🔴</span>
                              Watch Live
                            </button>
                          )}
                          
                          {/* View Completed Game */}
                          {match.status === 'complete' && match.match_id && (
                            <button
                              onClick={() => navigate(`/game/${match.match_id}`)}
                              className="w-full mt-3 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700 transition shadow-md"
                            >
                              👁️ View Replay
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Winner Announcement */}
        {tournament.status === 'complete' && tournament.winner_id && (
          <div className="mt-6 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-lg shadow-lg p-8 text-center">
            <div className="text-6xl mb-4">🏆</div>
            <h2 className="text-3xl font-bold text-white mb-2">Tournament Complete!</h2>
            <p className="text-white text-xl">
              Winner: {tournament.participants?.find(p => p.user_id === tournament.winner_id)?.username || 'Unknown'}
            </p>
          </div>
        )}
      </div>

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

      {/* Invite Players Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-md w-full p-6">
            <h2 className="text-2xl font-bold mb-4 text-gray-800">✉️ Invite Player</h2>
            <p className="text-gray-600 mb-4">Send a direct invitation to a user by entering their username.</p>
            
            <form onSubmit={handleInviteUser}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Username
                </label>
                <input
                  type="text"
                  value={inviteUsername}
                  onChange={(e) => setInviteUsername(e.target.value)}
                  placeholder="Enter username..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                  autoFocus
                  disabled={inviting}
                />
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm">
                  {error}
                </div>
              )}

              {inviteSuccess && (
                <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded-lg text-sm">
                  ✓ {inviteSuccess}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowInviteModal(false);
                    setInviteUsername('');
                    setError('');
                    setInviteSuccess('');
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                  disabled={inviting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={inviting}
                  className="flex-1 px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {inviting ? 'Sending...' : 'Send Invitation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

