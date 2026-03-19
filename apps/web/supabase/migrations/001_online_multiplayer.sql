-- Online multiplayer tables for NLC Darts

-- Players who are currently online
create table if not exists online_players (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  status text not null default 'online' check (status in ('online', 'in_game')),
  last_seen timestamptz not null default now()
);

-- Game rooms
create table if not exists rooms (
  id uuid primary key default gen_random_uuid(),
  host_id uuid not null references online_players(id) on delete cascade,
  guest_id uuid references online_players(id) on delete set null,
  status text not null default 'waiting' check (status in ('waiting', 'playing', 'finished', 'abandoned')),
  game_type text not null check (game_type in ('x01', 'cricket', 'set')),
  game_options jsonb not null default '{}',
  created_at timestamptz not null default now()
);

-- Game invites (with 30-second expiration)
create table if not exists invites (
  id uuid primary key default gen_random_uuid(),
  from_id uuid not null references online_players(id) on delete cascade,
  to_id uuid not null references online_players(id) on delete cascade,
  room_id uuid not null references rooms(id) on delete cascade,
  game_type text not null,
  game_options jsonb not null default '{}',
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined', 'expired')),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '30 seconds')
);

-- Row Level Security
alter table online_players enable row level security;
alter table rooms enable row level security;
alter table invites enable row level security;

-- online_players: users can read all, but only update their own
create policy "Anyone can read online players"
  on online_players for select using (true);

create policy "Users can insert their own player record"
  on online_players for insert with check (auth.uid() = id);

create policy "Users can update their own player record"
  on online_players for update using (auth.uid() = id);

-- rooms: readable by participants, creatable by authenticated users
create policy "Anyone can read rooms"
  on rooms for select using (true);

create policy "Authenticated users can create rooms"
  on rooms for insert with check (auth.uid() = host_id);

create policy "Participants can update rooms"
  on rooms for update using (auth.uid() = host_id or auth.uid() = guest_id);

-- invites: readable by sender/receiver, creatable by authenticated users
create policy "Users can read invites sent to or from them"
  on invites for select using (auth.uid() = from_id or auth.uid() = to_id);

create policy "Authenticated users can create invites"
  on invites for insert with check (auth.uid() = from_id);

create policy "Invite recipients can update invite status"
  on invites for update using (auth.uid() = to_id or auth.uid() = from_id);

-- Index for finding active invites
create index if not exists idx_invites_to_pending
  on invites(to_id) where status = 'pending';

-- Index for finding active rooms
create index if not exists idx_rooms_status
  on rooms(status) where status in ('waiting', 'playing');

-- Enable Realtime for relevant tables
alter publication supabase_realtime add table online_players;
alter publication supabase_realtime add table rooms;
alter publication supabase_realtime add table invites;
