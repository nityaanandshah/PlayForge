import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api, { tournamentApi } from '../lib/api';
import { Tournament, BracketMatch, BracketRound } from '../types/tournament';
import { useAuth } from '../hooks/useAuth';
import { Lock, Copy, Mail, Trophy, Rocket, Play, Eye, Clock, Plus, Loader2, Circle, Check, AlertTriangle } from 'lucide-react';

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
      console.log('=== LOADING TOURNAMENT ===');
      console.log('Tournament ID:', id);
      const response = await tournamentApi.getTournament(id);
      console.log('Tournament API response:', response);
      
      // Ensure participants is always an array
      const tournamentData = {
        ...response.tournament,
        participants: response.tournament.participants || []
      };
      
      console.log('Tournament data:', tournamentData);
      console.log('Bracket data:', tournamentData.bracket_data);
      if (tournamentData.bracket_data?.rounds) {
        tournamentData.bracket_data.rounds.forEach((round: any, idx: number) => {
          console.log(`Round ${idx}:`, round);
          round.matches?.forEach((match: any, mIdx: number) => {
            console.log(`  Match ${mIdx}:`, match);
          });
        });
      }
      
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
      await tournamentApi.joinTournament(id);
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
      await tournamentApi.joinTournament(id, joinCode);
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
      case 'pending': return 'bg-surface-2 text-text-secondary';
      case 'in_progress': return 'bg-warning-soft text-warning';
      case 'complete': return 'bg-success-soft text-success';
      default: return 'bg-surface-2 text-text-secondary';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-main flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-4 border-accent-primary mb-4"></div>
          <p className="text-text-secondary">Loading tournament...</p>
        </div>
      </div>
    );
  }

  if (error && !tournament) {
    return (
      <div className="min-h-screen bg-bg-main flex items-center justify-center p-4">
        <div className="bg-surface-1 rounded-lg shadow-floating border border-border-subtle p-8 max-w-md w-full">
          <div className="flex justify-center mb-4">
            <AlertTriangle className="w-16 h-16 text-danger" />
          </div>
          <h2 className="text-2xl font-bold text-text-primary mb-2 text-center">Error</h2>
          <p className="text-text-secondary text-center mb-4">{error}</p>
          <button
            onClick={() => navigate('/tournaments')}
            className="w-full px-4 py-2 bg-accent-primary text-bg-main rounded-lg hover:bg-accent-hover transition"
          >
            Back to Tournaments
          </button>
        </div>
      </div>
    );
  }

  if (!tournament) return null;

  return (
    <div className="min-h-screen bg-bg-main py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-surface-1 rounded-lg shadow-floating border border-border-subtle p-6 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-text-primary mb-1">{tournament.name}</h1>
              <p className="text-text-secondary">{getGameName(tournament.game_type)} • Single Elimination</p>
            </div>
            <span className={`px-4 py-2 rounded-full text-sm font-semibold ${getStatusColor(tournament.status)}`}>
              {tournament.status.replace('_', ' ').toUpperCase()}
            </span>
          </div>

          {/* Join Code for Private Tournaments - Only show if tournament is not full or not started */}
          {tournament.is_private && tournament.join_code && (isHost || isParticipant) && 
           (tournament.status === 'pending' && (tournament.participants?.length || 0) < tournament.max_participants) && (
            <div className="mt-4 p-4 bg-warning-soft border border-warning rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm text-warning font-semibold mb-1 flex items-center gap-1">
                    <Lock className="w-4 h-4" fill="currentColor" /> Private Tournament - Join Code:
                  </p>
                  <p className="text-2xl font-mono font-bold text-text-primary tracking-wider">{tournament.join_code}</p>
                  <p className="text-xs text-text-secondary mt-1">Share this code with participants to join</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(tournament.join_code || '');
                      alert('Join code copied to clipboard!');
                    }}
                    className="px-4 py-2 bg-accent-primary text-bg-main rounded-lg hover:bg-accent-hover transition text-sm font-semibold flex items-center gap-1"
                  >
                    <Copy className="w-4 h-4" fill="currentColor" /> Copy Code
                  </button>
                  {isHost && tournament.status === 'pending' && (
                    <button
                      onClick={() => setShowInviteModal(true)}
                      className="px-4 py-2 bg-accent-primary text-bg-main rounded-lg hover:bg-accent-hover transition text-sm font-semibold flex items-center gap-1"
                    >
                      <Mail className="w-4 h-4" fill="currentColor" /> Invite Players
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
            <div className="text-center p-3 bg-surface-2 rounded-lg border border-border-subtle">
              <p className="text-text-secondary text-sm">Participants</p>
              <p className="text-2xl font-bold text-text-primary">{tournament.participants?.length || 0}</p>
            </div>
            <div className="text-center p-3 bg-surface-2 rounded-lg border border-border-subtle">
              <p className="text-text-secondary text-sm">Total Rounds</p>
              <p className="text-2xl font-bold text-text-primary">{tournament.total_rounds || '-'}</p>
            </div>
            <div className="text-center p-3 bg-surface-2 rounded-lg border border-border-subtle">
              <p className="text-text-secondary text-sm">Current Round</p>
              <p className="text-2xl font-bold text-text-primary">{tournament.current_round || '-'}</p>
            </div>
            <div className="text-center p-3 bg-surface-2 rounded-lg border border-border-subtle">
              <p className="text-text-secondary text-sm">Status</p>
              <p className="text-2xl font-bold text-text-primary">
                {tournament.status === 'complete' ? <Trophy className="w-8 h-8 mx-auto text-accent-primary" fill="currentColor" /> : 
                 tournament.status === 'in_progress' ? <Play className="w-8 h-8 mx-auto text-accent-primary" fill="currentColor" /> : 
                 <Clock className="w-8 h-8 mx-auto text-accent-primary" />}
              </p>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mt-4 p-4 bg-danger-soft border border-danger text-danger rounded-lg">
              {error}
            </div>
          )}

          {/* Action Buttons */}
          <div className="mt-4 flex gap-3">
            <button
              onClick={() => navigate('/tournaments')}
              className="flex-1 px-6 py-2 bg-surface-3 text-text-primary border border-border-subtle rounded-lg hover:bg-surface-2 transition font-semibold"
            >
              ← Back
            </button>

            {tournament.status === 'pending' && !isParticipant && (
              <button
                onClick={handleJoinTournament}
                className="flex-1 px-6 py-2 bg-accent-primary text-bg-main rounded-lg hover:bg-accent-hover transition font-semibold flex items-center justify-center gap-2"
              >
                {tournament.is_private ? <><Lock className="w-5 h-5" fill="currentColor" /> Join with Code</> : <><Plus className="w-5 h-5" /> Join Tournament</>}
              </button>
            )}

            {tournament.status === 'pending' && isHost && (
              <button
                onClick={handleStartTournament}
                disabled={starting || (tournament.participants?.length || 0) < tournament.max_participants}
                className="flex-1 px-6 py-2 bg-success text-text-primary rounded-lg hover:bg-success-soft transition font-semibold disabled:bg-text-disabled disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {starting ? <><Loader2 className="w-5 h-5 animate-spin" /> Starting...</> : <><Rocket className="w-5 h-5" fill="currentColor" /> Start Tournament</>}
              </button>
            )}
          </div>

          {tournament.status === 'pending' && isHost && (tournament.participants?.length || 0) < tournament.max_participants && (
            <p className="text-sm text-text-secondary mt-2 text-center">
              Need {tournament.max_participants - (tournament.participants?.length || 0)} more participant(s) to start (must be full: {tournament.participants?.length || 0}/{tournament.max_participants})
            </p>
          )}

          {tournament.status === 'pending' && (tournament.participants?.length || 0) < 2 && (
            <p className="mt-2 text-sm text-text-muted text-center">
              Need at least 2 participants to start (must be power of 2: 2, 4, 8, 16, 32)
            </p>
          )}
        </div>

        {/* Participants (if pending) */}
        {tournament.status === 'pending' && (
          <div className="bg-surface-1 rounded-lg shadow-floating border border-border-subtle p-6 mb-6">
            <h2 className="text-xl font-bold text-text-primary mb-4">Participants ({tournament.participants?.length || 0})</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {(tournament.participants || []).map((participant) => (
                <div key={participant.user_id} className="flex items-center gap-3 p-3 bg-surface-2 rounded-lg">
                  <div className="w-10 h-10 bg-accent-primary text-bg-main rounded-full flex items-center justify-center font-bold">
                    {participant.username.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-text-primary">
                      {participant.username}
                      {participant.user_id === tournament.created_by && (
                        <span className="ml-2 text-xs bg-warning-soft text-warning px-2 py-0.5 rounded">HOST</span>
                      )}
                    </p>
                    <p className="text-sm text-text-secondary">Seed #{participant.seed} • ELO {participant.elo_rating}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Bracket Visualization */}
        {tournament.bracket_data && tournament.bracket_data.rounds.length > 0 && (
          <div className="bg-surface-1 rounded-lg shadow-floating border border-border-subtle p-6">
            <h2 className="text-xl font-bold text-text-primary mb-4">Tournament Bracket</h2>
            
            <div className="overflow-x-auto">
              <div className="flex gap-8 min-w-max pb-4">
                {tournament.bracket_data.rounds.map((round: BracketRound, roundIdx: number) => (
                  <div key={roundIdx} className="flex flex-col gap-4" style={{ minWidth: '250px' }}>
                    <h3 className="text-center font-bold text-text-primary mb-2">
                      {round.round_name}
                    </h3>
                    
                    <div className="space-y-8">
                      {round.matches.map((match: BracketMatch, matchIdx: number) => (
                        <div
                          key={matchIdx}
                          className={`border-2 rounded-lg p-4 ${
                            match.status === 'complete'
                              ? 'border-success bg-success-soft'
                              : match.status === 'in_progress'
                              ? 'border-warning bg-warning-soft'
                              : match.status === 'ready'
                              ? 'border-accent-primary bg-accent-soft'
                              : 'border-border-subtle bg-surface-1'
                          }`}
                        >
                          <div className="text-xs text-text-muted mb-2 text-center">
                            Match {match.match_number}
                          </div>
                          
                          {/* Player 1 */}
                          <div className={`flex items-center gap-2 p-2 rounded mb-2 ${
                            match.winner_id === match.player1_id
                              ? 'bg-success-soft font-bold'
                              : 'bg-surface-2'
                          }`}>
                            <div className="w-6 h-6 bg-accent-primary text-bg-main rounded-full flex items-center justify-center text-xs">
                              {match.player1_name ? match.player1_name.charAt(0).toUpperCase() : '?'}
                            </div>
                            <span className="text-sm flex-1">
                              {match.player1_name || 'TBD'}
                            </span>
                            {match.winner_id === match.player1_id && <Trophy className="w-4 h-4 text-warning" fill="currentColor" />}
                          </div>
                          
                          <div className="text-center text-text-muted text-xs my-1">vs</div>
                          
                          {/* Player 2 */}
                          <div className={`flex items-center gap-2 p-2 rounded ${
                            match.winner_id === match.player2_id
                              ? 'bg-success-soft font-bold'
                              : 'bg-surface-2'
                          }`}>
                            <div className="w-6 h-6 bg-danger text-bg-main rounded-full flex items-center justify-center text-xs">
                              {match.player2_name ? match.player2_name.charAt(0).toUpperCase() : '?'}
                            </div>
                            <span className="text-sm flex-1">
                              {match.player2_name || 'TBD'}
                            </span>
                            {match.winner_id === match.player2_id && <Trophy className="w-4 h-4 text-warning" fill="currentColor" />}
                          </div>

                          {/* Match Actions */}
                          {match.status === 'ready' && match.match_id && (
                            <>
                              {/* Play button for match participants */}
                              {(match.player1_id === user?.id || match.player2_id === user?.id) ? (
                                <button
                                  onClick={() => {
                                    console.log('=== PLAY GAME CLICKED ===');
                                    console.log('Match data:', match);
                                    console.log('Match ID:', match.match_id);
                                    console.log('Match status:', match.status);
                                    console.log('Navigating to:', `/game/${match.match_id}`);
                                    navigate(`/game/${match.match_id}`);
                                  }}
                                  className="w-full mt-3 px-4 py-2 bg-accent-primary text-bg-main rounded-lg text-sm font-semibold hover:bg-accent-hover transition shadow-elevated flex items-center justify-center gap-2"
                                >
                                  <Play className="w-4 h-4" fill="currentColor" /> Play Game
                                </button>
                              ) : (
                                /* Watch button for spectators */
                                <button
                                  onClick={() => navigate(`/game/${match.match_id}?spectate=true`)}
                                  className="w-full mt-3 px-4 py-2 bg-surface-3 text-text-primary border border-border-subtle rounded-lg text-sm font-semibold hover:bg-surface-2 transition shadow-soft flex items-center justify-center gap-2"
                                >
                                  <Eye className="w-4 h-4" /> Watch Match
                                </button>
                              )}
                            </>
                          )}
                          
                          {/* Watch in-progress match */}
                          {match.status === 'in_progress' && match.match_id && (
                            <button
                              onClick={() => navigate(`/game/${match.match_id}?spectate=true`)}
                              className="w-full mt-3 px-4 py-2 bg-warning text-text-primary rounded-lg text-sm font-semibold hover:bg-warning-soft transition shadow-elevated flex items-center justify-center gap-2"
                            >
                              <Circle className="w-3 h-3 text-danger animate-pulse" fill="currentColor" />
                              Watch Live
                            </button>
                          )}
                          
                          {/* View Completed Game */}
                          {match.status === 'complete' && match.match_id && (
                            <button
                              onClick={() => navigate(`/game/${match.match_id}`)}
                              className="w-full mt-3 px-4 py-2 bg-success text-text-primary rounded-lg text-sm font-semibold hover:bg-success-soft transition shadow-elevated flex items-center justify-center gap-2"
                            >
                              <Eye className="w-4 h-4" /> View Replay
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
          <div className="mt-6 bg-success-soft border-2 border-success rounded-lg shadow-floating p-8 text-center">
            <Trophy className="w-24 h-24 mb-4 mx-auto text-warning" fill="currentColor" />
            <h2 className="text-3xl font-bold text-text-primary mb-2">Tournament Complete!</h2>
            <p className="text-text-primary text-xl">
              Winner: {tournament.participants?.find(p => p.user_id === tournament.winner_id)?.username || 'Unknown'}
            </p>
          </div>
        )}
      </div>

      {/* Join Code Modal */}
      {showJoinCodeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-surface-1 rounded-lg shadow-floating border border-border-subtle max-w-md w-full p-6">
            <h2 className="text-2xl font-bold mb-4 text-text-primary flex items-center gap-2">
              <Lock className="w-7 h-7" fill="currentColor" /> Enter Join Code
            </h2>
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

      {/* Invite Players Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-surface-1 rounded-lg shadow-floating border border-border-subtle max-w-md w-full p-6">
            <h2 className="text-2xl font-bold mb-4 text-text-primary flex items-center gap-2">
              <Mail className="w-7 h-7" fill="currentColor" /> Invite Player
            </h2>
            <p className="text-text-secondary mb-4">Send a direct invitation to a user by entering their username.</p>
            
            <form onSubmit={handleInviteUser}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-text-secondary mb-1">
                  Username
                </label>
                <input
                  type="text"
                  value={inviteUsername}
                  onChange={(e) => setInviteUsername(e.target.value)}
                  placeholder="Enter username..."
                  className="w-full px-4 py-3 border border-border-subtle rounded-lg bg-surface-3 text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-primary"
                  required
                  autoFocus
                  disabled={inviting}
                />
              </div>

              {error && (
                <div className="mb-4 p-3 bg-danger-soft border border-danger text-danger rounded-lg text-sm">
                  {error}
                </div>
              )}

              {inviteSuccess && (
                <div className="mb-4 p-3 bg-success-soft border border-success text-success rounded-lg text-sm flex items-center gap-2">
                  <Check className="w-4 h-4" /> {inviteSuccess}
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
                  className="flex-1 px-4 py-2 border border-border-subtle rounded-lg hover:bg-surface-2 transition text-text-primary"
                  disabled={inviting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={inviting}
                  className="flex-1 px-4 py-2 bg-accent-primary text-bg-main rounded-lg hover:bg-accent-hover transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
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

