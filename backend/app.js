require('dotenv').config();
var createError = require('http-errors');
var express = require('express');
var cors = require('cors'); // Cho phép các domain khác (như React/Swagger) gọi API
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./src/config/swagger');

var indexRouter = require('./src/routes/index');
var usersRouter = require('./src/routes/users');
var authRouter = require('./src/routes/auth'); // Router Đăng nhập/Đăng ký
var listingsRouter = require('./src/routes/listings');
var ordersRouter = require('./src/routes/orders');
var adminRouter = require('./src/routes/admin');
var positionsRouter = require('./src/routes/positions');
var shelfRouter = require('./src/routes/shelf');
var eventsRouter = require('./src/routes/events');

var app = express();

app.use(cors()); // KÍCH HOẠT CORS CHO TOÀN BỘ PROJECT
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Gắn giao diện Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use('/api/auth', authRouter);
app.use('/api/listings', listingsRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/admin', adminRouter);
app.use('/api/positions', positionsRouter);
app.use('/api/shelf', shelfRouter);
app.use('/api/events', eventsRouter);
app.use('/api/users', usersRouter);
app.use('/api', indexRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  const status = err.status || 500;
  const message = err.message || 'Internal Server Error';
  const isDev = req.app.get('env') === 'development';

  return res.status(status).json({
    success: false,
    message: message,
    error: isDev ? err : undefined
  });
});

module.exports = app;
