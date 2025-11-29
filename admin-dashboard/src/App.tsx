import React, { useEffect, useState } from "react"
import { getMe, login, logout } from "./api"

export const App: React.FC = () => {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Check if this is a logout redirect
    const urlParams = new URLSearchParams(window.location.search)
    if (urlParams.get("logout") === "true") {
      // User was redirected here after logout, just show login form
      return
    }

    // Try to restore existing session - if logged in, redirect to Medusa admin
    getMe()
      .then(() => {
        // Already logged in, redirect to default Medusa admin
        const backendUrl = import.meta.env.VITE_MEDUSA_BACKEND_URL || "http://localhost:9000"
        window.location.href = `${backendUrl}/app`
      })
      .catch(() => {
        // ignore – user is not logged in, show login form
      })
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      await login(email, password)
      
      // Verify session was created by checking /admin/users/me
      try {
        await getMe()
        // Session verified - redirect to default Medusa admin panel
        const backendUrl = import.meta.env.VITE_MEDUSA_BACKEND_URL || "http://localhost:9000"
        window.location.href = `${backendUrl}/app`
      } catch (verifyErr) {
        // Session verification failed
        setError("Login successful but session verification failed. Please try again.")
        setLoading(false)
      }
    } catch (err: any) {
      setError(err.message ?? "Login failed")
      setLoading(false)
    }
  }

  return (
    <div className="page page--center">
      <form className="card card--narrow" onSubmit={handleLogin}>
        <div className="logo-circle">Z</div>
        <h1>Zahan Admin</h1>
        <p className="muted">Sign in to access the admin area</p>

        {error && <p className="error">{error}</p>}

        <label className="field">
          <span>Email</span>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>

        <label className="field">
          <span>Password</span>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>

        <button type="submit" className="btn" disabled={loading}>
          {loading ? "Signing in..." : "Sign in"}
        </button>
      </form>
    </div>
  )
}


