const express = require('express');
const router = express.Router();
const prisma = require('../middleware/prismaClient');

const authenticate = require('../middleware/authenticate');
const { requireRole } = require('../middleware/authorizeRole');

router.get('/stats', authenticate, requireRole('ADMIN'), async (req, res) => {
  try {
    const [users, listings, orders] = await Promise.all([
      prisma.user.count(),
      prisma.listing.count(),
      prisma.order.count(),
    ]);

    res.json({
      success: true,
      data: {
        users,
        listings,
        orders,
      },
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    res.status(500).json({ success: false, message: 'Loi server' });
  }
});

module.exports = router;
