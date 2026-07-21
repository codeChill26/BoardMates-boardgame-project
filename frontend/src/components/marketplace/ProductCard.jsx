import React from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/hooks/useAuthStore';

function ProductCard({ item, onRefresh }) {
  const { user } = useAuthStore();
  const router = useRouter();
  const isOwner = user && item.userId === user.id;

  const canOrder = user && !isOwner && Number.isFinite(Number(item.id));
  const canChat = user && !isOwner && Number.isFinite(Number(item.userId));

  const handleCreateOrder = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!canOrder) return;

    try {
      const response = await fetch('http://localhost:8080/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify({
          listingId: Number(item.id),
          type: item.type,
        }),
      });

      const result = await response.json().catch(() => null);
      if (!response.ok || !result?.success) {
        throw new Error(result?.message || 'Không thể tạo giao dịch');
      }

      alert('Đã tạo giao dịch (PENDING). Seller sẽ nhận thông báo realtime.');
      onRefresh?.();
    } catch (error) {
      console.error('Error creating order:', error);
      alert(error?.message || 'Lỗi khi tạo giao dịch');
    }
  };

  const handleViewDetails = (e) => {
    e?.preventDefault?.();
    e?.stopPropagation?.();
    if (!Number.isFinite(Number(item?.id))) return;
    router.push(`/marketplace/${item.id}`);
  };

  const handleChat = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!canChat) return;
    router.push(`/chat?toUserId=${item.userId}&listingId=${item.id}`);
  };

  const handleDelete = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!confirm('Bạn có chắc chắn muốn xóa tin đăng này?')) return;

    try {
      const response = await fetch(`http://localhost:8080/api/listings/${item.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${user.token}`
        }
      });
      const result = await response.json();
      if (result.success) {
        onRefresh();
      } else {
        alert(result.message);
      }
    } catch (error) {
      console.error('Error deleting listing:', error);
      alert('Lỗi khi xóa tin');
    }
  };

  if (!item || !item.game) {
    return (
      <div className="group opacity-80 animate-pulse">
        <div className="relative aspect-4/5 overflow-hidden rounded-xl bg-surface-container-high mb-5" />
        <div className="space-y-3">
          <div className="h-6 w-3/4 bg-surface-container-highest rounded" />
          <div className="h-4 w-1/2 bg-surface-container-highest rounded" />
        </div>
      </div>
    );
  }

  const { game, price, rentPrice, type } = item;

  return (
    <div className="group cursor-pointer" onClick={handleViewDetails} role="button" tabIndex={0} onKeyDown={(e) => {
      if (e.key === 'Enter' || e.key === ' ') handleViewDetails(e);
    }}>
      <div className="relative aspect-4/5 overflow-hidden rounded-3xl bg-surface-container-low mb-5 window-shadow hover:-translate-y-2 transition-all duration-500">
        {game.imageUrl ? (
          <img 
            src={game.imageUrl} 
            alt={game.name} 
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-outline-variant bg-surface-container-high">
            <span className="material-symbols-outlined text-5xl">image</span>
          </div>
        )}
        
        {/* Type Badge */}
        <div className="absolute top-4 left-4 bg-surface/80 backdrop-blur-md px-3 py-1 rounded-full border border-outline/20">
          <span className="font-label text-[10px] font-bold uppercase tracking-widest text-primary">
            {type === 'SELL' ? 'Bán' : 'Cho thuê'}
          </span>
        </div>

        {/* Owner Actions */}
        {isOwner && (
          <div className="absolute top-4 right-4 flex gap-2">
            <button 
              onClick={handleDelete}
              className="w-8 h-8 rounded-full bg-error/10 backdrop-blur-md text-error flex items-center justify-center hover:bg-error hover:text-on-error transition-all"
              title="Xóa tin"
            >
              <span className="material-symbols-outlined text-sm">delete</span>
            </button>
          </div>
        )}

        <div className="absolute inset-0 bg-linear-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-6">
          <div className="w-full grid grid-cols-1 gap-2">
            <button
              type="button"
              onClick={handleViewDetails}
              className="w-full bg-primary text-on-primary font-label text-[10px] uppercase tracking-widest py-3 rounded-xl font-bold shadow-xl shadow-primary/30"
            >
              Xem chi tiết
            </button>

            {!isOwner && user ? (
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handleCreateOrder}
                  disabled={!canOrder}
                  className="w-full bg-surface/90 text-on-surface font-label text-[10px] uppercase tracking-widest py-3 rounded-xl font-bold border border-outline/30 disabled:opacity-50"
                >
                  {type === 'SELL' ? 'Mua' : 'Thuê'}
                </button>
                <button
                  type="button"
                  onClick={handleChat}
                  disabled={!canChat}
                  className="w-full bg-surface/90 text-on-surface font-label text-[10px] uppercase tracking-widest py-3 rounded-xl font-bold border border-outline/30 disabled:opacity-50"
                >
                  Chat
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <div className="space-y-2 px-1">
        <div className="flex justify-between items-start gap-4">
          <h3 className="text-xl font-headline text-on-surface font-bold leading-tight group-hover:text-primary transition-colors">
            {game.name}
          </h3>
        </div>
        
        <div className="flex items-center gap-4 text-on-surface-variant/60 font-label text-[10px] uppercase tracking-widest">
           <span>{game.minPlayers}-{game.maxPlayers} NGƯỜI</span>
           <span className="w-1 h-1 bg-outline-variant/30 rounded-full"></span>
           <span>{item.user?.username || 'Member'}</span>
        </div>

        <div className="pt-2 flex items-baseline gap-2">
          <span className="text-lg font-headline font-bold text-primary">
            {price ? `${price.toLocaleString('vi-VN')}đ` : rentPrice ? `${rentPrice.toLocaleString('vi-VN')}đ/ngày` : 'Liên hệ'}
          </span>
        </div>
      </div>
    </div>
  );
}

export default ProductCard;
