"use server"

import { updateCart } from "./cart"
import { HttpTypes } from "@medusajs/types"

/**
 * Auto-save address fields to cart without redirecting
 * Used for preserving form state during page refreshes (e.g., coupon application)
 */
export async function autoSaveAddress(data: HttpTypes.StoreUpdateCart) {
    try {
        await updateCart(data)
        return { success: true }
    } catch (error: any) {
        console.error("[autoSaveAddress] Error:", error)
        return { success: false, error: error.message }
    }
}
