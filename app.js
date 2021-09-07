const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit')
const helmet = require('helmet')
const mongoSanitize = require('express-mongo-sanitize')
const xssClean = require('xss-clean')
const hpp = require('hpp')

const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController')
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes')

const app = express();
// 1) GLOBAL MIDDLEWARES

// Set security http headers
app.disable("x-powered-by");
// Set security http headers
app.use(helmet())
// development logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// limit request from same api
const limiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 60 minutes
  max: 100, // limit each IP to 100 requests per windowMs,
  message: 'Too many request from this IP please try again in an hour'
})

app.use('/api', limiter)
// body parser reading data from body into req.body
app.use(express.json({ limit: "10kb" }));

// data sanitization against nosql query injection
app.use(mongoSanitize())
// data sanitization against xss(cross site scripting attack)
app.use(xssClean())
//prevent parameter pollution
app.use(hpp({
  whitelist: ['ratingsAverage', 'ratingsQuantity', 'duration', 'difficulty', 'price', 'maxGroupSize']
}))
// serving static files
app.use(express.static(`${__dirname}/public`));

// app.use((req, res, next) => {
//   console.log('Hello from the middleware 👋');
//   next();
// });

// test middleware
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  // console.log(">>>> headers", req.headers)
  next();
});

// 3) ROUTES
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter)

// Base route
app.get('/', function (req, res) {
  res.status(200).send({
    health_check: 'Ok',
    message: 'base endpoint for Natour is up and running'
  })
})

app.all('*', (req, res, next) => {
  // res.status(404).json({
  //   status: 'Failed',
  //   message: `Can't find this route: ${req.originalUrl} on the server`
  // })
  next(new AppError(`Can't find this route: ${req.originalUrl} on the server`, 404))
})

app.use(globalErrorHandler)
module.exports = app;
