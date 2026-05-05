import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// Ping the backend immediately on app start so Render wakes up
// before the user even tries to log in or browse data.
const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
fetch(`${API.replace('/api', '')}/health`, { method: 'GET' })
  .catch(() => {}); // fire-and-forget, ignore errors

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
