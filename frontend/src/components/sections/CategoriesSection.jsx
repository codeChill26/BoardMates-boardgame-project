import SectionHeader from './SectionHeader'

function CategoriesSection({ categories }) {
  return (
    <section className="section shell-gap">
      <div className="shell">
        <SectionHeader
          title="Browse by Category"
          subtitle="Find your favorite type of game"
          actionLabel="View All"
        />

        <div className="category-grid">
          {categories.map((category) => (
            <article key={category.name} className={`category-card ${category.theme}`}>
              <div>
                <h3>{category.name}</h3>
                <p>{category.count} games</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

export default CategoriesSection
