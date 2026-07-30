import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLanguageStore } from '@/hooks/useLanguageStore';
import { useAuthStore } from '@/hooks/useAuthStore';
import { translations } from '@/data/translations';

const CATEGORY_OPTIONS = [
  { value: 'Strategy', vi: 'Chiến thuật', en: 'Strategy' },
  { value: 'Family', vi: 'Gia đình', en: 'Family' },
  { value: 'Party', vi: 'Party', en: 'Party' },
  { value: 'Cooperative', vi: 'Hợp tác', en: 'Cooperative' },
  { value: 'Card', vi: 'Thẻ bài', en: 'Card' },
  { value: 'Puzzle', vi: 'Giải đố', en: 'Puzzle' },
  { value: 'Roleplaying', vi: 'Nhập vai', en: 'Roleplaying' },
];

const AddBoardgameModal = ({ isOpen, onClose, onAdded }) => {
  const { language } = useLanguageStore();
  const { user } = useAuthStore();
  const t = translations[language].modal;
  const [formData, setFormData] = useState({
    title: '',
    minPlayers: '',
    maxPlayers: '',
    categories: [],
    description: '',
    priceSell: '',
    priceRent: '',
    condition: 'Mới 100%',
    type: 'SELL',
  });

  const [imageFile, setImageFile] = useState(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState('');

  const [categoryOpen, setCategoryOpen] = useState(false);
  const [categoryQuery, setCategoryQuery] = useState('');
  const categoryRef = useRef(null);

  const categoryOptions = useMemo(() => {
    const q = categoryQuery.trim().toLowerCase();
    if (!q) return CATEGORY_OPTIONS;
    return CATEGORY_OPTIONS.filter((opt) => {
      const label = (language === 'vi' ? opt.vi : opt.en).toLowerCase();
      return label.includes(q) || opt.value.toLowerCase().includes(q);
    });
  }, [categoryQuery, language]);

  const getCategoryLabel = (value) => {
    const found = CATEGORY_OPTIONS.find((o) => o.value === value);
    if (!found) return value;
    return language === 'vi' ? found.vi : found.en;
  };

  useEffect(() => {
    const onClickOutside = (event) => {
      if (!categoryRef.current) return;
      if (!categoryRef.current.contains(event.target)) {
        setCategoryOpen(false);
      }
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  useEffect(() => {
    return () => {
      if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
    };
  }, [imagePreviewUrl]);

  const formatPrice = (value) => {
    if (!value) return '';
    // Remove all non-digits
    const number = value.toString().replace(/\D/g, '');
    // Add dots every 3 digits
    return number.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  };

  const unformatPrice = (value) => {
    return value.toString().replace(/\./g, '');
  };

  const handlePriceChange = (field, value) => {
    const unformatted = unformatPrice(value);
    setFormData({ ...formData, [field]: unformatted });
  };

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user || !user.token) {
      alert('Vui lòng đăng nhập để thực hiện tính năng này!');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const listingType = formData.type === 'BOTH' ? 'SELL' : formData.type;

      const payload = new FormData();
      payload.append('title', formData.title);
      payload.append('description', formData.description || '');
      payload.append('minPlayers', formData.minPlayers);
      payload.append('maxPlayers', formData.maxPlayers);
      payload.append('priceSell', formData.priceSell ? String(parseFloat(formData.priceSell)) : '');
      payload.append('priceRent', formData.priceRent ? String(parseFloat(formData.priceRent)) : '');
      payload.append('condition', formData.condition || '');
      payload.append('type', listingType);
      payload.append('categories', JSON.stringify(formData.categories || []));
      if (imageFile) payload.append('image', imageFile);

      const response = await fetch('http://localhost:8080/api/listings', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
        body: payload,
      });

      const result = await response.json();
      
      if (result.success) {
        onAdded();
        onClose();
        setFormData({
          title: '',
          minPlayers: '',
          maxPlayers: '',
          categories: [],
          description: '',
          priceSell: '',
          priceRent: '',
          condition: 'Mới 100%',
          type: 'SELL',
        });
        setImageFile(null);
        setImagePreviewUrl('');
      } else {
        alert(result.message || 'Lỗi khi đăng tin');
      }
    } catch (error) {
      console.error('Error submitting listing:', error);
      alert('Không thể kết nối đến server');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4 md:p-6 bg-black/40 backdrop-blur-sm overflow-y-auto">
      <div className="bg-surface-container-low w-full max-w-2xl window-border window-shadow animate-in fade-in zoom-in duration-300 my-auto">
        {/* Title Bar */}
        <div className="retro-title-bar bg-tertiary text-on-tertiary px-4 py-2 flex justify-between items-center sticky top-0 z-10">
          <span className="font-label text-xs font-bold uppercase tracking-widest leading-none">add_new_archive.exe</span>
          <button onClick={onClose} className="material-symbols-outlined text-sm hover:opacity-70 transition-opacity cursor-pointer leading-none">close</button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-6">
          <div className="space-y-2">
            <h2 className="text-3xl font-headline font-bold text-on-surface">{t.addNew}</h2>
            <p className="text-xs font-body text-on-surface-variant opacity-60 uppercase tracking-widest">v.1.0-beta.market</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Title */}
            <div className="space-y-2 md:col-span-2">
              <label className="font-label text-[10px] uppercase font-bold tracking-widest text-on-surface-variant">{t.title}</label>
              <input 
                required
                className="w-full bg-surface-container-lowest border-2 border-outline-variant p-3 focus:border-primary outline-none transition-colors font-body"
                type="text"
                placeholder="Ex: Catan, Monopoly..."
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
              />
            </div>

            {/* Min Players */}
            <div className="space-y-2">
              <label className="font-label text-[10px] uppercase font-bold tracking-widest text-on-surface-variant">
                {language === 'vi' ? 'Số người chơi tối thiểu' : 'Min players'}
              </label>
              <input
                required
                className="w-full bg-surface-container-lowest border-2 border-outline-variant p-3 focus:border-primary outline-none transition-colors font-body"
                type="number"
                min={1}
                placeholder="1"
                value={formData.minPlayers}
                onChange={(e) => setFormData({ ...formData, minPlayers: e.target.value })}
              />
            </div>

            {/* Max Players */}
            <div className="space-y-2">
              <label className="font-label text-[10px] uppercase font-bold tracking-widest text-on-surface-variant">
                {language === 'vi' ? 'Số người chơi tối đa' : 'Max players'}
              </label>
              <input
                required
                className="w-full bg-surface-container-lowest border-2 border-outline-variant p-3 focus:border-primary outline-none transition-colors font-body"
                type="number"
                min={1}
                placeholder="4"
                value={formData.maxPlayers}
                onChange={(e) => setFormData({ ...formData, maxPlayers: e.target.value })}
              />
            </div>

            {/* Categories (searchable multi-select dropdown) */}
            <div className="space-y-2 md:col-span-2" ref={categoryRef}>
              <label className="font-label text-[10px] uppercase font-bold tracking-widest text-on-surface-variant">{t.gameplay}</label>

              <button
                type="button"
                onClick={() => setCategoryOpen((v) => !v)}
                className="w-full bg-surface-container-lowest border-2 border-outline-variant p-3 focus:border-primary outline-none transition-colors font-body text-left flex items-center justify-between"
              >
                <span className="text-on-surface-variant">
                  {formData.categories?.length
                    ? language === 'vi'
                      ? `Đã chọn: ${formData.categories.length}`
                      : `Selected: ${formData.categories.length}`
                    : language === 'vi'
                      ? 'Chọn thể loại'
                      : 'Select categories'}
                </span>
                <span className="material-symbols-outlined text-base text-on-surface-variant">
                  {categoryOpen ? 'expand_less' : 'expand_more'}
                </span>
              </button>

              {formData.categories?.length ? (
                <div className="flex flex-wrap gap-2">
                  {formData.categories.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => {
                        setFormData((prev) => ({
                          ...prev,
                          categories: (prev.categories || []).filter((x) => x !== c),
                        }));
                      }}
                      className="inline-flex items-center gap-2 rounded-full border border-outline-variant/30 bg-surface-container-low px-3 py-1 font-label text-[10px] font-bold uppercase tracking-widest text-on-surface hover:border-error hover:text-error"
                      title={language === 'vi' ? 'Bỏ chọn' : 'Remove'}
                    >
                      {getCategoryLabel(c)}
                      <span className="material-symbols-outlined text-sm">close</span>
                    </button>
                  ))}
                </div>
              ) : null}

              {categoryOpen ? (
                <div className="mt-2 rounded-xl border border-outline-variant/20 bg-surface overflow-hidden">
                  <div className="p-3 border-b border-outline-variant/10">
                    <input
                      value={categoryQuery}
                      onChange={(e) => setCategoryQuery(e.target.value)}
                      className="w-full rounded-xl border border-outline-variant/30 bg-surface-container-lowest px-4 py-3 font-body outline-none focus:border-primary"
                      placeholder={language === 'vi' ? 'Nhập để tìm thể loại...' : 'Type to search...'}
                    />
                  </div>

                  <div className="max-h-64 overflow-auto">
                    {categoryOptions.length === 0 ? (
                      <div className="px-4 py-4 font-body text-sm text-on-surface-variant">
                        {language === 'vi' ? 'Không có kết quả.' : 'No results.'}
                      </div>
                    ) : (
                      categoryOptions.map((opt) => {
                        const selected = (formData.categories || []).includes(opt.value);
                        return (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => {
                              setFormData((prev) => {
                                const current = prev.categories || [];
                                const next = current.includes(opt.value)
                                  ? current.filter((x) => x !== opt.value)
                                  : [...current, opt.value];
                                return { ...prev, categories: next };
                              });
                            }}
                            className="w-full px-4 py-3 flex items-center justify-between hover:bg-surface-container-high text-left"
                          >
                            <span className="font-body text-sm text-on-surface">{language === 'vi' ? opt.vi : opt.en}</span>
                            <span className={`material-symbols-outlined text-base ${selected ? 'text-primary' : 'text-outline-variant'}`}>
                              {selected ? 'check_box' : 'check_box_outline_blank'}
                            </span>
                          </button>
                        );
                      })
                    )}
                  </div>

                  <div className="p-3 border-t border-outline-variant/10 flex justify-end">
                    <button
                      type="button"
                      onClick={() => setCategoryOpen(false)}
                      className="rounded-xl border border-outline-variant/30 px-4 py-2 font-label text-[10px] font-bold uppercase tracking-widest text-on-surface"
                    >
                      {language === 'vi' ? 'Xong' : 'Done'}
                    </button>
                  </div>
                </div>
              ) : null}
            </div>

            {/* Description */}
            <div className="space-y-2 md:col-span-2">
              <label className="font-label text-[10px] uppercase font-bold tracking-widest text-on-surface-variant">{t.description}</label>
              <textarea 
                className="w-full bg-surface-container-lowest border-2 border-outline-variant p-3 focus:border-primary outline-none transition-colors font-body min-h-25"
                placeholder="..."
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
              />
            </div>

            {/* Listing Type */}
            <div className="space-y-2">
              <label className="font-label text-[10px] uppercase font-bold tracking-widest text-on-surface-variant">{t.type}</label>
              <select 
                className="w-full bg-surface-container-lowest border-2 border-outline-variant p-3 focus:border-primary outline-none transition-colors font-body"
                value={formData.type}
                onChange={(e) => setFormData({...formData, type: e.target.value})}
              >
                <option value="SELL">{language === 'vi' ? 'Bán' : 'Sell'}</option>
                <option value="RENT">{language === 'vi' ? 'Cho thuê' : 'Rent'}</option>
                <option value="BOTH">{language === 'vi' ? 'Cả 2' : 'Both'}</option>
              </select>
            </div>

            {/* Condition */}
            <div className="space-y-2">
              <label className="font-label text-[10px] uppercase font-bold tracking-widest text-on-surface-variant">{t.condition}</label>
              <input 
                className="w-full bg-surface-container-lowest border-2 border-outline-variant p-3 focus:border-primary outline-none transition-colors font-body"
                type="text"
                placeholder="Ex: Mới 99%, Fullbox..."
                value={formData.condition}
                onChange={(e) => setFormData({...formData, condition: e.target.value})}
              />
            </div>

            {/* Price Sell */}
            <div className={`space-y-2 ${formData.type === 'RENT' ? 'opacity-30 pointer-events-none' : ''}`}>
              <label className="font-label text-[10px] uppercase font-bold tracking-widest text-on-surface-variant">{t.priceSell} (VND)</label>
              <input 
                className="w-full bg-surface-container-lowest border-2 border-outline-variant p-3 focus:border-primary outline-none transition-colors font-body"
                type="text"
                placeholder="0"
                value={formatPrice(formData.priceSell)}
                onChange={(e) => handlePriceChange('priceSell', e.target.value)}
              />
            </div>

            {/* Price Rent */}
            <div className={`space-y-2 ${formData.type === 'SELL' ? 'opacity-30 pointer-events-none' : ''}`}>
              <label className="font-label text-[10px] uppercase font-bold tracking-widest text-on-surface-variant">{t.priceRent} (VND)</label>
              <input 
                className="w-full bg-surface-container-lowest border-2 border-outline-variant p-3 focus:border-primary outline-none transition-colors font-body"
                type="text"
                placeholder="0"
                value={formatPrice(formData.priceRent)}
                onChange={(e) => handlePriceChange('priceRent', e.target.value)}
              />
            </div>

            {/* Image Upload */}
            <div className="space-y-2 md:col-span-2">
              <label className="font-label text-[10px] uppercase font-bold tracking-widest text-on-surface-variant">{t.imageUrl}</label>
              <input
                className="w-full bg-surface-container-lowest border-2 border-outline-variant p-3 focus:border-primary outline-none transition-colors font-body"
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0] || null;
                  setImageFile(file);
                  if (file) {
                    const url = URL.createObjectURL(file);
                    setImagePreviewUrl(url);
                  } else {
                    setImagePreviewUrl('');
                  }
                }}
              />
              {imagePreviewUrl ? (
                <div className="mt-3 overflow-hidden rounded-xl border border-outline-variant/30 bg-surface-container-low">
                  <img src={imagePreviewUrl} alt="preview" className="w-full h-56 object-cover" />
                </div>
              ) : null}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex flex-col sm:flex-row justify-end gap-4 pt-4">
            <button 
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-6 py-3 font-label text-xs uppercase tracking-widest font-bold border-2 border-outline hover:bg-surface-container-high transition-colors cursor-pointer"
            >
              {t.cancel}
            </button>
            <button 
              disabled={isSubmitting}
              type="submit"
              className="w-full sm:w-auto px-10 py-3 font-label text-xs uppercase tracking-widest font-bold bg-tertiary text-on-tertiary window-shadow hover:translate-x-1 hover:translate-y-1 hover:shadow-none disabled:opacity-50 disabled:translate-x-0 disabled:translate-y-0 disabled:shadow-none transition-all cursor-pointer"
            >
              {isSubmitting ? t.submitting : t.submit}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddBoardgameModal;