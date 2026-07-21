import { PinIcon, StarIcon, UserIcon } from '../common/Icons'

function Avatar({ name }) {
  const initials = name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)

  return <span className="avatar">{initials}</span>
}

function GameCard({ game }) {
  return (
    <article className="game-card">
      <div className={`game-cover ${game.theme}`}>
        <span className="pill">{game.type}</span>
        <span className="pill soft">{game.condition}</span>
        <span className="pill dark">{game.players} players</span>
      </div>

      <div className="game-body">
        <h3>{game.title}</h3>

        <p className="meta-line">
          <PinIcon />
          {game.location}
        </p>

        <div className="price-row">
          {game.buyPrice && (
            <div>
              <small>Buy</small>
              <strong>{game.buyPrice}</strong>
            </div>
          )}
          {game.rentPrice && (
            <div className="align-right">
              <small>Rent/day</small>
              <strong>{game.rentPrice}</strong>
            </div>
          )}
        </div>

        <div className="owner-row">
          <p>
            <Avatar name={game.owner} />
            <UserIcon />
            {game.owner}
          </p>
          <p>
            <StarIcon />
            {game.rating}
          </p>
        </div>

        <div className={`action-row actions-${game.actions.length}`}>
          {game.actions.map((action) => (
            <button key={action} className="primary-outline" type="button">
              {action}
            </button>
          ))}
        </div>
      </div>
    </article>
  )
}

export default GameCard
