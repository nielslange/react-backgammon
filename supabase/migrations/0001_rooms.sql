-- Online play: rooms, games and the move log (spec 7.2).
-- Clients may only read their own rooms; every write goes through the
-- Server Actions with the service-role key.

create table public.rooms (
	id uuid primary key default gen_random_uuid(),
	code text unique not null,
	variant text not null,
	options jsonb not null,
	match_target int not null default 1,
	host uuid not null references auth.users on delete cascade,
	host_name text not null,
	guest uuid references auth.users on delete set null,
	guest_name text,
	status text not null default 'waiting'
		check (status in ('waiting', 'playing', 'finished', 'abandoned')),
	created_at timestamptz not null default now()
);

create table public.games (
	id uuid primary key default gen_random_uuid(),
	room_id uuid not null references public.rooms on delete cascade,
	number int not null,
	snapshot jsonb not null, -- GameState
	version int not null default 0,
	scores jsonb not null default '{"PLAYER_ONE":0,"PLAYER_TWO":0}',
	crawford_played boolean not null default false,
	updated_at timestamptz not null default now(),
	unique (room_id, number)
);

create table public.moves (
	id bigserial primary key,
	game_id uuid not null references public.games on delete cascade,
	seq int not null,
	actor uuid, -- null = the server (opening roll, rolls)
	kind text not null
		check (kind in ('opening', 'roll', 'step', 'undo', 'resign', 'double', 'accept', 'drop')),
	payload jsonb not null,
	created_at timestamptz not null default now(),
	unique (game_id, seq)
);

create index games_room_idx on public.games (room_id);
create index moves_game_idx on public.moves (game_id, seq);

alter table public.rooms enable row level security;
alter table public.games enable row level security;
alter table public.moves enable row level security;

-- Read access for the two players of a room; no insert, update or delete
-- policies, so only the service role can write.
create policy "players read their rooms" on public.rooms
	for select to authenticated
	using ((select auth.uid()) in (host, guest));

create policy "players read their games" on public.games
	for select to authenticated
	using (exists (
		select 1 from public.rooms r
		where r.id = room_id and (select auth.uid()) in (r.host, r.guest)
	));

create policy "players read their moves" on public.moves
	for select to authenticated
	using (exists (
		select 1 from public.games g join public.rooms r on r.id = g.room_id
		where g.id = game_id and (select auth.uid()) in (r.host, r.guest)
	));

-- Appends one move and stores the resulting snapshot in one transaction.
-- Fails with 'stale_version' unless p_seq follows the stored version, so two
-- racing submissions cannot both win.
create function public.apply_move(
	p_game_id uuid,
	p_seq int,
	p_actor uuid,
	p_kind text,
	p_payload jsonb,
	p_snapshot jsonb,
	p_scores jsonb default null,
	p_crawford_played boolean default null
) returns int
language plpgsql
security invoker
set search_path = ''
as $$
begin
	update public.games
		set snapshot = p_snapshot,
			version = p_seq,
			scores = coalesce(p_scores, scores),
			crawford_played = coalesce(p_crawford_played, crawford_played),
			updated_at = now()
		where id = p_game_id and version = p_seq - 1;
	if not found then
		raise exception 'stale_version' using errcode = 'P0001';
	end if;
	insert into public.moves (game_id, seq, actor, kind, payload)
		values (p_game_id, p_seq, p_actor, p_kind, p_payload);
	return p_seq;
end;
$$;

revoke execute on function public.apply_move from public, anon, authenticated;
grant execute on function public.apply_move to service_role;

-- Clients receive new moves (and room changes, e.g. a guest joining) live.
alter publication supabase_realtime add table public.moves, public.rooms;
