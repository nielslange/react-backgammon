/**
 * The state machine every variant shares: opening roll, roll, play, undo,
 * resign, doubling cube, snapshot. Pure functions that throw EngineError
 * on an illegal call.
 */
import { PlayerType } from '../types/PlayerType';
import { BAR, opponent } from './constants';
import { EngineError } from './errors';
import { getEngine } from './index';
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

const VARIANTS: VariantId[] = [ 'backgammon', 'triktrak' ];
const PLAYERS: Player[] = [ PlayerType.PLAYER_ONE, PlayerType.PLAYER_TWO ];

export const createGame = (
	variant: VariantId,
	options: Partial< VariantOptions > = {}
): GameState => ( {
	variant,
	options: { ...DEFAULT_OPTIONS, ...options },
	checkers: getEngine( variant ).initialCheckers(),
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
	const mover = checkers.find( ( c ) => c.id === last.checkerId )!;
	mover.lane = last.from;
	if ( last.hit && state.player !== null ) {
		const victim = checkers.find(
			( c ) =>
				c.player === opponent( state.player! ) &&
				c.lane === BAR[ opponent( state.player! ) ]
		)!;
		victim.lane = last.to;
	}
	const dice = engine.orderedDice
		? [ last.die, ...state.dice ]
		: [ ...state.dice, last.die ];
	return {
		...state,
		checkers,
		dice,
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

/** Validate an untrusted snapshot and return a fresh GameState. */
export const restore = ( json: unknown ): GameState => {
	if ( typeof json !== 'object' || json === null ) return invalid( 'not an object' );
	const raw = json as Record< string, unknown >;
	if ( ! VARIANTS.includes( raw.variant as VariantId ) ) {
		return invalid( 'unknown variant' );
	}
	if ( ! Array.isArray( raw.checkers ) ) return invalid( 'checkers missing' );

	const checkers: Checker[] = raw.checkers.map( ( c: unknown ) => {
		const r = c as Record< string, unknown >;
		if (
			typeof r?.id !== 'number' ||
			! PLAYERS.includes( r.player as Player ) ||
			typeof r.lane !== 'number' ||
			r.lane < 0 ||
			r.lane > 25
		) {
			return invalid( 'malformed checker' );
		}
		return { id: r.id, player: r.player as Player, lane: r.lane };
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

	const base = createGame( raw.variant as VariantId );
	const copy = JSON.parse( JSON.stringify( raw ) ) as Partial< GameState >;
	return {
		...base,
		...copy,
		options: { ...base.options, ...( copy.options ?? {} ) },
		checkers,
	};
};
