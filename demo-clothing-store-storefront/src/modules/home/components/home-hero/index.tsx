import LocalizedClientLink from "@modules/common/components/localized-client-link"

export default function HomeHero() {
  return (
    <section className="relative w-full overflow-hidden bg-gradient-to-br from-white via-slate-50 to-slate-100 py-20 small:py-32">
      {/* Decorative Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-orange-500/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-pink-500/5 rounded-full blur-3xl" />
      </div>

      {/* Content */}
      <div className="relative z-10 content-container">
        <div className="max-w-4xl">
          <div className="space-y-6">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-orange-100/60 backdrop-blur-md rounded-full border border-orange-200 hover:bg-orange-100 transition-colors">
              <span className="flex h-2 w-2 rounded-full bg-orange-500" />
              <span className="text-sm font-medium text-slate-900">
                Summer Collection Now Available
              </span>
            </div>

            {/* Heading */}
            <h1 className="text-4xl small:text-5xl medium:text-6xl font-bold text-slate-900 leading-tight">
              Elevate Your{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 via-pink-500 to-rose-500">
                Personal Style
              </span>
            </h1>

            {/* Subheading */}
            <p className="text-lg small:text-xl text-slate-600 leading-relaxed max-w-2xl">
              Discover expertly curated collections of premium fashion and lifestyle products. From timeless classics to contemporary trends, find your perfect look today.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col small:flex-row gap-4 pt-4">
              <LocalizedClientLink
                href="/store"
                className="inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-orange-500 to-pink-500 text-white font-bold rounded-lg hover:shadow-2xl hover:shadow-orange-500/30 transition-all duration-300 hover:scale-105 text-base whitespace-nowrap group"
              >
                <span>Shop Collection</span>
                <span className="group-hover:translate-x-1 transition-transform ml-2">→</span>
              </LocalizedClientLink>
              <LocalizedClientLink
                href="/store"
                className="inline-flex items-center justify-center px-8 py-4 bg-slate-200 backdrop-blur-md text-slate-900 font-bold rounded-lg border border-slate-300 hover:bg-slate-300 transition-all duration-300 text-base whitespace-nowrap group"
              >
                <span>Explore Categories</span>
                <span className="group-hover:translate-x-1 transition-transform ml-2">→</span>
              </LocalizedClientLink>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-6 pt-8 border-t border-slate-300">
              <div>
                <div className="text-2xl small:text-3xl font-bold text-slate-900">500+</div>
                <p className="text-sm text-slate-600 mt-1">Premium Products</p>
              </div>
              <div>
                <div className="text-2xl small:text-3xl font-bold text-slate-900">50K+</div>
                <p className="text-sm text-slate-600 mt-1">Happy Customers</p>
              </div>
              <div>
                <div className="text-2xl small:text-3xl font-bold text-slate-900">24/7</div>
                <p className="text-sm text-slate-600 mt-1">Customer Support</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Fade Effect */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-slate-200 to-transparent opacity-10" />
    </section>
  )
}
