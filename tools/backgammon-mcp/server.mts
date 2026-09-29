/**
 * MCP server: lets an MCP client (Claude Code, Claude Desktop, …) play Red
 * against a human playing Blue in the react-backgammon dev app.
 *
 * Tools: new_game, board, play_red, wait_for_my_turn.
 * Requires the dev server (`pnpm dev`); launches Chrome on demand.
 */
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import {
	connect,
	describe,
	isGameOver,
	loadMidgame,
	playRedTurn,
	readState,
	startNewGame,
	type Strength,
} from './lib.mts';

const server = new McpServer( { name: 'backgammon', version: '0.1.0' } );
const text = ( s: string ) => ( { content: [ { type: 'text' as const, text: s } ] } );
const withPage = async < T >( fn: ( page: Awaited< ReturnType< typeof connect > >[ 'page' ] ) => Promise< T > ) => {
	const { browser, page } = await connect();
	try {
		return await fn( page );
	} finally {
		await browser.close();
	}
};

server.tool(
	'new_game',
	'Start a new game in the shared Chrome window. Blue is the human, Red is Claude. `midgame` loads a balanced middle-game position with Blue to move; `strength` sets how hard Red plays.',
	{
		midgame: z.boolean().default( false ),
		strength: z.enum( [ 'gentle', 'normal' ] ).default( 'normal' ),
	},
	async ( { midgame, strength } ) =>
		withPage( async ( page ) => {
			if ( midgame ) await loadMidgame( page );
			else await startNewGame( page );
			const log = await playRedTurn( page, strength as Strength );
			return text( [ ...log, describe( await readState( page ) ) ].join( '\n' ) );
		} )
);

server.tool( 'board', 'Read the current board, dice, whose turn it is and the pip counts.', {}, async () =>
	withPage( async ( page ) => text( describe( await readState( page ) ) ) )
);

server.tool(
	'play_red',
	"Play Red's turn if it is Red's turn (does nothing otherwise).",
	{ strength: z.enum( [ 'gentle', 'normal' ] ).default( 'normal' ) },
	async ( { strength } ) =>
		withPage( async ( page ) => {
			const log = await playRedTurn( page, strength as Strength );
			return text( [ ...log, describe( await readState( page ) ) ].join( '\n' ) );
		} )
);

server.tool(
	'wait_for_my_turn',
	"Poll the board until it is Red's turn or the game is over, then play Red's turn. Returns after `timeoutSeconds` at the latest.",
	{
		timeoutSeconds: z.number().int().min( 5 ).max( 600 ).default( 120 ),
		strength: z.enum( [ 'gentle', 'normal' ] ).default( 'normal' ),
	},
	async ( { timeoutSeconds, strength } ) =>
		withPage( async ( page ) => {
			const deadline = Date.now() + timeoutSeconds * 1000;
			while ( Date.now() < deadline ) {
				const st = await readState( page );
				if ( isGameOver( st ) ) return text( describe( st ) );
				if ( st.current === 'PLAYER_TWO' && st.dice.length ) {
					const log = await playRedTurn( page, strength as Strength );
					return text( [ ...log, describe( await readState( page ) ) ].join( '\n' ) );
				}
				await new Promise( ( r ) => setTimeout( r, 1500 ) );
			}
			return text( `Still Blue's turn after ${ timeoutSeconds }s.\n` + describe( await readState( page ) ) );
		} )
);

await server.connect( new StdioServerTransport() );
