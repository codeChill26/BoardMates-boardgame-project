import GameCard from '../cards/GameCard'
import SectionHeader from './SectionHeader'

function GameGridSection({ title, subtitle, actionLabel, games }) {
  return (
    <section className="section shell-gap">
      <div className="shell">
        <SectionHeader title={title} subtitle={subtitle} actionLabel={actionLabel} />
        <div className="game-grid">
          {games.map((game) => (
            <GameCard key={`${title}-${game.title}`} game={game} />
          ))}
        </div>
      </div>
    </section>
  )
}

export default GameGridSection
