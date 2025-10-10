'use client'

import { useEffect, useRef, useState } from "react"
import { useAlert } from "@/context/AlertContext"
import FlowStep from "../components/FlowChartStep"
import AuctionCard from "../components/AuctionCard"
import AuctionCardSkeleton from "../components/HomeAuctionSkele"
import { Search, DollarSign, TrendingUp, Trophy, Package } from "lucide-react"
import Link from "next/link"
import { supabaseBrowser } from "../utils/supabase/client"

export default function HomePage() {
  const { showAlert } = useAlert()

  const sectionsRef = useRef([])
  const stepsRef = useRef([])
  const featuredRef = useRef(null)

  const [visibleSections, setVisibleSections] = useState(new Set())
  const [visibleSteps, setVisibleSteps] = useState(new Set())
  const [featuredAuctions, setFeaturedAuctions] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  const steps = [
    { icon: <Search className="w-12 h-12" />, label: 'Find Auction', description: 'Browse curated premium auctions' },
    { icon: <DollarSign className="w-12 h-12" />, label: 'Enter Starting Bid', description: 'Register and place your initial bid' },
    { icon: <TrendingUp className="w-12 h-12" />, label: 'Bid Increment', description: 'Compete in real-time; auto or manual' },
    { icon: <Trophy className="w-12 h-12" />, label: 'Win Auction', description: 'Highest bid at close secures the item' },
    { icon: <Package className="w-12 h-12" />, label: 'Collect Item', description: 'Complete payment and receive your treasure' },
  ]

  // ---------------------------
  // Flash alert logic
  // ---------------------------
  useEffect(() => {
    const raw = sessionStorage.getItem('flash')
    if (raw) {
      const { message, variant = 'info' } = JSON.parse(raw)
      showAlert({ message, variant })
      sessionStorage.removeItem('flash')
    }
  }, [showAlert])

  // ---------------------------
  // Fetch featured auctions
  // ---------------------------
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      const supabase = supabaseBrowser()

      const { data, error } = await supabase
        .from("auction")
        .select("aid, name, description, end_time, thumbnail_bucket, object_path")

      if (error) {
        console.error("❌ Supabase error:", error.message)
        setIsLoading(false)
        return
      }

      if (!data || data.length === 0) {
        console.log("⚠️ No auction data found.")
        setIsLoading(false)
        return
      }

      const mapped = await Promise.all(
        data.map(async (a) => {
          let publicUrl = null
          if (a.thumbnail_bucket && a.object_path) {
            const { data: publicData } = supabase
              .storage
              .from(a.thumbnail_bucket)
              .getPublicUrl(a.object_path)
            publicUrl = publicData?.publicUrl || null
          }

          return {
            aid: a.aid,
            name: a.name,
            description: a.description,
            endTime: new Date(a.end_time).toLocaleString(),
            thumbnail: a.thumbnail_bucket,
            picUrl: publicUrl,
          }
        })
      )

      setFeaturedAuctions(mapped)
      setIsLoading(false)
    }

    fetchData()
  }, [])

  // ---------------------------
  // Section visibility for animations
  // ---------------------------
  useEffect(() => {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        const idx = sectionsRef.current.indexOf(entry.target)
        if (entry.isIntersecting && idx >= 0) {
          setVisibleSections(prev => new Set(prev).add(idx))
        }
      })
    }, { threshold: 0.5 })

    sectionsRef.current.forEach(el => el && observer.observe(el))
    return () => observer.disconnect()
  }, [])

  // Flow step visibility
  useEffect(() => {
    const stepObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        const idx = stepsRef.current.indexOf(entry.target)
        if (idx >= 0 && entry.intersectionRatio >= 0.4) {
          setVisibleSteps(prev => new Set(prev).add(idx))
        }
      })
    }, { threshold: [0.4, 0.6] })

    stepsRef.current.forEach(el => el && stepObserver.observe(el))
    return () => stepObserver.disconnect()
  }, [])

  // Scroll lock after user scrolls further into Featured Auctions
  useEffect(() => {
    const featured = featuredRef.current
    if (!featured) return

    let hasEnteredFeatured = false

    const handleScroll = () => {
      const scrollY = window.scrollY
      const featuredTop = featured.offsetTop

      if (scrollY >= featuredTop) {
        hasEnteredFeatured = true
      }

      if (hasEnteredFeatured && scrollY < featuredTop) {
        window.scrollTo({ top: featuredTop, behavior: "instant" })
      }
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  // ---------------------------
  // FloatingShapes component
  // ---------------------------
  const FloatingShapes = ({ theme }) => {
    const colors = {
      orange: "from-orange-400/10 to-amber-400/10",
      yellow: "from-yellow-400/10 to-orange-300/10",
      beige: "from-amber-300/10 to-yellow-200/10",
      welcome: "from-red-400/10 to-orange-400/10",
    }

    return (
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute top-1/4 left-1/4 w-64 h-64 bg-gradient-to-br ${colors[theme]} rounded-full blur-3xl animate-float`} />
        <div className={`absolute top-1/2 right-1/4 w-96 h-96 bg-gradient-to-br ${colors[theme]} rounded-full blur-3xl animate-float-delayed`} />
        <div className={`absolute bottom-1/4 left-1/3 w-80 h-80 bg-gradient-to-br ${colors[theme]} rounded-full blur-3xl animate-float-slow`} />
      </div>
    )
  }

  // ---------------------------
  // RENDER
  // ---------------------------
  return (
    <div className="relative bg-gray-50 text-gray-800">
      <main>
        {/* Hero Section */}
        <section
          ref={(el) => (sectionsRef.current[0] = el)}
          className="relative flex flex-col items-center justify-center min-h-[100vh] overflow-hidden bg-gradient-to-b from-orange-100 via-yellow-50 to-amber-50"
        >
          <FloatingShapes theme="orange" />
          <div
            className={`relative z-10 px-6 text-center max-w-3xl transition-all duration-700 ${visibleSections.has(0)
                ? 'opacity-100 translate-y-0 scale-100'
                : 'opacity-0 translate-y-8 scale-95'
              }`}
          >
            <h1 className="text-7xl md:text-8xl font-bold mb-6 text-orange-900 font-serif">
              BidHub
            </h1>
            <p className="text-xl md:text-2xl text-gray-700 mb-8">
              Live auctions. Real-time bidding. Premium collectibles from anywhere.
            </p>
          </div>
        </section>

        {/* How It Works Section */}
        <section
          ref={(el) => (sectionsRef.current[1] = el)}
          className="relative flex flex-col items-center justify-center min-h-[180vh] overflow-hidden bg-gradient-to-b from-amber-50 via-yellow-100 to-orange-50"
        >
          <FloatingShapes theme="yellow" />
          <div
            className={`relative z-10 text-center px-6 max-w-4xl transition-all duration-700 ${visibleSections.has(1)
                ? 'opacity-100 translate-y-0 scale-100'
                : 'opacity-0 translate-y-8 scale-95'
              }`}
          >
            <h2 className="text-5xl md:text-6xl font-bold text-gray-800 mb-6">
              How It Works
            </h2>
            <p className="text-xl text-gray-600 mb-10">
              Follow these simple steps to start winning auctions
            </p>
          </div>
        </section>

        {/* Flow Steps Section */}
        <section
          ref={(el) => (sectionsRef.current[2] = el)}
          className="relative py-32 bg-gradient-to-b from-orange-50 via-amber-50 to-orange-100"
        >
          <FloatingShapes theme="beige" />
          <div className="relative z-10 max-w-6xl mx-auto space-y-16">
            {steps.map((s, i) => (
              <div key={i} ref={(el) => (stepsRef.current[i] = el)}>
                <FlowStep
                  icon={s.icon}
                  label={s.label}
                  description={s.description}
                  side={i % 2 === 0 ? 'left' : 'right'}
                  visible={visibleSteps.has(i)}
                />
              </div>
            ))}
          </div>
        </section>

        {/* Welcome Section */}
        <section
          ref={(el) => (sectionsRef.current[3] = el)}
          className="relative flex flex-col items-center justify-center min-h-[100vh] overflow-hidden bg-gradient-to-b from-orange-100 via-orange-50 to-[#fff5e1]"
        >
          <FloatingShapes theme="welcome" />
          <div
            className={`relative z-10 px-6 text-center max-w-3xl transition-all duration-700 ${visibleSections.has(3)
                ? 'opacity-100 translate-y-0 scale-100'
                : 'opacity-0 translate-y-8 scale-95'
              }`}
          >
            <h1 className="text-7xl md:text-8xl font-bold mb-6 text-orange-600 font-serif">
              Welcome!
            </h1>
            <p className="text-xl md:text-2xl text-gray-700 mb-8">
              Start bidding and winning.
            </p>
          </div>
        </section>


        {/* Featured Auctions Section */}
        <section ref={featuredRef} className="min-h-screen relative pt-10 bg-gradient-to-b from-[#fff5e1] to-[#ffefea]">
          <div className="max-w-7xl mx-auto pb-15 px-6">
            <div className="text-center mb-16">
              <h2 className="text-5xl md:text-6xl font-bold mb-6 text-gray-800">Featured Auctions</h2>
              <p className="text-lg text-gray-600">Discover our handpicked selection of premium items available now</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {isLoading
                ? Array.from({ length: 25 }).map((_, i) => <AuctionCardSkeleton key={i} />)
                : featuredAuctions.map((a, i) => (
                  <Link
                    key={i}
                    href={`/auction/${a.aid}`}
                    className="block transform transition-transform hover:scale-105 focus:scale-105 focus:outline-none focus:ring-4 focus:ring-orange-300 rounded-lg"
                  >
                    <AuctionCard {...a} />
                  </Link>
                ))
              }
            </div>
          </div>
        </section>
      </main>

      {/* Floating animation */}
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translate(0,0) scale(1); }
          33% { transform: translate(30px,-30px) scale(1.1); }
          66% { transform: translate(-20px,20px) scale(0.9); }
        }
        .animate-float { animation: float 20s ease-in-out infinite; }
        .animate-float-delayed { animation: float 25s ease-in-out infinite; animation-delay: -5s; }
        .animate-float-slow { animation: float 30s ease-in-out infinite; animation-delay: -10s; }
      `}</style>
    </div>
  )
}
