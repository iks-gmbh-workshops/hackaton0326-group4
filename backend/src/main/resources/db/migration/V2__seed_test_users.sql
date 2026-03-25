-- Local test users
-- anna@example.com / TestUser123!
-- ben@example.com / Welcome123!
-- clara@example.com / DrumDiBum123!

INSERT INTO users (email, password, first_name, last_name, tos_accepted)
VALUES
    ('anna@example.com', '$2a$10$UE6TpU6oMwYFYAckeNFZ2OQSz0hEF6SCynjk5te/xA1uxphQaJVbq', 'Anna', 'Becker', TRUE),
    ('ben@example.com', '$2a$10$RUon.D4.Fp16Rt76KgCyieezpXvJbV5x9IirdN11LZQsfzss3.8j6', 'Ben', 'Fischer', TRUE),
    ('clara@example.com', '$2a$10$Kphaf8lTRJE9Yt1PLflUlOrboeAQswBDZq3ipxP5SBqfDWk60My0a', 'Clara', 'Neumann', TRUE)
ON CONFLICT (email) DO NOTHING;
