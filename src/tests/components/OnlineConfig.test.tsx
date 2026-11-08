import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { RoomScreen } from '../../components/RoomScreen';
import { StartScreen } from '../../components/StartScreen';
import { makeStore } from '../../data/createStore';

vi.mock( 'next/navigation', () => ( { useRouter: () => ( { push: () => {} } ), usePathname: () => '/' } ) );

const withStore = ( ui: React.ReactNode ) => render( <Provider store={ makeStore() }>{ ui }</Provider> );

describe( 'without a configured backend (no Supabase keys)', () => {
	afterEach( () => vi.unstubAllEnvs() );

	it( 'offers Online as not set up yet and hides joining by code', () => {
		vi.stubEnv( 'NEXT_PUBLIC_SUPABASE_URL', '' );
		vi.stubEnv( 'NEXT_PUBLIC_SUPABASE_ANON_KEY', '' );
		withStore( <StartScreen /> );
		expect( screen.getByRole( 'radio', { name: /online/i } ) ).toBeDisabled();
		expect( screen.getByText( /online play is not set up yet/i ) ).toBeInTheDocument();
		expect( screen.queryByLabelText( 'Room code' ) ).not.toBeInTheDocument();
	} );

	it( 'explains on a room page instead of crashing', () => {
		vi.stubEnv( 'NEXT_PUBLIC_SUPABASE_URL', '' );
		vi.stubEnv( 'NEXT_PUBLIC_SUPABASE_ANON_KEY', '' );
		withStore( <RoomScreen code="ABCDEF" /> );
		expect( screen.getByRole( 'heading', { name: /online play is not available yet/i } ) ).toBeInTheDocument();
	} );

	it( 'offers Online once the keys are there', () => {
		vi.stubEnv( 'NEXT_PUBLIC_SUPABASE_URL', 'http://127.0.0.1:54321' );
		vi.stubEnv( 'NEXT_PUBLIC_SUPABASE_ANON_KEY', 'anon' );
		withStore( <StartScreen /> );
		expect( screen.getByRole( 'radio', { name: /online/i } ) ).toBeEnabled();
		expect( screen.getByLabelText( 'Room code' ) ).toBeInTheDocument();
	} );
} );
