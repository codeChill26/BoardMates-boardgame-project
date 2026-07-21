function FilterGroup({ title, options }) {
  return (
    <article className="filter-group">
      <h4>{title}</h4>
      <div>
        {options.map((option) => (
          <label key={option}>
            <input type="checkbox" />
            <span>{option}</span>
          </label>
        ))}
      </div>
    </article>
  )
}

function MarketplaceFilters({ filters }) {
  return (
    <aside className="market-filters">
      <header>
        <h3>Filters</h3>
        <button type="button">Reset</button>
      </header>

      {filters.map((group) => (
        <FilterGroup key={group.title} title={group.title} options={group.options} />
      ))}
    </aside>
  )
}

export default MarketplaceFilters
