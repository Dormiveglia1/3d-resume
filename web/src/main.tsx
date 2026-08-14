import { createRoot } from 'react-dom/client'
import App from './App'
import Admin from './Admin'
import './styles.css'

// GitHub Pages serves static files and returns public/404.html for /admin.
// That page forwards the intended client-side path in ?route=/admin.
const routedPath = new URLSearchParams(location.search).get('route') ?? location.pathname
const isAdmin = routedPath.replace(/\/+$/, '') === '/admin'

createRoot(document.getElementById('root')!).render(isAdmin ? <Admin /> : <App />)
