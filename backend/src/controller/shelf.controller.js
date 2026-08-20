const prisma = require('../middleware/prismaClient');

/**
 * Lấy danh sách game trên kệ của user hiện tại (có phân trang, tìm kiếm, lọc)
 */
const getShelfGames = async (req, res) => {
  try {
    const userId = req.user.id;
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit, 10) || 8));
    const skip = (page - 1) * limit;

    const { search, status, category, players, sortBy, sortOrder } = req.query;

    const where = {
      userId: userId,
    };

    // Lọc theo trạng thái sở hữu
    if (status && status !== 'ALL') {
      where.status = status;
    }

    // Lọc hoặc tìm kiếm theo game gốc
    const gameWhere = {};

    if (search && search.trim() !== '') {
      gameWhere.name = {
        contains: search.trim(),
        mode: 'insensitive',
      };
    }

    if (category && category !== 'ALL') {
      gameWhere.categories = {
        has: category,
      };
    }

    if (players) {
      const p = parseInt(players, 10);
      if (!isNaN(p)) {
        gameWhere.minPlayers = { lte: p };
        gameWhere.maxPlayers = { gte: p };
      }
    }

    if (Object.keys(gameWhere).length > 0) {
      where.game = gameWhere;
    }

    // Sắp xếp
    let orderBy = { updatedAt: 'desc' };
    if (sortBy === 'name') {
      orderBy = { game: { name: sortOrder === 'asc' ? 'asc' : 'desc' } };
    } else if (sortBy === 'rating') {
      orderBy = { personalRating: sortOrder === 'asc' ? 'asc' : 'desc' };
    } else if (sortBy === 'createdAt') {
      orderBy = { createdAt: sortOrder === 'asc' ? 'asc' : 'desc' };
    }

    const [totalItems, items] = await Promise.all([
      prisma.shelfGame.count({ where }),
      prisma.shelfGame.findMany({
        where,
        include: {
          game: true,
        },
        orderBy,
        skip,
        take: limit,
      }),
    ]);

    const totalPages = Math.ceil(totalItems / limit) || 1;

    return res.status(200).json({
      success: true,
      data: items,
      pagination: {
        page,
        limit,
        totalItems,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    });
  } catch (error) {
    console.error('Error in getShelfGames:', error);
    return res.status(500).json({
      success: false,
      message: 'Không thể lấy danh sách kho game',
      error: error.message,
    });
  }
};

/**
 * Lấy danh sách BoardGame gốc trong hệ thống để gợi ý tìm kiếm / chọn nhanh
 */
const getMasterGames = async (req, res) => {
  try {
    const search = req.query.search || '';
    const games = await prisma.boardGame.findMany({
      where: search
        ? {
            name: {
              contains: search.trim(),
              mode: 'insensitive',
            },
          }
        : {},
      take: 20,
      orderBy: { name: 'asc' },
    });

    return res.status(200).json({
      success: true,
      data: games,
    });
  } catch (error) {
    console.error('Error in getMasterGames:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi tìm kiếm game gốc',
      error: error.message,
    });
  }
};

/**
 * Thống kê tổng quan kho game của user
 */
const getShelfStats = async (req, res) => {
  try {
    const userId = req.user.id;

    const [total, onShelf, lentOut, forSale, wishlist] = await Promise.all([
      prisma.shelfGame.count({ where: { userId } }),
      prisma.shelfGame.count({ where: { userId, status: 'ON_SHELF' } }),
      prisma.shelfGame.count({ where: { userId, status: 'LENT_OUT' } }),
      prisma.shelfGame.count({ where: { userId, status: 'FOR_SALE' } }),
      prisma.shelfGame.count({ where: { userId, status: 'WISHLIST' } }),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        total,
        onShelf,
        lentOut,
        forSale,
        wishlist,
      },
    });
  } catch (error) {
    console.error('Error in getShelfStats:', error);
    return res.status(500).json({
      success: false,
      message: 'Không thể lấy thống kê kho game',
    });
  }
};

function parseSafeDate(d) {
  if (!d) return null;
  const parsed = new Date(d);
  return isNaN(parsed.getTime()) ? null : parsed;
}

function parseSafeFloat(val) {
  if (val === undefined || val === null || val === '') return null;
  const parsed = parseFloat(val);
  return isNaN(parsed) ? null : parsed;
}

/**
 * Thêm một boardgame vào kho game cá nhân
 * Nếu gameId đã có: liên kết trực tiếp
 * Nếu là game mới: tạo 1 bản ghi duy nhất trong bảng BoardGame rồi liên kết
 */
const addGameToShelf = async (req, res) => {
  try {
    const userId = req.user.id;
    let {
      gameId,
      name,
      description,
      categories,
      minPlayers,
      maxPlayers,
      playTime,
      imageUrl,
      condition,
      status,
      borrower,
      borrowedDate,
      expectedReturnDate,
      personalNotes,
      personalRating,
    } = req.body;

    let targetGameId = gameId ? parseInt(gameId, 10) : null;

    // Nếu chưa có gameId, tìm xem game này đã có trong BoardGame theo tên chưa
    if (!targetGameId) {
      if (!name || name.trim() === '') {
        return res.status(400).json({
          success: false,
          message: 'Vui lòng cung cấp tên boardgame hoặc chọn game có sẵn',
        });
      }

      const cleanName = name.trim();
      let existingGame = await prisma.boardGame.findFirst({
        where: {
          name: {
            equals: cleanName,
            mode: 'insensitive',
          },
        },
      });

      if (existingGame) {
        targetGameId = existingGame.id;
      } else {
        // Tạo mới 1 bản ghi gốc trong bảng BoardGame
        const safeCategories = Array.isArray(categories)
          ? categories
          : typeof categories === 'string' && categories.trim() !== ''
          ? categories.split(',').map((c) => c.trim())
          : [];

        const newMasterGame = await prisma.boardGame.create({
          data: {
            name: cleanName,
            description: description || '',
            categories: safeCategories,
            minPlayers: minPlayers ? parseInt(minPlayers, 10) : 1,
            maxPlayers: maxPlayers ? parseInt(maxPlayers, 10) : 4,
            playTime: playTime ? parseInt(playTime, 10) : 30,
            imageUrl: imageUrl || 'https://images.unsplash.com/photo-1610890716171-6b1bb98ffd09?q=80&w=800&auto=format&fit=crop',
          },
        });
        targetGameId = newMasterGame.id;
      }
    }

    // Kiểm tra xem user đã có game này trên kệ chưa
    const alreadyInShelf = await prisma.shelfGame.findUnique({
      where: {
        userId_gameId: {
          userId,
          gameId: targetGameId,
        },
      },
      include: {
        game: true,
      },
    });

    if (alreadyInShelf) {
      return res.status(400).json({
        success: false,
        message: `Game "${alreadyInShelf.game?.name || 'này'}" đã có trong kho của bạn rồi!`,
      });
    }

    // Tạo bản ghi trên kệ của user
    const newShelfItem = await prisma.shelfGame.create({
      data: {
        userId,
        gameId: targetGameId,
        condition: condition || 'Like New',
        status: status || 'ON_SHELF',
        borrower: status === 'LENT_OUT' ? (borrower || null) : null,
        borrowedDate: status === 'LENT_OUT' ? parseSafeDate(borrowedDate) : null,
        expectedReturnDate: status === 'LENT_OUT' ? parseSafeDate(expectedReturnDate) : null,
        personalNotes: personalNotes || '',
        personalRating: parseSafeFloat(personalRating),
      },
      include: {
        game: true,
      },
    });

    return res.status(201).json({
      success: true,
      message: 'Đã thêm game vào kho thành công',
      data: newShelfItem,
    });
  } catch (error) {
    console.error('Error in addGameToShelf:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi thêm game vào kho',
      error: error.message,
    });
  }
};

/**
 * Cập nhật thông tin sở hữu của user (tình trạng, trạng thái, người mượn, ghi chú)
 */
const updateShelfGame = async (req, res) => {
  try {
    const userId = req.user.id;
    const shelfId = parseInt(req.params.id, 10);

    if (isNaN(shelfId)) {
      return res.status(400).json({ success: false, message: 'ID không hợp lệ' });
    }

    const existing = await prisma.shelfGame.findUnique({
      where: { id: shelfId },
    });

    if (!existing || existing.userId !== userId) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy boardgame này trong kho của bạn',
      });
    }

    const {
      condition,
      status,
      borrower,
      borrowedDate,
      expectedReturnDate,
      personalNotes,
      personalRating,
    } = req.body;

    const updated = await prisma.shelfGame.update({
      where: { id: shelfId },
      data: {
        condition: condition !== undefined ? condition : existing.condition,
        status: status !== undefined ? status : existing.status,
        borrower: (status || existing.status) === 'LENT_OUT' ? (borrower !== undefined ? borrower : existing.borrower) : null,
        borrowedDate: (status || existing.status) === 'LENT_OUT' ? parseSafeDate(borrowedDate !== undefined ? borrowedDate : existing.borrowedDate) : null,
        expectedReturnDate: (status || existing.status) === 'LENT_OUT' ? parseSafeDate(expectedReturnDate !== undefined ? expectedReturnDate : existing.expectedReturnDate) : null,
        personalNotes: personalNotes !== undefined ? personalNotes : existing.personalNotes,
        personalRating: personalRating !== undefined ? parseSafeFloat(personalRating) : existing.personalRating,
      },
      include: {
        game: true,
      },
    });

    return res.status(200).json({
      success: true,
      message: 'Đã cập nhật thông tin game',
      data: updated,
    });
  } catch (error) {
    console.error('Error in updateShelfGame:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi cập nhật game',
      error: error.message,
    });
  }
};

/**
 * Xóa một game khỏi kho của user
 */
const deleteShelfGame = async (req, res) => {
  try {
    const userId = req.user.id;
    const shelfId = parseInt(req.params.id, 10);

    if (isNaN(shelfId)) {
      return res.status(400).json({ success: false, message: 'ID không hợp lệ' });
    }

    const existing = await prisma.shelfGame.findUnique({
      where: { id: shelfId },
    });

    if (!existing || existing.userId !== userId) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy boardgame này trong kho của bạn',
      });
    }

    await prisma.shelfGame.delete({
      where: { id: shelfId },
    });

    return res.status(200).json({
      success: true,
      message: 'Đã xóa boardgame khỏi kho thành công',
    });
  } catch (error) {
    console.error('Error in deleteShelfGame:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi xóa boardgame khỏi kho',
      error: error.message,
    });
  }
};

/**
 * Tải file CSV Template mẫu chuẩn có UTF-8 BOM để mở tiếng Việt trên Excel
 */
const downloadCsvTemplate = async (req, res) => {
  try {
    const csvHeader = 'Tên BoardGame,Thể loại,Số người tối thiểu,Số người tối đa,Thời gian chơi (phút),Độ tuổi,Nhà phát hành,Link ảnh URL,Mô tả,Tình trạng box,Trạng thái,Người mượn,Ngày mượn,Ngày hẹn trả,Đánh giá cá nhân,Ghi chú';
    
    const sampleRows = [
      '"Catan","Chiến thuật;Kinh tế;Gia đình",3,4,75,10,"KOSMOS","https://images.unsplash.com/photo-1610890716171-6b1bb98ffd09?auto=format&fit=crop&w=800&q=80","Thu thập và giao dịch tài nguyên để xây dựng đường sá làng mạc trên đảo Catan","Like New 99%","ON_SHELF","","","",5.0,"Bản tiếng Anh đã bọc bài sleeves đầy đủ"',
      '"Wingspan","Xây dựng động cơ;Động vật;Thẻ bài",1,5,70,10,"Stonemaier Games","https://images.unsplash.com/photo-1552728089-57bdde30beb3?auto=format&fit=crop&w=800&q=80","Khám phá thế giới chim muông và xây dựng chuỗi bảo tồn sinh thái","Mới 100%","ON_SHELF","","","",4.5,"Hộp nguyên seal chưa khui"',
      '"Codenames","Giải đố;Party;Từ vựng",2,8,15,10,"Czech Games Edition","https://images.unsplash.com/photo-1610890716171-6b1bb98ffd09?auto=format&fit=crop&w=800&q=80","Hai đội điệp viên giải mã từ ngữ bí mật","Đã qua sử dụng","LENT_OUT","Hoàng Nam","2026-08-15","2026-08-30",4.0,"Cho nhóm bạn mượn đi dã ngoại"',
      '"Terraforming Mars","Khoa học viễn tưởng;Kinh tế;Không gian",1,5,120,12,"FryxGames","https://images.unsplash.com/photo-1614728894747-a83421e2b9c9?auto=format&fit=crop&w=800&q=80","Cải tạo Sao Hỏa thành nơi sinh sống cho nhân loại","Like New 99%","FOR_SALE","","","",4.8,"Muốn bán lại 850k do ít nhóm chơi cùng"',
    ];

    const csvContent = '\uFEFF' + [csvHeader, ...sampleRows].join('\r\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="boardgames_shelf_template.csv"');
    return res.status(200).send(csvContent);
  } catch (error) {
    console.error('Error in downloadCsvTemplate:', error);
    return res.status(500).json({
      success: false,
      message: 'Không thể tạo file template CSV',
      error: error.message,
    });
  }
};

/**
 * Nhập hàng loạt boardgame từ danh sách CSV vào kho game
 * Tự động tạo bản ghi BoardGame nếu chưa có trong cơ sở dữ liệu
 * Đồng thời tạo bản ghi ShelfGame cho người chơi
 */
const batchImportShelfGames = async (req, res) => {
  try {
    const userId = req.user.id;
    const { games } = req.body;

    if (!Array.isArray(games) || games.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Danh sách boardgame không hợp lệ hoặc rỗng',
      });
    }

    let createdCount = 0;
    let updatedCount = 0;
    let newMasterCreated = 0;
    const errors = [];

    for (let i = 0; i < games.length; i++) {
      const item = games[i];
      const rawName = item.name || item.title || item['Tên BoardGame'] || item['Tên game'];

      if (!rawName || typeof rawName !== 'string' || rawName.trim() === '') {
        errors.push(`Dòng ${i + 1}: Thiếu tên boardgame`);
        continue;
      }

      const cleanName = rawName.trim();

      try {
        // 1. Tìm hoặc tạo master BoardGame
        let masterGame = await prisma.boardGame.findFirst({
          where: {
            name: {
              equals: cleanName,
              mode: 'insensitive',
            },
          },
        });

        if (!masterGame) {
          // Xử lý danh sách thể loại (hỗ trợ mảng, chuỗi phân tách bởi dấu ; hoặc ,)
          let categories = [];
          const rawCategories = item.categories || item.category || item['Thể loại'];
          if (Array.isArray(rawCategories)) {
            categories = rawCategories.map((c) => String(c).trim()).filter(Boolean);
          } else if (typeof rawCategories === 'string' && rawCategories.trim() !== '') {
            categories = rawCategories
              .split(/[;,]/)
              .map((c) => c.trim())
              .filter(Boolean);
          }

          if (categories.length === 0) {
            categories = ['Board Game'];
          }

          const rawImageUrl = item.imageUrl || item.image || item['Link ảnh URL'] || item['Ảnh'];
          const cleanImageUrl =
            rawImageUrl && typeof rawImageUrl === 'string' && rawImageUrl.startsWith('http')
              ? rawImageUrl.trim()
              : 'https://images.unsplash.com/photo-1610890716171-6b1bb98ffd09?auto=format&fit=crop&w=800&q=80';

          const minPlayers = parseInt(item.minPlayers || item['Số người tối thiểu'], 10) || 1;
          const maxPlayers = parseInt(item.maxPlayers || item['Số người tối đa'], 10) || 4;
          const playTime = parseInt(item.playTime || item['Thời gian chơi (phút)'] || item['Thời gian chơi'], 10) || 45;
          const age = parseInt(item.age || item['Độ tuổi'], 10) || 10;
          const publisher = item.publisher || item['Nhà phát hành'] || 'Tự do';
          const description = item.description || item['Mô tả'] || '';

          masterGame = await prisma.boardGame.create({
            data: {
              name: cleanName,
              description: description.trim(),
              categories,
              minPlayers,
              maxPlayers,
              playTime,
              age,
              publisher: publisher.trim(),
              imageUrl: cleanImageUrl,
            },
          });
          newMasterCreated++;
        }

        // 2. Chuẩn bị dữ liệu ShelfGame cho người chơi
        const rawCondition = item.condition || item['Tình trạng box'] || item['Tình trạng'] || 'Like New 99%';
        const rawStatus = (item.status || item['Trạng thái'] || 'ON_SHELF').toUpperCase();
        const validStatuses = ['ON_SHELF', 'LENT_OUT', 'FOR_SALE', 'WISHLIST'];
        const finalStatus = validStatuses.includes(rawStatus) ? rawStatus : 'ON_SHELF';

        const borrower = finalStatus === 'LENT_OUT' ? (item.borrower || item['Người mượn'] || null) : null;
        const borrowedDate = finalStatus === 'LENT_OUT' ? parseSafeDate(item.borrowedDate || item['Ngày mượn']) : null;
        const expectedReturnDate = finalStatus === 'LENT_OUT' ? parseSafeDate(item.expectedReturnDate || item['Ngày hẹn trả']) : null;
        const personalNotes = item.personalNotes || item['Ghi chú'] || item.notes || '';
        const personalRating = parseSafeFloat(item.personalRating || item['Đánh giá cá nhân'] || item.rating);

        // 3. Upsert vào ShelfGame
        const existingShelf = await prisma.shelfGame.findUnique({
          where: {
            userId_gameId: {
              userId,
              gameId: masterGame.id,
            },
          },
        });

        if (existingShelf) {
          await prisma.shelfGame.update({
            where: { id: existingShelf.id },
            data: {
              condition: rawCondition,
              status: finalStatus,
              borrower,
              borrowedDate,
              expectedReturnDate,
              personalNotes,
              personalRating: personalRating ?? existingShelf.personalRating,
            },
          });
          updatedCount++;
        } else {
          await prisma.shelfGame.create({
            data: {
              userId,
              gameId: masterGame.id,
              condition: rawCondition,
              status: finalStatus,
              borrower,
              borrowedDate,
              expectedReturnDate,
              personalNotes,
              personalRating,
            },
          });
          createdCount++;
        }
      } catch (rowError) {
        console.error(`Error importing row ${i + 1} (${cleanName}):`, rowError);
        errors.push(`Game "${cleanName}": ${rowError.message}`);
      }
    }

    return res.status(200).json({
      success: true,
      message: `Đã nhập thành công ${createdCount + updatedCount} boardgame vào kho (${createdCount} thêm mới, ${updatedCount} cập nhật, ${newMasterCreated} game mới thêm vào hệ thống).`,
      data: {
        totalReceived: games.length,
        createdCount,
        updatedCount,
        newMasterCreated,
        errors,
      },
    });
  } catch (error) {
    console.error('Error in batchImportShelfGames:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi nhập danh sách boardgame từ CSV',
      error: error.message,
    });
  }
};

const bggService = require('../services/bgg.service');

/**
 * Tìm kiếm BoardGame từ BGG theo Tên hoặc BGG ID
 */
const searchBgg = async (req, res) => {
  try {
    const { query } = req.query;
    const results = await bggService.searchBggGames(query);
    return res.status(200).json({
      success: true,
      data: results,
    });
  } catch (error) {
    console.error('Error in searchBgg:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi tìm kiếm game BGG',
      error: error.message,
    });
  }
};

/**
 * Lấy danh sách Top BoardGame đang thịnh hành từ BGG
 */
const fetchBggHotness = async (req, res) => {
  try {
    const hotGames = await bggService.getBggHotness();
    return res.status(200).json({
      success: true,
      data: hotGames,
    });
  } catch (error) {
    console.error('Error in fetchBggHotness:', error);
    return res.status(500).json({
      success: false,
      message: 'Không thể lấy dữ liệu BGG Hotness',
      error: error.message,
    });
  }
};

/**
 * Lấy chi tiết thông số và ảnh HD của một game từ BGG theo BGG ID
 */
const fetchBggDetails = async (req, res) => {
  try {
    const { bggId } = req.params;
    const gameDetails = await bggService.getBggGameById(bggId);
    return res.status(200).json({
      success: true,
      data: gameDetails,
    });
  } catch (error) {
    console.error('Error in fetchBggDetails:', error);
    return res.status(500).json({
      success: false,
      message: 'Không thể lấy thông tin chi tiết từ BGG',
      error: error.message,
    });
  }
};

/**
 * Nhập 1 game trực tiếp từ BGG ID vào database và gắn vào kệ của user
 */
const importBggToShelf = async (req, res) => {
  try {
    const userId = req.user.id;
    const { bggId, condition, status, personalRating, personalNotes } = req.body;

    if (!bggId) {
      return res.status(400).json({ success: false, message: 'Thiếu bggId' });
    }

    // 1. Nạp master BoardGame từ BGG
    const { game } = await bggService.importBggGameToDatabase(bggId);

    // 2. Thêm vào ShelfGame của user
    const shelfItem = await prisma.shelfGame.upsert({
      where: {
        userId_gameId: {
          userId,
          gameId: game.id,
        },
      },
      update: {
        condition: condition || 'Like New 99%',
        status: status || 'ON_SHELF',
        personalRating: parseSafeFloat(personalRating),
        personalNotes: personalNotes || '',
      },
      create: {
        userId,
        gameId: game.id,
        condition: condition || 'Like New 99%',
        status: status || 'ON_SHELF',
        personalRating: parseSafeFloat(personalRating),
        personalNotes: personalNotes || '',
      },
      include: {
        game: true,
      },
    });

    return res.status(201).json({
      success: true,
      message: `Đã nạp thành công "${game.name}" từ BoardGameGeek vào kho!`,
      data: shelfItem,
    });
  } catch (error) {
    console.error('Error in importBggToShelf:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi nhập game từ BGG',
      error: error.message,
    });
  }
};

module.exports = {
  getShelfGames,
  getMasterGames,
  getShelfStats,
  addGameToShelf,
  updateShelfGame,
  deleteShelfGame,
  downloadCsvTemplate,
  batchImportShelfGames,
  searchBgg,
  fetchBggHotness,
  fetchBggDetails,
  importBggToShelf,
};
