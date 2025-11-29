export default function Announcement() {
  return (
    <div className="w-full bg-gradient-to-r from-orange-50 via-pink-50 to-rose-50 border-b border-orange-200">
      <div className="content-container">
        <div className="flex flex-col small:flex-row items-center justify-between py-4 small:py-3 gap-3 small:gap-0 px-0">
          <div className="text-center small:text-left flex-1">
            <p className="text-xs xsmall:text-sm small:text-base text-slate-900 font-medium">
              🎉 Exclusive Launch Offer
            </p>
            <p className="text-xs text-slate-700 mt-0.5 small:mt-1">
              Get 20% off on your first purchase with code: <span className="font-semibold text-orange-600">WELCOME20</span>
            </p>
          </div>
          <div className="hidden small:flex items-center gap-2 text-slate-700 hover:text-slate-900 transition-colors cursor-pointer group">
            <span className="text-xs small:text-sm font-medium">Shop Now</span>
            <span className="group-hover:translate-x-1 transition-transform inline-block">→</span>
          </div>
        </div>
      </div>
    </div>
  )
}
