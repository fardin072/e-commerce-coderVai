"use server"

import { HttpTypes } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Image from "next/image"
import { Suspense } from "react"
import { listProducts } from "@lib/data/products"
import CategorySectionClient from "./category-section-client"
import { CategorySectionSkeleton } from "./skeleton"

interface CategoryShowcaseProps {
  categories: HttpTypes.StoreProductCategory[]
  countryCode: string
}

const demoImages = [
  "https://images.unsplash.com/photo-1551986782-d244ca7868ca?w=600&h=300&fit=crop",
  "https://images.unsplash.com/photo-1542272604-787c62d465d1?w=600&h=300&fit=crop",
  "https://images.unsplash.com/photo-1523381210435-271e8be1f52b?w=600&h=300&fit=crop",
  "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=600&h=300&fit=crop",
  "https://images.unsplash.com/photo-1595777707802-51b39fd9b371?w=600&h=300&fit=crop",
  "https://images.unsplash.com/photo-1595580571289-2206f4a10b52?w=600&h=300&fit=crop",
]

export default async function CategoryShowcase({
  categories,
  countryCode,
}: CategoryShowcaseProps) {
  const topLevelCategories = categories
    .filter((cat) => !cat.parent_category && cat.products && cat.products.length > 0)
    .slice(0, 6)

  return (
    <div className="w-full bg-gradient-to-b from-white to-slate-50/50 py-16 small:py-24">
      <div className="content-container">
        <div className="flex flex-col gap-16">
          {/* Header Section */}
          <div className="flex flex-col gap-4">
            <div className="space-y-3">
              <h2 className="text-3xl small:text-4xl medium:text-5xl font-bold text-slate-900 leading-tight">
                Explore by Category
              </h2>
              <p className="text-slate-600 text-base small:text-lg max-w-2xl">
                Discover our handpicked collections tailored to your style and preferences
              </p>
            </div>
            <div className="w-12 h-1 bg-gradient-to-r from-orange-500 to-pink-500 rounded-full" />
          </div>

          {/* Categories Grid */}
          <div className="space-y-12">
            {topLevelCategories.map((category, index) => (
              <Suspense
                key={category.id}
                fallback={<CategorySectionSkeleton />}
              >
                <CategorySection
                  category={category}
                  countryCode={countryCode}
                  imageIndex={index}
                />
              </Suspense>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

async function CategorySection({
  category,
  countryCode,
  imageIndex,
}: {
  category: HttpTypes.StoreProductCategory
  countryCode: string
  imageIndex: number
}) {
  const { response } = await listProducts({
    queryParams: {
      category_id: [category.id],
      limit: 8,
    },
    countryCode,
  })

  const products = response.products || []

  return (
    <CategorySectionClient
      category={category}
      products={products}
      imageIndex={imageIndex}
      demoImages={demoImages}
    />
  )
}
