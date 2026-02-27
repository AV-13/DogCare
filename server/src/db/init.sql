-- Extension to generate UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ENUM type for events
CREATE TYPE event_type AS ENUM ('vaccine', 'walk', 'meal', 'vet');

-- Users table
CREATE TABLE users (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email         VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name    VARCHAR(50) NOT NULL,
    created_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Dogs table
CREATE TABLE dogs (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name          VARCHAR(100) NOT NULL,
    breed         VARCHAR(100),
    birth_date    DATE,
    weight_kg     DECIMAL(5, 2),
    photo_url     TEXT,
    created_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Events table
CREATE TABLE events (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    dog_id        UUID NOT NULL REFERENCES dogs(id) ON DELETE CASCADE,
    type          event_type NOT NULL,
    title         VARCHAR(255) NOT NULL,
    description   TEXT,
    event_date    TIMESTAMP WITH TIME ZONE NOT NULL,
    next_due_date DATE,
    created_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for frequently used queries
CREATE INDEX idx_dogs_user_id ON dogs(user_id);
CREATE INDEX idx_events_dog_id ON events(dog_id);
CREATE INDEX idx_events_event_date ON events(event_date);
CREATE INDEX idx_events_type ON events(type);
CREATE INDEX idx_events_next_due_date ON events(next_due_date);
