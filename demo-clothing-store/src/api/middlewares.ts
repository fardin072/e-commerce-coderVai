import { defineMiddlewares } from "@medusajs/framework/http"
import type {
  MedusaRequest,
  MedusaResponse,
  MedusaNextFunction,
} from "@medusajs/framework/http"
import { enrichPaymentContext } from "./middlewares/enrich-payment-context"

/**
 * Middleware to add publishable API key to SSLCommerz callback requests
 * SSLCommerz makes server-to-server requests without the publishable key,
 * so we need to add it automatically for these routes.
 */
async function addPublishableKeyForSslCallbacks(
  req: MedusaRequest,
  res: MedusaResponse,
  next: MedusaNextFunction
) {
  // Get publishable key from environment
  const publishableKey = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY

  if (!publishableKey) {
    console.error("[SSLCommerz Middleware] Publishable key not found in environment")
    return next()
  }

  // Log that middleware is running
  console.log(`[SSLCommerz Middleware] Adding publishable key to ${req.url}`)

  // If the request doesn't have the publishable key header, add it
  // This must happen BEFORE Medusa's validation middleware runs
  if (!req.headers["x-publishable-api-key"]) {
    req.headers["x-publishable-api-key"] = publishableKey
    console.log(`[SSLCommerz Middleware] Added publishable key header`)
  } else {
    console.log(`[SSLCommerz Middleware] Publishable key already present`)
  }
  
  // Also try setting it directly on the request object
  ;(req as any).headers = req.headers || {}
  ;(req as any).headers["x-publishable-api-key"] = publishableKey
  
  // Set in rawHeaders if available
  if ((req as any).rawHeaders) {
    const rawHeaders = (req as any).rawHeaders as string[]
    const keyIndex = rawHeaders.findIndex(
      (h: string) => h.toLowerCase() === "x-publishable-api-key"
    )
    if (keyIndex === -1) {
      rawHeaders.push("x-publishable-api-key", publishableKey)
    } else if (keyIndex >= 0 && keyIndex < rawHeaders.length - 1) {
      rawHeaders[keyIndex + 1] = publishableKey
    }
  }

  next()
}

/**
 * Middleware to intercept logout and redirect to custom admin
 * This runs BEFORE authentication, so it can handle logout even if session is invalid
 */
async function handleLogoutRedirect(
  req: MedusaRequest,
  res: MedusaResponse,
  next: MedusaNextFunction
) {
  // Check if this is a DELETE request to /auth/session (logout)
  // Match both with and without query params
  const urlPath = req.url?.split("?")[0] || req.url || ""
  if (req.method === "DELETE" && (urlPath === "/auth/session" || urlPath.endsWith("/auth/session"))) {
    console.log("[Logout Middleware] Intercepting logout request")
    
    // Destroy session and redirect
    req.session.destroy((err) => {
      if (err) {
        console.error("[Logout Middleware] Failed to destroy session:", err)
        return res.status(500).json({ message: "Failed to logout" })
      }
      
      console.log("[Logout Middleware] Session destroyed, redirecting")
      const customAdminUrl = process.env.CUSTOM_ADMIN_URL || "http://localhost:5173"
      
      // Set CORS headers
      const origin = req.headers.origin || "http://localhost:9000"
      res.setHeader("Access-Control-Allow-Origin", origin)
      res.setHeader("Access-Control-Allow-Credentials", "true")
      
      // Use 303 redirect - browser will follow it
      res.redirect(303, customAdminUrl)
      return
    })
    return // Don't call next() - we've handled the request
  }
  
  // For all other requests, continue to next middleware
  next()
}

export default defineMiddlewares({
  routes: [
    // Handle logout redirect to custom admin
    {
      matcher: /^\/auth\/session$/,
      middlewares: [handleLogoutRedirect],
    },
    // Enrich payment session creation with cart data
    {
      matcher: /^\/store\/payment-collections\/[^\/]+\/payment-sessions$/,
      middlewares: [enrichPaymentContext],
    },
    // Add publishable key for SSLCommerz callbacks
    {
      matcher: /^\/store\/sslcommerz\/(success|fail|cancel|ipn)/,
      middlewares: [addPublishableKeyForSslCallbacks],
    },
  ],
})

