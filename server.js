const express = require('express')
const app = express()
const bodyParser = require('body-parser')
const cors = require('cors')
const mongoose = require('mongoose')

app.use(cors())

app.use(bodyParser.urlencoded({extended: false}))
app.use(bodyParser.json())

mongoose.connect(process.env.MONGO_URI, (err)=>{
  err ? 
    console.log(`Sorry you cannot connect to the databas: ${err}`) 
    : console.log(`You are now connected to the Mongo Database!`)
})

const User = require(__dirname + '/userSchema.js');

app.post('/api/exercise/new-user', (req, res, next)=>{
  var reqUser = req.body.username;
  if (reqUser){
    const newUser = { username: reqUser }; //default value for the log array is []... right?
    User.findOne({username: newUser.username}, (err, data)=>{
      if (err)  next(err);
          if (data){ 
            res.send("Username already taken... fool")
          } else {
          User.create(newUser, (err, user)=>{
          err ? next(err) : res.json({username: user.username, id: user._id})        
          });
        }
      
  });
    
  } else {
    res.send("Please enter a usernaem");
    }
});



app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});


// Not found middleware
app.use((req, res, next) => {
  return next({status: 404, message: 'not found'})
})

// Error Handling middleware
app.use((err, req, res, next) => {
  let errCode, errMessage

  if (err.errors) {
    // mongoose validation error
    errCode = 400 // bad request
    const keys = Object.keys(err.errors)
    // report the first validation error
    errMessage = err.errors[keys[0]].message
  } else {
    // generic or custom error
    errCode = err.status || 500
    errMessage = err.message || 'Internal Server Error'
  }
  res.status(errCode).type('txt')
    .send(errMessage)
})

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
