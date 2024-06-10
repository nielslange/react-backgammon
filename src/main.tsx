import ReactDOM from 'react-dom/client';
import { Game } from './components/Game';
import 'bootstrap/dist/css/bootstrap.min.css';
import './index.scss';

const root = ReactDOM.createRoot(
	document.getElementById( 'root' ) as HTMLElement
);
root.render(
	// <React.StrictMode>
	<Game />
	// </React.StrictMode>
);
