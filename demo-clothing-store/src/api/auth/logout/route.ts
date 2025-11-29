import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

// This endpoint handles logout and redirects to custom admin login
export const DELETE = async (req: MedusaRequest, res: MedusaResponse) => {
  // Clear the session
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ message: "Failed to logout" })
    }
    
    // Redirect to custom admin login page
    const customAdminUrl = process.env.CUSTOM_ADMIN_URL || "http://localhost:5173"
    return res.redirect(customAdminUrl)
  })
}

// Also support GET for browser redirects
export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ message: "Failed to logout" })
    }
    
    const customAdminUrl = process.env.CUSTOM_ADMIN_URL || "http://localhost:5173"
    return res.redirect(customAdminUrl)
  })
}

