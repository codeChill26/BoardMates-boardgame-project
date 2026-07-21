const express = require('express');
const router = express.Router();

const authenticate = require('../middleware/authenticate');
const orderController = require('../controller/orderController');

router.post('/', authenticate, orderController.createOrder);
router.delete('/:id', authenticate, orderController.deleteOrder);

module.exports = router;
