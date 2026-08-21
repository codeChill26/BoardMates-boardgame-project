'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/hooks/useAuthStore';
import { useLanguageStore } from '@/hooks/useLanguageStore';
import { getBackendUrl } from '@/lib/apiConfig';
import * as XLSX from 'xlsx';

const POPULAR_CATEGORIES = [
  'Chiến thuật',
  'Gia đình',
  'Party',
  'Giải đố',
  'Đối kháng',
  'Nhập vai',
  'Kinh tế',
  'Thẻ bài',
  'Hợp tác (Co-op)',
];

const CONDITION_OPTIONS = [
  'Mới 100% (Nguyên seal)',
  'Like New 99%',
  'Đã bọc bài (Sleeved)',
  'Tốt (Good)',
  'Đã qua sử dụng',
  'Cũ / Hộp cấn nhẹ',
];

const STATUS_CONFIG = {
  ON_SHELF: {
    label: 'Đang trên kệ',
    labelEn: 'On Shelf',
    bg: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/30 dark:text-emerald-400',
    icon: 'shelves',
  },
  LENT_OUT: {
    label: 'Đang cho mượn',
    labelEn: 'Lent Out',
    bg: 'bg-amber-500/10 text-amber-800 border-amber-500/30 dark:text-amber-300',
    icon: 'handshake',
  },
  FOR_SALE: {
    label: 'Muốn bán / cho thuê',
    labelEn: 'For Sale / Rent',
    bg: 'bg-blue-500/10 text-blue-700 border-blue-500/30 dark:text-blue-400',
    icon: 'sell',
  },
  WISHLIST: {
    label: 'Muốn sưu tầm',
    labelEn: 'Wishlist',
    bg: 'bg-purple-500/10 text-purple-700 border-purple-500/30 dark:text-purple-400',
    icon: 'favorite',
  },
};

const DEFAULT_BG_IMAGE = 'https://images.unsplash.com/photo-1610890716171-6b1bb98ffd09?auto=format&fit=crop&w=800&q=80';

// Xử lý link ảnh an toàn, hỗ trợ trích xuất ảnh trực tiếp từ Google Images URL
function sanitizeImageUrl(url) {
  if (!url || typeof url !== 'string' || !url.trim()) {
    return DEFAULT_BG_IMAGE;
  }
  const clean = url.trim();
  if (clean.includes('imgurl=')) {
    try {
      const match = clean.match(/imgurl=([^&]+)/);
      if (match && match[1]) {
        return decodeURIComponent(match[1]);
      }
    } catch (e) {
      // ignore
    }
  }
  if (!clean.startsWith('http://') && !clean.startsWith('https://')) {
    return DEFAULT_BG_IMAGE;
  }
  return clean;
}

// Helper phân tích dữ liệu bảng tính (Excel / CSV 2D Array)
function parseRowsData(rows) {
  if (!Array.isArray(rows) || rows.length < 2) return [];

  const headers = (rows[0] || []).map((h) =>
    String(h || '')
      .toLowerCase()
      .replace(/[\(\)_-]/g, ' ')
      .trim()
  );
  const dataRows = rows.slice(1);

  const findCol = (aliases) => {
    return headers.findIndex((h) => aliases.some((a) => h.includes(a.toLowerCase())));
  };

  const bggIdx = findCol(['link bgg', 'bgg id', 'bgg', 'id', 'link']);
  const nameIdx = findCol(['tên', 'name', 'title']);
  const noteIdx = findCol(['ghi chú', 'notes', 'note', 'cá nhân']);
  const condIdx = findCol(['tình trạng', 'condition']);
  const statIdx = findCol(['trạng thái', 'status']);
  const rateIdx = findCol(['đánh giá', 'rating', 'sao']);

  return dataRows
    .map((r, index) => {
      const rawBgg = bggIdx !== -1 && r[bggIdx] != null ? String(r[bggIdx]) : '';
      const rawName =
        nameIdx !== -1 && r[nameIdx] != null
          ? String(r[nameIdx])
          : bggIdx === -1 && r[0] != null
          ? String(r[0])
          : '';
      const rawNote = noteIdx !== -1 && r[noteIdx] != null ? String(r[noteIdx]) : '';
      const rawCond = condIdx !== -1 && r[condIdx] != null ? String(r[condIdx]) : 'Like New 99%';
      const rawStat = statIdx !== -1 && r[statIdx] != null ? String(r[statIdx]) : 'ON_SHELF';
      const rawRate = rateIdx !== -1 && r[rateIdx] != null ? String(r[rateIdx]) : '5';

      let extractedId = null;
      if (rawBgg) {
        const match = rawBgg.match(/boardgame\/(\d+)/i) || rawBgg.match(/^(\d+)$/);
        if (match) extractedId = match[1];
      }

      return {
        _id: index + 1,
        bggLink: (rawBgg || '').trim(),
        bggId: extractedId,
        name: (rawName || (extractedId ? `BGG #${extractedId}` : '')).trim(),
        personalNotes: (rawNote || '').trim(),
        condition: rawCond ? rawCond.trim() : 'Like New 99%',
        status: ['ON_SHELF', 'LENT_OUT', 'FOR_SALE', 'WISHLIST'].includes((rawStat || '').toUpperCase())
          ? rawStat.toUpperCase()
          : 'ON_SHELF',
        personalRating: parseFloat(rawRate) || 5,
        imageUrl: extractedId
          ? `https://cf.geekdo-images.com/thumb/img/pic${extractedId}.jpg`
          : 'https://images.unsplash.com/photo-1610890716171-6b1bb98ffd09?auto=format&fit=crop&w=800&q=80',
      };
    })
    .filter((item) => (item.name && item.name.trim() !== '') || item.bggLink);
}

export default function GameVaultPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { language } = useLanguageStore();

  // Danh sách game & phân trang
  const [shelfItems, setShelfItems] = useState([]);
  const [stats, setStats] = useState({ total: 0, onShelf: 0, lentOut: 0, forSale: 0, wishlist: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successToast, setSuccessToast] = useState('');

  // Bộ lọc & Phân trang
  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedPlayers, setSelectedPlayers] = useState('');
  const [sortBy, setSortBy] = useState('updatedAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    totalItems: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
  });

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  // Form Thêm Game Thủ Công & BGG
  const [addMode, setAddMode] = useState('bgg'); // 'bgg' | 'existing' | 'new'
  const [masterGames, setMasterGames] = useState([]);
  const [masterSearch, setMasterSearch] = useState('');
  const [selectedMasterGame, setSelectedMasterGame] = useState(null);
  const [isSearchingMaster, setIsSearchingMaster] = useState(false);

  // BGG Live Integration States
  const [bggHotGames, setBggHotGames] = useState([]);
  const [bggSearchQuery, setBggSearchQuery] = useState('');
  const [bggSearchResults, setBggSearchResults] = useState([]);
  const [bggSelectedGame, setBggSelectedGame] = useState(null);
  const [isFetchingBgg, setIsFetchingBgg] = useState(false);
  const [bggError, setBggError] = useState('');

  // CSV Import States
  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);
  const [parsedCsvGames, setParsedCsvGames] = useState([]);
  const [csvFileName, setCsvFileName] = useState('');
  const [csvPage, setCsvPage] = useState(1);
  const csvLimit = 10; // Mỗi trang tối đa 10 game
  const [isImportingCsv, setIsImportingCsv] = useState(false);
  const [csvError, setCsvError] = useState('');

  const [gameForm, setGameForm] = useState({
    name: '',
    imageUrl: '',
    description: '',
    categories: [],
    minPlayers: 2,
    maxPlayers: 4,
    playTime: 45,
    condition: 'Like New 99%',
    status: 'ON_SHELF',
    borrower: '',
    borrowedDate: '',
    expectedReturnDate: '',
    personalNotes: '',
    personalRating: 5,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Tải dữ liệu kho game
  const fetchShelfGames = async () => {
    if (!user?.token) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const query = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        status: selectedStatus,
        category: selectedCategory,
        sortBy,
        sortOrder,
      });

      if (search.trim()) query.append('search', search.trim());
      if (selectedPlayers) query.append('players', selectedPlayers);

      const res = await fetch(`${getBackendUrl()}/api/shelf?${query.toString()}`, {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });

      const result = await res.json();
      if (!res.ok || !result.success) {
        throw new Error(result.message || 'Không thể tải danh sách kho game');
      }

      setShelfItems(result.data || []);
      if (result.pagination) {
        setPagination(result.pagination);
      }
    } catch (err) {
      console.error('Error fetching shelf games:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Tải thống kê
  const fetchStats = async () => {
    if (!user?.token) return;
    try {
      const res = await fetch(`${getBackendUrl()}/api/shelf/stats`, {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });
      const result = await res.json();
      if (result.success) {
        setStats(result.data);
      }
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  useEffect(() => {
    if (user?.token) {
      fetchShelfGames();
      fetchStats();
    } else {
      setIsLoading(false);
    }
  }, [user?.token, page, limit, selectedStatus, selectedCategory, selectedPlayers, sortBy, sortOrder]);

  // Debounce tìm kiếm
  useEffect(() => {
    const timer = setTimeout(() => {
      if (page === 1) {
        fetchShelfGames();
      } else {
        setPage(1);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [search]);

  // Tìm kiếm Master Game khi mở modal thêm
  useEffect(() => {
    if (!isAddModalOpen || addMode !== 'existing') return;

    const timer = setTimeout(async () => {
      try {
        setIsSearchingMaster(true);
        const res = await fetch(
          `${getBackendUrl()}/api/shelf/master-games?search=${encodeURIComponent(masterSearch)}`,
          {
            headers: {
              Authorization: `Bearer ${user?.token}`,
            },
          }
        );
        const result = await res.json();
        if (result.success) {
          setMasterGames(result.data || []);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setIsSearchingMaster(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [masterSearch, isAddModalOpen, addMode, user?.token]);

  // Tải file template Excel (.xlsx) chuẩn 100%
  const handleDownloadTemplate = () => {
    try {
      const wsData = [
        ['Link BGG / BGG ID', 'Tên BoardGame', 'Ghi chú cá nhân'],
        ['https://boardgamegeek.com/boardgame/13/catan', 'Catan', 'Bản tiếng Anh, đã bọc bài sleeves đầy đủ'],
        ['https://boardgamegeek.com/boardgame/266192/wingspan', 'Wingspan', 'Hộp nguyên seal chưa khui, kèm xúc xắc gỗ'],
        ['https://boardgamegeek.com/boardgame/218179/princess-jing', 'Princess Jing', 'Bản sưu tầm limited edition'],
        ['174430', 'Gloomhaven', 'Hộp to nặng 10kg, tình trạng 98%'],
        ['', 'Tam Cúc', 'Game dân gian truyền thống Việt Nam'],
      ];
      const ws = XLSX.utils.aoa_to_sheet(wsData);
      
      // Độ rộng cột thẩm mỹ
      ws['!cols'] = [
        { wch: 48 }, // Cột 1: Link BGG / BGG ID
        { wch: 25 }, // Cột 2: Tên Boardgame
        { wch: 45 }, // Cột 3: Ghi chú cá nhân
      ];

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'BoardGames');
      XLSX.writeFile(wb, 'boardgames_shelf_template.xlsx');
      showToast('Đã tải xuống file template Excel (.xlsx) thành công!');
    } catch (err) {
      console.error('Lỗi khi tải file template Excel:', err);
      showToast('Không thể tạo file Excel mẫu.');
    }
  };

  // Mở modal Import Excel / CSV
  const handleOpenCsvModal = () => {
    setParsedCsvGames([]);
    setCsvFileName('');
    setCsvPage(1);
    setCsvError('');
    setIsCsvModalOpen(true);
  };

  // Xử lý chọn file Excel (.xlsx, .xls) hoặc CSV với SheetJS
  const handleCsvFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCsvFileName(file.name);
    setCsvError('');

    try {
      const buffer = await file.arrayBuffer();
      const wb = XLSX.read(buffer, { type: 'array' });
      const firstSheetName = wb.SheetNames[0];
      if (!firstSheetName) {
        throw new Error('File không có trang tính (Sheet) nào.');
      }
      const sheet = wb.Sheets[firstSheetName];
      const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
      
      if (!rows || rows.length < 2) {
        throw new Error('File không chứa dữ liệu. Vui lòng tải file mẫu (.xlsx) và điền danh sách boardgame.');
      }

      const games = parseRowsData(rows);
      if (games.length === 0) {
        throw new Error('Không tìm thấy dữ liệu boardgame hợp lệ. Vui lòng kiểm tra lại 3 cột trong file Excel/CSV.');
      }

      setParsedCsvGames(games);
      setCsvPage(1);
    } catch (err) {
      console.error('File Read error:', err);
      setCsvError(err.message || 'Lỗi khi đọc file Excel / CSV');
      setParsedCsvGames([]);
    }
  };

  // Xóa 1 dòng khỏi danh sách CSV xem trước
  const handleRemoveParsedRow = (id) => {
    setParsedCsvGames((prev) => {
      const next = prev.filter((g) => g._id !== id);
      const maxP = Math.ceil(next.length / csvLimit) || 1;
      if (csvPage > maxP) setCsvPage(maxP);
      return next;
    });
  };

  // Submit nạp CSV vào hệ thống
  const handleImportCsvSubmit = async () => {
    if (parsedCsvGames.length === 0) {
      setCsvError('Chưa có boardgame nào để nhập');
      return;
    }

    setIsImportingCsv(true);
    setCsvError('');

    try {
      const res = await fetch(`${getBackendUrl()}/api/shelf/batch-import`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user?.token}`,
        },
        body: JSON.stringify({ games: parsedCsvGames }),
      });

      const result = await res.json();
      if (!res.ok || !result.success) {
        throw new Error(result.message || 'Lỗi khi nạp dữ liệu từ CSV');
      }

      showToast(result.message || `Đã nạp ${parsedCsvGames.length} game vào kho thành công!`);
      setIsCsvModalOpen(false);
      setParsedCsvGames([]);
      setCsvFileName('');
      fetchShelfGames();
      fetchStats();
    } catch (err) {
      setCsvError(err.message || 'Lỗi khi nhập game vào kho');
    } finally {
      setIsImportingCsv(false);
    }
  };

  // Tải danh sách BGG Hotness
  const fetchBggHotList = async () => {
    if (bggHotGames.length > 0) return;
    setIsFetchingBgg(true);
    setBggError('');
    try {
      const res = await fetch(`${getBackendUrl()}/api/shelf/bgg/hotness`);
      const result = await res.json();
      if (res.ok && result.success) {
        setBggHotGames(result.data || []);
      }
    } catch (err) {
      console.error('Error fetching BGG Hotness:', err);
    } finally {
      setIsFetchingBgg(false);
    }
  };

  // Tra cứu chi tiết game từ BGG
  const handleSelectBggGame = async (gameOrId) => {
    const bggId = typeof gameOrId === 'object' ? gameOrId.bggId : gameOrId;
    if (!bggId) return;
    setIsFetchingBgg(true);
    setBggError('');
    try {
      const res = await fetch(`${getBackendUrl()}/api/shelf/bgg/details/${bggId}`);
      const result = await res.json();
      if (res.ok && result.success && result.data) {
        setBggSelectedGame(result.data);
        setGameForm((prev) => ({
          ...prev,
          name: result.data.name,
          imageUrl: result.data.imageUrl,
          description: result.data.description || '',
          categories: result.data.categories || ['Board Game'],
          minPlayers: result.data.minPlayers || 2,
          maxPlayers: result.data.maxPlayers || 4,
          playTime: result.data.playTime || 45,
        }));
      } else if (typeof gameOrId === 'object') {
        setBggSelectedGame(gameOrId);
        setGameForm((prev) => ({
          ...prev,
          name: gameOrId.name,
          imageUrl: gameOrId.imageUrl,
          description: gameOrId.description || '',
          categories: gameOrId.categories || ['Board Game'],
          minPlayers: gameOrId.minPlayers || 2,
          maxPlayers: gameOrId.maxPlayers || 4,
          playTime: gameOrId.playTime || 45,
        }));
      } else {
        throw new Error(result.message || 'Không tìm thấy dữ liệu từ BGG');
      }
    } catch (err) {
      if (typeof gameOrId === 'object') {
        setBggSelectedGame(gameOrId);
        setGameForm((prev) => ({
          ...prev,
          name: gameOrId.name,
          imageUrl: gameOrId.imageUrl,
          description: gameOrId.description || '',
          categories: gameOrId.categories || ['Board Game'],
          minPlayers: gameOrId.minPlayers || 2,
          maxPlayers: gameOrId.maxPlayers || 4,
          playTime: gameOrId.playTime || 45,
        }));
      } else {
        setBggError(err.message || 'Lỗi khi tra cứu BGG');
        setBggSelectedGame(null);
      }
    } finally {
      setIsFetchingBgg(false);
    }
  };

  // Nạp game BGG vào kho của người dùng
  const handleImportBggSubmit = async (e) => {
    e?.preventDefault();
    if (!bggSelectedGame?.bggId) {
      setBggError('Vui lòng chọn hoặc tra cứu 1 game BGG trước khi lưu');
      return;
    }

    setIsSubmitting(true);
    setBggError('');

    try {
      const res = await fetch(`${getBackendUrl()}/api/shelf/bgg/import`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user?.token}`,
        },
        body: JSON.stringify({
          bggId: bggSelectedGame.bggId,
          condition: gameForm.condition,
          status: gameForm.status,
          personalRating: gameForm.personalRating,
          personalNotes: gameForm.personalNotes,
        }),
      });

      const result = await res.json();
      if (!res.ok || !result.success) {
        throw new Error(result.message || 'Lỗi khi nhập game từ BGG');
      }

      showToast(result.message || `Đã thêm "${bggSelectedGame.name}" từ BGG vào kho!`);
      setIsAddModalOpen(false);
      setBggSelectedGame(null);
      setBggSearchQuery('');
      setBggSearchResults([]);
      fetchShelfGames();
      fetchStats();
    } catch (err) {
      setBggError(err.message || 'Lỗi khi nạp game từ BGG');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Tìm kiếm BGG khi người dùng nhấn Enter hoặc bấm nút Tìm kiếm
  const handleExecuteBggSearch = async () => {
    const q = bggSearchQuery.trim();
    if (!q || q.length < 2) {
      setBggSearchResults([]);
      setBggError('Vui lòng nhập ít nhất 2 ký tự và nhấn Enter để tìm kiếm.');
      return;
    }

    setIsFetchingBgg(true);
    setBggError('');
    try {
      const res = await fetch(`${getBackendUrl()}/api/shelf/bgg/search?query=${encodeURIComponent(q)}`);
      const result = await res.json();
      if (res.ok && result.success) {
        setBggSearchResults(result.data || []);
        if (!result.data || result.data.length === 0) {
          setBggError(`Không tìm thấy game nào khớp với "${q}". Thử từ khóa khác hoặc bấm nút "Tìm trên BGG ↗" ở dưới.`);
        } else if (result.data.length === 1) {
          handleSelectBggGame(result.data[0]);
        }
      } else {
        throw new Error(result.message || 'Lỗi khi tìm kiếm trên BGG');
      }
    } catch (err) {
      console.error('Error searching BGG:', err);
      setBggError(err.message || 'Không thể kết nối đến máy chủ tìm kiếm BGG');
    } finally {
      setIsFetchingBgg(false);
    }
  };

  // Mở Google để tìm nhanh trang BGG của game
  const handleOpenBggSearchExternal = () => {
    const query = bggSearchQuery.trim() || '';
    const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(`${query} boardgamegeek`)}`;
    window.open(searchUrl, '_blank', 'noopener,noreferrer');
  };

  // Dán nhanh link/ID từ Clipboard và tự động nạp game
  const handlePasteBggLinkAndSearch = async () => {
    try {
      if (typeof navigator === 'undefined' || !navigator.clipboard) {
        showToast('Trình duyệt không hỗ trợ đọc clipboard tự động, bạn hãy dán thủ công nhé.');
        return;
      }
      const text = await navigator.clipboard.readText();
      if (!text || !text.trim()) {
        showToast('Bộ nhớ tạm (Clipboard) đang trống.');
        return;
      }
      const cleanText = text.trim();
      setBggSearchQuery(cleanText);
      setIsFetchingBgg(true);
      setBggError('');
      try {
        const res = await fetch(`${getBackendUrl()}/api/shelf/bgg/search?query=${encodeURIComponent(cleanText)}`);
        const result = await res.json();
        if (res.ok && result.success) {
          setBggSearchResults(result.data || []);
          if (result.data && result.data.length > 0) {
            handleSelectBggGame(result.data[0]);
            showToast(`Đã nhận diện game: ${result.data[0].name}`);
          } else {
            setBggError(`Không tìm thấy game nào từ link/ID: "${cleanText}".`);
          }
        }
      } catch (err) {
        console.error('Error searching BGG:', err);
      } finally {
        setIsFetchingBgg(false);
      }
    } catch (err) {
      showToast('Vui lòng cấp quyền truy cập bộ nhớ tạm hoặc dán link thủ công.');
    }
  };

  // Toast message
  const showToast = (msg) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(''), 3500);
  };

  // Mở modal Thêm Game
  const handleOpenAddModal = () => {
    setSelectedMasterGame(null);
    setMasterSearch('');
    setAddMode('bgg'); // Mặc định mở Tab 1: Chọn từ BGG
    setBggSelectedGame(null);
    setBggSearchQuery('');
    setBggSearchResults([]);
    setBggError('');
    fetchBggHotList();
    setGameForm({
      name: '',
      imageUrl: '',
      description: '',
      categories: ['Chiến thuật'],
      minPlayers: 2,
      maxPlayers: 4,
      playTime: 45,
      condition: 'Like New 99%',
      status: 'ON_SHELF',
      borrower: '',
      borrowedDate: '',
      expectedReturnDate: '',
      personalNotes: '',
      personalRating: 5,
    });
    setIsAddModalOpen(true);
  };

  // Mở modal Sửa Game
  const handleOpenEditModal = (item) => {
    setSelectedItem(item);
    setGameForm({
      condition: item.condition || 'Like New 99%',
      status: item.status || 'ON_SHELF',
      borrower: item.borrower || '',
      borrowedDate: item.borrowedDate ? item.borrowedDate.split('T')[0] : '',
      expectedReturnDate: item.expectedReturnDate ? item.expectedReturnDate.split('T')[0] : '',
      personalNotes: item.personalNotes || '',
      personalRating: item.personalRating || 5,
    });
    setIsEditModalOpen(true);
  };

  // Mở modal Xóa
  const handleOpenDeleteModal = (item) => {
    setSelectedItem(item);
    setIsDeleteModalOpen(true);
  };

  // Submit Thêm Game
  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      let payload = {
        condition: gameForm.condition,
        status: gameForm.status,
        borrower: gameForm.status === 'LENT_OUT' ? gameForm.borrower : '',
        borrowedDate: gameForm.status === 'LENT_OUT' ? gameForm.borrowedDate : null,
        expectedReturnDate: gameForm.status === 'LENT_OUT' ? gameForm.expectedReturnDate : null,
        personalNotes: gameForm.personalNotes,
        personalRating: gameForm.personalRating,
      };

      if (addMode === 'existing') {
        if (!selectedMasterGame) {
          throw new Error('Vui lòng chọn 1 game trong danh sách gợi ý hoặc chuyển sang tab "Tự tạo game mới"');
        }
        payload.gameId = selectedMasterGame.id;
      } else {
        if (!gameForm.name.trim()) {
          throw new Error('Vui lòng nhập tên boardgame');
        }
        payload.name = gameForm.name.trim();
        payload.imageUrl = gameForm.imageUrl.trim();
        payload.description = gameForm.description.trim();
        payload.categories = gameForm.categories;
        payload.minPlayers = parseInt(gameForm.minPlayers, 10) || 1;
        payload.maxPlayers = parseInt(gameForm.maxPlayers, 10) || 4;
        payload.playTime = parseInt(gameForm.playTime, 10) || 30;
      }

      const res = await fetch(`${getBackendUrl()}/api/shelf`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify(payload),
      });

      const result = await res.json();
      if (!res.ok || !result.success) {
        throw new Error(result.message || 'Lỗi khi thêm game');
      }

      showToast(`Đã thêm "${result.data?.game?.name || 'Boardgame'}" vào kệ của bạn!`);
      setIsAddModalOpen(false);
      fetchShelfGames();
      fetchStats();
    } catch (err) {
      alert(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit Sửa Game
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!selectedItem) return;
    setIsSubmitting(true);

    try {
      const payload = {
        condition: gameForm.condition,
        status: gameForm.status,
        borrower: gameForm.status === 'LENT_OUT' ? gameForm.borrower : '',
        borrowedDate: gameForm.status === 'LENT_OUT' ? gameForm.borrowedDate : null,
        expectedReturnDate: gameForm.status === 'LENT_OUT' ? gameForm.expectedReturnDate : null,
        personalNotes: gameForm.personalNotes,
        personalRating: gameForm.personalRating,
      };

      const res = await fetch(`${getBackendUrl()}/api/shelf/${selectedItem.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify(payload),
      });

      const result = await res.json();
      if (!res.ok || !result.success) {
        throw new Error(result.message || 'Lỗi khi cập nhật game');
      }

      showToast(`Đã cập nhật thông tin "${selectedItem.game?.name}"`);
      setIsEditModalOpen(false);
      fetchShelfGames();
      fetchStats();
    } catch (err) {
      alert(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit Xóa Game
  const handleDeleteSubmit = async () => {
    if (!selectedItem) return;
    setIsSubmitting(true);

    try {
      const res = await fetch(`${getBackendUrl()}/api/shelf/${selectedItem.id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });

      const result = await res.json();
      if (!res.ok || !result.success) {
        throw new Error(result.message || 'Lỗi khi xóa game');
      }

      showToast(`Đã xóa "${selectedItem.game?.name}" khỏi kho game`);
      setIsDeleteModalOpen(false);
      fetchShelfGames();
      fetchStats();
    } catch (err) {
      alert(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle category checkbox
  const toggleCategory = (cat) => {
    setGameForm((prev) => {
      const exists = prev.categories.includes(cat);
      if (exists) {
        return { ...prev, categories: prev.categories.filter((c) => c !== cat) };
      } else {
        return { ...prev, categories: [...prev.categories, cat] };
      }
    });
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-6">
          <span className="material-symbols-outlined text-4xl">lock</span>
        </div>
        <h1 className="font-headline text-3xl md:text-4xl font-bold text-on-surface mb-3 uppercase tracking-tight">
          Kho Game Cá Nhân
        </h1>
        <p className="font-body text-on-surface-variant max-w-md mb-8">
          Vui lòng đăng nhập để xem và quản lý các boardgame bạn đang sở hữu trên kệ tủ của mình.
        </p>
        <Link
          href="/login"
          className="px-8 py-3.5 rounded-full bg-primary text-on-primary font-label text-sm uppercase tracking-widest font-bold shadow-md hover:bg-primary-dim transition-all"
        >
          Đăng nhập ngay
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-on-background py-8 px-4 sm:px-6 lg:px-8">
      {/* Toast Notification */}
      {successToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-surface-container-highest border-2 border-primary text-on-surface px-5 py-3.5 rounded-xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-5 duration-300">
          <span className="material-symbols-outlined text-primary text-xl">check_circle</span>
          <span className="font-body text-sm font-semibold">{successToast}</span>
        </div>
      )}

      <div className="max-w-7xl mx-auto space-y-8">
        {/* HEADER & ACTION */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-outline-variant/30">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="font-label text-[11px] font-bold tracking-[0.2em] text-primary uppercase bg-primary/10 px-2.5 py-1 rounded-md">
                PERSONAL SHELF VAULT
              </span>
            </div>
            <h1 className="font-headline text-4xl md:text-5xl font-bold tracking-tight text-on-surface uppercase">
              Kho Game Trên Kệ
            </h1>
            <p className="mt-2 font-body text-sm md:text-base text-on-surface-variant max-w-2xl">
              Quản lý toàn bộ boardgame bạn đang sở hữu, theo dõi game đang cho mượn và lưu trữ các ghi chú phụ kiện, bản mở rộng.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={handleDownloadTemplate}
              className="flex items-center gap-1.5 px-4 py-3 rounded-xl border border-outline-variant/40 hover:border-primary text-on-surface font-label text-xs uppercase tracking-wider font-bold transition-all hover:bg-surface-container-high cursor-pointer"
              title="Tải file Excel mẫu (.xlsx) về máy để chỉnh sửa"
            >
              <span className="material-symbols-outlined text-base text-emerald-600 dark:text-emerald-400">table_view</span>
              <span>Tải Excel Mẫu</span>
            </button>

            <button
              onClick={handleOpenCsvModal}
              className="flex items-center gap-1.5 px-4 py-3 rounded-xl border border-primary/40 bg-primary/10 hover:bg-primary/20 text-primary font-label text-xs uppercase tracking-wider font-bold transition-all shadow-xs cursor-pointer"
              title="Tải lên file Excel (.xlsx) hoặc CSV chứa danh sách game của bạn"
            >
              <span className="material-symbols-outlined text-base">upload_file</span>
              <span>Nhập Excel / CSV</span>
            </button>

            <button
              onClick={handleOpenAddModal}
              className="flex items-center gap-2 px-5 py-3 rounded-xl bg-tertiary text-on-tertiary font-label text-xs uppercase tracking-widest font-bold hover:bg-tertiary-fixed-dim transition-all shadow-md active:scale-95 cursor-pointer"
            >
              <span className="material-symbols-outlined text-lg">add_circle</span>
              <span>Thêm Game Lên Kệ</span>
            </button>
          </div>
        </div>

        {/* STATS OVERVIEW CARDS */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div
            onClick={() => setSelectedStatus('ALL')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer ${
              selectedStatus === 'ALL'
                ? 'bg-surface-container-high border-primary shadow-sm'
                : 'bg-surface-container-lowest border-outline-variant/20 hover:border-outline-variant/60'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-label uppercase tracking-wider text-on-surface-variant">Tổng số game</span>
              <span className="material-symbols-outlined text-primary text-xl">casino</span>
            </div>
            <p className="mt-2 font-headline text-3xl font-bold text-on-surface">{stats.total}</p>
          </div>

          <div
            onClick={() => setSelectedStatus('ON_SHELF')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer ${
              selectedStatus === 'ON_SHELF'
                ? 'bg-emerald-500/10 border-emerald-500 shadow-sm'
                : 'bg-surface-container-lowest border-outline-variant/20 hover:border-outline-variant/60'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-label uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                Đang trên kệ
              </span>
              <span className="material-symbols-outlined text-emerald-600 text-xl">shelves</span>
            </div>
            <p className="mt-2 font-headline text-3xl font-bold text-on-surface">{stats.onShelf}</p>
          </div>

          <div
            onClick={() => setSelectedStatus('LENT_OUT')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer ${
              selectedStatus === 'LENT_OUT'
                ? 'bg-amber-500/10 border-amber-500 shadow-sm'
                : 'bg-surface-container-lowest border-outline-variant/20 hover:border-outline-variant/60'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-label uppercase tracking-wider text-amber-800 dark:text-amber-300">
                Đang cho mượn
              </span>
              <span className="material-symbols-outlined text-amber-600 text-xl">handshake</span>
            </div>
            <p className="mt-2 font-headline text-3xl font-bold text-on-surface">{stats.lentOut}</p>
          </div>

          <div
            onClick={() => setSelectedStatus('FOR_SALE')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer ${
              selectedStatus === 'FOR_SALE'
                ? 'bg-blue-500/10 border-blue-500 shadow-sm'
                : 'bg-surface-container-lowest border-outline-variant/20 hover:border-outline-variant/60'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-label uppercase tracking-wider text-blue-700 dark:text-blue-400">
                Muốn bán / thuê
              </span>
              <span className="material-symbols-outlined text-blue-600 text-xl">sell</span>
            </div>
            <p className="mt-2 font-headline text-3xl font-bold text-on-surface">{stats.forSale}</p>
          </div>
        </div>

        {/* SEARCH & FILTERS BAR */}
        <div className="bg-surface-container-lowest p-4 rounded-2xl border border-outline-variant/20 shadow-sm space-y-4">
          <div className="flex flex-col md:flex-row gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant/60">
                search
              </span>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm tên boardgame trong kho của bạn..."
                className="w-full bg-surface-container-high/60 border border-outline-variant/30 rounded-xl pl-10 pr-10 py-2.5 font-body text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:border-primary transition-colors"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface text-sm cursor-pointer"
                >
                  close
                </button>
              )}
            </div>

            {/* Status Dropdown */}
            <div className="w-full md:w-48">
              <select
                value={selectedStatus}
                onChange={(e) => {
                  setSelectedStatus(e.target.value);
                  setPage(1);
                }}
                className="w-full bg-surface-container-high/60 border border-outline-variant/30 rounded-xl px-3 py-2.5 font-body text-sm text-on-surface focus:outline-none focus:border-primary transition-colors cursor-pointer"
              >
                <option value="ALL">Tất cả trạng thái</option>
                <option value="ON_SHELF">🏠 Đang trên kệ</option>
                <option value="LENT_OUT">🤝 Đang cho mượn</option>
                <option value="FOR_SALE">🏷️ Muốn bán / thuê</option>
                <option value="WISHLIST">💖 Muốn sưu tầm</option>
              </select>
            </div>

            {/* Category Dropdown */}
            <div className="w-full md:w-44">
              <select
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value);
                  setPage(1);
                }}
                className="w-full bg-surface-container-high/60 border border-outline-variant/30 rounded-xl px-3 py-2.5 font-body text-sm text-on-surface focus:outline-none focus:border-primary transition-colors cursor-pointer"
              >
                <option value="ALL">Tất cả thể loại</option>
                {POPULAR_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Players Dropdown */}
            <div className="w-full md:w-36">
              <select
                value={selectedPlayers}
                onChange={(e) => {
                  setSelectedPlayers(e.target.value);
                  setPage(1);
                }}
                className="w-full bg-surface-container-high/60 border border-outline-variant/30 rounded-xl px-3 py-2.5 font-body text-sm text-on-surface focus:outline-none focus:border-primary transition-colors cursor-pointer"
              >
                <option value="">Số người</option>
                <option value="1">1 người</option>
                <option value="2">2 người</option>
                <option value="4">4 người</option>
                <option value="6">6+ người</option>
              </select>
            </div>

            {/* Sort Dropdown */}
            <div className="w-full md:w-40">
              <select
                value={`${sortBy}-${sortOrder}`}
                onChange={(e) => {
                  const [by, ord] = e.target.value.split('-');
                  setSortBy(by);
                  setSortOrder(ord);
                  setPage(1);
                }}
                className="w-full bg-surface-container-high/60 border border-outline-variant/30 rounded-xl px-3 py-2.5 font-body text-sm text-on-surface focus:outline-none focus:border-primary transition-colors cursor-pointer"
              >
                <option value="updatedAt-desc">Mới cập nhật</option>
                <option value="createdAt-desc">Mới thêm gần đây</option>
                <option value="name-asc">Tên game A - Z</option>
                <option value="name-desc">Tên game Z - A</option>
                <option value="rating-desc">Đánh giá cao nhất</option>
              </select>
            </div>
          </div>
        </div>

        {/* HORIZONTAL LIST VIEW TABLE */}
        <div className="space-y-4">
          {isLoading ? (
            <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/20 p-12 text-center">
              <div className="inline-block w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-3"></div>
              <p className="font-body text-sm text-on-surface-variant">Đang tải kho game của bạn...</p>
            </div>
          ) : error ? (
            <div className="bg-error/10 border border-error/20 rounded-2xl p-6 text-center text-error">
              <p className="font-body text-sm">{error}</p>
              <button
                onClick={fetchShelfGames}
                className="mt-3 px-4 py-1.5 rounded-lg bg-error text-white font-label text-xs uppercase"
              >
                Thử lại
              </button>
            </div>
          ) : shelfItems.length === 0 ? (
            <div className="bg-surface-container-lowest rounded-2xl border-2 border-dashed border-outline-variant/30 p-16 text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary mx-auto mb-4">
                <span className="material-symbols-outlined text-3xl">inventory_2</span>
              </div>
              <h3 className="font-headline text-xl font-bold text-on-surface mb-1">
                Chưa có boardgame nào phù hợp
              </h3>
              <p className="font-body text-sm text-on-surface-variant max-w-md mx-auto mb-6">
                {search || selectedStatus !== 'ALL' || selectedCategory !== 'ALL'
                  ? 'Thử điều chỉnh bộ lọc hoặc từ khóa tìm kiếm để tìm game bạn muốn.'
                  : 'Kệ game của bạn đang trống. Hãy thêm các tựa game bạn đang sở hữu lên kệ ngay bây giờ!'}
              </p>
              <button
                onClick={handleOpenAddModal}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-tertiary text-on-tertiary font-label text-xs uppercase tracking-widest font-bold shadow-md hover:bg-tertiary-fixed-dim transition-all"
              >
                <span className="material-symbols-outlined text-base">add_circle</span>
                <span>Thêm Game Đầu Tiên</span>
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Header của danh sách ngang */}
              <div className="hidden lg:grid grid-cols-12 gap-4 px-6 py-2 text-[11px] font-label font-bold uppercase tracking-widest text-on-surface-variant/70 border-b border-outline-variant/20">
                <div className="col-span-4">Boardgame</div>
                <div className="col-span-2">Thông số</div>
                <div className="col-span-2">Tình trạng Box</div>
                <div className="col-span-2">Trạng thái</div>
                <div className="col-span-2 text-right">Thao tác</div>
              </div>

              {/* Từng dòng game nằm ngang */}
              {shelfItems.map((item) => {
                const statusInfo = STATUS_CONFIG[item.status] || STATUS_CONFIG.ON_SHELF;
                const game = item.game || {};

                return (
                  <div
                    key={item.id}
                    className="group bg-surface-container-lowest hover:bg-surface-container-low border border-outline-variant/20 hover:border-primary/40 rounded-2xl p-4 sm:p-5 transition-all shadow-xs hover:shadow-md"
                  >
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
                      {/* Cột 1: Thumbnail & Tên game & Thể loại */}
                      <div className="lg:col-span-4 flex items-center gap-4">
                        <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden bg-surface-container-high shrink-0 border border-outline-variant/30 shadow-xs flex items-center justify-center">
                          <img
                            src={sanitizeImageUrl(game.imageUrl || item.imageUrl)}
                            alt={game.name || 'Boardgame'}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            onError={(e) => {
                              e.currentTarget.onerror = null;
                              e.currentTarget.src = DEFAULT_BG_IMAGE;
                            }}
                          />
                          {item.personalRating ? (
                            <div className="absolute bottom-1 right-1 bg-black/75 backdrop-blur-xs text-amber-400 text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5">
                              <span>★</span>
                              <span>{item.personalRating}</span>
                            </div>
                          ) : null}
                        </div>

                        <div className="min-w-0 flex-1">
                          <h3 className="font-headline text-base sm:text-lg font-bold text-on-surface leading-snug truncate">
                            {game.name || 'Untitled Boardgame'}
                          </h3>

                          <div className="flex flex-wrap gap-1.5 mt-1.5">
                            {Array.isArray(game.categories) && game.categories.length > 0 ? (
                              game.categories.slice(0, 3).map((cat, idx) => (
                                <span
                                  key={idx}
                                  className="font-label text-[9px] font-bold uppercase tracking-wider bg-surface-container-high text-on-surface-variant px-2 py-0.5 rounded-md"
                                >
                                  {cat}
                                </span>
                              ))
                            ) : (
                              <span className="font-label text-[9px] text-on-surface-variant/60">
                                Boardgame
                              </span>
                            )}
                          </div>

                          {/* Ghi chú cá nhân */}
                          {item.personalNotes && (
                            <p className="mt-1 font-body text-xs text-on-surface-variant italic truncate max-w-xs">
                              💬 &quot;{item.personalNotes}&quot;
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Cột 2: Thông số (Số người & Thời lượng) */}
                      <div className="lg:col-span-2 flex lg:flex-col gap-3 lg:gap-1 text-xs text-on-surface-variant font-body">
                        <div className="flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-primary text-base">group</span>
                          <span>
                            {game.minPlayers && game.maxPlayers
                              ? `${game.minPlayers} - ${game.maxPlayers} người`
                              : `${game.minPlayers || game.maxPlayers || 2} người`}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-primary text-base">schedule</span>
                          <span>{game.playTime ? `${game.playTime} phút` : '30-60 phút'}</span>
                        </div>
                      </div>

                      {/* Cột 3: Tình trạng Box */}
                      <div className="lg:col-span-2">
                        <span className="inline-flex items-center gap-1 font-label text-[11px] font-bold text-on-surface bg-surface-container px-2.5 py-1 rounded-lg border border-outline-variant/20">
                          <span className="material-symbols-outlined text-xs text-primary">verified</span>
                          <span>{item.condition || 'Like New'}</span>
                        </span>
                      </div>

                      {/* Cột 4: Trạng thái & Người mượn */}
                      <div className="lg:col-span-2 space-y-1">
                        <div
                          className={`inline-flex items-center gap-1.5 font-label text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg border ${statusInfo.bg}`}
                        >
                          <span className="material-symbols-outlined text-xs">{statusInfo.icon}</span>
                          <span>{statusInfo.label}</span>
                        </div>

                        {item.status === 'LENT_OUT' && item.borrower && (
                          <p className="font-body text-xs text-amber-800 dark:text-amber-300 font-semibold truncate">
                            👤 {item.borrower}
                            {item.expectedReturnDate && (
                              <span className="block text-[10px] font-normal text-on-surface-variant">
                                Hẹn trả: {new Date(item.expectedReturnDate).toLocaleDateString('vi-VN')}
                              </span>
                            )}
                          </p>
                        )}
                      </div>

                      {/* Cột 5: Nút Thao tác */}
                      <div className="lg:col-span-2 flex items-center justify-end gap-2 pt-2 lg:pt-0 border-t lg:border-t-0 border-outline-variant/10">
                        <button
                          onClick={() => handleOpenEditModal(item)}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-outline-variant/30 hover:border-primary hover:text-primary text-on-surface font-label text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
                          title="Chỉnh sửa thông tin"
                        >
                          <span className="material-symbols-outlined text-sm">edit</span>
                          <span className="hidden sm:inline">Sửa</span>
                        </button>

                        <button
                          onClick={() => handleOpenDeleteModal(item)}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-outline-variant/30 hover:border-error/50 hover:text-error text-on-surface-variant font-label text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
                          title="Xóa khỏi kệ"
                        >
                          <span className="material-symbols-outlined text-sm">delete</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* PAGINATION CONTROLS */}
        {pagination.totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-outline-variant/20">
            <p className="font-body text-xs text-on-surface-variant">
              Hiển thị{' '}
              <span className="font-semibold text-on-surface">
                {(pagination.page - 1) * pagination.limit + 1} -{' '}
                {Math.min(pagination.page * pagination.limit, pagination.totalItems)}
              </span>{' '}
              trên tổng số <span className="font-semibold text-on-surface">{pagination.totalItems}</span> boardgame
            </p>

            <div className="flex items-center gap-1.5">
              {/* Nút Trước */}
              <button
                disabled={!pagination.hasPrevPage}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="flex items-center gap-1 px-3 py-2 rounded-xl border border-outline-variant/30 text-on-surface font-label text-xs font-bold uppercase tracking-wider hover:border-primary disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm">chevron_left</span>
                <span>Trước</span>
              </button>

              {/* Các nút số trang */}
              <div className="flex items-center gap-1">
                {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                  .filter((p) => p === 1 || p === pagination.totalPages || Math.abs(p - pagination.page) <= 1)
                  .map((p, idx, arr) => {
                    const isCurrent = p === pagination.page;
                    const prevP = arr[idx - 1];

                    return (
                      <React.Fragment key={p}>
                        {prevP && p - prevP > 1 && (
                          <span className="px-2 font-body text-xs text-on-surface-variant">...</span>
                        )}
                        <button
                          onClick={() => setPage(p)}
                          className={`w-9 h-9 rounded-xl font-label text-xs font-bold transition-all cursor-pointer ${
                            isCurrent
                              ? 'bg-primary text-on-primary shadow-sm'
                              : 'border border-outline-variant/30 text-on-surface hover:border-primary'
                          }`}
                        >
                          {p}
                        </button>
                      </React.Fragment>
                    );
                  })}
              </div>

              {/* Nút Sau */}
              <button
                disabled={!pagination.hasNextPage}
                onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                className="flex items-center gap-1 px-3 py-2 rounded-xl border border-outline-variant/30 text-on-surface font-label text-xs font-bold uppercase tracking-wider hover:border-primary disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
              >
                <span>Sau</span>
                <span className="material-symbols-outlined text-sm">chevron_right</span>
              </button>
            </div>

            {/* Số lượng mỗi trang */}
            <div className="flex items-center gap-2 text-xs font-body text-on-surface-variant">
              <span>Mỗi trang:</span>
              <select
                value={limit}
                onChange={(e) => {
                  setLimit(parseInt(e.target.value, 10));
                  setPage(1);
                }}
                className="bg-surface-container-high/60 border border-outline-variant/30 rounded-lg px-2 py-1 font-body text-xs text-on-surface focus:outline-none focus:border-primary cursor-pointer"
              >
                <option value="6">6</option>
                <option value="8">8</option>
                <option value="12">12</option>
                <option value="20">20</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* ============================================================== */}
      {/*                   MODAL: THÊM GAME MỚI                         */}
      {/* ============================================================== */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-surface-container-lowest border border-outline-variant/30 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden my-8 max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-outline-variant/20 flex items-center justify-between bg-surface-container-high/40">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-xl">add_box</span>
                <h3 className="font-headline text-xl font-bold text-on-surface uppercase">
                  Thêm Boardgame Vào Kệ
                </h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="material-symbols-outlined text-on-surface-variant hover:text-on-surface text-xl cursor-pointer"
              >
                close
              </button>
            </div>

            {/* Tabs chọn mode: Chỉ còn 2 Tab: 1. BGG và 2. Tự tạo game mới */}
            <div className="flex border-b border-outline-variant/20 bg-surface-container-high/20 px-6 pt-3 gap-4 overflow-x-auto">
              <button
                type="button"
                onClick={() => {
                  setAddMode('bgg');
                  fetchBggHotList();
                }}
                className={`pb-3 font-label text-xs uppercase font-bold tracking-wider transition-all border-b-2 cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                  addMode === 'bgg'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-on-surface-variant hover:text-on-surface'
                }`}
              >
                <span className="material-symbols-outlined text-sm">public</span>
                <span>1. Chọn game từ BoardGameGeek (BGG)</span>
              </button>

              <button
                type="button"
                onClick={() => setAddMode('new')}
                className={`pb-3 font-label text-xs uppercase font-bold tracking-wider transition-all border-b-2 cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                  addMode === 'new'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-on-surface-variant hover:text-on-surface'
                }`}
              >
                <span className="material-symbols-outlined text-sm">edit_square</span>
                <span>2. Tự tạo game mới</span>
              </button>
            </div>

            {/* Modal Body */}
            <form
              onSubmit={addMode === 'bgg' ? handleImportBggSubmit : handleAddSubmit}
              className="p-6 overflow-y-auto space-y-5 flex-1"
            >
              {addMode === 'bgg' ? (
                /* TAB 1: TÌM KIẾM THEO TÊN & NẠP TRỰC TIẾP TỪ BOARDGAMEGEEK (BGG) */
                <div className="space-y-5">
                  <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 flex items-start gap-3">
                    <span className="material-symbols-outlined text-primary text-2xl shrink-0 mt-0.5">travel_explore</span>
                    <div className="text-xs font-body">
                      <p className="font-bold text-on-surface text-sm">Tìm kiếm trực tiếp từ kho dữ liệu BoardGameGeek</p>
                      <p className="text-on-surface-variant mt-0.5">
                        Gõ <strong>Tên Boardgame</strong> (ví dụ: <em>Catan, Wingspan, Brass, Nemesis, Splendor, Dune...</em>) hoặc <strong>BGG ID</strong>. Hệ thống sẽ tự động tìm kiếm và lấy ảnh HD gốc cùng đầy đủ thông số cho bạn!
                      </p>
                    </div>
                  </div>

                  {bggError && (
                    <div className="p-3 bg-error/10 border border-error/30 text-error rounded-xl text-xs font-body flex items-center gap-2">
                      <span className="material-symbols-outlined text-base">error</span>
                      <span>{bggError}</span>
                    </div>
                  )}

                  {/* Ô tìm kiếm theo Tên game hoặc BGG ID */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="font-label text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                        Tìm theo tên game, BGG ID hoặc dán Link BGG:
                      </label>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={handleOpenBggSearchExternal}
                          className="font-label text-[10px] font-bold text-primary hover:underline flex items-center gap-0.5 cursor-pointer"
                          title="Mở Google tìm kiếm trang BGG cho từ khóa này"
                        >
                          <span className="material-symbols-outlined text-xs">open_in_new</span>
                          <span>Tìm trên BGG ↗</span>
                        </button>
                        <span className="text-on-surface-variant/30">•</span>
                        <button
                          type="button"
                          onClick={handlePasteBggLinkAndSearch}
                          className="font-label text-[10px] font-bold text-on-surface-variant hover:text-on-surface flex items-center gap-0.5 cursor-pointer"
                          title="Dán nhanh link BGG từ bộ nhớ tạm"
                        >
                          <span className="material-symbols-outlined text-xs">content_paste</span>
                          <span>Dán link</span>
                        </button>
                      </div>
                    </div>

                    <div className="flex gap-2.5">
                      <div className="relative flex-1">
                        <input
                          type="text"
                          value={bggSearchQuery}
                          onChange={(e) => setBggSearchQuery(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleExecuteBggSearch();
                            }
                          }}
                          placeholder="Nhập tên game (Catan, Nemesis...), BGG ID (vd: 218179) hoặc dán link BGG..."
                          className="w-full bg-surface-container-high/60 border border-outline-variant/30 rounded-xl pl-11 pr-10 py-3 font-body text-sm text-on-surface focus:outline-none focus:border-primary"
                        />
                        <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant text-xl">
                          search
                        </span>
                        {bggSearchQuery && (
                          <button
                            type="button"
                            onClick={() => {
                              setBggSearchQuery('');
                              setBggSearchResults([]);
                              setBggError('');
                            }}
                            className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface text-sm cursor-pointer"
                          >
                            close
                          </button>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={handleExecuteBggSearch}
                        disabled={isFetchingBgg || !bggSearchQuery.trim()}
                        className="px-5 py-3 rounded-xl bg-primary text-on-primary font-label text-xs uppercase tracking-wider font-bold shadow-sm hover:bg-primary-dim disabled:opacity-50 disabled:pointer-events-none transition-all flex items-center gap-2 shrink-0 cursor-pointer"
                      >
                        {isFetchingBgg ? (
                          <div className="w-4 h-4 border-2 border-on-primary border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          <span className="material-symbols-outlined text-base">search</span>
                        )}
                        <span>Tìm kiếm</span>
                        <span className="hidden sm:inline text-[10px] bg-white/20 px-1.5 py-0.5 rounded font-mono">↵</span>
                      </button>
                    </div>
                  </div>

                  {/* Danh sách kết quả tìm kiếm theo Tên hoặc BGG Hotness */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-label text-[11px] font-bold uppercase tracking-wider text-on-surface-variant flex items-center gap-1">
                        {bggSearchResults.length > 0 ? (
                          <>
                            <span className="material-symbols-outlined text-primary text-sm">manage_search</span>
                            Kết quả tìm kiếm ({bggSearchResults.length}):
                          </>
                        ) : (
                          <>
                            <span className="material-symbols-outlined text-amber-500 text-sm">local_fire_department</span>
                            Top BoardGame Đang Thịnh Hành (BGG Hotness):
                          </>
                        )}
                      </span>
                      {isFetchingBgg && (
                        <span className="text-[10px] text-primary animate-pulse font-medium">Đang tìm kiếm BGG...</span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-64 overflow-y-auto p-1.5 border border-outline-variant/20 rounded-xl bg-surface-container-high/20">
                      {(bggSearchResults.length > 0 ? bggSearchResults : bggHotGames).slice(0, 15).map((g) => {
                        const isSelected = bggSelectedGame?.bggId === g.bggId || bggSelectedGame?.name === g.name;

                        return (
                          <div
                            key={g.bggId || g.name}
                            onClick={() => handleSelectBggGame(g)}
                            className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center gap-3 ${
                              isSelected
                                ? 'border-primary bg-primary/10 shadow-sm ring-1 ring-primary'
                                : 'border-outline-variant/20 hover:border-primary/50 bg-surface'
                            }`}
                          >
                            <div className="w-11 h-11 rounded-lg overflow-hidden bg-surface-container-high shrink-0 border border-outline-variant/20 flex items-center justify-center">
                              <img
                                src={sanitizeImageUrl(g.imageUrl)}
                                alt={g.name}
                                referrerPolicy="no-referrer"
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.currentTarget.onerror = null;
                                  e.currentTarget.src = DEFAULT_BG_IMAGE;
                                }}
                              />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="font-headline text-xs font-bold text-on-surface truncate">{g.name}</p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[10px] font-label text-primary font-semibold">
                                  {g.bggId ? `BGG #${g.bggId}` : 'Master Game'}
                                </span>
                                {g.year && (
                                  <span className="text-[10px] text-on-surface-variant">({g.year})</span>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      {bggSearchQuery.trim().length >= 2 && bggSearchResults.length === 0 && !isFetchingBgg && (
                        <div className="col-span-full py-5 px-4 rounded-xl bg-surface-container-high/40 border border-outline-variant/30 text-center space-y-3">
                          <div className="w-10 h-10 mx-auto rounded-full bg-primary/10 text-primary flex items-center justify-center border border-primary/20">
                            <span className="material-symbols-outlined text-xl">travel_explore</span>
                          </div>
                          <div>
                            <p className="font-headline text-xs font-bold text-on-surface">
                              Không tìm thấy &quot;{bggSearchQuery}&quot; trong danh mục tìm kiếm nhanh?
                            </p>
                            <p className="font-body text-[11px] text-on-surface-variant mt-0.5 max-w-md mx-auto">
                              Đây có thể là game ít phổ biến, bản mở rộng hoặc game mới ra mắt. Bạn có thể mở BGG lấy link và dán vào đây để nạp 100% tự động!
                            </p>
                          </div>
                          <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                            <button
                              type="button"
                              onClick={handleOpenBggSearchExternal}
                              className="px-3.5 py-2 rounded-lg bg-primary text-on-primary font-label text-[11px] font-bold flex items-center gap-1.5 hover:bg-primary-dim transition-all shadow-xs cursor-pointer"
                            >
                              <span className="material-symbols-outlined text-sm">open_in_new</span>
                              <span>Tìm &quot;{bggSearchQuery}&quot; trên BGG ↗</span>
                            </button>
                            <button
                              type="button"
                              onClick={handlePasteBggLinkAndSearch}
                              className="px-3.5 py-2 rounded-lg bg-surface-container-highest border border-outline-variant/40 text-on-surface font-label text-[11px] font-bold flex items-center gap-1.5 hover:bg-surface-container-high transition-all cursor-pointer"
                            >
                              <span className="material-symbols-outlined text-sm">content_paste</span>
                              <span>Dán Link & Tải Game</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setActiveTab('CUSTOM');
                                setNewGameForm((prev) => ({ ...prev, name: bggSearchQuery }));
                              }}
                              className="px-3 py-2 rounded-lg text-primary hover:bg-primary/10 font-label text-[11px] font-semibold transition-all cursor-pointer"
                            >
                              + Tự tạo thủ công
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Xem trước Game BGG đã chọn */}
                  {bggSelectedGame && (
                    <div className="p-4 rounded-xl border border-primary/40 bg-surface-container-high/40 space-y-3 animate-in fade-in">
                      <div className="flex gap-4 items-start">
                        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl bg-surface-container-high overflow-hidden border border-outline-variant/30 shrink-0 flex items-center justify-center">
                          <img
                            src={sanitizeImageUrl(bggSelectedGame.imageUrl)}
                            alt={bggSelectedGame.name}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.onerror = null;
                              e.currentTarget.src = DEFAULT_BG_IMAGE;
                            }}
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-label text-[10px] font-bold px-2 py-0.5 rounded bg-primary/20 text-primary">
                              BGG #{bggSelectedGame.bggId}
                            </span>
                            {bggSelectedGame.yearPublished && (
                              <span className="font-label text-[10px] text-on-surface-variant font-semibold">
                                ({bggSelectedGame.yearPublished})
                              </span>
                            )}
                          </div>
                          <h4 className="font-headline text-base font-bold text-on-surface mt-1 truncate">
                            {bggSelectedGame.name}
                          </h4>
                          <div className="flex flex-wrap gap-2.5 text-xs text-on-surface-variant mt-1">
                            <span>👥 {bggSelectedGame.minPlayers}-{bggSelectedGame.maxPlayers} người</span>
                            <span>⏱️ {bggSelectedGame.playTime} phút</span>
                            {bggSelectedGame.minAge && <span>🎂 {bggSelectedGame.minAge}+ tuổi</span>}
                          </div>
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {bggSelectedGame.categories?.slice(0, 4).map((cat, idx) => (
                              <span
                                key={idx}
                                className="font-label text-[9px] font-bold bg-surface-container-high text-on-surface-variant px-2 py-0.5 rounded-md"
                              >
                                {cat}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                      {bggSelectedGame.description && (
                        <p className="text-xs text-on-surface-variant line-clamp-3 italic font-body pt-1 border-t border-outline-variant/15">
                          &quot;{bggSelectedGame.description}&quot;
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                /* TAB 2: TỰ TẠO GAME MỚI */
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <label className="block font-label text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                        Tên boardgame *
                      </label>
                      <input
                        type="text"
                        value={gameForm.name}
                        onChange={(e) => setGameForm({ ...gameForm, name: e.target.value })}
                        required={addMode === 'new'}
                        placeholder="Ví dụ: Catan 3D, Terraforming Mars..."
                        className="w-full bg-surface-container-high/60 border border-outline-variant/30 rounded-xl px-4 py-2.5 font-body text-sm text-on-surface focus:outline-none focus:border-primary"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block font-label text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                        Link ảnh bìa game (URL)
                      </label>
                      <input
                        type="url"
                        value={gameForm.imageUrl}
                        onChange={(e) => setGameForm({ ...gameForm, imageUrl: e.target.value })}
                        placeholder="https://images.unsplash.com/..."
                        className="w-full bg-surface-container-high/60 border border-outline-variant/30 rounded-xl px-4 py-2.5 font-body text-sm text-on-surface focus:outline-none focus:border-primary"
                      />
                    </div>

                    <div>
                      <label className="block font-label text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                        Số người chơi tối thiểu - tối đa
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="1"
                          max="20"
                          value={gameForm.minPlayers}
                          onChange={(e) => setGameForm({ ...gameForm, minPlayers: e.target.value })}
                          className="w-full bg-surface-container-high/60 border border-outline-variant/30 rounded-xl px-3 py-2 text-sm text-center font-body"
                        />
                        <span>-</span>
                        <input
                          type="number"
                          min="1"
                          max="30"
                          value={gameForm.maxPlayers}
                          onChange={(e) => setGameForm({ ...gameForm, maxPlayers: e.target.value })}
                          className="w-full bg-surface-container-high/60 border border-outline-variant/30 rounded-xl px-3 py-2 text-sm text-center font-body"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block font-label text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                        Thời gian chơi (Phút)
                      </label>
                      <input
                        type="number"
                        min="5"
                        max="600"
                        value={gameForm.playTime}
                        onChange={(e) => setGameForm({ ...gameForm, playTime: e.target.value })}
                        className="w-full bg-surface-container-high/60 border border-outline-variant/30 rounded-xl px-4 py-2 text-sm font-body"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block font-label text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1.5">
                        Thể loại
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {POPULAR_CATEGORIES.map((cat) => {
                          const isSelected = gameForm.categories.includes(cat);
                          return (
                            <button
                              type="button"
                              key={cat}
                              onClick={() => toggleCategory(cat)}
                              className={`px-3 py-1 rounded-lg font-label text-xs font-bold transition-all cursor-pointer ${
                                isSelected
                                  ? 'bg-primary text-on-primary shadow-xs'
                                  : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest'
                              }`}
                            >
                              {cat}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* PHẦN THÔNG TIN SỞ HỮU CÁ NHÂN (CẢ 2 TAB DÙNG CHUNG) */}
              <div className="border-t border-outline-variant/20 pt-4 space-y-4">
                <h4 className="font-headline text-sm font-bold text-primary uppercase">
                  Thông tin sở hữu & tình trạng trên kệ
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-label text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                      Tình trạng box & phụ kiện
                    </label>
                    <select
                      value={gameForm.condition}
                      onChange={(e) => setGameForm({ ...gameForm, condition: e.target.value })}
                      className="w-full bg-surface-container-high/60 border border-outline-variant/30 rounded-xl px-3 py-2.5 font-body text-sm text-on-surface focus:outline-none focus:border-primary"
                    >
                      {CONDITION_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-label text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                      Trạng thái hiện tại
                    </label>
                    <select
                      value={gameForm.status}
                      onChange={(e) => setGameForm({ ...gameForm, status: e.target.value })}
                      className="w-full bg-surface-container-high/60 border border-outline-variant/30 rounded-xl px-3 py-2.5 font-body text-sm text-on-surface focus:outline-none focus:border-primary"
                    >
                      <option value="ON_SHELF">🏠 Đang trên kệ</option>
                      <option value="LENT_OUT">🤝 Đang cho mượn</option>
                      <option value="FOR_SALE">🏷️ Muốn bán / cho thuê</option>
                      <option value="WISHLIST">💖 Muốn sưu tầm</option>
                    </select>
                  </div>

                  {/* Nếu trạng thái là ĐANG CHO MƯỢN */}
                  {gameForm.status === 'LENT_OUT' && (
                    <>
                      <div>
                        <label className="block font-label text-xs font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300 mb-1">
                          Tên người mượn *
                        </label>
                        <input
                          type="text"
                          value={gameForm.borrower}
                          onChange={(e) => setGameForm({ ...gameForm, borrower: e.target.value })}
                          required
                          placeholder="Ví dụ: Hoàng Nam, Bạn Đại học..."
                          className="w-full bg-amber-500/10 border border-amber-500/40 rounded-xl px-3 py-2 font-body text-sm text-on-surface focus:outline-none focus:border-amber-500"
                        />
                      </div>

                      <div>
                        <label className="block font-label text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                          Ngày hẹn trả
                        </label>
                        <input
                          type="date"
                          value={gameForm.expectedReturnDate}
                          onChange={(e) => setGameForm({ ...gameForm, expectedReturnDate: e.target.value })}
                          className="w-full bg-surface-container-high/60 border border-outline-variant/30 rounded-xl px-3 py-2 font-body text-sm text-on-surface"
                        />
                      </div>
                    </>
                  )}

                  <div>
                    <label className="block font-label text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                      Đánh giá của bạn (1 - 5 sao)
                    </label>
                    <select
                      value={gameForm.personalRating}
                      onChange={(e) => setGameForm({ ...gameForm, personalRating: parseFloat(e.target.value) })}
                      className="w-full bg-surface-container-high/60 border border-outline-variant/30 rounded-xl px-3 py-2.5 font-body text-sm text-on-surface"
                    >
                      <option value="5">⭐⭐⭐⭐⭐ (5.0 - Cực phẩm)</option>
                      <option value="4.5">⭐⭐⭐⭐½ (4.5 - Rất thích)</option>
                      <option value="4">⭐⭐⭐⭐ (4.0 - Game hay)</option>
                      <option value="3.5">⭐⭐⭐½ (3.5 - Khá ổn)</option>
                      <option value="3">⭐⭐⭐ (3.0 - Chơi tạm)</option>
                      <option value="2">⭐⭐ (2.0 - Không hợp gu)</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block font-label text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                      Ghi chú cá nhân (Bản mở rộng, phụ kiện, kỷ niệm...)
                    </label>
                    <input
                      type="text"
                      value={gameForm.personalNotes}
                      onChange={(e) => setGameForm({ ...gameForm, personalNotes: e.target.value })}
                      placeholder="Ví dụ: Đã kèm 2 bản mở rộng, bọc bài dày, hộp cấn góc..."
                      className="w-full bg-surface-container-high/60 border border-outline-variant/30 rounded-xl px-3 py-2 font-body text-sm text-on-surface focus:outline-none focus:border-primary"
                    />
                  </div>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-outline-variant/20">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-outline-variant/40 font-label text-xs uppercase tracking-wider text-on-surface hover:bg-surface-container-high transition-colors cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={
                    isSubmitting ||
                    (addMode === 'new' && !gameForm.name.trim()) ||
                    (addMode === 'bgg' && !bggSelectedGame)
                  }
                  className="px-6 py-2.5 rounded-xl bg-tertiary text-on-tertiary font-label text-xs uppercase tracking-widest font-bold shadow-md hover:bg-tertiary-fixed-dim disabled:opacity-40 transition-all cursor-pointer flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-on-tertiary border-t-transparent rounded-full animate-spin"></div>
                      <span>Đang lưu...</span>
                    </>
                  ) : addMode === 'bgg' ? (
                    <>
                      <span className="material-symbols-outlined text-base">cloud_download</span>
                      <span>Lưu Game BGG Vào Kệ</span>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-base">add_circle</span>
                      <span>Lưu Vào Kệ</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/*                   MODAL: SỬA GAME                              */}
      {/* ============================================================== */}
      {isEditModalOpen && selectedItem && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-surface-container-lowest border border-outline-variant/30 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden my-8">
            <div className="px-6 py-4 border-b border-outline-variant/20 flex items-center justify-between bg-surface-container-high/40">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-xl">edit</span>
                <h3 className="font-headline text-lg font-bold text-on-surface uppercase truncate max-w-xs">
                  Sửa: {selectedItem.game?.name}
                </h3>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="material-symbols-outlined text-on-surface-variant hover:text-on-surface text-xl cursor-pointer"
              >
                close
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
              <div>
                <label className="block font-label text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                  Tình trạng Box & Phụ kiện
                </label>
                <select
                  value={gameForm.condition}
                  onChange={(e) => setGameForm({ ...gameForm, condition: e.target.value })}
                  className="w-full bg-surface-container-high/60 border border-outline-variant/30 rounded-xl px-3 py-2.5 font-body text-sm text-on-surface"
                >
                  {CONDITION_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-label text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                  Trạng thái sở hữu
                </label>
                <select
                  value={gameForm.status}
                  onChange={(e) => setGameForm({ ...gameForm, status: e.target.value })}
                  className="w-full bg-surface-container-high/60 border border-outline-variant/30 rounded-xl px-3 py-2.5 font-body text-sm text-on-surface"
                >
                  <option value="ON_SHELF">🏠 Đang trên kệ</option>
                  <option value="LENT_OUT">🤝 Đang cho mượn</option>
                  <option value="FOR_SALE">🏷️ Muốn bán / cho thuê</option>
                  <option value="WISHLIST">💖 Muốn sưu tầm</option>
                </select>
              </div>

              {gameForm.status === 'LENT_OUT' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-amber-500/10 rounded-xl border border-amber-500/30">
                  <div className="sm:col-span-2">
                    <label className="block font-label text-[10px] font-bold uppercase tracking-wider text-amber-900 dark:text-amber-200 mb-1">
                      Tên người mượn *
                    </label>
                    <input
                      type="text"
                      value={gameForm.borrower}
                      onChange={(e) => setGameForm({ ...gameForm, borrower: e.target.value })}
                      required
                      placeholder="Tên bạn bè / người mượn"
                      className="w-full bg-surface border border-amber-500/40 rounded-lg px-3 py-1.5 text-sm font-body"
                    />
                  </div>
                  <div>
                    <label className="block font-label text-[10px] font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                      Ngày cho mượn
                    </label>
                    <input
                      type="date"
                      value={gameForm.borrowedDate}
                      onChange={(e) => setGameForm({ ...gameForm, borrowedDate: e.target.value })}
                      className="w-full bg-surface border border-outline-variant/30 rounded-lg px-2 py-1.5 text-xs font-body"
                    />
                  </div>
                  <div>
                    <label className="block font-label text-[10px] font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                      Ngày hẹn trả
                    </label>
                    <input
                      type="date"
                      value={gameForm.expectedReturnDate}
                      onChange={(e) => setGameForm({ ...gameForm, expectedReturnDate: e.target.value })}
                      className="w-full bg-surface border border-outline-variant/30 rounded-lg px-2 py-1.5 text-xs font-body"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block font-label text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                  Đánh giá cá nhân
                </label>
                <select
                  value={gameForm.personalRating}
                  onChange={(e) => setGameForm({ ...gameForm, personalRating: parseFloat(e.target.value) })}
                  className="w-full bg-surface-container-high/60 border border-outline-variant/30 rounded-xl px-3 py-2 font-body text-sm"
                >
                  <option value="5">⭐⭐⭐⭐⭐ (5.0 - Cực phẩm)</option>
                  <option value="4.5">⭐⭐⭐⭐½ (4.5 - Rất thích)</option>
                  <option value="4">⭐⭐⭐⭐ (4.0 - Game hay)</option>
                  <option value="3.5">⭐⭐⭐½ (3.5 - Khá ổn)</option>
                  <option value="3">⭐⭐⭐ (3.0 - Chơi tạm)</option>
                  <option value="2">⭐⭐ (2.0 - Không hợp gu)</option>
                </select>
              </div>

              <div>
                <label className="block font-label text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                  Ghi chú riêng
                </label>
                <textarea
                  rows="2"
                  value={gameForm.personalNotes}
                  onChange={(e) => setGameForm({ ...gameForm, personalNotes: e.target.value })}
                  placeholder="Ghi chú về bản mở rộng, bọc bài, tình trạng hộp..."
                  className="w-full bg-surface-container-high/60 border border-outline-variant/30 rounded-xl px-3 py-2 text-sm font-body focus:outline-none focus:border-primary"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-outline-variant/20">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-outline-variant/40 font-label text-xs uppercase text-on-surface"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-tertiary text-on-tertiary font-label text-xs uppercase tracking-wider font-bold shadow-md hover:bg-tertiary-fixed-dim"
                >
                  {isSubmitting ? 'Đang lưu...' : 'Lưu Thay Đổi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/*                   MODAL: XÁC NHẬN XÓA                          */}
      {/* ============================================================== */}
      {isDeleteModalOpen && selectedItem && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-surface-container-lowest border border-outline-variant/30 w-full max-w-md rounded-2xl shadow-2xl p-6 text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-error/10 text-error flex items-center justify-center mx-auto">
              <span className="material-symbols-outlined text-3xl">delete</span>
            </div>
            <h3 className="font-headline text-xl font-bold text-on-surface uppercase">
              Xác nhận xóa khỏi kho?
            </h3>
            <p className="font-body text-sm text-on-surface-variant">
              Bạn có chắc chắn muốn xóa tựa game{' '}
              <strong className="text-on-surface">&quot;{selectedItem.game?.name}&quot;</strong> khỏi kệ game của bạn? (Thông tin game gốc trong hệ thống vẫn sẽ được giữ nguyên).
            </p>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-5 py-2.5 rounded-xl border border-outline-variant/40 font-label text-xs uppercase tracking-wider text-on-surface hover:bg-surface-container-high"
              >
                Không, giữ lại
              </button>
              <button
                onClick={handleDeleteSubmit}
                disabled={isSubmitting}
                className="px-5 py-2.5 rounded-xl bg-error text-white font-label text-xs uppercase tracking-wider font-bold shadow-md hover:bg-error/90"
              >
                {isSubmitting ? 'Đang xóa...' : 'Đồng ý xóa'}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ============================================================== */}
      {/*                   MODAL: NHẬP GAME TỪ CSV                      */}
      {/* ============================================================== */}
      {isCsvModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-surface-container-lowest border border-outline-variant/30 w-full max-w-5xl rounded-2xl shadow-2xl overflow-hidden my-6 max-h-[92vh] flex flex-col">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-outline-variant/20 flex items-center justify-between bg-surface-container-high/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <span className="material-symbols-outlined text-2xl">table_view</span>
                </div>
                <div>
                  <h3 className="font-headline text-lg sm:text-xl font-bold text-on-surface uppercase">
                    Nhập Kho Hàng Loạt Bằng Excel (.xlsx) / CSV
                  </h3>
                  <p className="font-body text-xs text-on-surface-variant">
                    Tải file Excel mẫu (.xlsx), điền danh sách boardgame và tải lên để tự động thêm vào kệ.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleDownloadTemplate}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-emerald-500/30 hover:border-emerald-500 text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 font-label text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
                  title="Tải file Excel mẫu (.xlsx) chuẩn về máy"
                >
                  <span className="material-symbols-outlined text-sm">download</span>
                  <span className="hidden sm:inline">Tải File Excel Mẫu (.xlsx)</span>
                </button>

                <button
                  onClick={() => setIsCsvModalOpen(false)}
                  className="material-symbols-outlined text-on-surface-variant hover:text-on-surface text-xl cursor-pointer p-1 rounded-lg hover:bg-surface-container-high"
                >
                  close
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              {/* Error Message */}
              {csvError && (
                <div className="p-4 rounded-xl bg-error/10 border border-error/30 text-error flex items-start gap-3">
                  <span className="material-symbols-outlined text-xl shrink-0">error</span>
                  <div className="text-xs font-body flex-1">
                    <p className="font-bold">Đã có lỗi xảy ra:</p>
                    <p>{csvError}</p>
                  </div>
                </div>
              )}

              {/* Upload Zone khi chưa chọn file hoặc muốn chọn lại */}
              {parsedCsvGames.length === 0 ? (
                <div className="space-y-4">
                  <label className="border-2 border-dashed border-outline-variant/40 hover:border-primary/60 rounded-2xl p-8 sm:p-12 flex flex-col items-center justify-center text-center cursor-pointer transition-all bg-surface-container-high/20 hover:bg-surface-container-high/40 group">
                    <input
                      type="file"
                      accept=".xlsx,.xls,.csv,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
                      onChange={handleCsvFileSelect}
                      className="hidden"
                    />
                    <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform flex items-center justify-center mb-4">
                      <span className="material-symbols-outlined text-3xl">upload_file</span>
                    </div>
                    <h4 className="font-headline text-base sm:text-lg font-bold text-on-surface mb-1">
                      Kéo thả file Excel (.xlsx, .xls) hoặc CSV vào đây
                    </h4>
                    <p className="font-body text-xs sm:text-sm text-on-surface-variant max-w-md mb-4">
                      Hỗ trợ trực tiếp file Excel (.xlsx) chuẩn Unicode 100% từ Microsoft Excel, Google Sheets, LibreOffice, WPS Office...
                    </p>
                    <span className="px-5 py-2 rounded-xl bg-primary text-on-primary font-label text-xs uppercase tracking-widest font-bold shadow-xs">
                      Chọn file Excel / CSV từ máy
                    </span>
                  </label>

                  {/* Hướng dẫn nhanh */}
                  <div className="bg-surface-container-high/30 rounded-xl p-4 border border-outline-variant/20 space-y-2 text-xs font-body text-on-surface-variant">
                    <p className="font-bold text-on-surface flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-primary text-base">auto_awesome</span>
                      Quy tắc xử lý tự động từ BoardGameGeek (BGG):
                    </p>
                    <ul className="list-disc list-inside space-y-1 pl-1">
                      <li>File mẫu chỉ cần 3 cột đơn giản: <strong>Link BGG / BGG ID</strong>, <strong>Tên BoardGame</strong>, và <strong>Ghi chú cá nhân</strong>.</li>
                      <li>Khi có Link BGG (hoặc BGG ID), hệ thống sẽ <strong>tự động kéo toàn bộ ảnh HD, số người chơi, thời gian, mô tả và thể loại gốc từ BGG</strong>.</li>
                      <li>Nếu là game tự chế/dân gian không có trên BGG, bạn chỉ cần điền <strong>Tên BoardGame</strong>.</li>
                    </ul>
                  </div>
                </div>
              ) : (
                /* ĐÃ PARSE THÀNH CÔNG: HIỂN THỊ PREVIEW TABLE CÓ PHÂN TRANG */
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-surface-container-high/40 p-4 rounded-xl border border-outline-variant/20">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-emerald-600 text-xl">task_alt</span>
                      <div>
                        <p className="font-headline text-sm font-bold text-on-surface">
                          Đã đọc {parsedCsvGames.length} boardgame từ file: <span className="text-primary">{csvFileName}</span>
                        </p>
                        <p className="font-body text-xs text-on-surface-variant">
                          Hệ thống sẽ tự động kết nối BGG để tải ảnh HD và thông số của các game có Link/ID khi bạn bấm &quot;Nhập vào kho&quot;.
                        </p>
                      </div>
                    </div>

                    <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-outline-variant/30 hover:border-primary text-on-surface font-label text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer bg-surface shrink-0">
                      <input
                        type="file"
                        accept=".xlsx,.xls,.csv,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
                        onChange={handleCsvFileSelect}
                        className="hidden"
                      />
                      <span className="material-symbols-outlined text-sm">swap_horiz</span>
                      <span>Đổi file khác</span>
                    </label>
                  </div>

                  {/* BẢNG PREVIEW PHÂN TRANG (TỐI ĐA 10 GAME / TRANG) */}
                  <div className="border border-outline-variant/20 rounded-xl overflow-hidden bg-surface">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse font-body text-xs">
                        <thead>
                          <tr className="bg-surface-container-high/60 border-b border-outline-variant/20 font-label text-[10px] uppercase font-bold tracking-wider text-on-surface-variant">
                            <th className="py-2.5 px-3 w-12 text-center">#</th>
                            <th className="py-2.5 px-4 min-w-[180px]">Tên BoardGame</th>
                            <th className="py-2.5 px-4 min-w-[220px]">Link BGG / BGG ID</th>
                            <th className="py-2.5 px-4">Ghi chú cá nhân</th>
                            <th className="py-2.5 px-3 w-36 text-center">Tự động nạp BGG</th>
                            <th className="py-2.5 px-3 w-16 text-center">Xóa</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-outline-variant/10">
                          {parsedCsvGames
                            .slice((csvPage - 1) * csvLimit, csvPage * csvLimit)
                            .map((item, idx) => {
                              const globalIndex = (csvPage - 1) * csvLimit + idx + 1;
                              const hasBgg = Boolean(item.bggId || item.bggLink);

                              return (
                                <tr key={item._id} className="hover:bg-surface-container-high/20 transition-colors">
                                  <td className="py-3 px-3 text-center text-on-surface-variant font-bold">
                                    {globalIndex}
                                  </td>
                                  <td className="py-3 px-4 min-w-[180px]">
                                    <h5 className="font-headline text-sm font-bold text-on-surface">
                                      {item.name || (item.bggId ? `BGG Game #${item.bggId}` : 'Chưa đặt tên')}
                                    </h5>
                                  </td>
                                  <td className="py-3 px-4 min-w-[220px]">
                                    {hasBgg ? (
                                      <div className="flex items-center gap-1.5">
                                        <span className="font-label text-[10px] font-bold bg-primary/10 text-primary px-2 py-0.5 rounded border border-primary/20 shrink-0">
                                          {item.bggId ? `BGG #${item.bggId}` : 'BGG Link'}
                                        </span>
                                        <span className="font-mono text-[11px] text-on-surface-variant truncate max-w-[180px]" title={item.bggLink}>
                                          {item.bggLink}
                                        </span>
                                      </div>
                                    ) : (
                                      <span className="text-[11px] text-on-surface-variant italic">
                                        (Không có - tạo game tự do)
                                      </span>
                                    )}
                                  </td>
                                  <td className="py-3 px-4">
                                    {item.personalNotes ? (
                                      <p className="text-xs text-on-surface font-body max-w-sm">
                                        📝 {item.personalNotes}
                                      </p>
                                    ) : (
                                      <span className="text-on-surface-variant/40 italic text-[11px]">Không có ghi chú</span>
                                    )}
                                  </td>
                                  <td className="py-3 px-3 text-center">
                                    {hasBgg ? (
                                      <span className="inline-flex items-center gap-1 font-label text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
                                        <span className="material-symbols-outlined text-xs">sync</span>
                                        Tự tải từ BGG
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center gap-1 font-label text-[10px] font-medium text-on-surface-variant bg-surface-container border border-outline-variant/20 px-2 py-0.5 rounded">
                                        Thủ công
                                      </span>
                                    )}
                                  </td>
                                  <td className="py-3 px-3 text-center">
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveParsedRow(item._id)}
                                      className="material-symbols-outlined text-on-surface-variant hover:text-error text-base cursor-pointer p-1 rounded hover:bg-error/10"
                                      title="Bỏ game này khỏi danh sách nạp"
                                    >
                                      delete
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                        </tbody>
                      </table>
                    </div>

                    {/* Phân trang của bảng CSV Preview */}
                    <div className="p-3 bg-surface-container-high/30 border-t border-outline-variant/20 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                      <p className="text-on-surface-variant">
                        Trang <strong className="text-on-surface">{csvPage}</strong> /{' '}
                        <strong className="text-on-surface">
                          {Math.ceil(parsedCsvGames.length / csvLimit) || 1}
                        </strong>{' '}
                        (Tổng số {parsedCsvGames.length} game - Tối đa 10 game/trang)
                      </p>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          disabled={csvPage <= 1}
                          onClick={() => setCsvPage((p) => Math.max(1, p - 1))}
                          className="px-3 py-1.5 rounded-lg border border-outline-variant/30 font-label text-xs font-bold uppercase disabled:opacity-40 disabled:pointer-events-none hover:border-primary transition-colors cursor-pointer flex items-center gap-1"
                        >
                          <span className="material-symbols-outlined text-xs">chevron_left</span>
                          <span>Trước</span>
                        </button>

                        <span className="font-bold text-primary px-2">{csvPage}</span>

                        <button
                          type="button"
                          disabled={csvPage >= Math.ceil(parsedCsvGames.length / csvLimit)}
                          onClick={() =>
                            setCsvPage((p) => Math.min(Math.ceil(parsedCsvGames.length / csvLimit), p + 1))
                          }
                          className="px-3 py-1.5 rounded-lg border border-outline-variant/30 font-label text-xs font-bold uppercase disabled:opacity-40 disabled:pointer-events-none hover:border-primary transition-colors cursor-pointer flex items-center gap-1"
                        >
                          <span>Sau</span>
                          <span className="material-symbols-outlined text-xs">chevron_right</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="px-6 py-4 border-t border-outline-variant/20 flex flex-col sm:flex-row items-center justify-between gap-3 bg-surface-container-high/30">
              <div className="text-xs text-on-surface-variant font-body">
                {parsedCsvGames.length > 0
                  ? `Sẵn sàng nhập ${parsedCsvGames.length} boardgame vào kệ của bạn.`
                  : 'Vui lòng chọn file CSV để tiếp tục.'}
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={() => setIsCsvModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-outline-variant/40 font-label text-xs uppercase tracking-wider text-on-surface hover:bg-surface-container-high transition-colors cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  disabled={parsedCsvGames.length === 0 || isImportingCsv}
                  onClick={handleImportCsvSubmit}
                  className="px-6 py-2.5 rounded-xl bg-tertiary text-on-tertiary font-label text-xs uppercase tracking-widest font-bold shadow-md hover:bg-tertiary-fixed-dim disabled:opacity-40 transition-all cursor-pointer flex items-center gap-2"
                >
                  {isImportingCsv ? (
                    <>
                      <div className="w-4 h-4 border-2 border-on-tertiary border-t-transparent rounded-full animate-spin"></div>
                      <span>Đang nạp dữ liệu...</span>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-base">cloud_upload</span>
                      <span>Nhập {parsedCsvGames.length} Game Vào Kệ</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
