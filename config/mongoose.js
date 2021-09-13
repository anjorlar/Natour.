const mongoose = require('mongoose');


const DB = process.env.DATABASE_LOCAL
//process.env.DATABASE.replace(
// '<PASSWORD>',
// process.env.DATABASE_PASSWORD
//   );

mongoose
    .connect(DB, {
        useNewUrlParser: true,
        useCreateIndex: true,
        useFindAndModify: false,
        useUnifiedTopology: true
    })
    .then((res) => console.log(`Connection to ${res.connections[0].name} Database successful!`,))
    .catch(e => console.log('error connecting', e))

module.exports = mongoose