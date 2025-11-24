import { defineMiddlewares } from "@medusajs/framework/http"
import type {
  MedusaRequest,
  MedusaResponse,
  MedusaNextFunction,
} from "@medusajs/framework/http"

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

  // If the request doesn't have the publishable key header, add it
  if (publishableKey && !req.headers["x-publishable-api-key"]) {
    req.headers["x-publishable-api-key"] = publishableKey
  }

  next()
}

export default defineMiddlewares({
  routes: [
    {
      matcher: "/store/sslcommerz/(success|fail|cancel|ipn)",
      middlewares: [addPublishableKeyForSslCallbacks],
    },
  ],
})

