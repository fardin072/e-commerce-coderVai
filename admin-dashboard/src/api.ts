const API_BASE = "/medusa"

export async function login(email: string, password: string): Promise<void> {
  // Step 1: Get token from /auth/user/emailpass
  const tokenRes = await fetch(`${API_BASE}/auth/user/emailpass`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ 
      email, 
      password,
    }),
  })

  if (!tokenRes.ok) {
    const text = await tokenRes.text()
    let errorMsg = `Login failed (${tokenRes.status}): ${text || "Unknown error"}`
    try {
      const json = JSON.parse(text)
      errorMsg = json.message || json.error || errorMsg
    } catch {
      // keep text as-is
    }
    throw new Error(errorMsg)
  }

  const tokenData = await tokenRes.json()
  
  // Extract token - response format: { "token": "eyJ..." }
  const token = tokenData.token
  
  if (!token) {
    throw new Error("Token not found in response")
  }

  // Step 2: Establish session with token (send as Bearer token in header)
  const sessionRes = await fetch(`${API_BASE}/auth/session`, {
    method: "POST",
    credentials: "include", // Important: this sets cookies
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`, // Send token as Bearer token
    },
    // Body is empty for session endpoint
  })

  if (!sessionRes.ok) {
    const text = await sessionRes.text()
    let errorMsg = `Session creation failed (${sessionRes.status}): ${text || "Unknown error"}`
    try {
      const json = JSON.parse(text)
      errorMsg = json.message || json.error || errorMsg
    } catch {
      // keep text as-is
    }
    // Log for debugging
    console.error("Session creation failed:", {
      status: sessionRes.status,
      statusText: sessionRes.statusText,
      response: text,
      tokenLength: token?.length,
    })
    throw new Error(errorMsg)
  }
  
  // Verify session was created by checking response
  const sessionData = await sessionRes.json()
  console.log("Session created successfully:", sessionData)

  // Session established - cookies are now set
}

export async function getMe(): Promise<any> {
  // Try /admin/users/me first (Medusa v2 standard)
  let res = await fetch(`${API_BASE}/admin/users/me`, {
    method: "GET",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
  })

  // If 404, try /admin/auth (alternative)
  if (res.status === 404) {
    res = await fetch(`${API_BASE}/admin/auth`, {
      method: "GET",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
    })
  }

  if (!res.ok) {
    if (res.status === 401) {
      throw new Error("Not authenticated")
    }
    const text = await res.text()
    throw new Error(`Failed to get user (${res.status}): ${text || "Unknown error"}`)
  }

  return res.json()
}

export async function logout(): Promise<void> {
  // Call Medusa logout endpoint
  const res = await fetch(`${API_BASE}/auth/session`, {
    method: "DELETE",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
  })

  // Even if logout fails, redirect to login page
  // Redirect to our custom login page
  window.location.href = window.location.origin
}


