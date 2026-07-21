const prisma = require('../middleware/prismaClient');
const { emitToUser } = require('../realtime/socket');

const createOrder = async (req, res) => {
  try {
    const buyerId = req.user.id;
    const listingId = Number(req.body?.listingId);
    const type = req.body?.type;
    const startDate = req.body?.startDate ? new Date(req.body.startDate) : null;
    const endDate = req.body?.endDate ? new Date(req.body.endDate) : null;

    if (!Number.isFinite(listingId)) {
      return res.status(400).json({ success: false, message: 'listingId khong hop le' });
    }

    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
      include: {
        game: true,
        user: {
          select: {
            id: true,
            username: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
    });

    if (!listing) {
      return res.status(404).json({ success: false, message: 'Khong tim thay tin dang' });
    }

    if (listing.status !== 'ACTIVE') {
      return res.status(400).json({ success: false, message: 'Tin dang khong con hoat dong' });
    }

    if (listing.userId === buyerId) {
      return res.status(400).json({ success: false, message: 'Khong the mua/thuê tin dang cua chinh ban' });
    }

    const orderType = type || listing.type;
    if (!['SELL', 'RENT', 'EXCHANGE'].includes(orderType)) {
      return res.status(400).json({ success: false, message: 'Loai giao dich khong hop le' });
    }

    const totalPrice =
      orderType === 'SELL'
        ? listing.price
        : orderType === 'RENT'
          ? listing.rentPrice
          : null;

    const order = await prisma.order.create({
      data: {
        buyerId,
        listingId: listing.id,
        type: orderType,
        status: 'PENDING',
        totalPrice: totalPrice ?? null,
        startDate: startDate && !Number.isNaN(startDate.getTime()) ? startDate : null,
        endDate: endDate && !Number.isNaN(endDate.getTime()) ? endDate : null,
      },
      include: {
        listing: {
          include: {
            game: true,
            user: {
              select: {
                id: true,
                username: true,
                email: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
    });

    emitToUser(listing.userId, 'notify:new', {
      id: `${order.id}`,
      kind: 'ORDER',
      orderId: order.id,
      listingId: listing.id,
      type: order.type,
      buyerId,
      title: listing.game?.name || 'Listing',
      createdAt: new Date().toISOString(),
    });

    res.status(201).json({ success: true, data: order });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ success: false, message: 'Loi server' });
  }
};

module.exports = {
  createOrder,
  deleteOrder,
};

async function deleteOrder(req, res) {
  try {
    const buyerId = req.user.id;
    const orderId = Number(req.params?.id);

    if (!Number.isFinite(orderId)) {
      return res.status(400).json({ success: false, message: 'Order id khong hop le' });
    }

    const existing = await prisma.order.findUnique({
      where: { id: orderId },
      select: { id: true, buyerId: true },
    });

    if (!existing) {
      return res.status(404).json({ success: false, message: 'Khong tim thay don hang' });
    }

    if (existing.buyerId !== buyerId) {
      return res.status(403).json({ success: false, message: 'Khong co quyen xoa don hang nay' });
    }

    await prisma.order.delete({ where: { id: orderId } });
    return res.json({ success: true, message: 'Da xoa don hang' });
  } catch (error) {
    console.error('Error deleting order:', error);
    return res.status(500).json({ success: false, message: 'Loi server' });
  }
}
