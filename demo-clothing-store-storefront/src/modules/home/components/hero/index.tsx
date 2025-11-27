"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

const heroImages = [
  "https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=1200&h=600&fit=crop",
  "https://images.unsplash.com/photo-1595777707802-51b39fd9b371?w=1200&h=600&fit=crop",
  "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=1200&h=600&fit=crop",
]

const Hero = () => {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isAutoPlay, setIsAutoPlay] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const router = useRouter()

  useEffect(() => {
    if (!isAutoPlay) return

    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroImages.length)
    }, 5000)

    return () => clearInterval(interval)
  }, [isAutoPlay])

  const goToSlide = (index: number) => {
    setCurrentSlide(index)
    setIsAutoPlay(false)
  }

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/store?search=${encodeURIComponent(searchQuery)}`)
    }
  }

  return (
    <section className="relative w-full max-h-[300px] overflow-hidden bg-slate-900" role="banner">
      {/* Background Image Carousel */}
      <div className="absolute inset-0 w-full h-full">
        {heroImages.map((img, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-opacity duration-1000 ${
              index === currentSlide ? "opacity-100" : "opacity-0"
            }`}
          >
            <Image
              src={img}
              alt={`Premium Collection ${index + 1}`}
              fill
              className="object-cover"
              priority={index === 0}
              quality={85}
            />
          </div>
        ))}
      </div>

      {/* Dark Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/50 to-black/60" />

      {/* Animated Background Pattern */}
      <div className="absolute inset-0 opacity-10 bg-gradient-to-r from-transparent via-white to-transparent animate-pulse" />

      {/* Content Container */}
      <div className="relative z-10 h-full flex flex-col items-center justify-center px-4 small:px-6 py-4 small:py-6">
        <div className="max-w-4xl mx-auto text-center space-y-2 small:space-y-3 medium:space-y-4">
          {/* Promotional Badge */}
          <div className="hidden small:inline-flex items-center gap-2 px-3 small:px-4 py-1 small:py-2 bg-white/20 backdrop-blur-sm rounded-full border border-white/30">
            <span className="text-xs small:text-sm font-semibold text-white flex items-center gap-1">
              🎉 Exclusive Offer
            </span>
          </div>

          {/* Main Headline */}
          <h1 className="text-2xl small:text-3xl medium:text-4xl font-bold text-white leading-tight animate-fade-in-up">
            Elevate Your Style
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-pink-400 text-xl small:text-2xl medium:text-3xl">
              Up to 50% OFF
            </span>
          </h1>

          {/* Subheadline */}
          <p className="text-xs small:text-sm medium:text-base text-slate-100 max-w-2xl mx-auto leading-tight animate-fade-in-up animation-delay-200 hidden small:block">
            Discover our handpicked selections for this season's must-haves. Premium quality, unbeatable prices, limited time only.
          </p>

          {/* Trust Badges */}
          <div className="hidden small:flex flex-wrap justify-center gap-2 small:gap-4 pt-1 small:pt-2 animate-fade-in-up animation-delay-400">
            <div className="flex items-center gap-1 text-white">
              <span className="text-sm small:text-base">🚀</span>
              <span className="text-xs small:text-sm font-medium">Free Shipping</span>
            </div>
            <div className="flex items-center gap-1 text-white">
              <span className="text-sm small:text-base">🛡️</span>
              <span className="text-xs small:text-sm font-medium">Secure Payment</span>
            </div>
            <div className="flex items-center gap-1 text-white">
              <span className="text-sm small:text-base">↩️</span>
              <span className="text-xs small:text-sm font-medium">Easy Returns</span>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col small:flex-row gap-2 small:gap-3 justify-center pt-2 small:pt-3 animate-fade-in-up animation-delay-600">
            <LocalizedClientLink
              href="/store"
              className="inline-flex items-center justify-center px-4 small:px-6 py-2 small:py-3 bg-gradient-to-r from-orange-500 to-pink-500 text-white font-bold rounded-lg hover:shadow-xl hover:shadow-orange-500/50 transition-all duration-300 transform hover:scale-105 text-xs small:text-sm medium:text-base whitespace-nowrap"
            >
              Shop Now →
            </LocalizedClientLink>
            <LocalizedClientLink
              href="/store"
              className="hidden small:inline-flex items-center justify-center px-4 small:px-6 py-2 small:py-3 bg-white/20 backdrop-blur-sm text-white font-bold rounded-lg border-2 border-white hover:bg-white/30 transition-all duration-300 text-xs small:text-sm medium:text-base whitespace-nowrap"
            >
              View Offers
            </LocalizedClientLink>
          </div>

          {/* Countdown Timer (optional) */}
          <div className="hidden small:block pt-1 small:pt-2 text-white text-xs small:text-sm font-medium animate-fade-in-up animation-delay-800">
            ⏱️ Limited Time Offer - Shop Today!
          </div>
        </div>
      </div>

      {/* Carousel Controls */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-20 flex gap-2">
        {heroImages.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            aria-label={`Go to slide ${index + 1}`}
            className={`h-2 rounded-full transition-all duration-300 ${
              index === currentSlide
                ? "w-8 bg-white"
                : "w-2 bg-white/50 hover:bg-white/75"
            }`}
          />
        ))}
      </div>

      {/* Navigation Arrows */}
      <button
        onClick={() => setCurrentSlide((prev) => (prev - 1 + heroImages.length) % heroImages.length)}
        aria-label="Previous slide"
        className="absolute left-4 top-1/2 transform -translate-y-1/2 z-20 p-2 small:p-3 bg-white/20 hover:bg-white/40 text-white rounded-full transition-all duration-300 backdrop-blur-sm"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      <button
        onClick={() => setCurrentSlide((prev) => (prev + 1) % heroImages.length)}
        aria-label="Next slide"
        className="absolute right-4 top-1/2 transform -translate-y-1/2 z-20 p-2 small:p-3 bg-white/20 hover:bg-white/40 text-white rounded-full transition-all duration-300 backdrop-blur-sm"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>

      {/* Scroll Indicator */}
      <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 animate-bounce text-white">
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </svg>
      </div>
    </section>
  )
}

export default Hero
