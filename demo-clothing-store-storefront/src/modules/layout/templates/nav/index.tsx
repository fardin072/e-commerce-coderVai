import { Suspense } from "react"

import { listRegions } from "@lib/data/regions"
import { listCategories, filterCategoriesWithProducts } from "@lib/data/categories"
import { StoreRegion } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import CartButton from "@modules/layout/components/cart-button"
import NavDropdown from "@modules/layout/components/nav-dropdown"
import MobileMenu from "@modules/layout/components/mobile-menu"
import CentralSearch from "@modules/layout/components/central-search"

export default async function Nav() {
  const regions = await listRegions().then((regions: StoreRegion[]) => regions)
  const allCategories = await listCategories()
  const categories = filterCategoriesWithProducts(allCategories)

  return (
    <div className="sticky top-0 inset-x-0 z-50">
      <header className="bg-white border-b border-slate-200 shadow-sm">
        <nav className="content-container">
          {/* Top Row: Logo, Search, Icons */}
          <div className="flex items-center justify-between h-16 gap-2 small:gap-4">
            {/* Left: Logo + Mobile Menu */}
            <div className="flex items-center gap-3 flex-shrink-0">
              <MobileMenu regions={regions} categories={categories} />
              <LocalizedClientLink
                href="/"
                className="font-bold text-lg small:text-xl tracking-tight hover:text-slate-600 transition-colors whitespace-nowrap"
                data-testid="nav-store-link"
              >
                ZAHAN
              </LocalizedClientLink>
            </div>

            {/* Center: Search Bar - Hidden on very small screens, 50% width on tablet+ */}
            <div className="hidden xsmall:flex small:w-1/2 medium:w-1/2 lg:w-1/2">
              <CentralSearch initialCategories={categories} />
            </div>

            {/* Right: Account + Cart */}
            <div className="flex items-center gap-2 small:gap-4 flex-shrink-0">
              <LocalizedClientLink
                className="hidden small:flex items-center gap-2 px-3 py-2 text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors text-sm font-medium"
                href="/account"
                data-testid="nav-account-link"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
                <span className="hidden medium:inline">Account</span>
              </LocalizedClientLink>

              <div className="h-6 w-px bg-slate-200 hidden small:block" />

              <Suspense
                fallback={
                  <LocalizedClientLink
                    className="flex items-center gap-2 px-3 py-2 text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors text-sm font-medium"
                    href="/cart"
                    data-testid="nav-cart-link"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2 9m10-9l2 9m-9-9h14l-4 8H7l4-8z"
                      />
                    </svg>
                    <span className="hidden medium:inline">Cart</span>
                  </LocalizedClientLink>
                }
              >
                <CartButton />
              </Suspense>
            </div>
          </div>

          {/* Mobile Search Bar - Shown on very small screens */}
          <div className="xsmall:hidden border-t border-slate-200 px-0 py-3">
            <CentralSearch initialCategories={categories} />
          </div>

          {/* Desktop Navigation Links - Second Row */}
          <div className="hidden small:flex items-center justify-center border-t border-slate-100 h-12 gap-8">
            <NavDropdown categories={categories} />
            <LocalizedClientLink
              href="/store"
              className="text-slate-700 hover:text-slate-900 font-medium transition-colors text-sm"
            >
              All Products
            </LocalizedClientLink>
          </div>
        </nav>
      </header>
    </div>
  )
}
