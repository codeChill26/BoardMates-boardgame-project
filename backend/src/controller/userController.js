const prisma = require('../middleware/prismaClient');

const getMyDashboard = async (req, res) => {
  try {
    const userId = req.user.id;

    const [currentUser, myListings, myOrders] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          username: true,
          email: true,
          phone: true,
          city: true,
          avatarUrl: true,
          createdAt: true
        }
      }),
      prisma.listing.findMany({
        where: { userId },
        include: {
          game: true
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.order.findMany({
        where: { buyerId: userId },
        include: {
          listing: {
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
          }
        },
        orderBy: { createdAt: 'desc' }
      })
    ]);

    if (!currentUser) {
      return res.status(404).json({ success: false, message: 'Khong tim thay nguoi dung' });
    }

    res.json({
      success: true,
      data: {
        user: currentUser,
        listings: myListings,
        transactions: myOrders.map((order) => ({
          id: order.id,
          type: order.type,
          status: order.status,
          totalPrice: order.totalPrice ?? order.listing?.price ?? order.listing?.rentPrice ?? null,
          startDate: order.startDate,
          endDate: order.endDate,
          createdAt: order.createdAt,
          listing: order.listing
        }))
      }
    });
  } catch (error) {
    console.error('Error fetching user dashboard:', error);
    res.status(500).json({ success: false, message: 'Loi server' });
  }
};

const updateMyProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { username, phone, city, avatarUrl } = req.body;

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        username: username?.trim() || undefined,
        phone: phone !== undefined ? (phone?.trim() || null) : undefined,
        city: city !== undefined ? (city?.trim() || null) : undefined,
        avatarUrl: avatarUrl !== undefined ? (avatarUrl?.trim() || null) : undefined
      },
      select: {
        id: true,
        username: true,
        email: true,
        phone: true,
        city: true,
        avatarUrl: true,
        createdAt: true
      }
    });

    res.json({
      success: true,
      message: 'Cap nhat thong tin thanh cong',
      data: updatedUser
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ success: false, message: 'Loi server' });
  }
};

module.exports = {
  getMyDashboard,
  updateMyProfile
};
