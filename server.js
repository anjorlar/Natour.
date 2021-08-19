const dotenv = require('dotenv');

dotenv.config({ path: './.env' });
require('./config/mongoose');
const app = require('./app');


const port = process.env.PORT;
app.listen(port, () => {
  console.log(`App running on port ${port}...`);
});