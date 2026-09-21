import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './styles.css'

// Sin StrictMode a propósito: en desarrollo monta los efectos dos veces,
// y eso duplicaría el AudioContext y el reloj del viaje.
createRoot(document.getElementById('root')).render(<App />)
