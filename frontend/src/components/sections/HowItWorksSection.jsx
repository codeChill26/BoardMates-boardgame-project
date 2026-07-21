function HowItWorksSection({ steps }) {
  return (
    <section className="section shell-gap">
      <div className="shell">
        <header className="center-header">
          <h2>How It Works</h2>
          <p>Simple steps to start trading board games</p>
        </header>

        <div className="steps-grid">
          {steps.map((step) => (
            <article key={step.step} className="step-card">
              <span className="step-index">{step.step}</span>
              <h3>{step.title}</h3>
              <p>{step.body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

export default HowItWorksSection
