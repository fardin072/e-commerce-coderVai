import { defineRouteConfig } from "@medusajs/admin-sdk"
import { Container, Heading, Text, Table, Select, Input, Button } from "@medusajs/ui"
import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"

const OrdersWithAddressPage = () => {
  const navigate = useNavigate()
  const [limit] = useState(20)
  const [offset, setOffset] = useState(0)
  const [data, setData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  // Filter states
  const [searchInput, setSearchInput] = useState('') // User input
  const [search, setSearch] = useState('') // Debounced value for API
  const [dateRange, setDateRange] = useState('all')
  const [paymentMethod, setPaymentMethod] = useState('all')
  const [orderStatus, setOrderStatus] = useState('all')
  const [paymentStatus, setPaymentStatus] = useState('all')

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput)
      setOffset(0) // Reset to first page when search changes
    }, 500) // Wait 500ms after user stops typing

    return () => clearTimeout(timer)
  }, [searchInput])

  // Fetch ALL orders once from backend (no filters in API call)
  useEffect(() => {
    const fetchOrders = async () => {
      setIsLoading(true)
      setError(null)
      try {
        // First, check total count to decide strategy
        const countResponse = await fetch(
          `/admin/orders-with-address?limit=1&offset=0`,
          { credentials: "include" }
        )
        const countData = await countResponse.json()
        const totalOrders = countData.count || 0

        // Strategy: Client-side for <500 orders, Server-side for >=500
        const useClientSideFiltering = totalOrders < 500

        if (useClientSideFiltering) {
          // Fetch all orders for client-side filtering
          const response = await fetch(
            `/admin/orders-with-address?limit=${totalOrders}&offset=0`,
            { credentials: "include" }
          )
          if (!response.ok) throw new Error("Failed to fetch orders")
          const result = await response.json()
          setData({ ...result, useClientFiltering: true })
        } else {
          // For large datasets, we'll fetch with filters on server
          setData({ orders: [], count: totalOrders, useClientFiltering: false })
        }
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Unknown error"))
      } finally {
        setIsLoading(false)
      }
    }
    fetchOrders()
  }, [])

  // Fetch with server-side filtering when dataset is large
  useEffect(() => {
    if (!data || data.useClientFiltering) return // Skip if using client-side filtering

    const fetchFilteredOrders = async () => {
      setIsLoading(true)
      try {
        const params = new URLSearchParams({
          limit: String(limit),
          offset: String(offset),
        })

        if (search) params.append('q', search) // Use 'q' for general search on server
        if (dateRange !== 'all') params.append('date_range', dateRange)
        if (paymentMethod !== 'all') params.append('payment_provider', paymentMethod) // Use payment_provider for server
        if (orderStatus !== 'all') params.append('status', orderStatus)
        if (paymentStatus !== 'all') params.append('payment_status', paymentStatus)

        const response = await fetch(
          `/admin/orders-with-address?${params.toString()}`,
          { credentials: "include" }
        )
        if (!response.ok) throw new Error("Failed to fetch orders")
        const result = await response.json()
        setData({ ...result, useClientFiltering: false })
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Unknown error"))
      } finally {
        setIsLoading(false)
      }
    }
    fetchFilteredOrders()
  }, [search, dateRange, paymentMethod, orderStatus, paymentStatus, offset, limit, data?.useClientFiltering])


  // CLIENT-SIDE vs SERVER-SIDE filtering strategy
  const useClientFiltering = data?.useClientFiltering || false
  let orders: any[]
  let count: number

  if (useClientFiltering) {
    // CLIENT-SIDE filtering for small datasets (<500 orders)
    const allOrders = data?.orders || []

    const filteredOrders = allOrders.filter((order: any) => {
      const address = order.shipping_address || order.billing_address

      // Search filter
      if (search) {
        const searchLower = search.toLowerCase()
        const displayId = String(order.display_id || '').toLowerCase()
        const email = String(order.email || '').toLowerCase()
        const phone = String(address?.phone || '').toLowerCase()
        const name = `${address?.first_name || ''} ${address?.last_name || ''}`.toLowerCase()

        const matchesSearch = displayId.includes(searchLower) ||
          email.includes(searchLower) ||
          phone.includes(searchLower) ||
          name.includes(searchLower)

        if (!matchesSearch) return false
      }

      // Date range filter
      if (dateRange !== 'all') {
        const orderDate = new Date(order.created_at)
        const now = new Date()

        if (dateRange === 'today') {
          const today = new Date(now.setHours(0, 0, 0, 0))
          if (orderDate < today) return false
        } else if (dateRange === 'week') {
          const weekAgo = new Date(now.setDate(now.getDate() - 7))
          if (orderDate < weekAgo) return false
        } else if (dateRange === 'month') {
          const monthAgo = new Date(now.setDate(now.getDate() - 30))
          if (orderDate < monthAgo) return false
        }
      }

      // Order status filter
      if (orderStatus !== 'all') {
        const customStatus = order.metadata?.custom_status || order.status
        if (customStatus !== orderStatus) return false
      }

      // Payment method filter
      if (paymentMethod !== 'all') {
        if (order.payment_provider !== paymentMethod) return false
      }

      // Payment status filter
      if (paymentStatus !== 'all') {
        if (order.payment_status !== paymentStatus) return false
      }

      return true
    })

    // Apply pagination
    count = filteredOrders.length
    const startIndex = offset
    const endIndex = startIndex + limit
    orders = filteredOrders.slice(startIndex, endIndex)
  } else {
    // SERVER-SIDE filtering for large datasets (>=500 orders)
    orders = data?.orders || []
    count = data?.count || 0
  }

  const formatName = (address: any) => {
    if (!address) return "N/A"

    const name = `${address.first_name || ""} ${address.last_name || ""}`.trim()
    return name || "N/A"
  }

  const formatPhone = (address: any) => {
    if (!address) return "N/A"
    return address.phone || "N/A"
  }

  const formatAddress = (address: any) => {
    if (!address) return "N/A"

    // Only include address parts, NOT name or phone
    const parts: string[] = []

    // Add company if available
    if (address.company) {
      parts.push(address.company)
    }

    // Add address lines
    if (address.address_1) parts.push(address.address_1)
    if (address.address_2) parts.push(address.address_2)

    // Add city, province, postal code
    const locationParts = [
      address.city,
      address.province,
      address.postal_code,
    ].filter(Boolean)

    if (locationParts.length > 0) {
      parts.push(locationParts.join(", "))
    }

    // Add country code
    if (address.country_code) {
      parts.push(address.country_code.toUpperCase())
    }

    return parts.length > 0 ? parts.join(", ") : "N/A"
  }

  const formatPaymentMethod = (order: any) => {
    if (!order.payment_provider) return "N/A"

    const providerId = order.payment_provider.toLowerCase()

    // Extract the actual provider name from the ID
    // Provider IDs are like "pp_sslcommerz_01..." or "pp_manual_01..."
    if (providerId.includes("sslcommerz")) {
      return "SSLCommerz"
    } else if (providerId.includes("manual")) {
      return "Manual/COD"
    } else if (providerId.includes("cod") || providerId.includes("system")) {
      return "COD"
    } else {
      // Try to extract a readable name from the provider ID
      const match = providerId.match(/pp_(\w+)_/)
      if (match && match[1]) {
        // Capitalize first letter
        return match[1].charAt(0).toUpperCase() + match[1].slice(1)
      }
      return "Other"
    }
  }

  // Status options for dropdown
  const STATUS_OPTIONS = [
    { value: 'pending', label: 'Pending', color: 'text-gray-600 bg-gray-100' },
    { value: 'processing', label: 'Processing', color: 'text-yellow-700 bg-yellow-100' },
    { value: 'shipped', label: 'Shipped', color: 'text-blue-600 bg-blue-100' },
    { value: 'delivered', label: 'Delivered', color: 'text-green-600 bg-green-100' },
    { value: 'canceled', label: 'Cancelled', color: 'text-red-600 bg-red-100' },
    { value: 'refunded', label: 'Refunded', color: 'text-amber-700 bg-amber-100' },
  ]

  // Get current status (priority: custom_status > official status)
  const getCurrentStatus = (order: any) => {
    return order.metadata?.custom_status || order.status
  }

  // Get status color classes
  const getStatusColor = (status: string) => {
    const option = STATUS_OPTIONS.find(opt => opt.value === status)
    return option?.color || 'text-gray-600 bg-gray-100'
  }

  // Helper function to get payment status square color
  const getPaymentStatusSquareColor = (status: string) => {
    const colors: Record<string, string> = {
      authorized: 'bg-orange-500',
      captured: 'bg-green-500',
      completed: 'bg-green-500',  // Medusa returns 'completed' for captured payments
      canceled: 'bg-red-500',
      awaiting: 'bg-gray-400',
      not_paid: 'bg-gray-400',
      pending: 'bg-blue-500',
    }
    return colors[status] || 'bg-gray-400'
  }

  // Helper function to format payment status label
  const formatPaymentStatus = (status: string | null) => {
    if (!status) return 'N/A'
    // Map 'completed' to 'Captured' to match Medusa's prebuilt pages
    if (status === 'completed') return 'Captured'
    // Capitalize first letter of each word and replace underscores with spaces
    return status.split('_').map(word =>
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ')
  }

  // Handle status change
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null)

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    try {
      setUpdatingOrderId(orderId)

      const response = await fetch(`/admin/orders/${orderId}/custom-status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ customStatus: newStatus })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to update status')
      }

      // Refresh orders
      const result = await fetch(
        `/admin/orders-with-address?limit=${limit}&offset=${offset}`,
        { credentials: 'include' }
      )
      const updatedData = await result.json()
      setData(updatedData)
    } catch (error) {
      console.error('Error updating status:', error)
      alert('Failed to update order status')
    } finally {
      setUpdatingOrderId(null)
    }
  }

  if (error) {
    return (
      <Container>
        <Heading level="h1">Orders with Address</Heading>
        <div className="mt-4 text-red-600">
          Error loading orders: {error instanceof Error ? error.message : "Unknown error"}
        </div>
      </Container>
    )
  }

  const totalPages = Math.ceil(count / limit)
  const currentPage = Math.floor(offset / limit) + 1

  return (
    <Container>
      <div className="flex items-center justify-between mb-6">
        <Heading level="h1">Orders with Address</Heading>
        <Text size="small" className="text-gray-500">
          Total: {count}
        </Text>
      </div>

      {/* Filter Section */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {/* Search */}
          <div className="xl:col-span-2">
            <Input
              size="small"
              placeholder="Search order #, email, phone, name..."
              value={searchInput}
              onChange={(e) => {
                setSearchInput(e.target.value)
              }}
            />
          </div>

          {/* Date Range */}
          <div>
            <Select size="small" value={dateRange} onValueChange={(val) => {
              setDateRange(val)
              setOffset(0)
            }}>
              <Select.Trigger className="w-full">
                <Select.Value placeholder="Date Range" />
              </Select.Trigger>
              <Select.Content>
                <Select.Item value="all">All Time</Select.Item>
                <Select.Item value="today">Today</Select.Item>
                <Select.Item value="week">This Week</Select.Item>
                <Select.Item value="month">This Month</Select.Item>
              </Select.Content>
            </Select>
          </div>

          {/* Payment Method */}
          <div>
            <Select size="small" value={paymentMethod} onValueChange={(val) => {
              setPaymentMethod(val)
              setOffset(0)
            }}>
              <Select.Trigger className="w-full">
                <Select.Value placeholder="Payment Method" />
              </Select.Trigger>
              <Select.Content>
                <Select.Item value="all">All Methods</Select.Item>
                <Select.Item value="pp_sslcommerz_default">SSLCommerz</Select.Item>
                <Select.Item value="pp_system_default">COD</Select.Item>
              </Select.Content>
            </Select>
          </div>

          {/* Order Status */}
          <div>
            <Select size="small" value={orderStatus} onValueChange={(val) => {
              setOrderStatus(val)
              setOffset(0)
            }}>
              <Select.Trigger className="w-full">
                <Select.Value placeholder="Order Status" />
              </Select.Trigger>
              <Select.Content>
                <Select.Item value="all">All Statuses</Select.Item>
                <Select.Item value="pending">Pending</Select.Item>
                <Select.Item value="processing">Processing</Select.Item>
                <Select.Item value="shipped">Shipped</Select.Item>
                <Select.Item value="delivered">Delivered</Select.Item>
                <Select.Item value="canceled">Cancelled</Select.Item>
                <Select.Item value="refunded">Refunded</Select.Item>
              </Select.Content>
            </Select>
          </div>

          {/* Payment Status */}
          <div>
            <Select size="small" value={paymentStatus} onValueChange={(val) => {
              setPaymentStatus(val)
              setOffset(0)
            }}>
              <Select.Trigger className="w-full">
                <Select.Value placeholder="Payment Status" />
              </Select.Trigger>
              <Select.Content>
                <Select.Item value="all">All Payment</Select.Item>
                <Select.Item value="authorized">Authorized</Select.Item>
                <Select.Item value="completed">Captured</Select.Item>
                <Select.Item value="canceled">Cancelled</Select.Item>
              </Select.Content>
            </Select>
          </div>
        </div>

        {/* Clear Filters Button */}
        {(searchInput || dateRange !== 'all' || paymentMethod !== 'all' || orderStatus !== 'all' || paymentStatus !== 'all') && (
          <div className="mt-4">
            <Button
              size="small"
              variant="secondary"
              onClick={() => {
                setSearchInput('')
                setSearch('')
                setDateRange('all')
                setPaymentMethod('all')
                setOrderStatus('all')
                setPaymentStatus('all')
                setOffset(0)
              }}
            >
              Clear Filters
            </Button>
          </div>
        )}
      </div>

      <div className="overflow-x-auto">
        <Table>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell>Order #</Table.HeaderCell>
              <Table.HeaderCell>Name</Table.HeaderCell>
              <Table.HeaderCell>Mobile Number</Table.HeaderCell>
              <Table.HeaderCell>Email</Table.HeaderCell>
              <Table.HeaderCell>Status</Table.HeaderCell>
              <Table.HeaderCell>Payment</Table.HeaderCell>
              <Table.HeaderCell>Address</Table.HeaderCell>
              <Table.HeaderCell>Payment Method</Table.HeaderCell>
              <Table.HeaderCell>Total</Table.HeaderCell>
              <Table.HeaderCell>Date</Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {isLoading ? (
              <Table.Row>
                <td colSpan={9} className="text-center py-8">
                  <Text size="small" className="text-gray-500">
                    Loading...
                  </Text>
                </td>
              </Table.Row>
            ) : orders.length === 0 ? (
              <Table.Row>
                <td colSpan={9} className="text-center py-8">
                  <Text size="small" className="text-gray-500">
                    No orders found
                  </Text>
                </td>
              </Table.Row>
            ) : (
              orders.map((order: any) => {
                const address = order.shipping_address || order.billing_address

                // Get total from summary - amounts are already in whole units (e.g., 1630 BDT)
                // Use current_order_total (what customer owes) or accounting_total (order total)
                let total = 0
                if (order.summary?.current_order_total !== undefined) {
                  total = order.summary.current_order_total
                } else if (order.summary?.accounting_total !== undefined) {
                  total = order.summary.accounting_total
                } else if (order.total !== undefined && order.total !== null) {
                  total = order.total
                }

                const currency = order.currency_code || "BDT"

                return (
                  <Table.Row
                    key={order.id}
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => navigate(`/orders/${order.id}`)}
                  >
                    <Table.Cell>
                      <Text size="small" weight="plus" className="text-blue-600 hover:underline">
                        #{order.display_id || order.id.slice(0, 8)}
                      </Text>
                    </Table.Cell>
                    <Table.Cell>
                      <Text size="small">{formatName(address)}</Text>
                    </Table.Cell>
                    <Table.Cell>
                      <Text size="small">{formatPhone(address)}</Text>
                    </Table.Cell>
                    <Table.Cell>
                      <Text size="small">{order.email || order.customer?.email || "N/A"}</Text>
                    </Table.Cell>
                    <Table.Cell onClick={(e) => e.stopPropagation()}>
                      <Select
                        size="small"
                        value={getCurrentStatus(order)}
                        onValueChange={(value) => handleStatusChange(order.id, value)}
                        disabled={updatingOrderId === order.id}
                      >
                        <Select.Trigger className={`capitalize px-2 py-1 rounded ${getStatusColor(getCurrentStatus(order))}`}>
                          {getCurrentStatus(order)}
                        </Select.Trigger>
                        <Select.Content>
                          {STATUS_OPTIONS.map(opt => (
                            <Select.Item key={opt.value} value={opt.value}>
                              {opt.label}
                            </Select.Item>
                          ))}
                        </Select.Content>
                      </Select>
                    </Table.Cell>
                    <Table.Cell>
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-sm ${getPaymentStatusSquareColor(order.payment_status || '')}`}></div>
                        <Text size="small">{formatPaymentStatus(order.payment_status)}</Text>
                      </div>
                    </Table.Cell>
                    <Table.Cell>
                      <Text size="small" className="whitespace-normal">
                        {formatAddress(address)}
                      </Text>
                    </Table.Cell>
                    <Table.Cell>
                      <Text size="small">{formatPaymentMethod(order)}</Text>
                    </Table.Cell>
                    <Table.Cell>
                      <Text size="small" weight="plus">
                        {total > 0 ? (
                          // Amounts are already in whole units (e.g., 1630 = 1630 BDT)
                          // Format with proper currency symbol
                          new Intl.NumberFormat("en-US", {
                            style: "currency",
                            currency: currency,
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          }).format(total)
                        ) : (
                          <span className="text-gray-400">N/A</span>
                        )}
                      </Text>
                    </Table.Cell>
                    <Table.Cell>
                      <Text size="small">
                        {order.created_at
                          ? new Date(order.created_at).toLocaleString("en-US", {
                            year: "numeric",
                            month: "2-digit",
                            day: "2-digit",
                            hour: "2-digit",
                            minute: "2-digit",
                            hour12: true,
                          })
                          : "N/A"}
                      </Text>
                    </Table.Cell>
                  </Table.Row>
                )
              })
            )}
          </Table.Body>
        </Table>
      </div>

      {/* Pagination - Always reserve space to prevent layout shift */}
      <div className="flex items-center justify-between mt-4 min-h-[40px]">
        {totalPages > 1 ? (
          <>
            <Text size="small" className="text-gray-500">
              Page {currentPage} of {totalPages}
            </Text>
            <div className="flex gap-2">
              <button
                onClick={() => setOffset(Math.max(0, offset - limit))}
                disabled={offset === 0}
                className="px-3 py-1 text-sm border rounded disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => setOffset(offset + limit)}
                disabled={offset + limit >= count}
                className="px-3 py-1 text-sm border rounded disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </>
        ) : (
          <div className="w-full"></div>
        )}
      </div>
    </Container>
  )
}

export const config = defineRouteConfig({
  label: "Orders with Address",
})

export default OrdersWithAddressPage

