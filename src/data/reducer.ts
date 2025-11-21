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

		case ActionTypes.SET_GAME_OVER:
			return { ...state, gameOver: true };

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

		default:
			return state;
	}
};
