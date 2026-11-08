/**
 * Public surface of the rules engine. Pure TypeScript: no React, Redux,
 * DOM or Node imports anywhere below this file.
 */
import { backgammon } from './backgammon';
import { triktrak } from './triktrak';
import { EngineError } from './errors';
import type { RulesEngine } from './RulesEngine';
import type { VariantId } from './types';

const ENGINES: Partial< Record< VariantId, RulesEngine > > = {
	backgammon,
	triktrak,
};

/** Whether an engine is registered for this variant id. */
export const hasEngine = ( variant: unknown ): variant is VariantId =>
	typeof variant === 'string' &&
	Object.prototype.hasOwnProperty.call( ENGINES, variant );

export const getEngine = ( variant: VariantId ): RulesEngine => {
	if ( ! hasEngine( variant ) ) {
		throw new EngineError(
			'UNKNOWN_VARIANT',
			`Unknown variant: ${ String( variant ) }`
		);
	}
	return ENGINES[ variant ]!;
};

export * from './types';
export * from './errors';
export * from './constants';
export type { RulesEngine } from './RulesEngine';
