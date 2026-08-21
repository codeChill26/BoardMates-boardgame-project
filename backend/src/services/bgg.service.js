/**
 * Service tích hợp BoardGameGeek (BGG API & Geekdo JSON API)
 * Hỗ trợ tra cứu chi tiết game, lấy ảnh HD, lấy danh sách Hotness và nạp vào Database
 */

const fs = require('fs');
const path = require('path');
const prisma = require('../middleware/prismaClient');

// Nạp 135+ game chất lượng cao từ top100_boardgames.json
let TOP_JSON_GAMES = [];
try {
  const jsonPath = path.join(__dirname, '../../data/top100_boardgames.json');
  if (fs.existsSync(jsonPath)) {
    TOP_JSON_GAMES = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  }
} catch (e) {
  console.warn('Could not load top100_boardgames.json in bgg.service:', e.message);
}

// Nạp 72,000+ BoardGame từ bgg_72k_index.json (Dữ liệu BGG toàn cầu)
let BGG_72K_INDEX = [];
try {
  const index72kPath = path.join(__dirname, '../../data/bgg_72k_index.json');
  if (fs.existsSync(index72kPath)) {
    BGG_72K_INDEX = JSON.parse(fs.readFileSync(index72kPath, 'utf8'));
    console.log(`[BGG Service] Loaded ${BGG_72K_INDEX.length} BGG games into memory.`);
  }
} catch (e) {
  console.warn('Could not load bgg_72k_index.json:', e.message);
}

// Hàm loại bỏ các thẻ HTML trong mô tả
function stripHtmlTags(html) {
  if (!html) return '';
  return html
    .replace(/<br\s*[\/]?>/gi, '\n')
    .replace(/<\/?[^>]+(>|$)/g, '')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .trim();
}

// In-memory cache cho chi tiết BGG
const BGG_DETAILS_CACHE = new Map();

/**
 * Lấy thông tin chi tiết một BoardGame từ BGG bằng BGG Object ID (ví dụ: 13 cho Catan, 224517 cho Brass: Birmingham)
 */
async function getBggGameById(bggId) {
  if (!bggId) throw new Error('Vui lòng cung cấp BGG ID');

  const cleanId = parseInt(bggId, 10);
  if (isNaN(cleanId)) throw new Error('BGG ID phải là số nguyên hợp lệ');

  if (BGG_DETAILS_CACHE.has(cleanId)) {
    return BGG_DETAILS_CACHE.get(cleanId);
  }

  const url = `https://api.geekdo.com/api/geekitems?objectid=${cleanId}&objecttype=thing`;

  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      Accept: 'application/json',
    },
  });

  if (!res.ok) {
    throw new Error(`BGG API trả về mã lỗi: ${res.status}`);
  }

  const data = await res.json();
  const item = data?.item;

  if (!item || !item.name) {
    throw new Error(`Không tìm thấy thông tin BoardGame với BGG ID: ${cleanId}`);
  }

  // Trích xuất danh mục / thể loại
  const categories = Array.isArray(item.links?.boardgamecategory)
    ? item.links.boardgamecategory.map((c) => c.name).filter(Boolean)
    : ['Board Game'];

  // Trích xuất nhà phát hành
  const publisher = item.links?.boardgamepublisher?.[0]?.name || 'BoardGameGeek';

  // Trích xuất ảnh gốc chất lượng cao
  const imageUrl =
    item.images?.square200 ||
    item.images?.previewthumb ||
    item.images?.thumb ||
    item.images?.original ||
    item.imageurl ||
    'https://images.unsplash.com/photo-1610890716171-6b1bb98ffd09?auto=format&fit=crop&w=800&q=80';

  const cleanDescription = stripHtmlTags(item.description);

  const result = {
    bggId: cleanId,
    name: item.name,
    yearPublished: item.yearpublished ? parseInt(item.yearpublished, 10) : null,
    minPlayers: item.minplayers ? parseInt(item.minplayers, 10) : 1,
    maxPlayers: item.maxplayers ? parseInt(item.maxplayers, 10) : 4,
    playTime: item.maxplaytime ? parseInt(item.maxplaytime, 10) : (item.minplaytime ? parseInt(item.minplaytime, 10) : 45),
    minAge: item.minage ? parseInt(item.minage, 10) : 10,
    categories,
    publisher,
    imageUrl,
    description: cleanDescription,
    bggLink: item.canonical_link || `https://boardgamegeek.com/boardgame/${cleanId}`,
  };

  BGG_DETAILS_CACHE.set(cleanId, result);
  return result;
}

/**
 * Lấy danh sách Top 50 BoardGame đang thịnh hành (Hotness) trên BGG
 */
async function getBggHotness() {
  const url = 'https://api.geekdo.com/api/hotness';

  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      Accept: 'application/json',
    },
  });

  if (!res.ok) {
    throw new Error(`BGG Hotness trả về lỗi: ${res.status}`);
  }

  const data = await res.json();
  const items = Array.isArray(data?.items) ? data.items : [];

  return items.map((g) => ({
    bggId: parseInt(g.objectid, 10),
    name: g.name,
    imageUrl: g.imageurl,
    bggLink: `https://boardgamegeek.com${g.href || ''}`,
  }));
}

/**
 * Tự động nạp hoặc cập nhật 1 game từ BGG vào cơ sở dữ liệu BoardGame của hệ thống
 */
async function importBggGameToDatabase(bggId) {
  const bggData = await getBggGameById(bggId);

  let existing = await prisma.boardGame.findFirst({
    where: {
      name: {
        equals: bggData.name.trim(),
        mode: 'insensitive',
      },
    },
  });

  if (existing) {
    // Cập nhật thông tin nếu có ảnh hoặc thể loại mới
    existing = await prisma.boardGame.update({
      where: { id: existing.id },
      data: {
        imageUrl: bggData.imageUrl || existing.imageUrl,
        description: bggData.description || existing.description,
        categories: bggData.categories.length > 0 ? bggData.categories : existing.categories,
        minPlayers: bggData.minPlayers ?? existing.minPlayers,
        maxPlayers: bggData.maxPlayers ?? existing.maxPlayers,
        playTime: bggData.playTime ?? existing.playTime,
        age: bggData.minAge ?? existing.age,
        publisher: bggData.publisher || existing.publisher,
      },
    });
    return { isNew: false, game: existing };
  } else {
    const created = await prisma.boardGame.create({
      data: {
        name: bggData.name.trim(),
        description: bggData.description,
        categories: bggData.categories,
        minPlayers: bggData.minPlayers,
        maxPlayers: bggData.maxPlayers,
        playTime: bggData.playTime,
        age: bggData.minAge,
        publisher: bggData.publisher,
        imageUrl: bggData.imageUrl,
      },
    });
    return { isNew: true, game: created };
  }
}

function removeVietnameseTones(str) {
  if (!str) return '';
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .trim();
}

/**
 * Tìm kiếm BoardGame từ BGG theo Tên hoặc BGG ID
 */
async function searchBggGames(query) {
  if (!query || typeof query !== 'string') return [];
  const q = query.trim().toLowerCase();
  if (!q) return [];

  const cleanQ = removeVietnameseTones(q);

  // Nếu là số ID (ví dụ: 13, 224517, 15987...)
  const numericId = parseInt(q, 10);
  if (!isNaN(numericId) && numericId > 0 && String(numericId) === q) {
    try {
      const directGame = await getBggGameById(numericId);
      return [
        {
          bggId: directGame.bggId,
          name: directGame.name,
          imageUrl: directGame.imageUrl,
          year: directGame.yearPublished,
          minPlayers: directGame.minPlayers,
          maxPlayers: directGame.maxPlayers,
          playTime: directGame.playTime,
          categories: directGame.categories,
          publisher: directGame.publisher,
        },
      ];
    } catch (e) {
      console.warn('Direct BGG ID lookup failed, fallback to name search:', e.message);
    }
  }

  const results = [];
  const seenIds = new Set();
  const seenNames = new Set();

  // 1. Tìm trong TOP_JSON_GAMES
  for (const g of TOP_JSON_GAMES) {
    const nameNorm = removeVietnameseTones(g.name);
    const descNorm = removeVietnameseTones(g.description || '');
    if (
      (nameNorm.includes(cleanQ) || descNorm.includes(cleanQ) || g.name.toLowerCase().includes(q)) &&
      !seenNames.has(g.name.toLowerCase())
    ) {
      results.push({
        bggId: g.bggId || Math.floor(Math.random() * 900000 + 100000),
        name: g.name,
        imageUrl: g.imageUrl,
        year: g.year || 2020,
        minPlayers: g.minPlayers,
        maxPlayers: g.maxPlayers,
        playTime: g.playTime,
        categories: g.categories,
        description: g.description,
        publisher: g.publisher,
      });
      if (g.bggId) seenIds.add(g.bggId);
      seenNames.add(g.name.toLowerCase());
    }
  }

  // 2. Tìm trong BGG 72K Index (Toàn bộ 72,000 game thế giới)
  let count72k = 0;
  for (let i = 0; i < BGG_72K_INDEX.length; i++) {
    const [bggId, bggName] = BGG_72K_INDEX[i];
    const nameLower = bggName.toLowerCase();
    const nameNorm = removeVietnameseTones(bggName);

    if (
      (nameLower.includes(q) || nameNorm.includes(cleanQ)) &&
      !seenIds.has(bggId) &&
      !seenNames.has(nameLower)
    ) {
      results.push({
        bggId: bggId,
        name: bggName,
        imageUrl: null,
        year: null,
      });
      seenIds.add(bggId);
      seenNames.add(nameLower);
      count72k++;
      if (count72k >= 12) break;
    }
  }

  // 3. Tìm trong bảng BoardGame Database
  try {
    const dbGames = await prisma.boardGame.findMany({
      where: {
        name: {
          contains: q,
          mode: 'insensitive',
        },
      },
      take: 10,
    });

    for (const dbg of dbGames) {
      if (!seenNames.has(dbg.name.toLowerCase())) {
        results.push({
          bggId: dbg.id,
          name: dbg.name,
          imageUrl: dbg.imageUrl,
          minPlayers: dbg.minPlayers,
          maxPlayers: dbg.maxPlayers,
          playTime: dbg.playTime,
          categories: dbg.categories,
          description: dbg.description,
          publisher: dbg.publisher,
          isDbMaster: true,
        });
        seenNames.add(dbg.name.toLowerCase());
      }
    }
  } catch (e) {
    // Ignore DB error
  }

  // 4. Lấy live thumbnail ảnh HD thực tế từ BGG cho top kết quả song song
  const topCandidates = results.slice(0, 12);
  await Promise.allSettled(
    topCandidates.map(async (item) => {
      if (item.bggId && (!item.imageUrl || item.imageUrl.includes('unsplash.com'))) {
        try {
          const detail = await getBggGameById(item.bggId);
          if (detail && detail.imageUrl) {
            item.imageUrl = detail.imageUrl;
            item.year = detail.yearPublished || item.year;
            item.minPlayers = detail.minPlayers || item.minPlayers;
            item.maxPlayers = detail.maxPlayers || item.maxPlayers;
            item.playTime = detail.playTime || item.playTime;
            item.categories = detail.categories || item.categories;
          }
        } catch (e) {
          // Fallback image
          if (!item.imageUrl) {
            item.imageUrl = 'https://images.unsplash.com/photo-1610890716171-6b1bb98ffd09?auto=format&fit=crop&w=800&q=80';
          }
        }
      }
    })
  );

  return results.slice(0, 20);
}

module.exports = {
  getBggGameById,
  getBggHotness,
  searchBggGames,
  importBggGameToDatabase,
};


module.exports = {
  getBggGameById,
  getBggHotness,
  searchBggGames,
  importBggGameToDatabase,
};

