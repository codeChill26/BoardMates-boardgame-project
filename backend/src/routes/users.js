var express = require('express');
var router = express.Router();
const authenticate = require('../middleware/authenticate');
const userController = require('../controller/userController');

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

router.get('/me/dashboard', authenticate, userController.getMyDashboard);
router.put('/me', authenticate, userController.updateMyProfile);

module.exports = router;
