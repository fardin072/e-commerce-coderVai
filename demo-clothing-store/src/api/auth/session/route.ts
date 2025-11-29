import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

// Handle CORS preflight
export const OPTIONS = async (req: MedusaRequest, res: MedusaResponse) => {
  const origin = req.headers.origin || "http://localhost:9000"
  res.setHeader("Access-Control-Allow-Origin", origin)
  res.setHeader("Access-Control-Allow-Credentials", "true")
  res.setHeader("Access-Control-Allow-Methods", "DELETE, OPTIONS")
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization")
  res.status(200).end()
}

// Override the default session DELETE to redirect to custom admin login
export const DELETE = async (req: MedusaRequest, res: MedusaResponse) => {
  const logger = req.scope.resolve(ContainerRegistrationKeys.LOGGER)
  
  try {
    logger.info("Custom logout endpoint called")
    
    // Clear the session
    return new Promise<void>((resolve) => {
      req.session.destroy((err) => {
        if (err) {
          logger.error("Failed to destroy session:", err)
          return res.status(500).json({ 
            message: "Failed to logout",
            redirectUrl: process.env.CUSTOM_ADMIN_URL || "http://localhost:5173"
          })
        }
        
        logger.info("Session destroyed, redirecting to custom admin")
        
        // Set CORS headers to allow the redirect
        const origin = req.headers.origin || "http://localhost:9000"
        res.setHeader("Access-Control-Allow-Origin", origin)
        res.setHeader("Access-Control-Allow-Credentials", "true")
        res.setHeader("Access-Control-Allow-Methods", "DELETE, OPTIONS")
        res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization")
        
        // Use 303 See Other - specifically for redirecting after DELETE/POST
        // This tells the browser to do a GET to the new location
        const customAdminUrl = process.env.CUSTOM_ADMIN_URL || "http://localhost:5173"
        res.redirect(303, customAdminUrl)
        resolve()
      })
    })
  } catch (error: any) {
    logger.error("Logout error:", error)
    const customAdminUrl = process.env.CUSTOM_ADMIN_URL || "http://localhost:5173"
    return res.status(200).json({ 
      message: "Logged out",
      redirectUrl: customAdminUrl
    })
  }
}

