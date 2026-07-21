import GameCard from '../cards/GameCard'

function MarketplaceGrid({ listings }) {
  return (
    <section className="market-grid">
      {listings.map((item) => (
        <GameCard key={`${item.title}-${item.owner}`} game={item} />
      ))}
    </section>
  )
}

export default MarketplaceGrid
