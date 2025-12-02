"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useCallback } from "react"
import { HttpTypes } from "@medusajs/types"

interface CategoryFilterClientProps {
  categories: HttpTypes.StoreProductCategory[]
  dataTestId?: string
}

export default function CategoryFilterClient({
  categories,
  dataTestId,
}: CategoryFilterClientProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const selectedCategoryId = searchParams.get("category")

  const handleCategorySelect = useCallback(
    (categoryId: string) => {
      const params = new URLSearchParams(searchParams)
      
      // If clicking the same category, deselect it
      if (selectedCategoryId === categoryId) {
        params.delete("category")
      } else {
        params.set("category", categoryId)
      }
      
      // Reset to page 1 when changing category
      params.set("page", "1")
      
      router.push(`/store?${params.toString()}`)
    },
    [selectedCategoryId, searchParams, pathname, router]
  )

  return (
    <div className="py-4 w-fit" data-testid={dataTestId || "category-filter"}>
      <h3 className="text-sm font-semibold text-grey-90 mb-4">Categories</h3>
      
      {categories.length === 0 ? (
        <p className="text-xs text-grey-60">No categories available</p>
      ) : (
        <ul className="space-y-2">
          {categories.map((category) => (
            <li key={category.id}>
              <button
                onClick={() => handleCategorySelect(category.id)}
                className={`w-fit px-2 text-left rounded text-md transition-colors overflow-hidden ${
                  selectedCategoryId === category.id
                    ? "bg-grey-90 text-white font-medium"
                    : "text-grey-60 hover:bg-grey-10 hover:text-grey-90"
                }`}
              >
                <div className="flex items-center justify-between gap-2 w-fit min-w-0">
                  <span className="">{category.name}</span>
                  {category.products && (
                    <span className={`text-xs whitespace-nowrap flex-shrink-0 ${
                      selectedCategoryId === category.id
                        ? "text-grey-20"
                        : "text-grey-40"
                    }`}>
                      ({category.products.length})
                    </span>
                  )}
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
