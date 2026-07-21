import { ArrowIcon } from '../common/Icons'

function CtaSection() {
  return (
    <section className="section cta-wrap">
      <div className="shell">
        <div className="cta-panel">
          <h2>Ready to Join the Community?</h2>
          <p>
            Start buying, selling, and renting board games today. Connect with gamers
            across Vietnam.
          </p>
          <div className="cta-actions">
            <button type="button" className="primary-btn">
              Sign Up Free <ArrowIcon />
            </button>
            <button type="button" className="secondary-btn">
              Explore Games
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}

export default CtaSection
