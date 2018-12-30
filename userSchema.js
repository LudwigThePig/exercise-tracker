const mongoose = require('mongoose')


const User = mongoose.Schema({
  username: String,
  count: {type: Number, default: 0},
  log : [{ description: String, duration: Number, date: Date }]
}, {
  collection: 'users'
})


module.exports = mongoose.model('User', User);