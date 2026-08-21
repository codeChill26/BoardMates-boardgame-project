var express = require('express');
var router = express.Router();

/* GET API status. */
router.get('/', function(req, res, next) {
  res.json({
    success: true,
    message: 'Dicero BoardGame API is running smoothly',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;
