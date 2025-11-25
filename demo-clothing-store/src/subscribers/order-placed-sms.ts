import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import { getBulkSmsClient } from "../lib/sms/bulk-sms-bd"

type OrderPlacedEvent = {
  id: string
}

const shouldNotify = () => {
  const flag = process.env.BULKSMSBD_NOTIFY_ORDER_PLACED
  if (!flag) {
    return true
  }

  return ["true", "1", "yes"].includes(flag.toLowerCase())
}

export default async function orderPlacedSmsSubscriber({
  event: { data },
  container,
}: SubscriberArgs<OrderPlacedEvent>) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  logger.info(`[Bulk SMS BD] order.placed payload: ${JSON.stringify(data)}`)

  if (!shouldNotify()) {
    return
  }

  if (!data?.id) {
    logger.warn("[Bulk SMS BD] Received order.placed event without an order ID")
    return
  }

  try {
    const orderModuleService = container.resolve(Modules.ORDER)
    logger.info(
      `[Bulk SMS BD] Fetching order ${data.id} with shipping/billing relations`
    )
    const order = await orderModuleService.retrieveOrder(data.id, {
      relations: ["shipping_address", "billing_address"],
      select: ["id", "display_id"],
    })

    logger.info(
      `[Bulk SMS BD] Loaded order ${order.id} display #${order.display_id}`
    )

    const phone =
      order?.shipping_address?.phone ||
      order?.billing_address?.phone ||
      null

    if (!phone) {
      logger.info(
        `[Bulk SMS BD] Order ${order.id} does not include a phone number. Skipping SMS notification.`
      )
      return
    }

    const client = getBulkSmsClient()
    const storeName = process.env.BULKSMSBD_BRAND_NAME || "Medusa Store"
    const orderNumber = order.display_id ?? order.id
    const message = `Your ${storeName} order #${orderNumber} was placed successfully.`
    logger.info(
      `[Bulk SMS BD] Sending SMS for order ${orderNumber} to ${phone} with message: ${message}`
    )

    const response = await client.send({
      numbers: [phone],
      message,
    })

    logger.info(
      `[Bulk SMS BD] Gateway response for order ${orderNumber}: ${JSON.stringify(
        response
      )}`
    )

    if (!response.success) {
      logger.warn(
        `[Bulk SMS BD] Failed to send order placed SMS for ${orderNumber}: ${response.description}`
      )
    } else {
      logger.info(
        `[Bulk SMS BD] Sent order placed SMS for ${orderNumber} to ${phone}`
      )
    }
  } catch (error: any) {
    logger.error(
      `[Bulk SMS BD] Unable to send order placed SMS for ${data.id}: ${
        error?.message || error
      }`
    )
    logger.error(error)
  }
}

export const config: SubscriberConfig = {
  event: "order.placed",
}

