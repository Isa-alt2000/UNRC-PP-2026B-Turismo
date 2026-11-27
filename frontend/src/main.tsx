import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// Inter e Inter Tight servidas desde el proyecto: una hoja de Google Fonts bloqueaba el primer render.
import '@fontsource-variable/inter'
import '@fontsource-variable/inter-tight'
import './index.css'
import App from './app'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
)
