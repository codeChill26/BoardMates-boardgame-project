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

/**
 * Lấy thông tin chi tiết một BoardGame từ BGG bằng BGG Object ID (ví dụ: 13 cho Catan, 224517 cho Brass: Birmingham)
 */
async function getBggGameById(bggId) {
  if (!bggId) throw new Error('Vui lòng cung cấp BGG ID');

  const cleanId = parseInt(bggId, 10);
  if (isNaN(cleanId)) throw new Error('BGG ID phải là số nguyên hợp lệ');

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
    item.images?.original ||
    item.images?.medium ||
    item.imageurl ||
    'https://images.unsplash.com/photo-1610890716171-6b1bb98ffd09?auto=format&fit=crop&w=800&q=80';

  const cleanDescription = stripHtmlTags(item.description);

  return {
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

// Danh sách game nổi tiếng với BGG ID tương ứng để tìm kiếm nhanh
const POPULAR_BGG_MAP = [
  { bggId: 13, name: 'Catan', year: 1995, imageUrl: 'https://cf.geekdo-images.com/W3Bsga_uLP9YO91gZVa3fQ__original/img/b_Bh3kO9y_2J6W7_6xZ_7k_8q_0=/0x0/filters:format(jpeg)/pic2419375.jpg' },
  { bggId: 224517, name: 'Brass: Birmingham', year: 2018, imageUrl: 'https://cf.geekdo-images.com/x3zxjr-Vw5iU4yDPg70Jgw__original/img/FpyxH41Y6_ROoePAilPNEhXnzO8=/0x0/filters:format(jpeg)/pic3490053.jpg' },
  { bggId: 174430, name: 'Gloomhaven', year: 2017, imageUrl: 'https://cf.geekdo-images.com/sZYp_3BTDGjh2unaZfZmuA__original/img/7m4w-4t1gDvd6jDq1fI5J6_K6kU=/0x0/filters:format(jpeg)/pic2437871.jpg' },
  { bggId: 266192, name: 'Wingspan', year: 2019, imageUrl: 'https://cf.geekdo-images.com/yLZJCVLlIx4c7eJEWUNJ7w__original/img/cBP4bKkY9QpY_Yk_2zG_9x_7g0U=/0x0/filters:format(jpeg)/pic4458123.jpg' },
  { bggId: 167791, name: 'Terraforming Mars', year: 2016, imageUrl: 'https://cf.geekdo-images.com/wg9oOLcsKvDesSUdZQ4rxw__original/img/F-lZJqE9vjT0U1A-F5S6mF9t7-s=/0x0/filters:format(jpeg)/pic3536616.jpg' },
  { bggId: 316554, name: 'Dune: Imperium', year: 2020, imageUrl: 'https://cf.geekdo-images.com/PhjygpTw0ECP384EBtZ8dQ__original/img/M6f-fU5S7M5tGgZ7xP1d2W5a9kU=/0x0/filters:format(jpeg)/pic5666597.jpg' },
  { bggId: 342942, name: 'Ark Nova', year: 2021, imageUrl: 'https://cf.geekdo-images.com/SoU8CSBp3doj5OIY2eC-bg__original/img/c1s-2Jk_5R4p7vW3oN3eD3hA9tU=/0x0/filters:format(jpeg)/pic6293412.jpg' },
  { bggId: 177302, name: 'Nemesis', year: 2018, imageUrl: 'https://cf.geekdo-images.com/wKGkNuT1vH80Y2qj9M5fDg__original/img/P9A9dK5vG1xQ_Y6m3eG0L5m7t1U=/0x0/filters:format(jpeg)/pic4431802.jpg' },
  { bggId: 230802, name: 'Azul', year: 2017, imageUrl: 'https://cf.geekdo-images.com/tz19Pf9whnOfMw5rJOT01w__original/img/2j7h8u_4yK_w7V2m3zT4pX2lq9U=/0x0/filters:format(jpeg)/pic3718275.jpg' },
  { bggId: 237182, name: 'Root', year: 2018, imageUrl: 'https://cf.geekdo-images.com/JUAUWaVUzeBWTNU4FLPlKg__original/img/o2H5Wq2K2hX_G9k3vP2zX5L4u2U=/0x0/filters:format(jpeg)/pic4254509.jpg' },
  { bggId: 169786, name: 'Scythe', year: 2016, imageUrl: 'https://cf.geekdo-images.com/7k_nOxWgYjvMRLrjngSnsw__original/img/tYv6yR2D2mZ5yJ9xX1uQ4o8q3mU=/0x0/filters:format(jpeg)/pic3163924.jpg' },
  { bggId: 148228, name: 'Splendor', year: 2014, imageUrl: 'https://cf.geekdo-images.com/rwOMxx4qVuFotzbAagIZQU__original/img/7G0p4_K6jY8uX1o5vT2k3Z7xG4U=/0x0/filters:format(jpeg)/pic1904079.jpg' },
  { bggId: 822, name: 'Carcassonne', year: 2000, imageUrl: 'https://cf.geekdo-images.com/okM0dq_bEXnbyQTOvHZwRw__original/img/G1s-2Jk_5R4p7vW3oN3eD3hA9tU=/0x0/filters:format(jpeg)/pic6544250.jpg' },
  { bggId: 9209, name: 'Ticket to Ride', year: 2004, imageUrl: 'https://cf.geekdo-images.com/ZWJg0dCdrWHxVnc0eFVvgA__original/img/2zK9fP1bX5gR_3xW2tQ7eL9y8oU=/0x0/filters:format(jpeg)/pic38668.jpg' },
  { bggId: 30549, name: 'Pandemic', year: 2008, imageUrl: 'https://cf.geekdo-images.com/S-K5qB-K3J_a0b2x1wX3yQ__original/img/4t9g5mQ3vE_7Yk2wP5zL1m8xO3U=/0x0/filters:format(jpeg)/pic1534148.jpg' },
  { bggId: 199792, name: 'Everdell', year: 2018, imageUrl: 'https://cf.geekdo-images.com/fjE6V52UnuFdNqKH8bUOGg__original/img/3f_3yP5X2rW_6zG9m8tL1k7o4yU=/0x0/filters:format(jpeg)/pic3918905.jpg' },
  { bggId: 295947, name: 'Cascadia', year: 2021, imageUrl: 'https://cf.geekdo-images.com/MJEggEWn1b000BWg1p5Vsw__original/img/e1s-2Jk_5R4p7vW3oN3eD3hA9tU=/0x0/filters:format(jpeg)/pic5100691.jpg' },
  { bggId: 68448, name: '7 Wonders', year: 2010, imageUrl: 'https://cf.geekdo-images.com/RvFVmgEZTsbDeD5e669-gQ__original/img/1k9zY_7zL_6m3vP2zX5L4u2U=/0x0/filters:format(jpeg)/pic860217.jpg' },
  { bggId: 162886, name: 'Spirit Island', year: 2017, imageUrl: 'https://cf.geekdo-images.com/aVOiP6kLpyP-L5WnQpGg_g__original/img/4t9g5mQ3vE_7Yk2wP5zL1m8xO3U=/0x0/filters:format(jpeg)/pic3615731.jpg' },
  { bggId: 284083, name: 'The Crew: Mission Deep Sea', year: 2021, imageUrl: 'https://cf.geekdo-images.com/39wHn8s8eR7E5K9q1f5g_A__original/img/1k9zY_7zL_6m3vP2zX5L4u2U=/0x0/filters:format(jpeg)/pic5499840.jpg' },
  { bggId: 366013, name: 'Heat: Pedal to the Metal', year: 2022, imageUrl: 'https://cf.geekdo-images.com/inYrgg98n_1sO5t8yK2mAg__original/img/4t9g5mQ3vE_7Yk2wP5zL1m8xO3U=/0x0/filters:format(jpeg)/pic6884813.jpg' },
  { bggId: 178900, name: 'Codenames', year: 2015, imageUrl: 'https://cf.geekdo-images.com/F_KDEu0GjdclmlIlFgyfMQ__original/img/2j7h8u_4yK_w7V2m3zT4pX2lq9U=/0x0/filters:format(jpeg)/pic2582929.jpg' },
  { bggId: 36218, name: 'Dixit', year: 2008, imageUrl: 'https://cf.geekdo-images.com/7f_52N_8v1m2z3X4yP5wLg__original/img/e1s-2Jk_5R4p7vW3oN3eD3hA9tU=/0x0/filters:format(jpeg)/pic3483909.jpg' },
  { bggId: 188834, name: 'Secret Hitler', year: 2016, imageUrl: 'https://cf.geekdo-images.com/rAQ9mE_w1K2z3X4yP5wLg__original/img/4t9g5mQ3vE_7Yk2wP5zL1m8xO3U=/0x0/filters:format(jpeg)/pic5164305.jpg' },
  { bggId: 131357, name: 'Coup', year: 2012, imageUrl: 'https://cf.geekdo-images.com/M5f-fU5S7M5tGgZ7xP1d2W5a9kU=/0x0/filters:format(jpeg)/pic2012143.jpg' },
  { bggId: 129622, name: 'Love Letter', year: 2012, imageUrl: 'https://cf.geekdo-images.com/T1s-2Jk_5R4p7vW3oN3eD3hA9tU=/0x0/filters:format(jpeg)/pic1401448.jpg' },
  { bggId: 201808, name: 'Clank!: A Deck-Building Adventure', year: 2016, imageUrl: 'https://cf.geekdo-images.com/I3s-2Jk_5R4p7vW3oN3eD3hA9tU=/0x0/filters:format(jpeg)/pic4449302.jpg' },
  { bggId: 170216, name: 'Blood Rage', year: 2015, imageUrl: 'https://cf.geekdo-images.com/E1s-2Jk_5R4p7vW3oN3eD3hA9tU=/0x0/filters:format(jpeg)/pic2439223.jpg' },
  { bggId: 163412, name: 'Patchwork', year: 2014, imageUrl: 'https://cf.geekdo-images.com/O1s-2Jk_5R4p7vW3oN3eD3hA9tU=/0x0/filters:format(jpeg)/pic2270492.jpg' },
  { bggId: 180263, name: 'Viticulture Essential Edition', year: 2015, imageUrl: 'https://cf.geekdo-images.com/U1s-2Jk_5R4p7vW3oN3eD3hA9tU=/0x0/filters:format(jpeg)/pic2622982.jpg' },
  { bggId: 124361, name: 'Concordia', year: 2013, imageUrl: 'https://cf.geekdo-images.com/K1s-2Jk_5R4p7vW3oN3eD3hA9tU=/0x0/filters:format(jpeg)/pic1760499.jpg' },
];

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

  // 1. Tìm trong POPULAR_BGG_MAP
  for (const item of POPULAR_BGG_MAP) {
    const itemNorm = removeVietnameseTones(item.name);
    if (itemNorm.includes(cleanQ) || item.name.toLowerCase().includes(q)) {
      results.push({
        bggId: item.bggId,
        name: item.name,
        imageUrl: item.imageUrl,
        year: item.year,
      });
      seenIds.add(item.bggId);
      seenNames.add(item.name.toLowerCase());
    }
  }

  // 2. Tìm trong TOP_JSON_GAMES
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

  // 3. Tìm trong BGG 72K Index (Toàn bộ 72,000 game thế giới)
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
        imageUrl: 'https://images.unsplash.com/photo-1610890716171-6b1bb98ffd09?auto=format&fit=crop&w=800&q=80',
        year: null,
      });
      seenIds.add(bggId);
      seenNames.add(nameLower);
      count72k++;
      if (count72k >= 12) break;
    }
  }

  // 4. Tìm trong bảng BoardGame Database
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

  return results.slice(0, 20);
}

module.exports = {
  getBggGameById,
  getBggHotness,
  searchBggGames,
  importBggGameToDatabase,
};

