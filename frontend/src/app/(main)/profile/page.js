'use client';

import React, { useEffect, useState } from 'react';
import { useAuthStore } from '@/hooks/useAuthStore';
import { useLanguageStore } from '@/hooks/useLanguageStore';
import { translations } from '@/data/translations';

const formatCurrency = (value, language) => {
  if (value == null || value === '') {
    return language === 'vi' ? 'Lien he' : 'Contact';
  }

  return `${Number(value).toLocaleString(language === 'vi' ? 'vi-VN' : 'en-US')}d`;
};

const formatDate = (value, language) => {
  if (!value) {
    return language === 'vi' ? 'Chua cap nhat' : 'Not available';
  }

  return new Date(value).toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-US');
};

const createProfileForm = (currentUser) => ({
  username: currentUser?.username || '',
  phone: currentUser?.phone || '',
  city: currentUser?.city || '',
  avatarUrl: currentUser?.avatarUrl || ''
});

const createListingForm = (item) => ({
  title: item?.game?.name || '',
  description: item?.description || item?.game?.description || '',
  minPlayers: item?.game?.minPlayers?.toString() || '',
  maxPlayers: item?.game?.maxPlayers?.toString() || '',
  priceSell: item?.price?.toString() || '',
  priceRent: item?.rentPrice?.toString() || '',
  imageUrl: item?.game?.imageUrl || '',
  condition: item?.condition || '',
  type: item?.type || 'SELL',
  status: item?.status || 'ACTIVE'
});

function EmptyState({ message }) {
  return (
    <div className="rounded-2xl border-2 border-dashed border-outline-variant/40 bg-surface-container-lowest px-6 py-12 text-center">
      <p className="font-body text-on-surface-variant">{message}</p>
    </div>
  );
}

function ProfileEditForm({
  form,
  onChange,
  onSubmit,
  onCancel,
  isSubmitting,
  language
}) {
  return (
    <form onSubmit={onSubmit} className="mt-8 w-full space-y-4 rounded-2xl border border-outline-variant/20 bg-surface-container-lowest p-5 text-left">
      <div>
        <label className="mb-2 block font-label text-[10px] font-bold uppercase tracking-widest text-outline">
          {language === 'vi' ? 'Ten hien thi' : 'Display name'}
        </label>
        <input
          className="w-full rounded-xl border border-outline-variant/30 bg-surface px-4 py-3 font-body outline-none focus:border-primary"
          name="username"
          value={form.username}
          onChange={onChange}
          required
        />
      </div>

      <div>
        <label className="mb-2 block font-label text-[10px] font-bold uppercase tracking-widest text-outline">
          {language === 'vi' ? 'So dien thoai' : 'Phone'}
        </label>
        <input
          className="w-full rounded-xl border border-outline-variant/30 bg-surface px-4 py-3 font-body outline-none focus:border-primary"
          name="phone"
          value={form.phone}
          onChange={onChange}
        />
      </div>

      <div>
        <label className="mb-2 block font-label text-[10px] font-bold uppercase tracking-widest text-outline">
          {language === 'vi' ? 'Thanh pho' : 'City'}
        </label>
        <input
          className="w-full rounded-xl border border-outline-variant/30 bg-surface px-4 py-3 font-body outline-none focus:border-primary"
          name="city"
          value={form.city}
          onChange={onChange}
        />
      </div>

      <div>
        <label className="mb-2 block font-label text-[10px] font-bold uppercase tracking-widest text-outline">
          {language === 'vi' ? 'Avatar URL' : 'Avatar URL'}
        </label>
        <input
          className="w-full rounded-xl border border-outline-variant/30 bg-surface px-4 py-3 font-body outline-none focus:border-primary"
          name="avatarUrl"
          value={form.avatarUrl}
          onChange={onChange}
        />
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 rounded-xl bg-primary px-4 py-3 font-label text-xs font-bold uppercase tracking-widest text-on-primary disabled:opacity-50"
        >
          {isSubmitting ? (language === 'vi' ? 'Dang luu...' : 'Saving...') : (language === 'vi' ? 'Luu profile' : 'Save profile')}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-xl border border-outline-variant/30 px-4 py-3 font-label text-xs font-bold uppercase tracking-widest text-on-surface"
        >
          {language === 'vi' ? 'Huy' : 'Cancel'}
        </button>
      </div>
    </form>
  );
}

function ListingEditForm({
  form,
  onChange,
  onSubmit,
  onCancel,
  isSubmitting,
  language
}) {
  return (
    <form onSubmit={onSubmit} className="mt-5 space-y-4 rounded-2xl border border-outline-variant/20 bg-surface-container-lowest p-5">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="md:col-span-2">
          <label className="mb-2 block font-label text-[10px] font-bold uppercase tracking-widest text-outline">
            {language === 'vi' ? 'Ten boardgame' : 'Board game title'}
          </label>
          <input
            className="w-full rounded-xl border border-outline-variant/30 bg-surface px-4 py-3 font-body outline-none focus:border-primary"
            name="title"
            value={form.title}
            onChange={onChange}
            required
          />
        </div>

        <div>
          <label className="mb-2 block font-label text-[10px] font-bold uppercase tracking-widest text-outline">
            {language === 'vi' ? 'So nguoi choi toi thieu' : 'Min players'}
          </label>
          <input
            className="w-full rounded-xl border border-outline-variant/30 bg-surface px-4 py-3 font-body outline-none focus:border-primary"
            name="minPlayers"
            type="number"
            min="1"
            value={form.minPlayers}
            onChange={onChange}
          />
        </div>

        <div>
          <label className="mb-2 block font-label text-[10px] font-bold uppercase tracking-widest text-outline">
            {language === 'vi' ? 'So nguoi choi toi da' : 'Max players'}
          </label>
          <input
            className="w-full rounded-xl border border-outline-variant/30 bg-surface px-4 py-3 font-body outline-none focus:border-primary"
            name="maxPlayers"
            type="number"
            min="1"
            value={form.maxPlayers}
            onChange={onChange}
          />
        </div>

        <div>
          <label className="mb-2 block font-label text-[10px] font-bold uppercase tracking-widest text-outline">
            {language === 'vi' ? 'Loai bai dang' : 'Listing type'}
          </label>
          <select
            className="w-full rounded-xl border border-outline-variant/30 bg-surface px-4 py-3 font-body outline-none focus:border-primary"
            name="type"
            value={form.type}
            onChange={onChange}
          >
            <option value="SELL">{language === 'vi' ? 'Ban' : 'Sell'}</option>
            <option value="RENT">{language === 'vi' ? 'Thue' : 'Rent'}</option>
            <option value="EXCHANGE">{language === 'vi' ? 'Trao doi' : 'Exchange'}</option>
          </select>
        </div>

        <div>
          <label className="mb-2 block font-label text-[10px] font-bold uppercase tracking-widest text-outline">
            {language === 'vi' ? 'Tinh trang' : 'Condition'}
          </label>
          <input
            className="w-full rounded-xl border border-outline-variant/30 bg-surface px-4 py-3 font-body outline-none focus:border-primary"
            name="condition"
            value={form.condition}
            onChange={onChange}
          />
        </div>

        <div>
          <label className="mb-2 block font-label text-[10px] font-bold uppercase tracking-widest text-outline">
            {language === 'vi' ? 'Gia ban' : 'Sell price'}
          </label>
          <input
            className="w-full rounded-xl border border-outline-variant/30 bg-surface px-4 py-3 font-body outline-none focus:border-primary"
            name="priceSell"
            type="number"
            min="0"
            value={form.priceSell}
            onChange={onChange}
          />
        </div>

        <div>
          <label className="mb-2 block font-label text-[10px] font-bold uppercase tracking-widest text-outline">
            {language === 'vi' ? 'Gia thue' : 'Rent price'}
          </label>
          <input
            className="w-full rounded-xl border border-outline-variant/30 bg-surface px-4 py-3 font-body outline-none focus:border-primary"
            name="priceRent"
            type="number"
            min="0"
            value={form.priceRent}
            onChange={onChange}
          />
        </div>

        <div className="md:col-span-2">
          <label className="mb-2 block font-label text-[10px] font-bold uppercase tracking-widest text-outline">
            {language === 'vi' ? 'Anh boardgame' : 'Board game image'}
          </label>
          <input
            className="w-full rounded-xl border border-outline-variant/30 bg-surface px-4 py-3 font-body outline-none focus:border-primary"
            name="imageUrl"
            value={form.imageUrl}
            onChange={onChange}
          />
        </div>

        <div className="md:col-span-2">
          <label className="mb-2 block font-label text-[10px] font-bold uppercase tracking-widest text-outline">
            {language === 'vi' ? 'Mo ta' : 'Description'}
          </label>
          <textarea
            className="min-h-30 w-full rounded-xl border border-outline-variant/30 bg-surface px-4 py-3 font-body outline-none focus:border-primary"
            name="description"
            value={form.description}
            onChange={onChange}
          />
        </div>
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 rounded-xl bg-primary px-4 py-3 font-label text-xs font-bold uppercase tracking-widest text-on-primary disabled:opacity-50"
        >
          {isSubmitting ? (language === 'vi' ? 'Dang luu...' : 'Saving...') : (language === 'vi' ? 'Luu boardgame' : 'Save board game')}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-xl border border-outline-variant/30 px-4 py-3 font-label text-xs font-bold uppercase tracking-widest text-on-surface"
        >
          {language === 'vi' ? 'Huy' : 'Cancel'}
        </button>
      </div>
    </form>
  );
}

function ListingCard({
  item,
  language,
  isEditing,
  onEdit,
  onCancel,
  onFormChange,
  onSubmit,
  editForm,
  isSubmitting
}) {
  const priceLabel =
    item.type === 'RENT'
      ? `${formatCurrency(item.rentPrice, language)}/${language === 'vi' ? 'ngay' : 'day'}`
      : formatCurrency(item.price, language);

  return (
    <article className="overflow-hidden rounded-2xl border border-outline-variant/20 bg-surface-container-low shadow-sm">
      <div className="aspect-16/10 overflow-hidden bg-surface-container-high">
        {item.game?.imageUrl ? (
          <img src={item.game.imageUrl} alt={item.game.name} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-outline">
            <span className="material-symbols-outlined text-5xl">image</span>
          </div>
        )}
      </div>

      <div className="space-y-3 p-5">
        <div className="flex items-center justify-between gap-3">
          <span className="rounded-full bg-primary/10 px-3 py-1 font-label text-[10px] font-bold uppercase tracking-widest text-primary">
            {item.type}
          </span>
          <span className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant">
            {formatDate(item.createdAt, language)}
          </span>
        </div>

        <div>
          <h3 className="font-headline text-2xl font-bold text-on-surface">
            {item.game?.name || (language === 'vi' ? 'Boardgame khong ten' : 'Untitled board game')}
          </h3>
          <p className="mt-2 line-clamp-2 font-body text-sm text-on-surface-variant">
            {item.description || item.game?.description || (language === 'vi' ? 'Khong co mo ta.' : 'No description available.')}
          </p>
        </div>

        <div className="flex items-center justify-between gap-3">
          <span className="font-headline text-lg font-bold text-primary">{priceLabel}</span>
          <span className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant">
            {item.game?.minPlayers ?? '?'}-{item.game?.maxPlayers ?? '?'} {language === 'vi' ? 'nguoi' : 'players'}
          </span>
        </div>

        <button
          type="button"
          onClick={isEditing ? onCancel : onEdit}
          className="w-full rounded-xl border border-outline-variant/30 px-4 py-3 font-label text-xs font-bold uppercase tracking-widest text-on-surface hover:border-primary hover:text-primary"
        >
          {isEditing ? (language === 'vi' ? 'Dong chinh sua' : 'Close editor') : (language === 'vi' ? 'Chinh sua boardgame' : 'Edit board game')}
        </button>

        {isEditing ? (
          <ListingEditForm
            form={editForm}
            onChange={onFormChange}
            onSubmit={onSubmit}
            onCancel={onCancel}
            isSubmitting={isSubmitting}
            language={language}
          />
        ) : null}
      </div>
    </article>
  );
}

function TransactionCard({ item, language, onDelete }) {
  const game = item.listing?.game;
  const seller = item.listing?.user;
  const sectionLabel =
    item.type === 'RENT'
      ? language === 'vi'
        ? 'Da thue'
        : 'Rented'
      : language === 'vi'
        ? 'Da mua'
        : 'Purchased';

  return (
    <article className="overflow-hidden rounded-2xl border border-outline-variant/20 bg-surface-container-low shadow-sm">
      <div className="aspect-16/10 overflow-hidden bg-surface-container-high">
        {game?.imageUrl ? (
          <img src={game.imageUrl} alt={game.name} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-outline">
            <span className="material-symbols-outlined text-5xl">stadia_controller</span>
          </div>
        )}
      </div>

      <div className="space-y-3 p-5">
        <div className="flex items-center justify-between gap-3">
          <span className="rounded-full bg-secondary-container px-3 py-1 font-label text-[10px] font-bold uppercase tracking-widest text-on-secondary-container">
            {sectionLabel}
          </span>
          <span className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant">
            {formatDate(item.createdAt, language)}
          </span>
        </div>

        <div>
          <h3 className="font-headline text-2xl font-bold text-on-surface">
            {game?.name || (language === 'vi' ? 'Boardgame khong ten' : 'Untitled board game')}
          </h3>
          <p className="mt-2 font-body text-sm text-on-surface-variant">
            {language === 'vi' ? 'Nguoi dang:' : 'Seller:'} {seller?.username || seller?.email || '-'}
          </p>
        </div>

        <div className="flex items-center justify-between gap-3">
          <span className="font-headline text-lg font-bold text-primary">
            {formatCurrency(item.totalPrice, language)}
          </span>
          <span className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant">
            {item.status}
          </span>
        </div>

        <button
          type="button"
          onClick={() => onDelete?.(item)}
          className="w-full rounded-xl border border-outline-variant/30 px-4 py-3 font-label text-xs font-bold uppercase tracking-widest text-on-surface hover:border-error hover:text-error"
        >
          {language === 'vi' ? 'Xóa khỏi lịch sử' : 'Delete from history'}
        </button>
      </div>
    </article>
  );
}

export default function ProfilePage() {
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
  const { language } = useLanguageStore();
  const t = translations[language].profile;
  const commonT = translations[language].auth;

  const [profileData, setProfileData] = useState(null);
  const [profileForm, setProfileForm] = useState(createProfileForm(null));
  const [editingProfile, setEditingProfile] = useState(false);
  const [editingListingId, setEditingListingId] = useState(null);
  const [listingForm, setListingForm] = useState(createListingForm(null));
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingListing, setIsSavingListing] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    const fetchProfileDashboard = async () => {
      if (!user?.token) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError('');

        const response = await fetch('http://localhost:8080/api/users/me/dashboard', {
          headers: {
            Authorization: `Bearer ${user.token}`
          }
        });

        const result = await response.json().catch(() => null);

        if (response.status === 401) {
          setUser(null);
          throw new Error(result?.message || 'Unauthorized');
        }

        if (!response.ok || !result?.success) {
          throw new Error(result?.message || 'Failed to load profile');
        }

        setProfileData(result.data);
        setProfileForm(createProfileForm(result.data.user));

        if (result?.data?.user) {
          setUser({
            ...(user || {}),
            ...result.data.user,
            token: user?.token,
          });
        }
      } catch (fetchError) {
        console.error('Error fetching profile dashboard:', fetchError);
        setError(language === 'vi' ? 'Khong the tai du lieu ho so.' : 'Unable to load profile data.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfileDashboard();
  }, [user?.token, language, setUser]);

  if (!user) {
    const loginPrompt = language === 'vi' ? 'Vui long dang nhap de xem thong tin ca nhan.' : 'Please login to view your profile.';
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="px-6 text-center font-body text-on-surface">{loginPrompt}</p>
      </div>
    );
  }

  const currentUser = profileData?.user || user;
  const myListings = profileData?.listings || [];
  const myTransactions = profileData?.transactions || [];
  const displayName = currentUser?.username || currentUser?.fullName || (currentUser?.email ? currentUser.email.split('@')[0] : 'User Name');

  const handleProfileChange = (event) => {
    const { name, value } = event.target;
    setProfileForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleListingFormChange = (event) => {
    const { name, value } = event.target;
    setListingForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleProfileSubmit = async (event) => {
    event.preventDefault();
    setIsSavingProfile(true);
    setError('');
    setSuccessMessage('');

    try {
      const response = await fetch('http://localhost:8080/api/users/me', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`
        },
        body: JSON.stringify(profileForm)
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Failed to update profile');
      }

      const nextUser = {
        ...user,
        id: result.data.id ?? user.id,
        username: result.data.username,
        email: result.data.email,
        phone: result.data.phone,
        city: result.data.city,
        avatarUrl: result.data.avatarUrl
      };

      setUser(nextUser);
      setProfileData((prev) => ({
        ...(prev || {}),
        user: result.data,
        listings: prev?.listings || [],
        transactions: prev?.transactions || []
      }));
      setProfileForm(createProfileForm(result.data));
      setEditingProfile(false);
      setSuccessMessage(language === 'vi' ? 'Da cap nhat profile.' : 'Profile updated.');
    } catch (submitError) {
      console.error('Error updating profile:', submitError);
      setError(language === 'vi' ? 'Cap nhat profile that bai.' : 'Failed to update profile.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const startEditingListing = (item) => {
    setEditingListingId(item.id);
    setListingForm(createListingForm(item));
    setSuccessMessage('');
    setError('');
  };

  const cancelEditingListing = () => {
    setEditingListingId(null);
    setListingForm(createListingForm(null));
  };

  const handleListingSubmit = async (event) => {
    event.preventDefault();
    if (!editingListingId) {
      return;
    }

    setIsSavingListing(true);
    setError('');
    setSuccessMessage('');

    try {
      const response = await fetch(`http://localhost:8080/api/listings/${editingListingId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`
        },
        body: JSON.stringify(listingForm)
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Failed to update listing');
      }

      setProfileData((prev) => ({
        ...prev,
        user: prev.user,
        transactions: prev.transactions || [],
        listings: (prev.listings || []).map((item) => (item.id === result.data.id ? result.data : item))
      }));
      setEditingListingId(null);
      setSuccessMessage(language === 'vi' ? 'Da cap nhat boardgame.' : 'Board game updated.');
    } catch (submitError) {
      console.error('Error updating listing:', submitError);
      setError(language === 'vi' ? 'Cap nhat boardgame that bai.' : 'Failed to update board game.');
    } finally {
      setIsSavingListing(false);
    }
  };

  const handleDeleteTransaction = async (transaction) => {
    if (!transaction?.id) return;
    const ok = confirm(language === 'vi' ? 'Xóa đơn này khỏi lịch sử? (Sẽ xóa trong database)' : 'Delete this order from history? (Will delete in database)');
    if (!ok) return;

    try {
      setError('');
      setSuccessMessage('');

      const response = await fetch(`http://localhost:8080/api/orders/${transaction.id}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        }
      );
      const result = await response.json().catch(() => null);
      if (!response.ok || !result?.success) {
        throw new Error(result?.message || `Delete failed (${response.status})`);
      }

      setProfileData((prev) => ({
        ...(prev || {}),
        user: prev?.user || currentUser,
        listings: prev?.listings || [],
        transactions: (prev?.transactions || []).filter((t) => t.id !== transaction.id),
      }));
      setSuccessMessage(language === 'vi' ? 'Đã xóa khỏi lịch sử.' : 'Deleted from history.');
    } catch (e) {
      console.error('Error deleting transaction:', e);
      const rawMessage = e?.message || '';
      const isNetwork = String(rawMessage).toLowerCase().includes('failed to fetch');
      if (isNetwork) {
        setError(
          language === 'vi'
            ? 'Không kết nối được backend (http://localhost:8080). Hãy chạy backend trước.'
            : 'Cannot reach backend (http://localhost:8080). Please start the backend first.'
        );
      } else {
        setError(rawMessage || (language === 'vi' ? 'Xóa lịch sử thất bại.' : 'Failed to delete history.'));
      }
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto max-w-7xl px-6 pb-16">
        <header className="mb-12">
          <p className="mb-2 font-label text-xs font-bold uppercase tracking-[0.2em] text-primary">
            {t.info}
          </p>
          <h1 className="font-headline text-5xl font-bold leading-tight tracking-tight text-on-surface md:text-6xl">
            {t.myProfile}
          </h1>
        </header>

        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12">
          <section className="flex flex-col gap-8 lg:col-span-4">
            <div className="relative overflow-hidden rounded-xl border border-outline-variant/10 bg-surface-container-low p-8 shadow-sm">
              <div className="absolute right-0 top-0 -mr-16 -mt-16 h-32 w-32 rounded-full bg-primary/5"></div>

              <div className="relative z-10 flex flex-col items-center text-center">
                <div className="mb-6 flex h-32 w-32 items-center justify-center overflow-hidden rounded-xl border-2 border-outline-variant/20 bg-surface-container-highest shadow-inner">
                  {currentUser?.avatarUrl ? (
                    <img src={currentUser.avatarUrl} alt={displayName} className="h-full w-full object-cover" />
                  ) : (
                    <span className="font-label text-lg font-bold uppercase tracking-widest text-outline">
                      {displayName.charAt(0)}
                    </span>
                  )}
                </div>

                <h2 className="mb-1 font-headline text-3xl font-bold text-on-surface">{displayName}</h2>
                <p className="mb-8 font-label text-sm font-bold tracking-wider text-primary">
                  {t.since} {currentUser?.createdAt ? new Date(currentUser.createdAt).getFullYear() : '2024'}
                </p>

                <div className="w-full space-y-4 text-left">
                  <div className="rounded-lg border border-outline-variant/10 bg-surface-container-lowest p-4">
                    <p className="mb-1 font-label text-[10px] font-bold uppercase tracking-widest text-outline">{commonT.email}</p>
                    <p className="truncate font-body font-semibold text-on-surface">{currentUser?.email || '-'}</p>
                  </div>
                  <div className="rounded-lg border border-outline-variant/10 bg-surface-container-lowest p-4">
                    <p className="mb-1 font-label text-[10px] font-bold uppercase tracking-widest text-outline">{t.phone}</p>
                    <p className="font-body font-semibold text-on-surface">{currentUser?.phone || '-'}</p>
                  </div>
                  <div className="rounded-lg border border-outline-variant/10 bg-surface-container-lowest p-4">
                    <p className="mb-1 font-label text-[10px] font-bold uppercase tracking-widest text-outline">{t.address}</p>
                    <p className="font-body font-semibold leading-relaxed text-on-surface">{currentUser?.city || '-'}</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setEditingProfile((prev) => !prev);
                    setProfileForm(createProfileForm(currentUser));
                    setSuccessMessage('');
                    setError('');
                  }}
                  className="mt-8 w-full rounded-xl bg-primary px-4 py-4 font-label text-sm font-bold uppercase tracking-widest text-on-primary"
                >
                  {editingProfile ? (language === 'vi' ? 'Dong chinh sua' : 'Close editor') : t.editProfile}
                </button>

                {editingProfile ? (
                  <ProfileEditForm
                    form={profileForm}
                    onChange={handleProfileChange}
                    onSubmit={handleProfileSubmit}
                    onCancel={() => {
                      setEditingProfile(false);
                      setProfileForm(createProfileForm(currentUser));
                    }}
                    isSubmitting={isSavingProfile}
                    language={language}
                  />
                ) : null}
              </div>
            </div>
          </section>

          <section className="space-y-16 lg:col-span-8">
            {isLoading ? (
              <div className="rounded-2xl border border-outline-variant/20 bg-surface-container-low p-8">
                <p className="font-body text-on-surface-variant">
                  {language === 'vi' ? 'Dang tai du lieu ho so...' : 'Loading profile data...'}
                </p>
              </div>
            ) : null}

            {error ? (
              <div className="rounded-2xl border border-error/20 bg-error/5 p-5">
                <p className="font-body text-error">{error}</p>
              </div>
            ) : null}

            {successMessage ? (
              <div className="rounded-2xl border border-secondary/20 bg-secondary-container/30 p-5">
                <p className="font-body text-on-secondary-container">{successMessage}</p>
              </div>
            ) : null}

            {!isLoading && !error ? (
              <>
                <div className="rounded-xl bg-surface">
                  <div className="mb-8">
                    <h3 className="font-headline text-3xl font-bold text-on-surface">
                      {language === 'vi' ? 'Boardgame da dang' : 'Posted board games'}
                    </h3>
                  </div>

                  {myListings.length > 0 ? (
                    <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                      {myListings.map((item) => (
                        <ListingCard
                          key={item.id}
                          item={item}
                          language={language}
                          isEditing={editingListingId === item.id}
                          onEdit={() => startEditingListing(item)}
                          onCancel={cancelEditingListing}
                          onFormChange={handleListingFormChange}
                          onSubmit={handleListingSubmit}
                          editForm={listingForm}
                          isSubmitting={isSavingListing}
                        />
                      ))}
                    </div>
                  ) : (
                    <EmptyState message={language === 'vi' ? 'Khong co game nao.' : 'No games found.'} />
                  )}
                </div>

                <div className="rounded-xl bg-surface">
                  <div className="mb-8">
                    <h3 className="font-headline text-3xl font-bold text-on-surface">
                      {language === 'vi' ? 'Boardgame da mua hoac thue' : 'Purchased or rented board games'}
                    </h3>
                  </div>

                  {myTransactions.length > 0 ? (
                    <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                      {myTransactions.map((item) => (
                        <TransactionCard
                          key={item.id}
                          item={item}
                          language={language}
                          onDelete={handleDeleteTransaction}
                        />
                      ))}
                    </div>
                  ) : (
                    <EmptyState message={language === 'vi' ? 'Khong co game nao.' : 'No games found.'} />
                  )}
                </div>
              </>
            ) : null}
          </section>
        </div>
      </main>
    </div>
  );
}
