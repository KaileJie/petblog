import { Button } from "@/components/ui/button"

export default function PetHero() {
  return (
    <section className="relative min-h-screen w-full overflow-hidden bg-gradient-to-br from-[#FFF8F3] via-[#FFE8D6] to-[#F5E6D3] flex items-center justify-center">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Soft paw print decorations */}
        <div className="absolute top-10 left-4 sm:left-10 w-16 h-16 sm:w-24 sm:h-24 rounded-full bg-orange-100/40 blur-3xl" />
        <div className="absolute top-1/3 right-4 sm:right-20 w-20 h-20 sm:w-32 sm:h-32 rounded-full bg-amber-100/30 blur-3xl" />
        <div className="absolute bottom-20 left-1/4 w-24 h-24 sm:w-40 sm:h-40 rounded-full bg-orange-50/50 blur-3xl" />
        <div className="absolute bottom-10 right-1/3 w-20 h-20 sm:w-36 sm:h-36 rounded-full bg-yellow-50/40 blur-3xl" />
      </div>

      {/* Content wrapper */}
      <div className="relative z-10 w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="flex flex-col items-center justify-center text-center space-y-6 sm:space-y-8">
          {/* Pet illustration area */}
          <div className="relative w-full max-w-md mx-auto h-56 sm:h-64 md:h-80 mb-2 sm:mb-4 md:mb-8">
            <img
              src="/cute-cats-and-dogs-playing-together-soft-pastel-co.jpg"
              alt="Happy cats and dogs together"
              className="w-full h-full object-contain drop-shadow-lg"
            />
          </div>

          {/* Headline */}
          <div className="space-y-3 sm:space-y-4 px-2">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-balance leading-tight px-2">
              <span className="bg-clip-text bg-gradient-to-r from-orange-600 via-red-500 to-orange-500 text-primary font-extrabold">
                Share your pet story
              </span>
              <br className="hidden sm:block" />
              <span className="text-primary block sm:inline">with the community</span>
            </h1>

            {/* Subtitle */}
            <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed font-semibold px-2">
              Build the beautiful memory together
            </p>
          </div>

          {/* CTA Button */}
          <div className="pt-2 sm:pt-4 md:pt-8 w-full sm:w-auto px-4 sm:px-0">
            <Button
              size="lg"
              className="w-full sm:w-auto bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 px-6 sm:px-8 md:px-10 py-5 sm:py-6 md:py-7 text-sm sm:text-base md:text-lg font-semibold rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 text-background"
            >
              Start Sharing
            </Button>
          </div>

          {/* Trust indicators */}
          <div className="pt-6 sm:pt-8 md:pt-12 w-full flex flex-col sm:flex-row gap-4 sm:gap-6 md:gap-8 justify-center items-center px-4">
            <div className="text-center w-full sm:w-auto">
              <p className="text-xl sm:text-2xl md:text-3xl font-bold text-orange-600">10K+</p>
              <p className="text-xs sm:text-sm text-muted-foreground">Pet Stories Shared</p>
            </div>
            <div className="hidden sm:block w-px h-12 bg-border" />
            <div className="text-center w-full sm:w-auto">
              <p className="text-xl sm:text-2xl md:text-3xl font-bold text-orange-600">5K+</p>
              <p className="text-xs sm:text-sm text-muted-foreground">Happy Pet Owners</p>
            </div>
            <div className="hidden sm:block w-px h-12 bg-border" />
            <div className="text-center w-full sm:w-auto">
              <p className="text-xl sm:text-2xl md:text-3xl font-bold text-orange-600">25K+</p>
              <p className="text-xs sm:text-sm text-muted-foreground">Hearts Shared</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
