import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  try {
    const orderModuleService = req.scope.resolve(Modules.ORDER)
    const remoteQuery = req.scope.resolve("remoteQuery")

    const {
      limit = 20,
      offset = 0,
      search,
      date_range,
      payment_method,
      status,
      payment_status
    } = req.query

    // Build filter object
    const filters: any = {}

    // Date range filter
    if (date_range && date_range !== 'all') {
      const now = new Date()
      let startDate: Date

      switch (date_range) {
        case 'today':
          startDate = new Date(now.setHours(0, 0, 0, 0))
          break
        case 'week':
          startDate = new Date(now.setDate(now.getDate() - 7))
          break
        case 'month':
          startDate = new Date(now.setDate(now.getDate() - 30))
          break
        default:
          startDate = new Date(0) // All time
      }

      filters.created_at = { $gte: startDate }
    }

    // Order status filter (custom_status in metadata)
    if (status && status !== 'all') {
      // We'll filter this after fetching since it's in metadata
    }

    // Search filter (applied after fetch since we need to search in addresses)
    // Will filter by: display_id, email, phone, name

    // According to schema.sql:
    // - order table has shipping_address_id and billing_address_id (FKs to order_address)
    // - order_address table has: address_1, address_2, city, province, postal_code, country_code, phone, first_name, last_name, company

    // List orders with address relations
    // Try with relations first
    let orders: any[]
    let count: number

    try {
      [orders, count] = await orderModuleService.listAndCountOrders(
        filters,
        {
          take: 1000, // Fetch more orders to allow filtering
          skip: 0,
          order: { created_at: "DESC" },
          relations: ["shipping_address", "billing_address", "summary"],
        }
      )
    } catch (relationError) {
      // If relations don't work, fetch orders and then fetch addresses separately
      [orders, count] = await orderModuleService.listAndCountOrders(
        filters,
        {
          take: 1000,
          skip: 0,
          order: { created_at: "DESC" },
        }
      )

      // Fetch addresses and summary for orders that have address IDs
      orders = await Promise.all(
        orders.map(async (order: any) => {
          const result: any = { ...order }

          // Fetch full order with relations
          try {
            const fullOrder = await orderModuleService.retrieveOrder(order.id, {
              relations: ["shipping_address", "billing_address", "summary"],
            })
            result.shipping_address = fullOrder.shipping_address || null
            result.billing_address = fullOrder.billing_address || null
            result.summary = fullOrder.summary || null
          } catch (e) {
            // If that fails, try individual fetches
            if (order.shipping_address_id) {
              try {
                const orderWithShipping = await orderModuleService.retrieveOrder(order.id, {
                  relations: ["shipping_address"],
                })
                result.shipping_address = orderWithShipping.shipping_address || null
              } catch (e2) {
                result.shipping_address = null
              }
            }

            if (order.billing_address_id) {
              try {
                const orderWithBilling = await orderModuleService.retrieveOrder(order.id, {
                  relations: ["billing_address"],
                })
                result.billing_address = orderWithBilling.billing_address || null
              } catch (e2) {
                result.billing_address = null
              }
            }
          }

          return result
        })
      )
    }

    // Fetch payment information separately using remoteQuery
    try {
      const orderIds = orders.map(o => o.id)

      const paymentData = await remoteQuery({
        entryPoint: "order_payment_collection",
        fields: ["order_id", "payment_collection_id"],
        variables: {
          filters: {
            order_id: orderIds,
          },
        },
      })

      // Get payment collection IDs
      const paymentCollectionIds = paymentData.map((p: any) => p.payment_collection_id).filter(Boolean)

      if (paymentCollectionIds.length > 0) {
        const payments = await remoteQuery({
          entryPoint: "payment",
          fields: ["id", "provider_id", "payment_collection_id"],
          variables: {
            filters: {
              payment_collection_id: paymentCollectionIds,
            },
          },
        })

        // Fetch payment collection statuses
        const paymentCollections = await remoteQuery({
          entryPoint: "payment_collection",
          fields: ["id", "status"],
          variables: {
            filters: {
              id: paymentCollectionIds,
            },
          },
        })

        // Create maps for payment provider and status
        const orderPaymentMap: Record<string, string> = {}
        const orderPaymentStatusMap: Record<string, string> = {}

        paymentData.forEach((link: any) => {
          const payment = payments.find((p: any) => p.payment_collection_id === link.payment_collection_id)
          const paymentCollection = paymentCollections.find((pc: any) => pc.id === link.payment_collection_id)

          if (payment && link.order_id) {
            orderPaymentMap[link.order_id] = payment.provider_id
          }
          if (paymentCollection && link.order_id) {
            orderPaymentStatusMap[link.order_id] = paymentCollection.status
          }
        })

        // Enrich orders with payment provider and status
        orders = orders.map(order => ({
          ...order,
          payment_provider: orderPaymentMap[order.id] || null,
          payment_status: orderPaymentStatusMap[order.id] || null,
        }))
      }
    } catch (paymentError) {
      console.warn("Could not fetch payment data:", paymentError)
      // Continue without payment data
    }

    // Apply post-fetch filters
    let filteredOrders = [...orders]

    // Search filter (order #, email, phone, name)
    if (search) {
      const searchLower = String(search).toLowerCase()
      filteredOrders = filteredOrders.filter(order => {
        const displayId = String(order.display_id || '').toLowerCase()
        const email = String(order.email || '').toLowerCase()
        const shippingPhone = String(order.shipping_address?.phone || '').toLowerCase()
        const billingPhone = String(order.billing_address?.phone || '').toLowerCase()
        const shippingName = `${order.shipping_address?.first_name || ''} ${order.shipping_address?.last_name || ''}`.toLowerCase()
        const billingName = `${order.billing_address?.first_name || ''} ${order.billing_address?.last_name || ''}`.toLowerCase()

        return displayId.includes(searchLower) ||
          email.includes(searchLower) ||
          shippingPhone.includes(searchLower) ||
          billingPhone.includes(searchLower) ||
          shippingName.includes(searchLower) ||
          billingName.includes(searchLower)
      })
    }

    // Order status filter
    if (status && status !== 'all') {
      filteredOrders = filteredOrders.filter(order => {
        const customStatus = order.metadata?.custom_status || order.status
        return customStatus === status
      })
    }

    // Payment method filter
    if (payment_method && payment_method !== 'all') {
      filteredOrders = filteredOrders.filter(order => {
        return order.payment_provider === payment_method
      })
    }

    // Payment status filter
    if (payment_status && payment_status !== 'all') {
      filteredOrders = filteredOrders.filter(order => {
        return order.payment_status === payment_status
      })
    }

    // Update count for filtered results
    const filteredCount = filteredOrders.length

    // Apply pagination after filtering
    const startIndex = Number(offset)
    const endIndex = startIndex + Number(limit)
    const paginatedOrders = filteredOrders.slice(startIndex, endIndex)

    return res.status(200).json({
      orders: paginatedOrders,
      count: filteredCount,
      limit: Number(limit),
      offset: Number(offset),
    })
  } catch (error: any) {
    console.error("Error fetching orders:", error)
    return res.status(500).json({
      message: error?.message ?? "Failed to fetch orders",
    })
  }
}

