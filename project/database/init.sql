-- Create the database if it doesn't exist
CREATE DATABASE pod1;
CREATE USER mrar WITH PASSWORD 'password';
GRANT ALL PRIVILEGES ON DATABASE pod1 TO mrar;
-- Connect to the database
\c pod1

-- Create the users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create the sessions table
CREATE TABLE sessions (
    id SERIAL PRIMARY KEY,
    room_id VARCHAR(255) UNIQUE NOT NULL,
    host_id INTEGER REFERENCES users(id),
    title VARCHAR(255),
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    ended_at TIMESTAMP WITH TIME ZONE
);

-- Create the participants table
CREATE TABLE participants (
    id SERIAL PRIMARY KEY,
    session_id INTEGER REFERENCES sessions(id),
    user_id INTEGER REFERENCES users(id),
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    left_at TIMESTAMP WITH TIME ZONE
);

-- Create the recordings table
CREATE TABLE recordings (
    id SERIAL PRIMARY KEY,
    session_id INTEGER REFERENCES sessions(id),
    user_id INTEGER REFERENCES users(id),
    file_name VARCHAR(255) NOT NULL,
    file_url TEXT NOT NULL,
    duration INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create a test user with a hashed password
INSERT INTO users (name, email, password_hash)
VALUES (
    'Test User',
    'arnavjig@gmail.com',
    '$2b$10$3QxDjD1ylgPnRxKBP8/rXOYxGNz.IMBrX7OHrHgR9RHZ0YwMhxlu6'  -- Hash for 'password123'
);