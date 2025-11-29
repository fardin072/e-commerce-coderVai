import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

// Simple logout redirect page - destroys session and redirects to custom admin
export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  // Clear the session
  req.session.destroy((err) => {
    const customAdminUrl = process.env.CUSTOM_ADMIN_URL || "http://localhost:5173"
    
    // Return HTML page that redirects (works even with CORS)
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta http-equiv="refresh" content="0;url=${customAdminUrl}">
          <script>window.location.href = "${customAdminUrl}";</script>
        </head>
        <body>
          <p>Logging out... <a href="${customAdminUrl}">Click here if you are not redirected</a></p>
        </body>
      </html>
    `
    
    res.setHeader("Content-Type", "text/html")
    res.send(html)
  })
}

