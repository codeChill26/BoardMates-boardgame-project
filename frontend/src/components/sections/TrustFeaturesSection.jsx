function TrustFeaturesSection({ features }) {
  return (
    <section className="section trust-shell">
      <div className="shell">
        <div className="trust-grid">
          {features.map((feature) => (
            <article key={feature.title} className="trust-item">
              <span className="trust-icon" aria-hidden="true" />
              <div>
                <h4>{feature.title}</h4>
                <p>{feature.desc}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

export default TrustFeaturesSection
