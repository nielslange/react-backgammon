/**
 * Colour contrast of the design tokens in both themes.
 *
 *  - Text: WCAG 2.0 SC 1.4.3, at least 4.5:1.
 *  - Control outlines, focus rings, state indicators and board graphics:
 *    at least 3:1 (the WCAG 2.1 SC 1.4.11 threshold; WCAG 2.0 sets none).
 *
 * An object such as a checker needs 3:1 for its fill OR its rim against
 * every surface it can stand on.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const css = readFileSync( join( __dirname, '../../styles/globals.css' ), 'utf8' );

const block = ( selector: RegExp ): Record< string, string > => {
	const match = css.match( selector );
	if ( ! match ) throw new Error( `block not found: ${ selector }` );
	const vars: Record< string, string > = {};
	for ( const [ , name, value ] of match[ 1 ].matchAll( /(--[\w-]+)\s*:\s*([^;]+);/g ) ) {
		vars[ name ] = value.trim();
	}
	return vars;
};

const theme = block( /@theme\s*\{([\s\S]*?)\n\}/ );
const light = block( /\n:root\s*\{([\s\S]*?)\n\}/ );
const dark = block( /:root\[data-theme='dark'\]\s*\{([\s\S]*?)\n\}/ );
const darkMedia = block( /:root:not\( \[data-theme='light'\] \)\s*\{([\s\S]*?)\n\t\}/ );

const THEMES = {
	light: { ...theme, ...light },
	dark: { ...theme, ...light, ...dark },
};

const resolve = ( vars: Record< string, string >, name: string ): string => {
	const value = vars[ `--color-${ name }` ] ?? vars[ name ];
	if ( ! value ) throw new Error( `unknown token ${ name }` );
	const ref = value.match( /^var\(\s*(--[\w-]+)\s*\)$/ );
	if ( ref ) return resolve( vars, ref[ 1 ] );
	if ( ! /^#[0-9a-f]{6}$/i.test( value ) ) throw new Error( `${ name } is not a #rrggbb colour: ${ value }` );
	return value;
};

const rgb = ( hex: string ) => [ 1, 3, 5 ].map( ( i ) => parseInt( hex.slice( i, i + 2 ), 16 ) );

const luminance = ( hex: string ) => {
	const [ r, g, b ] = rgb( hex ).map( ( c ) => {
		const s = c / 255;
		return s <= 0.03928 ? s / 12.92 : ( ( s + 0.055 ) / 1.055 ) ** 2.4;
	} );
	return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

export const ratio = ( a: string, b: string ) => {
	const [ hi, lo ] = [ luminance( a ), luminance( b ) ].sort( ( x, y ) => y - x );
	return ( hi + 0.05 ) / ( lo + 0.05 );
};

/** `top` at `alpha` over `base`, as #rrggbb. */
const blend = ( top: string, alpha: number, base: string ) => {
	const t = rgb( top );
	const b = rgb( base );
	return '#' + t.map( ( c, i ) => Math.round( c * alpha + b[ i ] * ( 1 - alpha ) ).toString( 16 ).padStart( 2, '0' ) ).join( '' );
};

type Check = { what: string; fg: string | string[]; bg: string; min: number; tint?: [ string, number ] };

const TEXT = 4.5;
const UI = 3;

const CHECKS: Check[] = [
	// Text
	{ what: 'body text on the page', fg: 'ink', bg: 'canvas', min: TEXT },
	{ what: 'body text on cards', fg: 'ink', bg: 'surface', min: TEXT },
	{ what: 'secondary text on the page', fg: 'muted', bg: 'canvas', min: TEXT },
	{ what: 'secondary text on cards', fg: 'muted', bg: 'surface', min: TEXT },
	{ what: 'primary button label', fg: 'accent-ink', bg: 'accent', min: TEXT },
	{ what: 'error notice text', fg: 'ink', bg: 'surface', tint: [ 'danger', 0.1 ], min: TEXT },
	{ what: 'success notice text', fg: 'ink', bg: 'surface', tint: [ 'success', 0.1 ], min: TEXT },
	{ what: 'stack count on a light checker', fg: 'count-on-light', bg: 'checker-light', min: TEXT },
	{ what: 'stack count on a dark checker', fg: 'count-on-dark', bg: 'checker-dark', min: TEXT },
	// Controls
	{ what: 'control outline on cards', fg: 'control', bg: 'surface', min: UI },
	{ what: 'control outline on the page', fg: 'control', bg: 'canvas', min: UI },
	{ what: 'focus ring on the page', fg: 'focus', bg: 'canvas', min: UI },
	{ what: 'focus ring on cards', fg: 'focus', bg: 'surface', min: UI },
	{ what: 'selected outline on cards', fg: 'focus', bg: 'surface', min: UI },
	{ what: 'switch knob when on', fg: 'accent-ink', bg: 'accent', min: UI },
	// Dice
	{ what: 'die on a card', fg: [ 'checker-light', 'die-edge' ], bg: 'surface', min: UI },
	{ what: 'die pips', fg: 'checker-dark', bg: 'checker-light', min: UI },
	// Board
	{ what: 'light points on the felt', fg: 'point-light', bg: 'felt', min: UI },
	{ what: 'dark points on the felt', fg: 'point-dark', bg: 'felt', min: UI },
	...( [ 'felt', 'point-light', 'point-dark' ] as const ).flatMap( ( bg ) => [
		{ what: `light checker on ${ bg }`, fg: [ 'checker-light', 'checker-light-rim' ], bg, min: UI },
		{ what: `dark checker on ${ bg }`, fg: [ 'checker-dark', 'checker-dark-rim' ], bg, min: UI },
		{ what: `landing-point outline on ${ bg }`, fg: [ 'target-outer', 'target-inner' ], bg, min: UI },
	] ),
];

describe.each( Object.entries( THEMES ) )( 'contrast in the %s theme', ( _name, vars ) => {
	it.each( CHECKS )( '$what', ( { fg, bg, min, tint } ) => {
		let base = resolve( vars, bg );
		if ( tint ) base = blend( resolve( vars, tint[ 0 ] ), tint[ 1 ], base );
		const best = Math.max( ...( Array.isArray( fg ) ? fg : [ fg ] ).map( ( f ) => ratio( resolve( vars, f ), base ) ) );
		expect( Number( best.toFixed( 2 ) ) ).toBeGreaterThanOrEqual( min );
	} );
} );

it( 'the dark media query and the explicit dark theme define the same colours', () => {
	expect( darkMedia ).toEqual( dark );
} );
