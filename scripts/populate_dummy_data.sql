-- PlayForge Dummy Data Population Script
-- Creates 4 users (alice, carol, bob, david) with 50+ games and 2 tournaments

-- Clear existing data (if any)
TRUNCATE TABLE chat_messages, tournament_matches, tournaments, room_participants, rooms, game_matches, player_stats, users CASCADE;

-- ============================================
-- 1. Create Users
-- ============================================
-- Password for all users: Test123!
-- Hash: $2a$10$8HreVVK.eqJvKFW4A75GkenszvQdZK9Xr2yt62iXTq.PAOVrCLtGm

INSERT INTO users (id, username, email, password_hash, elo_rating, created_at) VALUES
    ('11111111-1111-1111-1111-111111111111', 'alice', 'alice@example.com', '$2a$10$8HreVVK.eqJvKFW4A75GkenszvQdZK9Xr2yt62iXTq.PAOVrCLtGm', 1450, NOW() - INTERVAL '60 days'),
    ('22222222-2222-2222-2222-222222222222', 'carol', 'carol@example.com', '$2a$10$8HreVVK.eqJvKFW4A75GkenszvQdZK9Xr2yt62iXTq.PAOVrCLtGm', 1380, NOW() - INTERVAL '58 days'),
    ('33333333-3333-3333-3333-333333333333', 'bob', 'bob@example.com', '$2a$10$8HreVVK.eqJvKFW4A75GkenszvQdZK9Xr2yt62iXTq.PAOVrCLtGm', 1310, NOW() - INTERVAL '55 days'),
    ('44444444-4444-4444-4444-444444444444', 'david', 'david@example.com', '$2a$10$8HreVVK.eqJvKFW4A75GkenszvQdZK9Xr2yt62iXTq.PAOVrCLtGm', 1240, NOW() - INTERVAL '52 days');

-- ============================================
-- 2. Create Game Matches (50+ games across all types)
-- ============================================

-- TIC-TAC-TOE Games (15 games)
INSERT INTO game_matches (id, game_type, player1_id, player2_id, winner_id, status, started_at, ended_at) VALUES
    -- Quick play matches
    (uuid_generate_v4(), 'tictactoe', '11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 'completed', NOW() - INTERVAL '50 days', NOW() - INTERVAL '50 days' + INTERVAL '3 minutes'),
    (uuid_generate_v4(), 'tictactoe', '22222222-2222-2222-2222-222222222222', '44444444-4444-4444-4444-444444444444', '22222222-2222-2222-2222-222222222222', 'completed', NOW() - INTERVAL '48 days', NOW() - INTERVAL '48 days' + INTERVAL '4 minutes'),
    (uuid_generate_v4(), 'tictactoe', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'completed', NOW() - INTERVAL '45 days', NOW() - INTERVAL '45 days' + INTERVAL '5 minutes'),
    (uuid_generate_v4(), 'tictactoe', '33333333-3333-3333-3333-333333333333', '44444444-4444-4444-4444-444444444444', '33333333-3333-3333-3333-333333333333', 'completed', NOW() - INTERVAL '43 days', NOW() - INTERVAL '43 days' + INTERVAL '3 minutes'),
    (uuid_generate_v4(), 'tictactoe', '22222222-2222-2222-2222-222222222222', '33333333-3333-3333-3333-333333333333', '22222222-2222-2222-2222-222222222222', 'completed', NOW() - INTERVAL '40 days', NOW() - INTERVAL '40 days' + INTERVAL '4 minutes'),
    -- Private room matches
    (uuid_generate_v4(), 'tictactoe', '11111111-1111-1111-1111-111111111111', '44444444-4444-4444-4444-444444444444', '11111111-1111-1111-1111-111111111111', 'completed', NOW() - INTERVAL '38 days', NOW() - INTERVAL '38 days' + INTERVAL '3 minutes'),
    (uuid_generate_v4(), 'tictactoe', '22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'completed', NOW() - INTERVAL '35 days', NOW() - INTERVAL '35 days' + INTERVAL '5 minutes'),
    (uuid_generate_v4(), 'tictactoe', '33333333-3333-3333-3333-333333333333', '22222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 'completed', NOW() - INTERVAL '32 days', NOW() - INTERVAL '32 days' + INTERVAL '4 minutes'),
    (uuid_generate_v4(), 'tictactoe', '11111111-1111-1111-1111-111111111111', '44444444-4444-4444-4444-444444444444', NULL, 'completed', NOW() - INTERVAL '30 days', NOW() - INTERVAL '30 days' + INTERVAL '4 minutes'), -- draw
    (uuid_generate_v4(), 'tictactoe', '44444444-4444-4444-4444-444444444444', '33333333-3333-3333-3333-333333333333', '44444444-4444-4444-4444-444444444444', 'completed', NOW() - INTERVAL '28 days', NOW() - INTERVAL '28 days' + INTERVAL '3 minutes'),
    (uuid_generate_v4(), 'tictactoe', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'completed', NOW() - INTERVAL '25 days', NOW() - INTERVAL '25 days' + INTERVAL '5 minutes'),
    (uuid_generate_v4(), 'tictactoe', '33333333-3333-3333-3333-333333333333', '44444444-4444-4444-4444-444444444444', '33333333-3333-3333-3333-333333333333', 'completed', NOW() - INTERVAL '22 days', NOW() - INTERVAL '22 days' + INTERVAL '4 minutes'),
    (uuid_generate_v4(), 'tictactoe', '22222222-2222-2222-2222-222222222222', '33333333-3333-3333-3333-333333333333', '22222222-2222-2222-2222-222222222222', 'completed', NOW() - INTERVAL '20 days', NOW() - INTERVAL '20 days' + INTERVAL '3 minutes'),
    (uuid_generate_v4(), 'tictactoe', '11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 'completed', NOW() - INTERVAL '18 days', NOW() - INTERVAL '18 days' + INTERVAL '4 minutes'),
    (uuid_generate_v4(), 'tictactoe', '22222222-2222-2222-2222-222222222222', '44444444-4444-4444-4444-444444444444', '22222222-2222-2222-2222-222222222222', 'completed', NOW() - INTERVAL '15 days', NOW() - INTERVAL '15 days' + INTERVAL '5 minutes');

-- CONNECT4 Games (15 games)
INSERT INTO game_matches (id, game_type, player1_id, player2_id, winner_id, status, started_at, ended_at) VALUES
    (uuid_generate_v4(), 'connect4', '11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 'completed', NOW() - INTERVAL '49 days', NOW() - INTERVAL '49 days' + INTERVAL '8 minutes'),
    (uuid_generate_v4(), 'connect4', '22222222-2222-2222-2222-222222222222', '44444444-4444-4444-4444-444444444444', '22222222-2222-2222-2222-222222222222', 'completed', NOW() - INTERVAL '47 days', NOW() - INTERVAL '47 days' + INTERVAL '10 minutes'),
    (uuid_generate_v4(), 'connect4', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 'completed', NOW() - INTERVAL '44 days', NOW() - INTERVAL '44 days' + INTERVAL '9 minutes'),
    (uuid_generate_v4(), 'connect4', '33333333-3333-3333-3333-333333333333', '44444444-4444-4444-4444-444444444444', '33333333-3333-3333-3333-333333333333', 'completed', NOW() - INTERVAL '42 days', NOW() - INTERVAL '42 days' + INTERVAL '7 minutes'),
    (uuid_generate_v4(), 'connect4', '11111111-1111-1111-1111-111111111111', '44444444-4444-4444-4444-444444444444', '11111111-1111-1111-1111-111111111111', 'completed', NOW() - INTERVAL '39 days', NOW() - INTERVAL '39 days' + INTERVAL '8 minutes'),
    (uuid_generate_v4(), 'connect4', '22222222-2222-2222-2222-222222222222', '33333333-3333-3333-3333-333333333333', '22222222-2222-2222-2222-222222222222', 'completed', NOW() - INTERVAL '37 days', NOW() - INTERVAL '37 days' + INTERVAL '11 minutes'),
    (uuid_generate_v4(), 'connect4', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'completed', NOW() - INTERVAL '34 days', NOW() - INTERVAL '34 days' + INTERVAL '9 minutes'),
    (uuid_generate_v4(), 'connect4', '33333333-3333-3333-3333-333333333333', '44444444-4444-4444-4444-444444444444', '33333333-3333-3333-3333-333333333333', 'completed', NOW() - INTERVAL '31 days', NOW() - INTERVAL '31 days' + INTERVAL '8 minutes'),
    (uuid_generate_v4(), 'connect4', '11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 'completed', NOW() - INTERVAL '29 days', NOW() - INTERVAL '29 days' + INTERVAL '10 minutes'),
    (uuid_generate_v4(), 'connect4', '22222222-2222-2222-2222-222222222222', '44444444-4444-4444-4444-444444444444', '22222222-2222-2222-2222-222222222222', 'completed', NOW() - INTERVAL '27 days', NOW() - INTERVAL '27 days' + INTERVAL '7 minutes'),
    (uuid_generate_v4(), 'connect4', '11111111-1111-1111-1111-111111111111', '44444444-4444-4444-4444-444444444444', '11111111-1111-1111-1111-111111111111', 'completed', NOW() - INTERVAL '24 days', NOW() - INTERVAL '24 days' + INTERVAL '9 minutes'),
    (uuid_generate_v4(), 'connect4', '33333333-3333-3333-3333-333333333333', '22222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 'completed', NOW() - INTERVAL '21 days', NOW() - INTERVAL '21 days' + INTERVAL '8 minutes'),
    (uuid_generate_v4(), 'connect4', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'completed', NOW() - INTERVAL '19 days', NOW() - INTERVAL '19 days' + INTERVAL '10 minutes'),
    (uuid_generate_v4(), 'connect4', '44444444-4444-4444-4444-444444444444', '33333333-3333-3333-3333-333333333333', '33333333-3333-3333-3333-333333333333', 'completed', NOW() - INTERVAL '17 days', NOW() - INTERVAL '17 days' + INTERVAL '11 minutes'),
    (uuid_generate_v4(), 'connect4', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'completed', NOW() - INTERVAL '14 days', NOW() - INTERVAL '14 days' + INTERVAL '9 minutes');

-- ROCK-PAPER-SCISSORS Games (12 games)
INSERT INTO game_matches (id, game_type, player1_id, player2_id, winner_id, status, started_at, ended_at) VALUES
    (uuid_generate_v4(), 'rps', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'completed', NOW() - INTERVAL '46 days', NOW() - INTERVAL '46 days' + INTERVAL '1 minutes'),
    (uuid_generate_v4(), 'rps', '33333333-3333-3333-3333-333333333333', '44444444-4444-4444-4444-444444444444', '44444444-4444-4444-4444-444444444444', 'completed', NOW() - INTERVAL '41 days', NOW() - INTERVAL '41 days' + INTERVAL '1 minutes'),
    (uuid_generate_v4(), 'rps', '11111111-1111-1111-1111-111111111111', '44444444-4444-4444-4444-444444444444', '11111111-1111-1111-1111-111111111111', 'completed', NOW() - INTERVAL '36 days', NOW() - INTERVAL '36 days' + INTERVAL '2 minutes'),
    (uuid_generate_v4(), 'rps', '22222222-2222-2222-2222-222222222222', '33333333-3333-3333-3333-333333333333', '22222222-2222-2222-2222-222222222222', 'completed', NOW() - INTERVAL '33 days', NOW() - INTERVAL '33 days' + INTERVAL '1 minutes'),
    (uuid_generate_v4(), 'rps', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', NULL, 'completed', NOW() - INTERVAL '26 days', NOW() - INTERVAL '26 days' + INTERVAL '1 minutes'), -- draw
    (uuid_generate_v4(), 'rps', '33333333-3333-3333-3333-333333333333', '44444444-4444-4444-4444-444444444444', '33333333-3333-3333-3333-333333333333', 'completed', NOW() - INTERVAL '23 days', NOW() - INTERVAL '23 days' + INTERVAL '2 minutes'),
    (uuid_generate_v4(), 'rps', '11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 'completed', NOW() - INTERVAL '16 days', NOW() - INTERVAL '16 days' + INTERVAL '1 minutes'),
    (uuid_generate_v4(), 'rps', '22222222-2222-2222-2222-222222222222', '44444444-4444-4444-4444-444444444444', '22222222-2222-2222-2222-222222222222', 'completed', NOW() - INTERVAL '13 days', NOW() - INTERVAL '13 days' + INTERVAL '2 minutes'),
    (uuid_generate_v4(), 'rps', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 'completed', NOW() - INTERVAL '11 days', NOW() - INTERVAL '11 days' + INTERVAL '1 minutes'),
    (uuid_generate_v4(), 'rps', '33333333-3333-3333-3333-333333333333', '44444444-4444-4444-4444-444444444444', '33333333-3333-3333-3333-333333333333', 'completed', NOW() - INTERVAL '9 days', NOW() - INTERVAL '9 days' + INTERVAL '2 minutes'),
    (uuid_generate_v4(), 'rps', '11111111-1111-1111-1111-111111111111', '44444444-4444-4444-4444-444444444444', '11111111-1111-1111-1111-111111111111', 'completed', NOW() - INTERVAL '7 days', NOW() - INTERVAL '7 days' + INTERVAL '1 minutes'),
    (uuid_generate_v4(), 'rps', '22222222-2222-2222-2222-222222222222', '33333333-3333-3333-3333-333333333333', '22222222-2222-2222-2222-222222222222', 'completed', NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days' + INTERVAL '2 minutes');

-- DOTS & BOXES Games (10 games)
INSERT INTO game_matches (id, game_type, player1_id, player2_id, winner_id, status, started_at, ended_at) VALUES
    (uuid_generate_v4(), 'dotsandboxes', '11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 'completed', NOW() - INTERVAL '51 days', NOW() - INTERVAL '51 days' + INTERVAL '12 minutes'),
    (uuid_generate_v4(), 'dotsandboxes', '22222222-2222-2222-2222-222222222222', '44444444-4444-4444-4444-444444444444', '22222222-2222-2222-2222-222222222222', 'completed', NOW() - INTERVAL '48 days', NOW() - INTERVAL '48 days' + INTERVAL '15 minutes'),
    (uuid_generate_v4(), 'dotsandboxes', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 'completed', NOW() - INTERVAL '45 days', NOW() - INTERVAL '45 days' + INTERVAL '13 minutes'),
    (uuid_generate_v4(), 'dotsandboxes', '33333333-3333-3333-3333-333333333333', '44444444-4444-4444-4444-444444444444', '33333333-3333-3333-3333-333333333333', 'completed', NOW() - INTERVAL '40 days', NOW() - INTERVAL '40 days' + INTERVAL '14 minutes'),
    (uuid_generate_v4(), 'dotsandboxes', '11111111-1111-1111-1111-111111111111', '44444444-4444-4444-4444-444444444444', '11111111-1111-1111-1111-111111111111', 'completed', NOW() - INTERVAL '35 days', NOW() - INTERVAL '35 days' + INTERVAL '16 minutes'),
    (uuid_generate_v4(), 'dotsandboxes', '22222222-2222-2222-2222-222222222222', '33333333-3333-3333-3333-333333333333', '22222222-2222-2222-2222-222222222222', 'completed', NOW() - INTERVAL '30 days', NOW() - INTERVAL '30 days' + INTERVAL '12 minutes'),
    (uuid_generate_v4(), 'dotsandboxes', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'completed', NOW() - INTERVAL '25 days', NOW() - INTERVAL '25 days' + INTERVAL '15 minutes'),
    (uuid_generate_v4(), 'dotsandboxes', '33333333-3333-3333-3333-333333333333', '44444444-4444-4444-4444-444444444444', '33333333-3333-3333-3333-333333333333', 'completed', NOW() - INTERVAL '20 days', NOW() - INTERVAL '20 days' + INTERVAL '13 minutes'),
    (uuid_generate_v4(), 'dotsandboxes', '11111111-1111-1111-1111-111111111111', '44444444-4444-4444-4444-444444444444', '11111111-1111-1111-1111-111111111111', 'completed', NOW() - INTERVAL '12 days', NOW() - INTERVAL '12 days' + INTERVAL '14 minutes'),
    (uuid_generate_v4(), 'dotsandboxes', '22222222-2222-2222-2222-222222222222', '33333333-3333-3333-3333-333333333333', '22222222-2222-2222-2222-222222222222', 'completed', NOW() - INTERVAL '8 days', NOW() - INTERVAL '8 days' + INTERVAL '16 minutes');

-- ============================================
-- 3. Calculate and Insert Player Stats
-- ============================================

-- Alice stats (24 wins, 3 losses, 1 draw)
INSERT INTO player_stats (user_id, game_type, wins, losses, draws, current_streak, best_streak, total_games) VALUES
    ('11111111-1111-1111-1111-111111111111', 'tictactoe', 7, 1, 1, 2, 4, 9),
    ('11111111-1111-1111-1111-111111111111', 'connect4', 8, 1, 0, 3, 5, 9),
    ('11111111-1111-1111-1111-111111111111', 'rps', 5, 1, 1, 2, 3, 7),
    ('11111111-1111-1111-1111-111111111111', 'dotsandboxes', 4, 0, 0, 4, 4, 4);

-- Carol stats (19 wins, 8 losses, 0 draws)
INSERT INTO player_stats (user_id, game_type, wins, losses, draws, current_streak, best_streak, total_games) VALUES
    ('22222222-2222-2222-2222-222222222222', 'tictactoe', 6, 2, 0, 1, 3, 8),
    ('22222222-2222-2222-2222-222222222222', 'connect4', 6, 2, 0, 2, 3, 8),
    ('22222222-2222-2222-2222-222222222222', 'rps', 4, 2, 0, 1, 2, 6),
    ('22222222-2222-2222-2222-222222222222', 'dotsandboxes', 3, 2, 0, 1, 2, 5);

-- Bob stats (7 wins, 18 losses, 0 draws)
INSERT INTO player_stats (user_id, game_type, wins, losses, draws, current_streak, best_streak, total_games) VALUES
    ('33333333-3333-3333-3333-333333333333', 'tictactoe', 3, 4, 0, 0, 2, 7),
    ('33333333-3333-3333-3333-333333333333', 'connect4', 3, 5, 0, 1, 2, 8),
    ('33333333-3333-3333-3333-333333333333', 'rps', 1, 4, 0, 0, 1, 5),
    ('33333333-3333-3333-3333-333333333333', 'dotsandboxes', 0, 5, 0, 0, 0, 5);

-- David stats (2 wins, 23 losses, 1 draw)
INSERT INTO player_stats (user_id, game_type, wins, losses, draws, current_streak, best_streak, total_games) VALUES
    ('44444444-4444-4444-4444-444444444444', 'tictactoe', 1, 6, 1, 0, 1, 8),
    ('44444444-4444-4444-4444-444444444444', 'connect4', 0, 8, 0, 0, 0, 8),
    ('44444444-4444-4444-4444-444444444444', 'rps', 1, 5, 0, 0, 1, 6),
    ('44444444-4444-4444-4444-444444444444', 'dotsandboxes', 0, 4, 0, 0, 0, 4);

-- ============================================
-- 4. Create Tournament 1 (Private - Full, at Finals)
-- ============================================

-- Create room for tournament 1
INSERT INTO rooms (id, code, host_id, game_type, max_players, status, is_tournament, created_at) VALUES
    ('a0000000-0000-0000-0000-000000000001', 'PRIV001', '11111111-1111-1111-1111-111111111111', 'tictactoe', 4, 'active', true, NOW() - INTERVAL '10 days');

-- Add room participants
INSERT INTO room_participants (room_id, user_id, status, joined_at) VALUES
    ('a0000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'active', NOW() - INTERVAL '10 days'),
    ('a0000000-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222', 'active', NOW() - INTERVAL '10 days'),
    ('a0000000-0000-0000-0000-000000000001', '33333333-3333-3333-3333-333333333333', 'active', NOW() - INTERVAL '10 days'),
    ('a0000000-0000-0000-0000-000000000001', '44444444-4444-4444-4444-444444444444', 'active', NOW() - INTERVAL '10 days');

-- Create tournament 1
INSERT INTO tournaments (id, room_id, name, game_type, tournament_type, status, max_participants, is_private, join_code, total_rounds, created_by, started_at, created_at) VALUES
    ('b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'Arena Champions Cup', 'tictactoe', 'single_elimination', 'in_progress', 4, true, 'ACHAMP01', 2, '11111111-1111-1111-1111-111111111111', NOW() - INTERVAL '10 days', NOW() - INTERVAL '10 days');

-- Create game matches for tournament 1 semifinals
INSERT INTO game_matches (id, game_type, player1_id, player2_id, winner_id, status, started_at, ended_at) VALUES
    ('c0000000-0000-0000-0000-000000000001', 'tictactoe', '11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 'completed', NOW() - INTERVAL '10 days', NOW() - INTERVAL '10 days' + INTERVAL '5 minutes'),
    ('c0000000-0000-0000-0000-000000000002', 'tictactoe', '44444444-4444-4444-4444-444444444444', '22222222-2222-2222-2222-222222222222', '44444444-4444-4444-4444-444444444444', 'completed', NOW() - INTERVAL '10 days', NOW() - INTERVAL '10 days' + INTERVAL '6 minutes');

-- Tournament matches for tournament 1
INSERT INTO tournament_matches (tournament_id, match_id, round, match_number, player1_id, player2_id, winner_id, status) VALUES
    -- Semifinals (round 1)
    ('b0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 1, 1, '11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 'completed'),
    ('b0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000002', 1, 2, '44444444-4444-4444-4444-444444444444', '22222222-2222-2222-2222-222222222222', '44444444-4444-4444-4444-444444444444', 'completed'),
    -- Finals (round 2) - pending
    ('b0000000-0000-0000-0000-000000000001', NULL, 2, 1, '11111111-1111-1111-1111-111111111111', '44444444-4444-4444-4444-444444444444', NULL, 'pending');

-- ============================================
-- 5. Create Tournament 2 (Public - Ongoing)
-- ============================================

-- Create room for tournament 2
INSERT INTO rooms (id, code, host_id, game_type, max_players, status, is_tournament, created_at) VALUES
    ('a0000000-0000-0000-0000-000000000002', 'PUB002', '22222222-2222-2222-2222-222222222222', 'connect4', 8, 'active', true, NOW() - INTERVAL '5 days');

-- Add room participants for tournament 2 (all 4 users)
INSERT INTO room_participants (room_id, user_id, status, joined_at) VALUES
    ('a0000000-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 'active', NOW() - INTERVAL '5 days'),
    ('a0000000-0000-0000-0000-000000000002', '22222222-2222-2222-2222-222222222222', 'active', NOW() - INTERVAL '5 days'),
    ('a0000000-0000-0000-0000-000000000002', '33333333-3333-3333-3333-333333333333', 'active', NOW() - INTERVAL '5 days'),
    ('a0000000-0000-0000-0000-000000000002', '44444444-4444-4444-4444-444444444444', 'active', NOW() - INTERVAL '5 days');

-- Create tournament 2
INSERT INTO tournaments (id, room_id, name, game_type, tournament_type, status, max_participants, is_private, total_rounds, created_by, started_at, created_at) VALUES
    ('b0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000002', 'Connect Four Masters', 'connect4', 'single_elimination', 'pending', 8, false, 2, '22222222-2222-2222-2222-222222222222', NULL, NOW() - INTERVAL '5 days');

-- Add some pending matches for tournament 2 (waiting for more participants)
INSERT INTO tournament_matches (tournament_id, match_id, round, match_number, player1_id, player2_id, winner_id, status) VALUES
    ('b0000000-0000-0000-0000-000000000002', NULL, 1, 1, '11111111-1111-1111-1111-111111111111', '44444444-4444-4444-4444-444444444444', NULL, 'pending'),
    ('b0000000-0000-0000-0000-000000000002', NULL, 1, 2, '22222222-2222-2222-2222-222222222222', '33333333-3333-3333-3333-333333333333', NULL, 'pending');

-- ============================================
-- 6. Create Some Notifications
-- ============================================

INSERT INTO notifications (user_id, type, title, message, read, created_at) VALUES
    ('11111111-1111-1111-1111-111111111111', 'tournament_started', 'Tournament Started!', 'Arena Champions Cup has started. Your match is ready!', false, NOW() - INTERVAL '10 days'),
    ('44444444-4444-4444-4444-444444444444', 'tournament_started', 'Tournament Started!', 'Arena Champions Cup has started. Your match is ready!', true, NOW() - INTERVAL '10 days'),
    ('22222222-2222-2222-2222-222222222222', 'player_joined', 'Player Joined', 'A new player joined Connect Four Masters tournament', false, NOW() - INTERVAL '3 days'),
    ('33333333-3333-3333-3333-333333333333', 'player_joined', 'Player Joined', 'A new player joined Connect Four Masters tournament', false, NOW() - INTERVAL '3 days');

-- ============================================
-- Summary
-- ============================================
-- Users created: 4 (alice, bob, carol, david)
-- Total games: 52 games (15 TicTacToe + 15 Connect4 + 12 RPS + 10 Dots&Boxes)
-- ELO Ratings: Alice (1450) > Carol (1380) > Bob (1310) > David (1240)
-- Tournament 1: Private, at finals (alice vs david)
-- Tournament 2: Public, pending (needs more participants)
-- All passwords: Test123!

