const express = require('express');
const morgan = require('morgan');

const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');

const app = express();

// 1) MIDDLEWARES
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

app.use(express.json());
app.use(express.static(`${__dirname}/public`));

app.use((req, res, next) => {
  console.log('Hello from the middleware 👋');
  next();
});

app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  next();
});

// 3) ROUTES
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);

// Base route
app.get('/', function (req, res) {
  res.status(200).send({
    health_check: 'Ok',
    message: 'base endpoint for Natour is up and running'
  })
})

app.all('*', (req, res, next) => {
  res.status(404).json({
    status: 'Failed',
    message: `Can't find this route: ${req.originalUrl} on the server`
  })
})
module.exports = app;