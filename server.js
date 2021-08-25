const dotenv = require('dotenv');

dotenv.config({ path: './.env' });

process.on('uncaughtException', err => {
  console.log('Uncaught Exception! shutting down...')
  console.log(err.name, err.message)
  // console.log(err)
  process.exit(1);
})

require('./config/mongoose');
const app = require('./app');


const port = process.env.PORT;
const server = app.listen(port, () => {
  console.log(`App running on port ${port}...`);
});

process.on('unhandledRejection', err => {
  console.log(err.name, err.message)
  // console.log(err)
  console.log('Unhandled Rejection! shutting down...')
  server.close(() => {
    process.exit(1);
  })
})
