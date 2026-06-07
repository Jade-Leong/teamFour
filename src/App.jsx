import { useState } from 'react'
import SquatAnalyzer from './components/squatAnalyzer'

export default function App() {
  const [screen, setScreen] = useState('home')

  if (screen === 'workout') {
    return <SquatAnalyzer onBack={() => setScreen('home')} />
  }

  return (
    <div>
      {/* paste Lovable wellness frontend here */}

      <button onClick={() => setScreen('workout')}>
        Start Workout
      </button>
    </div>
  )
}