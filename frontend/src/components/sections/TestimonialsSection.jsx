import { PinIcon, StarIcon } from '../common/Icons'

function Stars() {
  return (
    <p className="stars" aria-label="five stars">
      {Array.from({ length: 5 }, (_, idx) => (
        <StarIcon key={idx} />
      ))}
    </p>
  )
}

function TestimonialsSection({ testimonials }) {
  return (
    <section className="section shell-gap">
      <div className="shell">
        <header className="center-header">
          <h2>What Gamers Say</h2>
          <p>Join our happy community of board game enthusiasts</p>
        </header>

        <div className="testimonial-grid">
          {testimonials.map((item) => (
            <article key={item.name} className="testimonial-card">
              <Stars />
              <blockquote>{item.quote}</blockquote>
              <footer>
                <strong>{item.name}</strong>
                <span>
                  <PinIcon /> {item.city}
                </span>
              </footer>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

export default TestimonialsSection
