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
const Exercise = require(__dirname + '/exercise.js');


app.post('/api/exercise/new-user', (req, res, next)=>{
  var reqUser = req.body.username;
  if (reqUser){
    const newUser = { username: reqUser };
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
    res.send("Please enter a username");
    }
});

app.post('/api/exercise/add', (req, res, next)=>{
  const userId = req.body.userId;
  const description = req.body.description;
  let duration = req.body.duration;
  User.findById(userId, (err, data)=>{
    
    if (err) next(err);
    
    if (data){
      
      const date = req.body.date ? new Date(req.body.date) : new Date();
      duration = parseInt(duration);
      
      
      const activity = new Exercise({userId, description, duration, date});
      
      activity.save((err, data) => {
        if (err) next(err);
        res.json(data);
      });
    } else {
      res.send("This does not appear to be a valid userId");
    }
  })
})

/*
INSPIRATION
GET /api/exercise/log?{userId}[&from][&to][&limit]
*/
app.get('/api/exercise/:log', (req, res)=>{
  let userId = req.query.id,
      from = req.query.from,
      to = req.query.to,
      limit = req.query.limit;
  let query = {};
  
  if (from !== undefined && isNaN(Date.parse(from))){
    res.send({error: 'The [from] date is formated poorly'});
  } else if (to !== undefined && (Date.parse(to))){
    res.send({error: 'The [to] date is foramted poorly'});
  } else if (limit !== undefined &&isNaN(limit)){
    res.send({error: '[limit] is not a number]'})
  } else {
    
    User.findOne({userId}, (err, data)=>{
    if (err) res.send({error: 'user not found'});
      query.userId = data.id;
      
      
      if (from !== undefined) {
        from = new Date(from);
        query.date = { $gte: from};
      }

      if (to !== undefined) {
        to = new Date(to);
        to.setDate(to.getDate() + 1); // Add 1 day to include date
        query.date = { $lt: to};
      }
      
      limit = parseInt(limit);
            
      Exercise.find(query).select('username description duration date').limit(limit).exec((err, exercises)=>{
        if(err) res.send({error: 'Query could not return'});
        res.json(exercises);
      })
    })  
  }
})


app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});


app.use((req, res, next) => {
  return next({status: 404, message: 'not found'})
})

app.use((err, req, res, next) => {
  let errCode, errMessage

  if (err.errors) {
    errCode = 400 // bad request
    const keys = Object.keys(err.errors)
    errMessage = err.errors[keys[0]].message
  } else {
    errCode = err.status || 500
    errMessage = err.message || 'Internal Server Error'
  }
  res.status(errCode).type('txt')
    .send(errMessage)
})

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
