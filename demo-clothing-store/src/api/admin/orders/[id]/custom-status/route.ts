import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules, ContainerRegistrationKeys } from "@medusajs/framework/utils"

const VALID_CUSTOM_STATUSES = [
    'pending',
    'processing',
    'shipped',
    'delivered',
    'canceled',
    'refunded',
]

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
    const { id } = req.params
    const { customStatus } = req.body as { customStatus: string }

    if (!VALID_CUSTOM_STATUSES.includes(customStatus)) {
        return res.status(400).json({
            message: `Invalid status. Must be one of: ${VALID_CUSTOM_STATUSES.join(', ')}`
        })
    }

    const orderModuleService = req.scope.resolve(Modules.ORDER)
    const pgConnection = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION)
    const remoteQuery = req.scope.resolve("remoteQuery")

    try {
        // Get current order
        const order = await orderModuleService.retrieveOrder(id)

        let updateData: any = {
            metadata: {
                ...order.metadata,
                custom_status: customStatus
            }
        }

        // Handle status-specific updates with direct DB changes for fulfillment
        switch (customStatus) {
            case 'shipped':
                await updateFulfillmentStatus(pgConnection, remoteQuery, id, 'shipped')
                break

            case 'delivered':
                await updateFulfillmentStatus(pgConnection, remoteQuery, id, 'delivered')
                updateData.status = 'archived' // Archive delivered orders
                break

            case 'canceled':
                await updateFulfillmentStatus(pgConnection, remoteQuery, id, 'canceled')
                updateData.status = 'canceled'
                updateData.canceled_at = new Date()
                break

            case 'refunded':
                updateData.status = 'archived'
                break

            // 'pending' and 'processing' only update custom status in metadata
        }

        // Update order
        const updatedOrder = await orderModuleService.updateOrders(id, updateData)

        return res.json({ order: updatedOrder })
    } catch (error: any) {
        console.error('Error updating order status:', error)
        return res.status(500).json({
            message: error?.message ?? 'Failed to update order status'
        })
    }
}

// Helper: Update fulfillment status via direct DB query
async function updateFulfillmentStatus(pgConnection: any, remoteQuery: any, orderId: string, statusType: 'shipped' | 'delivered' | 'canceled') {
    try {
        // Get fulfillment ID linked to this order using Knex query builder
        const fulfillments = await pgConnection('fulfillment')
            .select('fulfillment.id')
            .join('order_fulfillment', 'fulfillment.id', 'order_fulfillment.fulfillment_id')
            .where('order_fulfillment.order_id', orderId)
            .limit(1)

        let fulfillmentId: string

        if (fulfillments.length === 0) {
            // No fulfillment exists - create one
            console.log(`📦 Creating fulfillment for order ${orderId}`)

            // Get stock location
            const locations = await pgConnection('stock_location').select('id').limit(1)

            if (locations.length === 0) {
                console.log(`❌ No stock location found, cannot create fulfillment`)
                return
            }

            const locationId = locations[0].id

            // Get fulfillment provider
            const providers = await pgConnection('fulfillment_provider').select('id').limit(1)

            if (providers.length === 0) {
                console.log(`❌ No fulfillment provider found, cannot create fulfillment`)
                return
            }

            const providerId = providers[0].id
            const now = new Date().toISOString()

            // Generate fulfillment ID (Medusa format)
            fulfillmentId = `ful_${Date.now().toString(36)}${Math.random().toString(36).substr(2, 9)}`.toUpperCase()

            // Create fulfillment record using Knex
            await pgConnection('fulfillment').insert({
                id: fulfillmentId,
                location_id: locationId,
                provider_id: providerId,
                created_at: now,
                updated_at: now
            })

            // Link fulfillment to order using Knex
            const linkId = `orful_${Date.now().toString(36)}${Math.random().toString(36).substr(2, 9)}`.toUpperCase()
            await pgConnection('order_fulfillment').insert({
                id: linkId,
                order_id: orderId,
                fulfillment_id: fulfillmentId,
                created_at: now,
                updated_at: now
            })

            // Get order line items using remoteQuery (more reliable than direct SQL)
            const orderWithItems = await remoteQuery({
                entryPoint: "order",
                fields: ["items.id", "items.title", "items.variant_id", "items.quantity", "items.variant_sku", "items.variant_barcode"],
                variables: { filters: { id: orderId } },
            })

            const lineItems = orderWithItems && orderWithItems.length > 0 ? orderWithItems[0].items : []

            // Create fulfillment items for each line item
            for (const item of lineItems) {
                const fulfillmentItemId = `fulit_${Date.now().toString(36)}${Math.random().toString(36).substr(2, 9)}`.toUpperCase()
                await pgConnection('fulfillment_item').insert({
                    id: fulfillmentItemId,
                    fulfillment_id: fulfillmentId,
                    line_item_id: item.id,
                    title: item.title,
                    sku: item.variant_sku || '',
                    barcode: item.variant_barcode || '',
                    quantity: item.quantity || 1,
                    raw_quantity: JSON.stringify({ value: String(item.quantity || 1), precision: 20 }),
                    created_at: now,
                    updated_at: now
                })

                // Update order_item to mark as fulfilled
                await pgConnection('order_item')
                    .where('item_id', item.id)
                    .where('order_id', orderId)
                    .update({
                        fulfilled_quantity: item.quantity || 1,
                        raw_fulfilled_quantity: JSON.stringify({ value: String(item.quantity || 1), precision: 20 }),
                        updated_at: now
                    })
            }

            console.log(`✅ Created fulfillment ${fulfillmentId} for order ${orderId}`)
        } else {
            fulfillmentId = fulfillments[0].id
            console.log(`📋 Found existing fulfillment ${fulfillmentId}`)
        }

        // Now update fulfillment timestamps based on status
        let updateQuery = ''
        const now = new Date().toISOString()

        switch (statusType) {
            case 'shipped':
                await pgConnection('fulfillment')
                    .where('id', fulfillmentId)
                    .update({
                        shipped_at: now,
                        updated_at: now
                    })
                console.log(`✅ Fulfillment ${fulfillmentId} marked as shipped at ${now}`)
                break

            case 'delivered':
                await pgConnection('fulfillment')
                    .where('id', fulfillmentId)
                    .update({
                        shipped_at: pgConnection.raw('COALESCE(shipped_at, ?)', [now]),
                        delivered_at: now,
                        updated_at: now
                    })
                console.log(`✅ Fulfillment ${fulfillmentId} marked as delivered at ${now}`)
                break

            case 'canceled':
                await pgConnection('fulfillment')
                    .where('id', fulfillmentId)
                    .update({
                        canceled_at: now,
                        updated_at: now
                    })
                console.log(`✅ Fulfillment ${fulfillmentId} canceled at ${now}`)
                break
        }
    } catch (error) {
        console.error(`❌ Error updating fulfillment status:`, error)
    }
}
