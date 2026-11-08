/**
 * Requests from the UI that the turn driver fulfils. They change no state
 * by themselves.
 */
import { createAction } from '@reduxjs/toolkit';

/** The player to act wants their dice rolled now. */
export const requestRoll = createAction( 'intent/requestRoll' );
