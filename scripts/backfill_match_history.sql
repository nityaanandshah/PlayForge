-- Backfill match history from player stats
-- This creates historical match records based on the aggregated stats

DO $$
DECLARE
    user1_id UUID := 'd084cfd5-36c9-4192-b6eb-2b2f8804a9b7';
    user2_id UUID := 'd264efc9-7b25-4f6f-a34d-08a2cf822b5c';
    base_time TIMESTAMP := NOW() - INTERVAL '3 days';
    game_counter INT := 0;
BEGIN
    -- Tic-Tac-Toe games (11 total: 4 wins for user1, 4 wins for user2, 3 draws)
    -- User1 wins (4 games)
    FOR i IN 1..4 LOOP
        INSERT INTO game_matches (id, game_type, player1_id, player2_id, winner_id, status, started_at, ended_at, created_at)
        VALUES (
            gen_random_uuid(),
            'tictactoe',
            user1_id,
            user2_id,
            user1_id,
            'completed',
            base_time + (game_counter || ' hours')::INTERVAL,
            base_time + (game_counter || ' hours')::INTERVAL + INTERVAL '5 minutes',
            base_time + (game_counter || ' hours')::INTERVAL
        );
        game_counter := game_counter + 2;
    END LOOP;

    -- User2 wins (4 games)
    FOR i IN 1..4 LOOP
        INSERT INTO game_matches (id, game_type, player1_id, player2_id, winner_id, status, started_at, ended_at, created_at)
        VALUES (
            gen_random_uuid(),
            'tictactoe',
            user1_id,
            user2_id,
            user2_id,
            'completed',
            base_time + (game_counter || ' hours')::INTERVAL,
            base_time + (game_counter || ' hours')::INTERVAL + INTERVAL '5 minutes',
            base_time + (game_counter || ' hours')::INTERVAL
        );
        game_counter := game_counter + 2;
    END LOOP;

    -- Draws (3 games)
    FOR i IN 1..3 LOOP
        INSERT INTO game_matches (id, game_type, player1_id, player2_id, winner_id, status, started_at, ended_at, created_at)
        VALUES (
            gen_random_uuid(),
            'tictactoe',
            user1_id,
            user2_id,
            NULL,
            'completed',
            base_time + (game_counter || ' hours')::INTERVAL,
            base_time + (game_counter || ' hours')::INTERVAL + INTERVAL '5 minutes',
            base_time + (game_counter || ' hours')::INTERVAL
        );
        game_counter := game_counter + 2;
    END LOOP;

    -- Connect-4 game (user1 won)
    INSERT INTO game_matches (id, game_type, player1_id, player2_id, winner_id, status, started_at, ended_at, created_at)
    VALUES (
        gen_random_uuid(),
        'connect4',
        user1_id,
        user2_id,
        user1_id,
        'completed',
        base_time + (game_counter || ' hours')::INTERVAL,
        base_time + (game_counter || ' hours')::INTERVAL + INTERVAL '8 minutes',
        base_time + (game_counter || ' hours')::INTERVAL
    );
    game_counter := game_counter + 2;

    -- Dots & Boxes game (user1 won)
    INSERT INTO game_matches (id, game_type, player1_id, player2_id, winner_id, status, started_at, ended_at, created_at)
    VALUES (
        gen_random_uuid(),
        'dotsandboxes',
        user1_id,
        user2_id,
        user1_id,
        'completed',
        base_time + (game_counter || ' hours')::INTERVAL,
        base_time + (game_counter || ' hours')::INTERVAL + INTERVAL '10 minutes',
        base_time + (game_counter || ' hours')::INTERVAL
    );
    game_counter := game_counter + 2;

    -- RPS games (1 win for user2, 1 win for user1, 1 draw = 2 total games)
    -- Wait, stats show total_games=2, wins=1 for user2, wins=0 for user1, draws=1
    -- So: 1 win for user2, 1 draw
    
    -- User2 wins
    INSERT INTO game_matches (id, game_type, player1_id, player2_id, winner_id, status, started_at, ended_at, created_at)
    VALUES (
        gen_random_uuid(),
        'rps',
        user1_id,
        user2_id,
        user2_id,
        'completed',
        base_time + (game_counter || ' hours')::INTERVAL,
        base_time + (game_counter || ' hours')::INTERVAL + INTERVAL '3 minutes',
        base_time + (game_counter || ' hours')::INTERVAL
    );
    game_counter := game_counter + 2;

    -- Draw
    INSERT INTO game_matches (id, game_type, player1_id, player2_id, winner_id, status, started_at, ended_at, created_at)
    VALUES (
        gen_random_uuid(),
        'rps',
        user1_id,
        user2_id,
        NULL,
        'completed',
        base_time + (game_counter || ' hours')::INTERVAL,
        base_time + (game_counter || ' hours')::INTERVAL + INTERVAL '3 minutes',
        base_time + (game_counter || ' hours')::INTERVAL
    );

    RAISE NOTICE 'Successfully backfilled % match records', game_counter;
END $$;

-- Verify the results
SELECT 
    game_type,
    COUNT(*) as total_games,
    SUM(CASE WHEN winner_id IS NOT NULL THEN 1 ELSE 0 END) as decided_games,
    SUM(CASE WHEN winner_id IS NULL THEN 1 ELSE 0 END) as draws
FROM game_matches
GROUP BY game_type
ORDER BY game_type;

