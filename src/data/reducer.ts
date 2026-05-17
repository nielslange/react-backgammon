/**
 * Internal dependencies
 */
import { initialState } from './state';
import {
	ActionTypes,
	MessageType,
	NoticeStatusType,
	PlayerType,
} from '../types';
import checkers from './checkers-start.json';

export const reducer = ( state = initialState, action: any ) => {
	switch ( action.type ) {
		case ActionTypes.SET_DICE:
			return { ...state, dice: [ ...action.dice ] };

		case ActionTypes.SET_NOTICE:
			return {
				...state,
				notice: {
					message: action.notice.message,
					status: action.notice.status,
				},
			};

		case ActionTypes.TOGGLE_CURRENT_PLAYER:
			return { ...state, currentPlayer: action.player };

		case ActionTypes.MOVE_CHECKER:
			// Save current state to history before applying move
			const historyEntry = {
				checkers: [ ...state.checkers ],
				currentPlayer: state.currentPlayer,
				dice: [ ...state.dice ],
				pipCount: { ...state.pipCount },
			};

			return {
				...state,
				checkers: action.checkers,
				moveHistory: [ ...state.moveHistory, historyEntry ],
			};

		case ActionTypes.UNDO_MOVE:
			// If there are no moves to undo
			if ( state.moveHistory.length === 0 ) {
				return {
					...state,
					notice: {
						message: MessageType.NO_MOVES_TO_UNDO,
						status: NoticeStatusType.ERROR,
					},
				};
			}

			// Get the last state from history
			const lastState = state.moveHistory[ state.moveHistory.length - 1 ];
			const newHistory = state.moveHistory.slice( 0, -1 );

			return {
				...state,
				checkers: lastState.checkers,
				currentPlayer: lastState.currentPlayer,
				dice: lastState.dice,
				pipCount: lastState.pipCount,
				moveHistory: newHistory,
				notice: {
					message: MessageType.MOVE_UNDONE,
					status: NoticeStatusType.INFO,
				},
			};

		case ActionTypes.SET_GAME_OVER: {
			const winnerScores = action.winner
				? {
						...state.scores,
						[ action.winner ]:
							state.scores[ action.winner as PlayerType ] +
							( action.points ?? 1 ),
				  }
				: state.scores;
			return { ...state, gameOver: true, scores: winnerScores };
		}

		case ActionTypes.SURRENDER_GAME:
			// Determine the winner based on who surrendered
			const winner =
				state.currentPlayer === PlayerType.PLAYER_ONE
					? PlayerType.PLAYER_TWO
					: PlayerType.PLAYER_ONE;

			// Update notice with the surrender message
			const message = MessageType.PLAYER_SURRENDERED;

			// Create a new scores object with the winner's score incremented
			const updatedScores = {
				...state.scores,
				[ winner ]: state.scores[ winner ] + 1,
			};

			return {
				...state,
				gameOver: true,
				scores: updatedScores,
				notice: {
					message,
					status: NoticeStatusType.INFO,
				},
			};

		case ActionTypes.UPDATE_PIP_COUNT:
			return { ...state, pipCount: action.pipCount };

		case ActionTypes.RESTART_GAME:
			return {
				...initialState,
				// Preserve scores when restarting
				scores: state.scores,
				// Reset checkers to starting position
				checkers: JSON.parse( JSON.stringify( checkers ) ),
				// Set a restart message
				notice: {
					message: MessageType.GAME_RESTARTED,
					status: NoticeStatusType.INFO,
				},
			};

		case ActionTypes.ROLL_OPENING_DIE: {
			const nextOpening = {
				...state.openingRoll,
				[ action.player ]: action.die,
			};
			const p1 = nextOpening[ PlayerType.PLAYER_ONE ];
			const p2 = nextOpening[ PlayerType.PLAYER_TWO ];

			// Both players have rolled.
			if ( p1 !== null && p2 !== null ) {
				// Tie: re-roll (clear both rolls).
				if ( p1 === p2 ) {
					return {
						...state,
						openingRoll: {
							[ PlayerType.PLAYER_ONE ]: null,
							[ PlayerType.PLAYER_TWO ]: null,
						},
					};
				}

				// Higher roller goes first; both dice form the opening turn.
				const winner =
					p1 > p2 ? PlayerType.PLAYER_ONE : PlayerType.PLAYER_TWO;
				const high = Math.max( p1, p2 );
				const low = Math.min( p1, p2 );
				const dice = high === low ? [ high, high, high, high ] : [ high, low ];

				return {
					...state,
					openingRoll: {
						[ PlayerType.PLAYER_ONE ]: null,
						[ PlayerType.PLAYER_TWO ]: null,
					},
					currentPlayer: winner,
					dice,
				};
			}

			return { ...state, openingRoll: nextOpening };
		}

		case ActionTypes.OFFER_DOUBLING_CUBE:
			return { ...state, cube: { ...state.cube, offered: true } };

		case ActionTypes.ACCEPT_DOUBLE: {
			// The acceptor is the player who was OFFERED the cube — i.e. the
			// non-current player at the time of offer. After accepting they own
			// the cube and the value doubles.
			const acceptor =
				state.currentPlayer === PlayerType.PLAYER_ONE
					? PlayerType.PLAYER_TWO
					: PlayerType.PLAYER_ONE;
			return {
				...state,
				cube: {
					value: state.cube.value * 2,
					owner: acceptor,
					offered: false,
				},
			};
		}

		case ActionTypes.DROP_DOUBLE: {
			// Drop = forfeit. Offering player wins the current pre-double stake.
			const offeringPlayer = state.currentPlayer;
			if ( offeringPlayer === null ) {
				return { ...state, cube: { ...state.cube, offered: false } };
			}
			return {
				...state,
				gameOver: true,
				cube: { ...state.cube, offered: false },
				scores: {
					...state.scores,
					[ offeringPlayer ]:
						state.scores[ offeringPlayer ] + state.cube.value,
				},
			};
		}

		case ActionTypes.SET_MATCH_TARGET:
			return { ...state, matchTarget: action.target };

		default:
			return state;
	}
};
