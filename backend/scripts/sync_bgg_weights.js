const prisma = require('../src/middleware/prismaClient');

const KNOWN_BGG_IDS = {
  "Wingspan": 266192,
  "Gloomhaven": 174430,
  "Gloomhaven: Jaws of the Lion": 291457,
  "Lost Ruins of Arnak": 312484,
  "Ark Nova": 342942,
  "Ark Nova: Marine Worlds": 368966,
  "Dune: Imperium": 316554,
  "Dune: Imperium – Uprising": 397598,
  "Dune: Imperium - Uprising": 397598,
  "Scythe": 169786,
  "Cascadia": 295947,
  "Cascadia: Landmarks": 382320,
  "Cascadia: Rolling Rivers": 412497,
  "Blood Rage": 170216,
  "Everdell": 199792,
  "Gaia Project": 220308,
  "Spirit Island": 162886,
  "Great Western Trail": 193738,
  "Clank!: A Deck-Building Adventure": 201808,
  "Heat: Pedal to the Metal": 366013,
  "The Quacks of Quedlinburg": 244521,
  "Quacks: All-In Edition": 244521,
  "Mansions of Madness: Second Edition": 205059,
  "Dead of Winter: A Crossroads Game": 150376,
  "Captain Sonar": 171131,
  "Mysterium": 181304,
  "Codenames": 178900,
  "Codenames: Duet": 224037,
  "Secret Hitler": 188834,
  "The Resistance: Avalon": 128882,
  "Ultimate Werewolf (Ma Sói)": 38159,
  "Bang!": 3955,
  "Bang! The Dice Game": 143741,
  "Coup": 131357,
  "Skull": 92415,
  "Love Letter": 129622,
  "Jaipur": 54043,
  "Hive": 2655,
  "Patchwork": 163412,
  "Santorini": 194655,
  "Kingdomino": 193558,
  "Camel Up (Second Edition)": 260523,
  "Camel Up": 153938,
  "Sushi Go Party!": 192291,
  "Sushi Go!": 133473,
  "King of Tokyo": 70323,
  "Exploding Kittens (Mèo Nổ)": 172225,
  "Unstable Unicorns": 234190,
  "Taco Cat Goat Cheese Pizza": 253685,
  "Just One": 254640,
  "Wavelength": 262543,
  "Decrypto": 225694,
  "Deception: Murder in Hong Kong": 156129,
  "Rising Sun": 205896,
  "Ankh: Gods of Egypt": 285967,
  "Marvel Champions: The Card Game": 285774,
  "Arkham Horror: The Card Game": 205637,
  "Nemesis": 177302,
  "Nemesis: Lockdown": 310100,
  "War of the Ring: Second Edition": 115746,
  "Star Wars: Rebellion": 187645,
  "The Castles of Burgundy": 84876,
  "Viticulture Essential Edition": 180263,
  "A Feast for Odin": 177736,
  "Agricola": 31260,
  "Caverna: The Cave Farmers": 102794,
  "Puerto Rico": 3076,
  "Power Grid": 2651,
  "Darwin's Journey": 322289,
  "MicroMacro: Crime City": 318977,
  "Chronicles of Crime": 239188,
  "Unlock!: Escape Adventures": 213460,
  "EXIT: The Game - The Abandoned Cabin": 203416,
  "Scout": 293014,
  "Sea Salt & Paper": 367220,
  "The Mind": 244992,
  "Fantasy Realms": 223040,
  "Res Arcana": 262712,
  "Century: Spice Road": 209010,
  "Meadow": 314491,
  "Flamecraft": 336136,
  "Clue / Cluedo": 3242,
  "MIND MGMT: The Psychic Espionage": 284653,
  "Whitehall Mystery": 222118,
  "Cartographers": 263918,
  "Welcome To...": 233867,
  "Cthulhu: Death May Die": 253344,
  "Orléans": 164928,
  "Kanban EV": 284378,
  "Underwater Cities": 227789,
  "Beyond the Sun": 317985,
  "Revive": 352708,
  "Wyrmspan": 392929,
  "The White Castle": 371947,
  "Sleeping Gods": 255984,
  "Sleeping Gods: Distant Skies": 358844,
  "Tainted Grail: The Fall of Avalon": 264220,
  "Oath: Chronicles of Empire and Exile": 291572,
  "Maracaibo": 276025,
  "Barrage": 251247,
  "Nucleum": 396790,
  "Pax Pamir: Second Edition": 256490,
  "Voidfall": 337627,
  "Anachrony": 185343,
  "Slay the Spire: The Board Game": 365717,
  "Downforce": 215311,
  "Distilled": 295895,
  "Broom Service": 172308,
  "Arcs": 359871,
  "The Crew: Mission Deep Sea": 324856,
  "Unlock!: Heroic Adventures": 256565,
  "Unlock!: Extraordinary Adventures": 371887,
  "Spire's End": 271788,
  "Spire's End: Hildegard": 330263,
  "Resist!": 352697,
  "Endless Winter: Paleoamericans": 305096,
  "Betrayal at House on the Hill: 3rd Edition": 358504,
  "Twilight Imperium: Fourth Edition": 233078,
  "Undaunted: North Africa": 293372,
  "Faraway": 385761,
  "Dice Throne: Season One": 216734,
  "Cockroach Poker Royal": 139666,
  "Andromeda's Edge: Deluxe Edition": 358661,
  "SETI: Search for Extraterrestrial Intelligence": 418059,
  "Unmatched: Teen Spirit": 371842
};

async function fetchBggDynamicStats(bggId) {
  try {
    const res = await fetch(`https://api.geekdo.com/api/dynamicinfo?objectid=${bggId}&objecttype=thing`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        Accept: 'application/json',
      },
    });
    if (!res.ok) return null;
    const data = await res.json();
    const rawWeight = data?.item?.stats?.avgweight || data?.item?.polls?.boardgameweight?.averageweight;
    const rawRating = data?.item?.stats?.average;
    const rawRank = data?.item?.rankinfo?.find((r) => r.rankobjectid === 1 || r.browsesubtype === 'boardgame')?.rank;

    return {
      weight: rawWeight ? parseFloat(parseFloat(rawWeight).toFixed(2)) : null,
      bggRating: rawRating ? parseFloat(parseFloat(rawRating).toFixed(1)) : null,
      bggRank: rawRank && !isNaN(parseInt(rawRank, 10)) ? parseInt(rawRank, 10) : null,
    };
  } catch (err) {
    return null;
  }
}

async function syncAllRemaining() {
  console.log('=== ĐỒNG BỘ TOÀN DIỆN CÁC GAME BẢN QUYỀN TRÊN KỆ ===');

  const games = await prisma.boardGame.findMany({
    where: {
      weight: null,
    },
  });

  console.log(`Tìm thấy ${games.length} game cần cập nhật.`);
  let updatedCount = 0;

  for (let i = 0; i < games.length; i++) {
    const game = games[i];
    let bggId = KNOWN_BGG_IDS[game.name] || KNOWN_BGG_IDS[game.name.trim()];

    if (!bggId) {
      // Thử tìm theo từ khóa
      for (const [k, v] of Object.entries(KNOWN_BGG_IDS)) {
        if (game.name.toLowerCase().includes(k.toLowerCase()) || k.toLowerCase().includes(game.name.toLowerCase())) {
          bggId = v;
          break;
        }
      }
    }

    if (!bggId) {
      console.log(`[${i + 1}/${games.length}] ⏭️ Bỏ qua game nội bộ/tự tạo: "${game.name}"`);
      continue;
    }

    const stats = await fetchBggDynamicStats(bggId);

    if (stats && stats.weight) {
      await prisma.boardGame.update({
        where: { id: game.id },
        data: {
          bggId: bggId,
          weight: stats.weight,
          bggRating: stats.bggRating,
          bggRank: stats.bggRank,
        },
      });
      updatedCount++;
      console.log(`[${i + 1}/${games.length}] ✅ Cập nhật "${game.name}" (BGG #${bggId}): Độ khó ${stats.weight}/5, Score ${stats.bggRating}/10, Rank #${stats.bggRank || '—'}`);
    } else {
      console.log(`[${i + 1}/${games.length}] ⚠️ BGG #${bggId} không có dữ liệu weight cho "${game.name}"`);
    }

    await new Promise((r) => setTimeout(r, 80));
  }

  console.log(`\n🎉 HOÀN TẤT ĐỒNG BỘ 100%! Đã cập nhật thành công ${updatedCount} game.`);
}

syncAllRemaining()
  .catch((err) => console.error('Sync error:', err))
  .finally(() => prisma.$disconnect());
