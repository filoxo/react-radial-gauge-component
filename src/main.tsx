import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { RadialGauge } from './RadialGauge.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RadialGauge
      value={25}
      max={100}
      unit="rpm"
    />
  </StrictMode>,
)
