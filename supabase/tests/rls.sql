begin;
create extension if not exists pgtap with schema extensions;
select plan(8);

insert into auth.users (id, aud, role) values
	('00000000-0000-0000-0000-00000000000a', 'authenticated', 'authenticated'),
	('00000000-0000-0000-0000-00000000000b', 'authenticated', 'authenticated'),
	('00000000-0000-0000-0000-00000000000c', 'authenticated', 'authenticated');
insert into public.rooms (id, code, variant, options, host, host_name, guest, guest_name, status) values
	('10000000-0000-0000-0000-000000000001', 'ABCDEF', 'backgammon', '{}',
	 '00000000-0000-0000-0000-00000000000a', 'Host',
	 '00000000-0000-0000-0000-00000000000b', 'Guest', 'playing');
insert into public.games (id, room_id, number, snapshot) values
	('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 1, '{}');

-- The service role appends moves in order.
select is(public.apply_move('20000000-0000-0000-0000-000000000001', 1, null, 'opening', '{}', '{"v":1}'), 1, 'apply_move appends seq 1');
select throws_ok(
	$$ select public.apply_move('20000000-0000-0000-0000-000000000001', 1, null, 'roll', '{}', '{}') $$,
	'P0001', 'stale_version', 'a repeated seq is stale');
select throws_ok(
	$$ select public.apply_move('20000000-0000-0000-0000-000000000001', 3, null, 'roll', '{}', '{}') $$,
	'P0001', 'stale_version', 'a skipped seq is stale');
select is((select snapshot from public.games where id = '20000000-0000-0000-0000-000000000001'), '{"v":1}'::jsonb, 'the snapshot follows the move');

-- A player of the room.
set local role authenticated;
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-00000000000b","role":"authenticated"}';
select is((select count(*) from public.rooms)::int, 1, 'a player reads their room');
select is((select count(*) from public.moves)::int, 1, 'a player reads the moves');
select throws_ok(
	$$ insert into public.moves (game_id, seq, kind, payload) values ('20000000-0000-0000-0000-000000000001', 2, 'roll', '{}') $$,
	'42501', null, 'a player cannot insert moves');

-- Someone else.
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-00000000000c","role":"authenticated"}';
select is((select count(*) from public.rooms)::int, 0, 'a stranger sees no rooms');

select * from finish();
rollback;
