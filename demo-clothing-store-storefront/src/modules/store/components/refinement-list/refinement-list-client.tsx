"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useCallback } from "react"

import SortProducts, { SortOptions } from "./sort-products"
import CategoryFilterClient from "./category-filter/category-filter-client"
import { HttpTypes } from "@medusajs/types"

type RefinementListClientProps = {
  sortBy: SortOptions
  categories: HttpTypes.StoreProductCategory[]
  'data-testid'?: string
}

const RefinementListClient = ({
  sortBy,
  categories,
  'data-testid': dataTestId,
}: RefinementListClientProps) => {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const createQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams)
      params.set(name, value)

      return params.toString()
    },
    [searchParams]
  )

  const setQueryParams = (name: string, value: string) => {
    const query = createQueryString(name, value)
    router.push(`${pathname}?${query}`)
  }

  return (
    <div className="flex small:flex-col gap-12 py-4 mb-8 small:px-0 pl-6 small:min-w-[250px] small:ml-[1.675rem]">
      <div className="flex flex-col gap-8 w-full">
        <SortProducts sortBy={sortBy} setQueryParams={setQueryParams} data-testid={dataTestId} />
        <CategoryFilterClient
          categories={categories}
          dataTestId="category-filter"
        />
      </div>
    </div>
  )
}

export default RefinementListClient
