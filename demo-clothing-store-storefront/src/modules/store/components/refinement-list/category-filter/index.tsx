import { listCategories } from "@lib/data/categories"
import CategoryFilterClient from "./category-filter-client"

interface CategoryFilterProps {
  dataTestId?: string
}

export default async function CategoryFilter({
  dataTestId,
}: CategoryFilterProps) {
  try {
    const allCategories = await listCategories({ limit: 100 })

    // Filter out categories with no products and sort by name
    const categories = allCategories
      .filter((cat) => cat.products && cat.products.length > 0)
      .sort((a, b) => (a.name || "").localeCompare(b.name || ""))

    return (
      <CategoryFilterClient
        categories={categories}
        dataTestId={dataTestId}
      />
    )
  } catch (error) {
    return (
      <div className="py-4">
        <h3 className="text-sm font-semibold text-grey-90 mb-4">Categories</h3>
        <p className="text-xs text-grey-60">Unable to load categories</p>
      </div>
    )
  }
}
