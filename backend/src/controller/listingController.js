const prisma = require('../middleware/prismaClient');

function parseCategories(raw) {
  if (raw == null) return undefined;
  if (Array.isArray(raw)) {
    return raw.map((v) => String(v).trim()).filter(Boolean);
  }
  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    if (!trimmed) return [];
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return parsed.map((v) => String(v).trim()).filter(Boolean);
      }
    } catch (_) {
      // ignore
    }
    return trimmed
      .split(',')
      .map((v) => v.trim())
      .filter(Boolean);
  }
  return undefined;
}

function buildUploadedImageUrl(req, filename) {
  const proto = req.headers['x-forwarded-proto'] || req.protocol || 'http';
  const host = req.get('host');
  return `${proto}://${host}/uploads/boardgames/${filename}`;
}

const getAllListings = async (req, res) => {
  try {
    const listings = await prisma.listing.findMany({
      where: { status: 'ACTIVE' },
      include: {
        game: true,
        user: {
          select: {
            id: true,
            username: true,
            email: true,
            avatarUrl: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ success: true, data: listings });
  } catch (error) {
    console.error('Error fetching listings:', error);
    res.status(500).json({ success: false, message: 'Loi server' });
  }
};

const getListingById = async (req, res) => {
  try {
    const { id } = req.params;
    const listing = await prisma.listing.findUnique({
      where: { id: parseInt(id, 10) },
      include: {
        game: true,
        user: {
          select: {
            id: true,
            username: true,
            email: true,
            avatarUrl: true
          }
        }
      }
    });

    if (!listing) {
      return res.status(404).json({ success: false, message: 'Khong tim thay tin dang' });
    }

    res.json({ success: true, data: listing });
  } catch (error) {
    console.error('Error fetching listing:', error);
    res.status(500).json({ success: false, message: 'Loi server' });
  }
};

const createListing = async (req, res) => {
  try {
    const { title, description, minPlayers, maxPlayers, priceSell, priceRent, imageUrl, type, condition, categories } = req.body;
    const userId = req.user.id;

    const parsedCategories = parseCategories(categories);
    const uploadedImageUrl = req.file?.filename ? buildUploadedImageUrl(req, req.file.filename) : null;
    const nextImageUrl = uploadedImageUrl || imageUrl;

    let game = await prisma.boardGame.findFirst({
      where: { name: title }
    });

    if (!game) {
      const createData = {
        name: title,
        description,
        minPlayers: parseInt(minPlayers, 10) || null,
        maxPlayers: parseInt(maxPlayers, 10) || null,
        imageUrl: nextImageUrl,
        ...(parsedCategories !== undefined ? { categories: parsedCategories } : {}),
      };

      try {
        game = await prisma.boardGame.create({ data: createData });
      } catch (error) {
        const msg = String(error?.message || '');
        if (msg.includes('Unknown argument') && msg.includes('categories')) {
          const { categories: _ignored, ...fallbackData } = createData;
          game = await prisma.boardGame.create({ data: fallbackData });
        } else {
          throw error;
        }
      }
    } else {
      const gameUpdate = {};
      if (description != null && game.description == null) gameUpdate.description = description;
      const parsedMin = parseInt(minPlayers, 10);
      const parsedMax = parseInt(maxPlayers, 10);
      if (Number.isFinite(parsedMin) && game.minPlayers == null) gameUpdate.minPlayers = parsedMin;
      if (Number.isFinite(parsedMax) && game.maxPlayers == null) gameUpdate.maxPlayers = parsedMax;
      if (nextImageUrl && !game.imageUrl) gameUpdate.imageUrl = nextImageUrl;
      if (parsedCategories && Array.isArray(parsedCategories) && parsedCategories.length > 0) {
        gameUpdate.categories = parsedCategories;
      }
      if (Object.keys(gameUpdate).length > 0) {
        try {
          game = await prisma.boardGame.update({
            where: { id: game.id },
            data: gameUpdate,
          });
        } catch (error) {
          const msg = String(error?.message || '');
          if (msg.includes('Unknown argument') && msg.includes('categories')) {
            const { categories: _ignored, ...fallbackUpdate } = gameUpdate;
            if (Object.keys(fallbackUpdate).length === 0) {
              // nothing to update
            } else {
              game = await prisma.boardGame.update({
                where: { id: game.id },
                data: fallbackUpdate,
              });
            }
          } else {
            throw error;
          }
        }
      }
    }

    const newListing = await prisma.listing.create({
      data: {
        userId,
        gameId: game.id,
        type: type || 'SELL',
        price: parseFloat(priceSell) || null,
        rentPrice: parseFloat(priceRent) || null,
        description,
        condition,
        status: 'ACTIVE'
      },
      include: {
        game: true,
        user: {
          select: {
            id: true,
            username: true,
            email: true,
            avatarUrl: true
          }
        }
      }
    });

    res.status(201).json({ success: true, data: newListing });
  } catch (error) {
    console.error('Error creating listing:', error);
    res.status(500).json({ success: false, message: 'Loi server' });
  }
};

const updateListing = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      minPlayers,
      maxPlayers,
      price,
      priceSell,
      rentPrice,
      priceRent,
      imageUrl,
      status,
      condition,
      type
    } = req.body;
    const userId = req.user.id;

    const existingListing = await prisma.listing.findUnique({
      where: { id: parseInt(id, 10) },
      include: {
        game: true
      }
    });

    if (!existingListing) {
      return res.status(404).json({ success: false, message: 'Khong tim thay tin dang' });
    }

    if (existingListing.userId !== userId) {
      return res.status(403).json({ success: false, message: 'Ban khong co quyen sua tin nay' });
    }

    const shouldUpdateGame =
      title !== undefined ||
      description !== undefined ||
      minPlayers !== undefined ||
      maxPlayers !== undefined ||
      imageUrl !== undefined;

    let gameId = existingListing.gameId;

    if (shouldUpdateGame) {
      const linkedListingsCount = await prisma.listing.count({
        where: { gameId: existingListing.gameId }
      });

      const gameData = {
        name: title ?? existingListing.game.name,
        description: description ?? existingListing.game.description,
        minPlayers: minPlayers !== undefined ? (parseInt(minPlayers, 10) || null) : existingListing.game.minPlayers,
        maxPlayers: maxPlayers !== undefined ? (parseInt(maxPlayers, 10) || null) : existingListing.game.maxPlayers,
        imageUrl: imageUrl !== undefined ? imageUrl : existingListing.game.imageUrl
      };

      if (linkedListingsCount > 1) {
        const newGame = await prisma.boardGame.create({
          data: gameData
        });
        gameId = newGame.id;
      } else {
        await prisma.boardGame.update({
          where: { id: existingListing.gameId },
          data: gameData
        });
      }
    }

    const nextPrice = price !== undefined ? price : priceSell;
    const nextRentPrice = rentPrice !== undefined ? rentPrice : priceRent;

    const updatedListing = await prisma.listing.update({
      where: { id: parseInt(id, 10) },
      data: {
        gameId,
        type: type || undefined,
        price: nextPrice !== undefined ? (nextPrice === '' || nextPrice === null ? null : parseFloat(nextPrice)) : undefined,
        rentPrice: nextRentPrice !== undefined ? (nextRentPrice === '' || nextRentPrice === null ? null : parseFloat(nextRentPrice)) : undefined,
        description,
        status,
        condition
      },
      include: {
        game: true,
        user: {
          select: {
            id: true,
            username: true,
            email: true,
            avatarUrl: true
          }
        }
      }
    });

    res.json({ success: true, data: updatedListing });
  } catch (error) {
    console.error('Error updating listing:', error);
    res.status(500).json({ success: false, message: 'Loi server' });
  }
};

const deleteListing = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const existingListing = await prisma.listing.findUnique({
      where: { id: parseInt(id, 10) }
    });

    if (!existingListing) {
      return res.status(404).json({ success: false, message: 'Khong tim thay tin dang' });
    }

    if (existingListing.userId !== userId) {
      return res.status(403).json({ success: false, message: 'Ban khong co quyen xoa tin nay' });
    }

    await prisma.listing.delete({
      where: { id: parseInt(id, 10) }
    });

    res.json({ success: true, message: 'Xoa tin dang thanh cong' });
  } catch (error) {
    console.error('Error deleting listing:', error);
    res.status(500).json({ success: false, message: 'Loi server' });
  }
};

module.exports = {
  getAllListings,
  getListingById,
  createListing,
  updateListing,
  deleteListing
};
