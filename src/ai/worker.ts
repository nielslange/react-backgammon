/**
 * Web Worker entry: runs the search off the main thread so the board stays
 * responsive while the computer thinks.
 */
import { localAi } from './local';
import type { WorkerRequest, WorkerResponse } from './client';

const scope = self as unknown as {
	onmessage: ( event: MessageEvent< WorkerRequest > ) => void;
	postMessage: ( message: WorkerResponse ) => void;
};

scope.onmessage = async ( { data } ) => {
	try {
		const result =
			data.kind === 'turn'
				? await localAi.requestTurn( data.state, data.level, data.seed )
				: data.kind === 'cube'
				? await localAi.decideCube( data.state, data.player, data.level )
				: await localAi.answerDouble( data.state, data.player, data.level );
		scope.postMessage( { id: data.id, result } );
	} catch ( error ) {
		scope.postMessage( { id: data.id, error: String( error ) } );
	}
};
