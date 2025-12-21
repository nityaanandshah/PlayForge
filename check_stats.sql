-- Query to check all player stats in the database
SELECT 
    ps.user_id,
    u.username,
    ps.game_type,
    ps.wins,
    ps.losses,
    ps.draws,
    ps.total_games,
    ps.current_streak,
    ps.best_streak
FROM player_stats ps
JOIN users u ON u.id = ps.user_id
ORDER BY u.username, ps.game_type;

-- Query to check aggregated stats per user
SELECT 
    u.username,
    SUM(ps.wins) as total_wins,
    SUM(ps.losses) as total_losses,
    SUM(ps.draws) as total_draws,
    SUM(ps.total_games) as total_games
FROM player_stats ps
JOIN users u ON u.id = ps.user_id
GROUP BY u.id, u.username
ORDER BY u.username;

