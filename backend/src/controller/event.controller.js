const prisma = require('../middleware/prismaClient');

// Danh sách gợi ý các Board Game Cafe phổ biến tại Việt Nam kèm toạ độ GPS chính xác
const POPULAR_VENUES = [
  { name: 'The Mind Cafe & Boardgame', address: '284/41 Lý Thường Kiệt, P.14, Quận 10', city: 'TP. Hồ Chí Minh', lat: 10.7719, lng: 106.6575 },
  { name: 'Board Game Station', address: '24 Đường số 7, Cư xá Đô Thành, Quận 3', city: 'TP. Hồ Chí Minh', lat: 10.7735, lng: 106.6830 },
  { name: 'Cube Cafe & Board Game Hub', address: '168/19 Nguyễn Cư Trinh, Quận 1', city: 'TP. Hồ Chí Minh', lat: 10.7618, lng: 106.6890 },
  { name: 'Cashflow Cafe', address: '7A/19 Thành Thái, P.14, Quận 10', city: 'TP. Hồ Chí Minh', lat: 10.7725, lng: 106.6635 },
  { name: 'Say Boardgame Pub & Cafe', address: '106 Huỳnh Văn Bánh, P.12, Phú Nhuận', city: 'TP. Hồ Chí Minh', lat: 10.7938, lng: 106.6805 },
  { name: 'The Guild Board Game Hub', address: '50 Ngõ 41 Thái Hà, Đống Đa', city: 'Hà Nội', lat: 21.0118, lng: 105.8210 },
  { name: 'Nona Board Game Cafe', address: 'Ngõ 95 Chùa Bộc, Đống Đa', city: 'Hà Nội', lat: 21.0080, lng: 105.8290 },
  { name: 'Board Mates Community Hub (Online/Discord)', address: 'Discord Server / Voice Room', city: 'Online', lat: null, lng: null },
];

/**
 * Tính khoảng cách địa lý giữa 2 toạ độ GPS theo công thức Haversine (đơn vị: km)
 */
function calculateDistanceKm(lat1, lon1, lat2, lon2) {
  if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) return null;
  const R = 6371; // Bán kính Trái Đất (km)
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10; // Làm tròn 1 chữ số thập phân
}

/**
 * Lấy danh sách sự kiện / kèo board game (có lọc, phân trang, tìm kiếm, tìm gần đây theo GPS)
 */
exports.getEvents = async (req, res) => {
  try {
    const {
      type,
      status,
      city,
      search,
      mine,
      userLat,
      userLng,
      maxRadius, // Bán kính tối đa (km)
      page = 1,
      limit = 30,
    } = req.query;

    const pageNum = Math.max(1, parseInt(page) || 1);
    const take = Math.min(50, Math.max(1, parseInt(limit) || 30));
    const skip = (pageNum - 1) * take;

    const where = {};

    // Lọc theo loại sự kiện
    if (type && type !== 'ALL') {
      where.eventType = type;
    }

    // Lọc theo trạng thái
    if (status && status !== 'ALL') {
      where.status = status;
    }

    // Lọc theo thành phố / khu vực
    if (city && city !== 'ALL') {
      where.city = { contains: city, mode: 'insensitive' };
    }

    // Tìm kiếm theo từ khóa
    if (search && search.trim()) {
      const q = search.trim();
      where.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
        { location: { contains: q, mode: 'insensitive' } },
        { customGameName: { contains: q, mode: 'insensitive' } },
        { game: { name: { contains: q, mode: 'insensitive' } } },
      ];
    }

    // Lọc sự kiện của tôi (nếu đã đăng nhập)
    if (mine === 'hosted' && req.user?.id) {
      where.hostId = req.user.id;
    } else if (mine === 'joined' && req.user?.id) {
      where.participants = {
        some: {
          userId: req.user.id,
          status: 'JOINED',
        },
      };
    }

    const [total, rawEvents] = await Promise.all([
      prisma.event.count({ where }),
      prisma.event.findMany({
        where,
        take: userLat && userLng ? 100 : take, // Lấy nhiều hơn để tính khoảng cách & sort nếu có GPS
        skip: userLat && userLng ? 0 : skip,
        orderBy: [
          { startDate: 'asc' },
          { createdAt: 'desc' },
        ],
        include: {
          host: {
            select: {
              id: true,
              username: true,
              avatarUrl: true,
              email: true,
            },
          },
          game: {
            select: {
              id: true,
              name: true,
              imageUrl: true,
              bggRating: true,
              weight: true,
              playTime: true,
              minPlayers: true,
              maxPlayers: true,
            },
          },
          participants: {
            where: { status: 'JOINED' },
            include: {
              user: {
                select: {
                  id: true,
                  username: true,
                  avatarUrl: true,
                },
              },
            },
            orderBy: { joinedAt: 'asc' },
          },
        },
      }),
    ]);

    const uLat = userLat ? parseFloat(userLat) : null;
    const uLng = userLng ? parseFloat(userLng) : null;
    const radiusCap = maxRadius ? parseFloat(maxRadius) : null;

    let formattedEvents = rawEvents.map((ev) => {
      const joinedCount = ev.participants?.length || 0;
      const isFull = joinedCount >= ev.maxParticipants;
      const isUserJoined = req.user?.id
        ? ev.participants?.some((p) => p.userId === req.user.id)
        : false;
      const isHost = req.user?.id === ev.hostId;

      let distanceKm = null;
      if (uLat != null && uLng != null && ev.lat != null && ev.lng != null) {
        distanceKm = calculateDistanceKm(uLat, uLng, ev.lat, ev.lng);
      }

      return {
        ...ev,
        joinedCount,
        availableSlots: Math.max(0, ev.maxParticipants - joinedCount),
        isFull,
        isUserJoined,
        isHost,
        distanceKm,
      };
    });

    // Lọc theo bán kính GPS nếu có
    if (radiusCap && uLat != null && uLng != null) {
      formattedEvents = formattedEvents.filter(
        (ev) => ev.distanceKm != null && ev.distanceKm <= radiusCap
      );
    }

    // Sắp xếp theo khoảng cách gần nhất nếu có GPS
    if (uLat != null && uLng != null) {
      formattedEvents.sort((a, b) => {
        if (a.distanceKm == null && b.distanceKm == null) return 0;
        if (a.distanceKm == null) return 1;
        if (b.distanceKm == null) return -1;
        return a.distanceKm - b.distanceKm;
      });
      // Cắt trang sau khi sort
      formattedEvents = formattedEvents.slice(skip, skip + take);
    }

    return res.status(200).json({
      success: true,
      data: formattedEvents,
      pagination: {
        total,
        page: pageNum,
        limit: take,
        totalPages: Math.ceil(total / take) || 1,
      },
    });
  } catch (error) {
    console.error('[getEvents] Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Không thể tải danh sách sự kiện: ' + (error.message || 'Lỗi hệ thống'),
    });
  }
};

/**
 * Lấy chi tiết 1 sự kiện theo ID
 */
exports.getEventById = async (req, res) => {
  try {
    const eventId = parseInt(req.params.id);
    if (isNaN(eventId)) {
      return res.status(400).json({ success: false, message: 'ID sự kiện không hợp lệ' });
    }

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        host: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
            email: true,
            phone: true,
          },
        },
        game: true,
        participants: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                avatarUrl: true,
                email: true,
              },
            },
          },
          orderBy: { joinedAt: 'asc' },
        },
      },
    });

    if (!event) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy sự kiện này' });
    }

    const activeParticipants = event.participants.filter((p) => p.status === 'JOINED');
    const joinedCount = activeParticipants.length;
    const isUserJoined = req.user?.id
      ? activeParticipants.some((p) => p.userId === req.user.id)
      : false;
    const isHost = req.user?.id === event.hostId;

    return res.status(200).json({
      success: true,
      data: {
        ...event,
        joinedCount,
        availableSlots: Math.max(0, event.maxParticipants - joinedCount),
        isFull: joinedCount >= event.maxParticipants,
        isUserJoined,
        isHost,
      },
    });
  } catch (error) {
    console.error('[getEventById] Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi tải chi tiết sự kiện',
    });
  }
};

/**
 * Tạo mới sự kiện / lên kèo board game
 */
exports.createEvent = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Vui lòng đăng nhập để tạo sự kiện' });
    }

    const {
      title,
      description,
      eventType = 'CASUAL',
      gameId,
      customGameName,
      games,
      imageUrl,
      location,
      address,
      city = 'TP. Hồ Chí Minh',
      lat,
      lng,
      startDate,
      endDate,
      maxParticipants = 4,
      entryFee = 0,
      skillLevel = 'ALL',
    } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: 'Tiêu đề sự kiện không được để trống' });
    }

    if (!location || !location.trim()) {
      return res.status(400).json({ success: false, message: 'Địa điểm không được để trống' });
    }

    if (!startDate) {
      return res.status(400).json({ success: false, message: 'Thời gian bắt đầu không được để trống' });
    }

    const startDateTime = new Date(startDate);
    if (isNaN(startDateTime.getTime())) {
      return res.status(400).json({ success: false, message: 'Thời gian bắt đầu không đúng định dạng' });
    }

    let endDateTime = null;
    if (endDate) {
      endDateTime = new Date(endDate);
      if (isNaN(endDateTime.getTime())) {
        endDateTime = null;
      }
    }

    const maxCount = Math.max(2, parseInt(maxParticipants) || 4);
    const fee = Math.max(0, parseFloat(entryFee) || 0);

    // Tự động tìm toạ độ GPS nếu chọn quán nổi tiếng
    let finalLat = lat ? parseFloat(lat) : null;
    let finalLng = lng ? parseFloat(lng) : null;

    if (finalLat == null || finalLng == null) {
      const matchedVenue = POPULAR_VENUES.find((v) =>
        location.toLowerCase().includes(v.name.toLowerCase().split('&')[0].trim())
      );
      if (matchedVenue && matchedVenue.lat && matchedVenue.lng) {
        finalLat = matchedVenue.lat;
        finalLng = matchedVenue.lng;
      }
    }

    // Format danh sách games
    let finalGames = null;
    if (Array.isArray(games) && games.length > 0) {
      finalGames = games;
    } else if (customGameName?.trim()) {
      finalGames = [{ name: customGameName.trim(), id: gameId ? parseInt(gameId) : null, imageUrl }];
    }

    // Tạo Event kèm bản ghi Host tham gia trong 1 transaction
    const newEvent = await prisma.event.create({
      data: {
        title: title.trim(),
        description: description?.trim() || null,
        eventType,
        gameId: gameId ? parseInt(gameId) : (finalGames?.[0]?.id || null),
        customGameName: customGameName?.trim() || (finalGames?.[0]?.name || null),
        games: finalGames,
        imageUrl: imageUrl?.trim() || (finalGames?.[0]?.imageUrl || null),
        hostId: userId,
        location: location.trim(),
        address: address?.trim() || null,
        city: city.trim(),
        lat: finalLat,
        lng: finalLng,
        startDate: startDateTime,
        endDate: endDateTime,
        maxParticipants: maxCount,
        entryFee: fee,
        skillLevel,
        status: 'OPEN',
        participants: {
          create: {
            userId: userId,
            role: 'HOST',
            status: 'JOINED',
            notes: 'Người tạo kèo',
          },
        },
      },
      include: {
        host: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
          },
        },
        game: true,
        participants: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
    });

    return res.status(201).json({
      success: true,
      message: 'Tạo kèo sự kiện thành công!',
      data: newEvent,
    });
  } catch (error) {
    console.error('[createEvent] Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Không thể tạo sự kiện: ' + (error.message || 'Lỗi server'),
    });
  }
};

/**
 * Chỉnh sửa sự kiện (chỉ Host hoặc Admin)
 */
exports.updateEvent = async (req, res) => {
  try {
    const userId = req.user?.id;
    const userRole = req.user?.role;
    const eventId = parseInt(req.params.id);

    if (isNaN(eventId)) {
      return res.status(400).json({ success: false, message: 'ID không hợp lệ' });
    }

    const existing = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!existing) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy sự kiện' });
    }

    if (existing.hostId !== userId && userRole !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Bạn không có quyền chỉnh sửa sự kiện này' });
    }

    const {
      title,
      description,
      eventType,
      gameId,
      customGameName,
      games,
      imageUrl,
      location,
      address,
      city,
      lat,
      lng,
      startDate,
      endDate,
      maxParticipants,
      entryFee,
      skillLevel,
      status,
    } = req.body;

    const updateData = {};
    if (title) updateData.title = title.trim();
    if (description !== undefined) updateData.description = description?.trim() || null;
    if (eventType) updateData.eventType = eventType;
    if (gameId !== undefined) updateData.gameId = gameId ? parseInt(gameId) : null;
    if (customGameName !== undefined) updateData.customGameName = customGameName?.trim() || null;
    if (games !== undefined) updateData.games = games;
    if (imageUrl !== undefined) updateData.imageUrl = imageUrl?.trim() || null;
    if (location) updateData.location = location.trim();
    if (address !== undefined) updateData.address = address?.trim() || null;
    if (city) updateData.city = city.trim();
    if (lat !== undefined) updateData.lat = lat ? parseFloat(lat) : null;
    if (lng !== undefined) updateData.lng = lng ? parseFloat(lng) : null;
    if (startDate) updateData.startDate = new Date(startDate);
    if (endDate !== undefined) updateData.endDate = endDate ? new Date(endDate) : null;
    if (maxParticipants) updateData.maxParticipants = Math.max(2, parseInt(maxParticipants));
    if (entryFee !== undefined) updateData.entryFee = Math.max(0, parseFloat(entryFee));
    if (skillLevel) updateData.skillLevel = skillLevel;
    if (status) updateData.status = status;

    const updated = await prisma.event.update({
      where: { id: eventId },
      data: updateData,
      include: {
        host: { select: { id: true, username: true, avatarUrl: true } },
        game: true,
        participants: {
          include: {
            user: { select: { id: true, username: true, avatarUrl: true } },
          },
        },
      },
    });

    return res.status(200).json({
      success: true,
      message: 'Cập nhật sự kiện thành công',
      data: updated,
    });
  } catch (error) {
    console.error('[updateEvent] Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi cập nhật sự kiện',
    });
  }
};

/**
 * Hủy sự kiện
 */
exports.cancelEvent = async (req, res) => {
  try {
    const userId = req.user?.id;
    const userRole = req.user?.role;
    const eventId = parseInt(req.params.id);

    const existing = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!existing) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy sự kiện' });
    }

    if (existing.hostId !== userId && userRole !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Bạn không có quyền hủy sự kiện này' });
    }

    await prisma.event.update({
      where: { id: eventId },
      data: { status: 'CANCELLED' },
    });

    return res.status(200).json({
      success: true,
      message: 'Đã hủy sự kiện thành công',
    });
  } catch (error) {
    console.error('[cancelEvent] Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi hủy sự kiện',
    });
  }
};

/**
 * Đăng ký tham gia kèo sự kiện (RSVP)
 */
exports.joinEvent = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { displayName, contact, notes } = req.body;

    const eventId = parseInt(req.params.id);
    if (isNaN(eventId)) {
      return res.status(400).json({ success: false, message: 'ID sự kiện không hợp lệ' });
    }

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        participants: {
          where: { status: 'JOINED' },
        },
      },
    });

    if (!event) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy sự kiện' });
    }

    if (event.status === 'CANCELLED' || event.status === 'COMPLETED') {
      return res.status(400).json({ success: false, message: 'Sự kiện này đã kết thúc hoặc bị hủy' });
    }

    if (userId) {
      const alreadyJoined = event.participants.some((p) => p.userId === userId);
      if (alreadyJoined) {
        return res.status(400).json({ success: false, message: 'Bạn đã tham gia kèo này rồi' });
      }
    }

    if (event.participants.length >= event.maxParticipants) {
      return res.status(400).json({ success: false, message: 'Kèo này đã đủ số lượng người tham gia' });
    }

    // Nếu có userId thì lưu participant
    if (userId) {
      await prisma.eventParticipant.upsert({
        where: {
          eventId_userId: {
            eventId,
            userId,
          },
        },
        update: {
          status: 'JOINED',
          notes: notes?.trim() || null,
          joinedAt: new Date(),
        },
        create: {
          eventId,
          userId,
          role: 'PLAYER',
          status: 'JOINED',
          notes: notes?.trim() || null,
        },
      });
    }

    // Nếu đã đủ slot thì cập nhật trạng thái FULL
    const newCount = event.participants.length + 1;
    if (newCount >= event.maxParticipants) {
      await prisma.event.update({
        where: { id: eventId },
        data: { status: 'FULL' },
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Đăng ký tham gia kèo thành công!',
    });
  } catch (error) {
    console.error('[joinEvent] Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Không thể tham gia sự kiện: ' + (error.message || 'Lỗi server'),
    });
  }
};

/**
 * Rút khỏi kèo sự kiện
 */
exports.leaveEvent = async (req, res) => {
  try {
    const userId = req.user?.id;
    const eventId = parseInt(req.params.id);
    if (isNaN(eventId)) {
      return res.status(400).json({ success: false, message: 'ID không hợp lệ' });
    }

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        participants: {
          where: { status: 'JOINED' },
        },
      },
    });

    if (!event) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy sự kiện' });
    }

    if (userId && event.hostId === userId) {
      return res.status(400).json({
        success: false,
        message: 'Bạn là người tạo kèo (Host), không thể rời kèo. Hãy chọn Hủy kèo nếu không tổ chức nữa.',
      });
    }

    if (userId) {
      await prisma.eventParticipant.deleteMany({
        where: {
          eventId,
          userId,
        },
      });
    }

    // Mở lại status OPEN nếu trước đó là FULL
    if (event.status === 'FULL') {
      await prisma.event.update({
        where: { id: eventId },
        data: { status: 'OPEN' },
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Đã rút khỏi kèo thành công',
    });
  } catch (error) {
    console.error('[leaveEvent] Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi rút khỏi sự kiện',
    });
  }
};

/**
 * Lấy danh sách địa điểm gợi ý
 */
exports.getVenues = async (req, res) => {
  return res.status(200).json({
    success: true,
    data: POPULAR_VENUES,
  });
};
