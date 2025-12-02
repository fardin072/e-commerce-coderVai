import { listCategories } from "@lib/data/categories"
import RefinementListClient from "./refinement-list-client"
import { SortOptions } from "./sort-products"

type RefinementListProps = {
  sortBy: SortOptions
  search?: boolean
  'data-testid'?: string
}

const RefinementList = async ({
  sortBy,
  'data-testid': dataTestId,
}: RefinementListProps) => {
  try {
    const allCategories = await listCategories({ limit: 100 })

    // Filter out categories with no products and sort by name
    const categories = allCategories
      .filter((cat) => cat.products && cat.products.length > 0)
      .sort((a, b) => (a.name || "").localeCompare(b.name || ""))

    return (
      <RefinementListClient
        sortBy={sortBy}
        categories={categories}
        data-testid={dataTestId}
      />
    )
  } catch (error) {
    // If categories fail to load, render with empty categories
    return (
      <RefinementListClient
        sortBy={sortBy}
        categories={[]}
        data-testid={dataTestId}
      />
    )
  }
}

export default RefinementList
