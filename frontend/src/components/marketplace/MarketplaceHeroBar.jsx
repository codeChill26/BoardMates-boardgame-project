import { SearchIcon } from '../common/Icons'

function MarketplaceHeroBar({ chips, onPostClick }) {
  return (
    <section className="market-hero">
      <div className="shell market-hero-inner">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <p className="market-kicker">Marketplace</p>
            <h1>Discover Great Deals from the Community</h1>
            <p>
              Browse listings, compare prices, and connect with trusted board game
              sellers across Vietnam.
            </p>
          </div>
          <button
            type="button"
            onClick={onPostClick}
            className="bg-tertiary text-on-tertiary hover:bg-tertiary-fixed-dim transition-colors px-5 py-2.5 rounded-lg font-bold whitespace-nowrap cursor-pointer"
          >
            Post your Boardgame
          </button>
        </div>

        <form className="market-search" onSubmit={(event) => event.preventDefault()}>
          <label htmlFor="market-search" className="visually-hidden">
            Search marketplace
          </label>
          <SearchIcon />
          <input id="market-search" placeholder="Search game, city, seller..." />
          <button type="submit">Find</button>
        </form>

        <div className="market-chips">
          {chips.map((chip, index) => (
            <button key={chip} type="button" className={index === 0 ? 'active' : ''}>
              {chip}
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}

export default MarketplaceHeroBar
