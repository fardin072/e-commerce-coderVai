export default function medusaError(error: any): never {
  let message = "An unknown error occurred"

  if (error?.response?.data) {
    // The request was made and the server responded with a status code
    // that falls out of the range of 2xx
    try {
      if (error.config?.url && error.config?.baseURL) {
        const u = new URL(error.config.url, error.config.baseURL)
        console.error("Resource:", u.toString())
      }
      console.error("Response data:", error.response.data)
      console.error("Status code:", error.response.status)
      console.error("Headers:", error.response.headers)
    } catch (e) {
      // Ignore URL construction errors
    }

    // Extracting the error message from the response data
    const data = error.response.data
    const msgText = typeof data === "object" ? data.message : data
    if (msgText && typeof msgText === "string") {
      message = msgText.charAt(0).toUpperCase() + msgText.slice(1)
      if (!message.endsWith(".")) {
        message += "."
      }
    }
  } else if (error?.message && typeof error.message === "string") {
    // Handle fetch or other errors with message property
    message = error.message
  } else if (typeof error === "string") {
    // Handle string errors
    message = error
  } else if (error?.request) {
    // The request was made but no response was received
    message = "No response received from server"
  }

  throw new Error(message)
}
