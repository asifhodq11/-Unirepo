import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { MotionConfig } from 'framer-motion'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <MotionConfig transition={{ ease: [0.16, 1, 0.3, 1], duration: 0.25 }}>
      <App />
    </MotionConfig>
  </StrictMode>,
)



