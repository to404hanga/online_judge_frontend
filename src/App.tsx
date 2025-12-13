import { useEffect, useState } from 'react'
import './App.css'
import LoginPage from './pages/Login'
import DashboardPage from './pages/Dashboard'
import AdminPage from './pages/Admin'
import { clearAuthToken, getAuthToken } from './api/http'
import { fetchUserInfo } from './api/user'

function App() {
  const [loggedIn, setLoggedIn] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    const token = getAuthToken()
    if (!token) return
    void initUserFromToken()
  }, [])

  async function initUserFromToken() {
    try {
      const res = await fetchUserInfo()
      if (!res.ok || !res.data) {
        clearAuthToken()
        setLoggedIn(false)
        setIsAdmin(false)
        return
      }
      setLoggedIn(true)
      setIsAdmin(res.data.role === 1)
    } catch {
      clearAuthToken()
      setLoggedIn(false)
      setIsAdmin(false)
    }
  }

  async function handleLoginSuccess() {
    await initUserFromToken()
  }

  function handleLogout() {
    clearAuthToken()
    setLoggedIn(false)
    setIsAdmin(false)
  }

  if (loggedIn) {
    if (isAdmin) {
      return <AdminPage onLogout={handleLogout} />
    }
    return <DashboardPage onLogout={handleLogout} />
  }

  return <LoginPage onLoginSuccess={() => void handleLoginSuccess()} />
}

export default App
