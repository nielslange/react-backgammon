/**
 * Public surface of the rules engine. Pure TypeScript: no React, Redux,
 * DOM or Node imports anywhere below this file.
 */
import { backgammon } from './backgammon';
import type { RulesEngine } from './RulesEngine';
import type { VariantId } from './types';

const ENGINES: Partial< Record< VariantId, RulesEngine > > = {
	backgammon,
};

export const getEngine = ( variant: VariantId ): RulesEngine => {
	const engine = ENGINES[ variant ];
	if ( ! engine ) {
		throw new Error( `Unknown variant: ${ String( variant ) }` );
	}
	return engine;
};

export * from './types';
export * from './errors';
export * from './constants';
export type { RulesEngine } from './RulesEngine';
