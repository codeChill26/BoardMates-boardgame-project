import { ArrowIcon } from '../common/Icons'

function SectionHeader({ title, subtitle, actionLabel }) {
  return (
    <div className="section-header">
      <div>
        <h2>{title}</h2>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {actionLabel && (
        <button className="ghost-btn" type="button">
          {actionLabel}
          <ArrowIcon />
        </button>
      )}
    </div>
  )
}

export default SectionHeader
