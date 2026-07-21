function MarketplaceToolbar() {
  return (
    <header className="market-toolbar">
      <p>
        Showing <strong>6</strong> listings
      </p>

      <div>
        <label htmlFor="sort">Sort by</label>
        <select id="sort" defaultValue="newest">
          <option value="newest">Newest</option>
          <option value="price-low">Price: Low to High</option>
          <option value="price-high">Price: High to Low</option>
          <option value="rating">Top Rated</option>
        </select>
      </div>
    </header>
  )
}

export default MarketplaceToolbar
