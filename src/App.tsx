import { useEffect, useState } from 'react'
import './App.css'
import LoginPage from './pages/Login'
import DashboardPage from './pages/Dashboard'
import { clearAuthToken, getAuthToken } from './api/http'

function App() {
  const [loggedIn, setLoggedIn] = useState(false)

  useEffect(() => {
    const token = getAuthToken()
    if (token) {
      setLoggedIn(true)
    }
  }, [])

  function handleLoginSuccess() {
    setLoggedIn(true)
  }

  function handleLogout() {
    clearAuthToken()
    setLoggedIn(false)
  }

  if (loggedIn) {
    return <DashboardPage onLogout={handleLogout} />
  }

  return <LoginPage onLoginSuccess={() => handleLoginSuccess()} />
}

export default App
