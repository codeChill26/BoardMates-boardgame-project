'use client';

import React, { useState, useEffect } from 'react';
import ShopSidebar from '@/components/marketplace/ShopSidebar';
import ProductCard from '@/components/marketplace/ProductCard';
import AddBoardgameModal from '@/components/marketplace/AddBoardgameModal';
import { useAuthStore } from '@/hooks/useAuthStore';

const placeholderFilters = [
  {
    title: 'Category',
    options: [
      { name: 'Chiến thuật', count: 12 },
      { name: 'Gia đình', count: 25 },
      { name: 'Giải đố', count: 8 },
      { name: 'Nhập vai', count: 15 },
    ],
  },
];

const placeholderListings = [
  {
    id: 'mock-1',
    type: 'SELL',
    price: 450000,
    game: {
      name: 'Catan (Bản gốc)',
      imageUrl: 'https://images.unsplash.com/photo-1611996591259-77aed241c297?q=80&w=800&auto=format&fit=crop',
      minPlayers: 3,
      maxPlayers: 4
    },
    user: { username: 'Admin' }
  },
  {
    id: 'mock-2',
    type: 'RENT',
    rentPrice: 50000,
    game: {
      name: 'Monopoly Retro',
      imageUrl: 'https://images.unsplash.com/photo-1500048993953-d23a436266cf?q=80&w=800&auto=format&fit=crop',
      minPlayers: 2,
      maxPlayers: 6
    },
    user: { username: 'System' }
  },
  {
    id: 'mock-3',
    type: 'SELL',
    price: 1200000,
    game: {
      name: 'Gloomhaven',
      imageUrl: 'https://images.unsplash.com/photo-1610812384501-13551528437a?q=80&w=800&auto=format&fit=crop',
      minPlayers: 1,
      maxPlayers: 4
    },
    user: { username: 'Collector' }
  }
];

export default function MarketplacePage() {
  const { user } = useAuthStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [sortBy, setSortBy] = useState('Mới nhất');
  const [listings, setListings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchListings = async () => {
    try {
      const response = await fetch('http://localhost:8080/api/listings');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new TypeError("Oops, we haven't got JSON!");
      }

      const result = await response.json();
      if (result.success) {
        setListings(result.data);
      }
    } catch (error) {
      console.error('Error fetching listings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchListings();
  }, []);

  return (
    <main className="pt-28 pb-20 max-w-7xl mx-auto px-6 md:px-8">
      {/* Shop Header Section */}
      <header className="mb-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <span className="label-text text-primary font-bold uppercase tracking-[0.2em] text-xs mb-2 block tracking-widest">Bộ sưu tập 2024</span>
            <h1 className="text-5xl md:text-6xl font-headline italic text-on-surface">Cửa hàng</h1>
          </div>
          
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsModalOpen(true)}
              className={`font-label text-[10px] uppercase tracking-widest py-3 px-6 rounded-lg font-bold transition-all shadow-lg ${user ? 'bg-tertiary text-on-tertiary hover:translate-y-[-2px] shadow-tertiary/40 cursor-pointer' : 'bg-outline-variant/20 text-on-surface-variant opacity-50 cursor-not-allowed'}`}
              title={user ? 'Đăng tin mới' : 'Vui lòng đăng nhập để đăng tin'}
            >
              + Đăng trò chơi
            </button>

            <div className="flex items-center gap-3 bg-surface-container-low p-2 px-4 rounded-xl border border-outline-variant/10">
              <span className="label-text text-xs uppercase font-bold text-on-surface-variant">Sắp xếp:</span>
              <select 
                value={sortBy}
                disabled
                className="bg-transparent border-none focus:ring-0 text-sm font-body font-semibold text-on-surface-variant cursor-not-allowed p-0"
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option>Mới nhất</option>
              </select>
            </div>
          </div>
        </div>
      </header>

      {/* Main Layout with Sidebar */}
      <div className="flex flex-col lg:flex-row gap-12">
        {/* Filter Sidebar */}
        <ShopSidebar categories={placeholderFilters[0].options} />

        {/* Product Grid Area */}
        <div className="flex-1">
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-y-12 gap-x-8 animate-pulse">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="aspect-[3/4] bg-surface-container-high rounded-3xl" />
              ))}
            </div>
          ) : listings.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-y-12 gap-x-8">
              {listings.map((item) => (
                <ProductCard key={item.id} item={item} onRefresh={fetchListings} />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-y-12 gap-x-8">
              {placeholderListings.map((item) => (
                <ProductCard key={item.id} item={item} onRefresh={fetchListings} />
              ))}
            </div>
          )}

          {/* Pagination Placeholder */}
          <div className="mt-16 flex justify-center items-center gap-2 opacity-30 pointer-events-none">
            <button className="w-10 h-10 flex items-center justify-center rounded-lg border border-outline-variant text-on-surface">
              <span className="material-symbols-outlined">chevron_left</span>
            </button>
            <button className="w-10 h-10 flex items-center justify-center rounded-lg bg-outline-variant text-on-primary label-text font-bold">1</button>
            <button className="w-10 h-10 flex items-center justify-center rounded-lg border border-outline-variant text-on-surface">
              <span className="material-symbols-outlined">chevron_right</span>
            </button>
          </div>
        </div>
      </div>

      <AddBoardgameModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onAdded={fetchListings} 
      />
    </main>
  );
}
