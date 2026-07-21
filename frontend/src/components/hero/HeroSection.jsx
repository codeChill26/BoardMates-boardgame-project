import { ArrowIcon, SearchIcon } from '../common/Icons'

function HeroSection({ quickLinks }) {
  return (
    <section className="hero">
      <div className="hero-noise" aria-hidden="true" />
      <div className="shell hero-content">
        <p className="kicker">
          <span /> Vietnam&apos;s #1 Board Game Community
        </p>

        <h1>Buy, Sell & Bid on Board Games</h1>

        <p className="hero-lead">
          Join thousands of gamers across Vietnam. Find amazing deals, rent games,
          bid on rare finds, and grow your collection.
        </p>

        <form className="hero-search" onSubmit={(event) => event.preventDefault()}>
          <label htmlFor="search" className="visually-hidden">
            Search board games
          </label>
          <div className="search-input-wrap">
            <SearchIcon />
            <input
              id="search"
              type="text"
              placeholder="Search for board games (e.g., Catan, Wingspan)..."
            />
          </div>
          <button type="submit">Search</button>
        </form>

        <div className="hero-quick-links">
          {quickLinks.map((link) => (
            <button key={link} className="link-btn" type="button">
              {link}
              <ArrowIcon />
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}

export default HeroSection
