import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Thailand with Tasha & Callum | December 2026',
  description: 'Two adventure trips in Thailand this December — climbing in Krabi and Chiang Mai with Tasha & Callum. Rock climbing, deep water soloing, jungle hiking, and temple culture.',
  openGraph: {
    title: 'Thailand with Tasha & Callum | December 2026',
    description: 'Climb limestone cliffs, deep water solo off Railay Beach, and explore Chiang Mai\'s jungle and temples. Two trips. One unforgettable December.',
    images: ['https://assets.tourhero.com/jb9yz0z4o6neo8fvnbpjuv83wsnz'],
  },
}

const TRIPS = [
  {
    id: 'krabi',
    name: 'CLIFF HANGERS',
    subtitle: 'Climbing in Krabi',
    dates: 'Dec 2 – 8, 2026',
    price: '$3,000',
    level: 'Strenuous',
    groupSize: 'Max 14',
    location: 'Krabi, Thailand',
    url: 'https://www.tourhero.com/en/epic-adventures/thailand/cliff-hangers-climbing-in-krabi-with-tasha-and-callum-419337939',
    heroImage: 'https://assets.tourhero.com/jb9yz0z4o6neo8fvnbpjuv83wsnz',
    tagline: 'Chalk on your hands. Salt in your hair. Limestone cliffs above the sea.',
    description: 'Seven days on the world-class climbing routes of Railay and Tonsai — walls that rise straight from turquoise water, accessible only by long-tail boat. The week builds to a full day of deep water soloing: climbing sea-facing cliffs and jumping into open ocean. For the climber chasing something legendary, or the adventurer ready to rope in for the first time.',
    highlights: [
      'Full day of limestone sport climbing at Tonsai Beach',
      'Iconic sea-facing routes at Railay Beach',
      'Deep water soloing on a private boat',
      'All technical gear provided — harness, rope, helmet',
      'Local English-speaking climbing guides',
      '6 nights accommodation in Ao Nang',
    ],
    included: 'Hotel · Daily breakfast · Lunches (days 2, 3, 5) · Farewell dinner · All guided climbing · Boat transfers · Airport transfers',
    comboDeal: true,
  },
  {
    id: 'chiangmai',
    name: 'THAI HARD',
    subtitle: 'Climb, Hike & Discover in Chiang Mai',
    dates: 'Dec 11 – 17, 2026',
    price: '$3,057',
    level: 'Moderate',
    groupSize: '12–16',
    location: 'Chiang Mai, Thailand',
    url: 'https://www.tourhero.com/en/epic-adventures/thailand/thai-hard-climb-hike-and-discover-with-tasha-callum-450399634',
    heroImage: 'https://assets.tourhero.com/zsrcjhs4rculuktczhco2gq6njw6',
    tagline: 'Limestone cliffs in the jungle. Ancient temples. Hidden waterfalls.',
    description: 'A week in Thailand\'s rugged north — climbing single and multi-pitch limestone routes in a forest and mountain setting, hiking through jungle to waterfalls, and exploring Chiang Mai\'s Old City, temples, and night markets. The pace is active but balanced, with space to wander. For adventurers who want to move hard and absorb deeply.',
    highlights: [
      'Full-day guided limestone climbing — single + optional multi-pitch',
      'Jungle hiking and waterfall swimming',
      'Guided Old City exploration — temples, markets, cafes',
      'Scenic countryside nature walk',
      'All climbing gear included',
      '6 nights 4★ accommodation in Chiang Mai',
    ],
    included: 'Hotel · Daily breakfast · Lunches (days 2, 3, 5) · Farewell dinner · All guided activities · Airport transfers',
    comboDeal: true,
  },
]

export default function TripsPage() {
  return (
    <main className="min-h-screen bg-white text-black font-light">

      {/* Hero */}
      <section className="relative h-[70vh] min-h-[500px] overflow-hidden">
        <img
          src="https://assets.tourhero.com/9lvovzkm6wotlveoqgn93kxct30o"
          alt="Climbing in Thailand"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/50" />
        <div className="relative z-10 h-full flex flex-col items-center justify-center text-white text-center px-6">
          <p className="text-xs tracking-[0.3em] uppercase mb-4 text-white/70">@fargonetour</p>
          <h1 className="text-4xl md:text-6xl font-light tracking-widest uppercase mb-4">
            Thailand<br />December 2026
          </h1>
          <p className="text-base md:text-lg text-white/80 max-w-xl tracking-wide">
            Two trips. Krabi then Chiang Mai.<br />
            Climbing, deep water soloing, jungle hiking, temple culture.
          </p>
          <div className="mt-8 flex flex-wrap gap-4 justify-center">
            {TRIPS.map(t => (
              <a key={t.id} href={`#${t.id}`}
                className="text-xs tracking-widest uppercase border border-white/60 px-6 py-3 hover:bg-white hover:text-black transition-colors">
                {t.name}
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Combo Banner */}
      <section className="bg-black text-white py-6 px-6 text-center">
        <p className="text-xs tracking-[0.25em] uppercase text-white/60 mb-1">Dec 2–17 · 16 Days</p>
        <p className="text-sm tracking-wider">
          Do both trips back-to-back — a full two weeks in Thailand for{' '}
          <span className="font-medium">$6,057</span>.
          Book each separately on TourHero.
        </p>
      </section>

      {/* Trips */}
      {TRIPS.map((trip, idx) => (
        <section key={trip.id} id={trip.id} className="py-20 px-6 max-w-5xl mx-auto">
          <div className={`grid md:grid-cols-2 gap-12 items-start ${idx === 1 ? 'md:grid-flow-dense' : ''}`}>

            {/* Image */}
            <div className={`relative ${idx === 1 ? 'md:col-start-2' : ''}`}>
              <img src={trip.heroImage} alt={trip.name} className="w-full aspect-[4/5] object-cover" />
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-6">
                <p className="text-white text-xs tracking-widest uppercase">{trip.dates}</p>
                <p className="text-white/80 text-xs mt-0.5">{trip.location} · {trip.level} · {trip.groupSize} people</p>
              </div>
            </div>

            {/* Content */}
            <div className={idx === 1 ? 'md:col-start-1 md:row-start-1' : ''}>
              <p className="text-xs tracking-[0.3em] uppercase text-neutral-400 mb-2">{trip.subtitle}</p>
              <h2 className="text-3xl md:text-4xl font-light tracking-widest uppercase mb-4">{trip.name}</h2>
              <p className="text-base italic text-neutral-500 mb-6 leading-relaxed">{trip.tagline}</p>
              <p className="text-sm text-neutral-600 leading-relaxed mb-8">{trip.description}</p>

              <ul className="space-y-2 mb-8">
                {trip.highlights.map(h => (
                  <li key={h} className="flex items-start gap-3 text-sm text-neutral-700">
                    <span className="text-neutral-300 mt-0.5 flex-shrink-0">—</span>
                    {h}
                  </li>
                ))}
              </ul>

              <div className="border-t border-neutral-100 pt-6 mb-8">
                <p className="text-[10px] tracking-widest uppercase text-neutral-400 mb-1">Included</p>
                <p className="text-xs text-neutral-500 leading-relaxed">{trip.included}</p>
              </div>

              <div className="flex items-center justify-between mb-6">
                <div>
                  <p className="text-[10px] tracking-widest uppercase text-neutral-400">Price</p>
                  <p className="text-2xl font-light">{trip.price} <span className="text-sm text-neutral-400">/ person</span></p>
                  <p className="text-[10px] text-neutral-400 mt-0.5">Pay later with Affirm or Klarna</p>
                </div>
              </div>

              <a href={trip.url} target="_blank" rel="noopener noreferrer"
                className="inline-block bg-black text-white text-xs tracking-widest uppercase px-8 py-4 hover:bg-neutral-800 transition-colors w-full text-center">
                Reserve Your Spot on TourHero
              </a>
            </div>
          </div>
        </section>
      ))}

      {/* About section */}
      <section className="bg-neutral-50 py-20 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-xs tracking-[0.3em] uppercase text-neutral-400 mb-6">Your Hosts</p>
          <h2 className="text-2xl font-light tracking-widest uppercase mb-6">Tasha & Callum</h2>
          <p className="text-sm text-neutral-600 leading-relaxed mb-4">
            We've been climbing and traveling together for several years, drawn to the way climbing builds connection — between people, places, and stories. What began as shared days at our local gym has grown into a deep love for exploring the world through climbing.
          </p>
          <p className="text-sm text-neutral-600 leading-relaxed mb-8">
            We're passionate about creating welcoming, thoughtful spaces for climbers who value community as much as movement. Whether on the wall or around a shared meal, we believe the best trips are shaped by the people you climb with.
          </p>
          <div className="flex items-center justify-center gap-6">
            <a href="https://tiktok.com/@fargonetour" target="_blank" rel="noopener noreferrer"
              className="text-xs tracking-widest uppercase border border-neutral-300 px-5 py-2.5 hover:border-black transition-colors">
              @fargonetour on TikTok
            </a>
            <a href="https://instagram.com/climberstories" target="_blank" rel="noopener noreferrer"
              className="text-xs tracking-widest uppercase border border-neutral-300 px-5 py-2.5 hover:border-black transition-colors">
              @climberstories
            </a>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 px-6 text-center">
        <p className="text-xs tracking-[0.3em] uppercase text-neutral-400 mb-4">December 2026 · Thailand</p>
        <h2 className="text-2xl md:text-3xl font-light tracking-widest uppercase mb-8">
          Two trips.<br />One unforgettable December.
        </h2>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a href={TRIPS[0].url} target="_blank" rel="noopener noreferrer"
            className="text-xs tracking-widest uppercase bg-black text-white px-8 py-4 hover:bg-neutral-800 transition-colors">
            Book Krabi — Dec 2–8
          </a>
          <a href={TRIPS[1].url} target="_blank" rel="noopener noreferrer"
            className="text-xs tracking-widest uppercase border border-black px-8 py-4 hover:bg-black hover:text-white transition-colors">
            Book Chiang Mai — Dec 11–17
          </a>
        </div>
        <p className="text-xs text-neutral-400 mt-6">Questions? Follow <a href="https://tiktok.com/@fargonetour" target="_blank" rel="noopener noreferrer" className="underline">@fargonetour</a> on TikTok</p>
      </section>

    </main>
  )
}
