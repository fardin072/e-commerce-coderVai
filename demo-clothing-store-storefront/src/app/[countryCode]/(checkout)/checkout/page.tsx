import { retrieveCart } from "@lib/data/cart"
import { retrieveCustomer } from "@lib/data/customer"
import PaymentWrapper from "@modules/checkout/components/payment-wrapper"
import CheckoutForm from "@modules/checkout/templates/checkout-form"
import CheckoutSummary from "@modules/checkout/templates/checkout-summary"
import { Metadata } from "next"
import { notFound } from "next/navigation"

export const metadata: Metadata = {
  title: "Checkout",
}

export default async function Checkout() {
  const cart = await retrieveCart()

  if (!cart) {
    return notFound()
  }

  const customer = await retrieveCustomer()

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-slate-50">
      <div className="content-container py-6 small:py-12">
        <h1 className="text-2xl small:text-4xl font-bold text-slate-900 mb-6 small:mb-8">
          Checkout
        </h1>
        <div className="grid grid-cols-1 small:grid-cols-[1fr_380px] gap-6 small:gap-8">
          <div>
            <CheckoutForm cart={cart} customer={customer} />
          </div>
          <div className="bg-white rounded-lg border border-slate-200 p-5 small:p-6 h-fit sticky top-20 small:top-24">
            <CheckoutSummary cart={cart} />
          </div>
        </div>
      </div>
    </div>
  )
}
