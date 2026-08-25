'use client';

import React, { useState, useEffect } from 'react';

export const POPULAR_BOARDGAME_CAFES = [
  {
    id: 'mind-cafe',
    name: 'The Mind Cafe & Boardgame',
    address: '284/41 Lý Thường Kiệt, Phường 14, Quận 10, TP. Hồ Chí Minh',
    city: 'TP. Hồ Chí Minh',
    lat: 10.7719,
    lng: 106.6575,
    tag: 'Q10 • Game xịn',
  },
  {
    id: 'cube-cafe',
    name: 'Cube Cafe & Board Game Hub',
    address: '168/19 Nguyễn Cư Trinh, Phường Nguyễn Cư Trinh, Quận 1, TP. Hồ Chí Minh',
    city: 'TP. Hồ Chí Minh',
    lat: 10.7618,
    lng: 106.6890,
    tag: 'Q1 • Không gian rộng',
  },
  {
    id: 'bg-station',
    name: 'Board Game Station',
    address: '24 Đường số 7, Cư xá Đô Thành, Phường 4, Quận 3, TP. Hồ Chí Minh',
    city: 'TP. Hồ Chí Minh',
    lat: 10.7735,
    lng: 106.6830,
    tag: 'Q3 • Nhiều giải đấu',
  },
  {
    id: 'say-boardgame',
    name: 'Say Boardgame Pub & Cafe',
    address: '106 Huỳnh Văn Bánh, Phường 12, Quận Phú Nhuận, TP. Hồ Chí Minh',
    city: 'TP. Hồ Chí Minh',
    lat: 10.7938,
    lng: 106.6805,
    tag: 'Phú Nhuận • Chill',
  },
  {
    id: 'cashflow-cafe',
    name: 'Cashflow Cafe',
    address: '7A/19 Thành Thái, Phường 14, Quận 10, TP. Hồ Chí Minh',
    city: 'TP. Hồ Chí Minh',
    lat: 10.7725,
    lng: 106.6635,
    tag: 'Q10 • Chiến thuật',
  },
  {
    id: 'guild-hn',
    name: 'The Guild Board Game Hub',
    address: '50 Ngõ 41 Thái Hà, Trung Liệt, Đống Đa, Hà Nội',
    city: 'Hà Nội',
    lat: 21.0118,
    lng: 105.8210,
    tag: 'Hà Nội • Đống Đa',
  },
  {
    id: 'nona-hn',
    name: 'Nona Board Game Cafe',
    address: 'Ngõ 95 Chùa Bộc, Quang Trung, Đống Đa, Hà Nội',
    city: 'Hà Nội',
    lat: 21.0080,
    lng: 105.8290,
    tag: 'Hà Nội • Sinh viên',
  },
];

export default function EventMapPicker({
  location = '',
  address = '',
  city = 'TP. Hồ Chí Minh',
  lat = null,
  lng = null,
  onChangeVenue,
  isReadOnly = false,
  language = 'vi',
}) {
  const isEn = language === 'en';

  const [searchLocation, setSearchLocation] = useState(location || address || '');
  const [mapQuery, setMapQuery] = useState(
    address || location || (lat && lng ? `${lat},${lng}` : 'TP. Hồ Chí Minh, Việt Nam')
  );
  const [selectedCafeId, setSelectedCafeId] = useState(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (address || location) {
        setSearchLocation(address || location);
        setMapQuery(address || location);
      }
    }, 0);
    return () => clearTimeout(timer);
  }, [location, address]);

  const handleSelectCafe = (cafe) => {
    setSelectedCafeId(cafe.id);
    setSearchLocation(cafe.address);
    setMapQuery(cafe.address);
    if (onChangeVenue) {
      onChangeVenue({
        location: cafe.name,
        address: cafe.address,
        city: cafe.city,
        lat: cafe.lat,
        lng: cafe.lng,
      });
    }
  };

  const handleVerifyOnMap = () => {
    if (!searchLocation.trim()) return;
    setMapQuery(searchLocation.trim());
    if (onChangeVenue) {
      onChangeVenue({
        location: location || searchLocation.trim(),
        address: searchLocation.trim(),
        city: city,
        lat: null,
        lng: null,
      });
    }
  };

  const mapEmbedUrl = `https://maps.google.com/maps?q=${encodeURIComponent(
    mapQuery
  )}&t=&z=15&ie=UTF8&iwloc=&output=embed`;

  const googleMapsExternalUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    mapQuery
  )}`;

  return (
    <div className="space-y-3 font-sans">
      {/* Quick Select Preset Board Game Cafes */}
      {!isReadOnly && (
        <div>
          <label className="block text-xs font-bold text-on-surface mb-1.5 flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[16px] text-primary">local_cafe</span>
            <span>{isEn ? 'Quick pick popular Board Game Cafes:' : 'Hoặc chọn nhanh các Quán Board Game Cafe nổi tiếng:'}</span>
          </label>
          <div className="flex flex-wrap gap-1.5">
            {POPULAR_BOARDGAME_CAFES.map((cafe) => {
              const isSelected =
                selectedCafeId === cafe.id ||
                location?.toLowerCase().includes(cafe.name.toLowerCase().split('&')[0].trim());
              return (
                <button
                  key={cafe.id}
                  type="button"
                  onClick={() => handleSelectCafe(cafe)}
                  className={`px-2.5 py-1 text-xs rounded border transition-all flex items-center gap-1 cursor-pointer ${
                    isSelected
                      ? 'border-primary bg-primary text-white font-bold shadow-xs'
                      : 'border-outline/30 bg-surface-container hover:bg-surface-container-high text-on-surface'
                  }`}
                >
                  <span>{cafe.name}</span>
                  <span className={`text-[10px] px-1 py-0.2 rounded font-mono ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-surface text-outline'
                  }`}>
                    {cafe.tag}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Address Search & Map Verification Bar */}
      {!isReadOnly && (
        <div className="flex gap-2 items-center">
          <div className="relative flex-1">
            <span className="material-symbols-outlined absolute left-3 top-2.5 text-outline text-[16px] pointer-events-none">
              location_on
            </span>
            <input
              type="text"
              value={searchLocation}
              onChange={(e) => setSearchLocation(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleVerifyOnMap();
                }
              }}
              placeholder={isEn ? 'Enter cafe name or address to verify on map...' : 'Nhập tên quán hoặc địa chỉ để kiểm tra trên bản đồ...'}
              className="w-full pl-8 pr-3 py-2 text-xs border-2 border-on-surface/40 focus:border-primary rounded-sm bg-surface-bright text-on-surface outline-hidden"
            />
          </div>
          <button
            type="button"
            onClick={handleVerifyOnMap}
            className="px-3.5 py-2 text-xs font-bold rounded-sm border-2 border-on-surface bg-surface-container-high hover:bg-surface-container-highest text-on-surface transition-all flex items-center gap-1 cursor-pointer shrink-0"
          >
            <span className="material-symbols-outlined text-[15px] text-primary">search</span>
            <span>{isEn ? 'Verify on Map' : 'Kiểm tra trên bản đồ'}</span>
          </button>
        </div>
      )}

      {/* Google Maps Interactive Frame */}
      <div className="relative w-full h-56 sm:h-64 rounded-sm window-border overflow-hidden bg-surface-container shadow-inner">
        <iframe
          title="Google Map Preview"
          src={mapEmbedUrl}
          width="100%"
          height="100%"
          style={{ border: 0 }}
          allowFullScreen=""
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          className="w-full h-full"
        />

        {/* Action Link to Google Maps External */}
        <a
          href={googleMapsExternalUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="absolute bottom-2.5 right-2.5 bg-surface-bright/95 backdrop-blur-md px-3 py-1.5 rounded text-xs font-bold text-primary border border-on-surface/30 hover:bg-primary hover:text-white transition-all shadow-md flex items-center gap-1.5"
        >
          <span className="material-symbols-outlined text-[15px]">directions</span>
          <span>{isEn ? 'Directions / Open Maps' : 'Mở chỉ đường Google Maps'}</span>
        </a>
      </div>

      {/* Current Address display note */}
      <div className="text-[11px] text-on-surface-variant flex items-start gap-1 font-mono">
        <span className="material-symbols-outlined text-[14px] text-primary shrink-0 mt-0.5">info</span>
        <span>
          {isEn
            ? `Pinning: ${mapQuery || 'Please enter an address'}`
            : `Đang ghim vị trí: ${mapQuery || 'Chưa chọn địa chỉ'}`}
        </span>
      </div>
    </div>
  );
}
