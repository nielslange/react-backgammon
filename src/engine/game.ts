/**
 * The state machine every variant shares: opening roll, roll, play, undo,
 * resign, doubling cube, snapshot. Pure functions that throw EngineError
 * on an illegal call.
 */
import { PlayerType } from '../types/PlayerType';
import { BAR, opponent } from './constants';
import { EngineError } from './errors';
import { getEngine, hasEngine } from './index';
import type {
	Checker,
	GameState,
	Player,
	Roll,
	Step,
	VariantId,
	VariantOptions,
} from './types';
import { DEFAULT_OPTIONS } from './types';

const PLAYERS: Player[] = [ PlayerType.PLAYER_ONE, PlayerType.PLAYER_TWO ];

/** Checkers on each player's bar lane. */
const barCounts = ( checkers: Checker[] ): Record< Player, number > => ( {
	[ PlayerType.PLAYER_ONE ]: checkers.filter( ( c ) => c.player === PlayerType.PLAYER_ONE && c.lane === BAR[ PlayerType.PLAYER_ONE ] ).length,
	[ PlayerType.PLAYER_TWO ]: checkers.filter( ( c ) => c.player === PlayerType.PLAYER_TWO && c.lane === BAR[ PlayerType.PLAYER_TWO ] ).length,
} );

export const createGame = (
	variant: VariantId,
	options: Partial< VariantOptions > = {}
): GameState => ( {
	variant,
	options: { ...DEFAULT_OPTIONS, ...options },
	checkers: getEngine( variant ).initialCheckers(),
	// At the start every checker on a bar lane is waiting for its first entry.
	waiting: barCounts( getEngine( variant ).initialCheckers() ),
	player: null,
	firstMover: null,
	phase: 'opening',
	roll: null,
	dice: [],
	turnSteps: [],
	rerolls: 0,
	cube: { value: 1, owner: null, offered: false },
	result: null,
	lastEvent: null,
} );

const requirePhase = ( state: GameState, phase: GameState[ 'phase' ] ) => {
	if ( state.phase !== phase ) {
		throw new EngineError(
			'WRONG_PHASE',
			`Expected phase ${ phase }, got ${ state.phase }`
		);
	}
};

/**
 * Each player rolls one die; the higher starts and plays both dice. A tie
 * leaves the game in the opening phase for another attempt.
 */
export const openingRoll = (
	state: GameState,
	p1Die: number,
	p2Die: number
): GameState => {
	requirePhase( state, 'opening' );
	if ( p1Die === p2Die ) return state;
	const winner = p1Die > p2Die ? PlayerType.PLAYER_ONE : PlayerType.PLAYER_TWO;
	const engine = getEngine( state.variant );
	const high = Math.max( p1Die, p2Die );
	const low = Math.min( p1Die, p2Die );
	const rolled = engine.onRoll(
		{ ...state, player: winner, firstMover: winner, phase: 'awaiting-roll' },
		[ high, low ]
	);
	return { ...rolled, roll: [ p1Die, p2Die ] };
};

export const roll = ( state: GameState, dice: Roll ): GameState => {
	requirePhase( state, 'awaiting-roll' );
	return getEngine( state.variant ).onRoll( state, dice );
};

export const play = ( state: GameState, step: Step ): GameState => {
	requirePhase( state, 'moving' );
	const engine = getEngine( state.variant );
	return engine.afterStep( engine.applyStep( state, step ) );
};

/** Reverse the last step of the current turn. */
export const undoStep = ( state: GameState ): GameState => {
	if ( state.phase !== 'moving' || state.turnSteps.length === 0 ) {
		throw new EngineError( 'NOTHING_TO_UNDO' );
	}
	const engine = getEngine( state.variant );
	const last = state.turnSteps[ state.turnSteps.length - 1 ];
	const checkers = state.checkers.map( ( c ) => ( { ...c } ) );
	const mover = checkers.find(
		( c ) =>
			c.id === last.checkerId &&
			c.player === state.player &&
			c.lane === last.to
	);
	if ( ! mover || state.player === null ) {
		throw new EngineError( 'NOTHING_TO_UNDO', 'turn history does not match' );
	}
	mover.lane = last.from;
	if ( last.hit ) {
		const other = opponent( state.player );
		const victim = checkers.find(
			( c ) => c.player === other && c.lane === BAR[ other ]
		);
		if ( ! victim ) {
			throw new EngineError( 'NOTHING_TO_UNDO', 'hit checker is not on the bar' );
		}
		victim.lane = last.to;
	}
	const dice = engine.orderedDice
		? [ last.die, ...state.dice ]
		: [ ...state.dice, last.die ];
	const waiting = last.firstEntry
		? { ...state.waiting, [ state.player ]: state.waiting[ state.player ] + 1 }
		: state.waiting;
	return {
		...state,
		checkers,
		dice,
		waiting,
		turnSteps: state.turnSteps.slice( 0, -1 ),
		lastEvent: 'undo',
	};
};

export const resign = ( state: GameState, player: Player ): GameState => {
	if ( state.phase === 'over' || state.phase === 'idle' ) {
		throw new EngineError( 'WRONG_PHASE' );
	}
	return {
		...state,
		phase: 'over',
		cube: { ...state.cube, offered: false },
		result: {
			winner: opponent( player ),
			points: state.cube.value,
			kind: 'resign',
		},
		lastEvent: 'game-over',
	};
};

const requireCube = ( state: GameState ) => {
	if ( ! getEngine( state.variant ).supportsCube || ! state.options.cube ) {
		throw new EngineError( 'CUBE_NOT_ALLOWED' );
	}
};

/** The player about to roll may double when the cube is centred or theirs. */
export const offerDouble = ( state: GameState, player: Player ): GameState => {
	requireCube( state );
	requirePhase( state, 'awaiting-roll' );
	if ( state.player !== player ) throw new EngineError( 'NOT_YOUR_TURN' );
	if ( state.cube.offered ) throw new EngineError( 'CUBE_NOT_ALLOWED' );
	if ( state.cube.owner !== null && state.cube.owner !== player ) {
		throw new EngineError( 'CUBE_NOT_ALLOWED' );
	}
	return { ...state, cube: { ...state.cube, offered: true } };
};

export const acceptDouble = ( state: GameState ): GameState => {
	requireCube( state );
	if ( ! state.cube.offered || state.player === null ) {
		throw new EngineError( 'CUBE_NOT_ALLOWED' );
	}
	return {
		...state,
		cube: {
			value: state.cube.value * 2,
			owner: opponent( state.player ),
			offered: false,
		},
	};
};

export const dropDouble = ( state: GameState ): GameState => {
	requireCube( state );
	if ( ! state.cube.offered || state.player === null ) {
		throw new EngineError( 'CUBE_NOT_ALLOWED' );
	}
	return {
		...state,
		phase: 'over',
		cube: { ...state.cube, offered: false },
		result: { winner: state.player, points: state.cube.value, kind: 'drop' },
		lastEvent: 'game-over',
	};
};

/** The wire and storage format is the state itself; this deep-copies it. */
export const snapshot = ( state: GameState ): GameState =>
	JSON.parse( JSON.stringify( state ) );

const invalid = ( why: string ): never => {
	throw new EngineError( 'INVALID_POSITION', why );
};

type Raw = Record< string, unknown >;

const PHASES: GameState[ 'phase' ][] = [ 'idle', 'opening', 'awaiting-roll', 'moving', 'over' ];
const EVENTS: Array< GameState[ 'lastEvent' ] > = [ null, 'hit', 'hand-off', 'forfeit', 'reroll', 'game-over', 'undo', 'final-turn' ];
const KINDS = [ 'single', 'gammon', 'backgammon', 'draw', 'resign', 'drop' ];

const isObject = ( v: unknown ): v is Raw => typeof v === 'object' && v !== null && ! Array.isArray( v );
const isInt = ( v: unknown, min: number, max: number ): v is number =>
	typeof v === 'number' && Number.isInteger( v ) && v >= min && v <= max;
const isDie = ( v: unknown ): v is number => isInt( v, 1, 6 );
const isPlayer = ( v: unknown ): v is Player => PLAYERS.includes( v as Player );
const isPlayerOrNull = ( v: unknown ): v is Player | null => v === null || isPlayer( v );

const readCheckers = ( value: unknown ): Checker[] => {
	if ( ! Array.isArray( value ) ) return invalid( 'checkers missing' );
	const ids = new Set< number >();
	const checkers = value.map( ( c: unknown ) => {
		if ( ! isObject( c ) || ! isInt( c.id, 0, Number.MAX_SAFE_INTEGER ) || ! isPlayer( c.player ) || ! isInt( c.lane, 0, 25 ) ) {
			return invalid( 'malformed checker' );
		}
		if ( ids.has( c.id ) ) return invalid( `duplicate checker id ${ c.id }` );
		ids.add( c.id );
		return { id: c.id, player: c.player, lane: c.lane };
	} );
	for ( const player of PLAYERS ) {
		if ( checkers.filter( ( c ) => c.player === player ).length !== 15 ) {
			return invalid( `${ player } must have 15 checkers` );
		}
	}
	const owners = new Map< number, Player >();
	for ( const c of checkers ) {
		if ( c.lane < 1 || c.lane > 24 ) continue;
		const owner = owners.get( c.lane );
		if ( owner !== undefined && owner !== c.player ) {
			return invalid( `point ${ c.lane } holds both players` );
		}
		owners.set( c.lane, c.player );
	}
	return checkers;
};

const readOptions = ( value: unknown ): VariantOptions => {
	if ( value === undefined ) return { ...DEFAULT_OPTIONS };
	if ( ! isObject( value ) ) return invalid( 'malformed options' );
	const o = { ...DEFAULT_OPTIONS, ...value } as Raw;
	const nullableInt = ( v: unknown ) => v === null || isInt( v, 0, 1000 );
	if (
		typeof o.cube !== 'boolean' ||
		typeof o.rerollOnlyIfCompleted !== 'boolean' ||
		typeof o.enterOnlyOnDoubles !== 'boolean' ||
		typeof o.finalTurnForSecondPlayer !== 'boolean' ||
		! nullableInt( o.rerollLimit ) ||
		! nullableInt( o.maxCheckersPerPoint )
	) {
		return invalid( 'malformed options' );
	}
	return {
		cube: o.cube,
		rerollLimit: o.rerollLimit as number | null,
		rerollOnlyIfCompleted: o.rerollOnlyIfCompleted,
		enterOnlyOnDoubles: o.enterOnlyOnDoubles,
		maxCheckersPerPoint: o.maxCheckersPerPoint as number | null,
		finalTurnForSecondPlayer: o.finalTurnForSecondPlayer,
	};
};

const readStep = ( value: unknown, ids: Set< number > ): Step => {
	if (
		! isObject( value ) ||
		! isInt( value.checkerId, 0, Number.MAX_SAFE_INTEGER ) ||
		! ids.has( value.checkerId ) ||
		! isInt( value.from, 0, 25 ) ||
		! isInt( value.to, 0, 25 ) ||
		! isDie( value.die ) ||
		typeof value.hit !== 'boolean' ||
		( value.firstEntry !== undefined && typeof value.firstEntry !== 'boolean' )
	) {
		return invalid( 'malformed step' );
	}
	const step: Step = { checkerId: value.checkerId, from: value.from, to: value.to, die: value.die, hit: value.hit };
	if ( value.firstEntry ) step.firstEntry = true;
	return step;
};

/** Waiting counts from a snapshot; older snapshots treat Triktrak bar checkers as never entered. */
const readWaiting = ( value: unknown, variant: VariantId, checkers: Checker[] ): Record< Player, number > => {
	const bar = barCounts( checkers );
	if ( value === undefined ) {
		return variant === 'triktrak' ? bar : { [ PlayerType.PLAYER_ONE ]: 0, [ PlayerType.PLAYER_TWO ]: 0 };
	}
	if ( ! isObject( value ) || ! PLAYERS.every( ( p ) => isInt( value[ p ], 0, bar[ p ] ) ) ) {
		return invalid( 'malformed waiting' );
	}
	return { [ PlayerType.PLAYER_ONE ]: value[ PlayerType.PLAYER_ONE ] as number, [ PlayerType.PLAYER_TWO ]: value[ PlayerType.PLAYER_TWO ] as number };
};

/**
 * Validate an untrusted snapshot field by field and return a fresh
 * GameState. Unknown keys are dropped. Throws INVALID_POSITION or
 * UNKNOWN_VARIANT.
 */
export const restore = ( json: unknown ): GameState => {
	if ( ! isObject( json ) ) return invalid( 'not an object' );
	if ( ! hasEngine( json.variant ) ) {
		throw new EngineError( 'UNKNOWN_VARIANT', `Unknown variant: ${ String( json.variant ) }` );
	}
	const base = createGame( json.variant );
	const pick = < T >( key: keyof GameState, ok: ( v: unknown ) => boolean ): T => {
		const v = key in json ? json[ key ] : base[ key ];
		return ok( v ) ? ( v as T ) : invalid( `malformed ${ key }` );
	};

	const checkers = readCheckers( json.checkers );
	const ids = new Set( checkers.map( ( c ) => c.id ) );

	// Backgammon plays at most four dice; Triktrak's 1-2 roll plays eight.
	const maxDice = json.variant === 'backgammon' ? 4 : 8;
	const dice = pick< number[] >( 'dice', ( v ) => Array.isArray( v ) && v.length <= maxDice && v.every( isDie ) );
	const roll = pick< GameState[ 'roll' ] >( 'roll', ( v ) => v === null || ( Array.isArray( v ) && v.length === 2 && v.every( isDie ) ) );
	const stepsRaw = pick< unknown[] >( 'turnSteps', ( v ) => Array.isArray( v ) && v.length <= maxDice );
	const cube = pick< GameState[ 'cube' ] >( 'cube', ( v ) =>
		isObject( v ) &&
		isInt( v.value, 1, 1 << 20 ) &&
		( ( v.value as number ) & ( ( v.value as number ) - 1 ) ) === 0 &&
		isPlayerOrNull( v.owner ) &&
		typeof v.offered === 'boolean'
	);
	const result = pick< GameState[ 'result' ] >( 'result', ( v ) =>
		v === null ||
		( isObject( v ) && isPlayerOrNull( v.winner ) && isInt( v.points, 0, 1 << 20 ) && KINDS.includes( v.kind as string ) )
	);

	return {
		variant: json.variant,
		options: readOptions( json.options ),
		checkers,
		player: pick( 'player', isPlayerOrNull ),
		firstMover: pick( 'firstMover', isPlayerOrNull ),
		phase: pick( 'phase', ( v ) => PHASES.includes( v as GameState[ 'phase' ] ) ),
		roll: roll === null ? null : [ roll[ 0 ], roll[ 1 ] ],
		dice: [ ...dice ],
		turnSteps: stepsRaw.map( ( s ) => readStep( s, ids ) ),
		rerolls: pick( 'rerolls', ( v ) => isInt( v, 0, 1000 ) ),
		waiting: readWaiting( json.waiting, json.variant, checkers ),
		cube: { value: cube.value, owner: cube.owner, offered: cube.offered },
		result: result === null ? null : { winner: result.winner, points: result.points, kind: result.kind },
		lastEvent: pick( 'lastEvent', ( v ) => EVENTS.includes( v as GameState[ 'lastEvent' ] ) ),
	};
};
