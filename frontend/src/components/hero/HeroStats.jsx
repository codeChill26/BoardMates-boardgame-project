function HeroStats({ stats }) {
  return (
    <section className="hero-stats-wrap">
      <div className="shell">
        <div className="hero-stats">
          {stats.map((item) => (
            <article key={item.label}>
              <strong>{item.value}</strong>
              <p>{item.label}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

export default HeroStats
