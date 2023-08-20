//packages
const express = require("express"); //interact with html file
const bodyParser = require("body-parser"); //to get data from user
const mongoose = require("mongoose"); //package to connect to db
const cookieParser = require("cookie-parser");//used to store cookies for user sessions
const sessions = require('express-session');//used to create sessions
const mysql = require('mysql');//used connect to mysql db
var validator = require("email-validator");
const multer = require('multer');//package to upload and fetch images
const fs=require("fs");
const { json } = require("body-parser");
const hbs = require("express-handlebars");
//const popup = require('node-popup/dist/cjs.js');

const app = express();
app.use(express.static(__dirname + '/public'));
app.use(cookieParser());
const path = __dirname + '/public';
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());

app.use(sessions({ //this the data sent and stored in brower cookie
  secret: "thisismysecrctekeyfhrgfgrfrty84fwir767",
  saveUninitialized:true,
  cookie: { maxAge: 24*60*60*1000 },
  resave: false 
}));

const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  database: 'xplore',
})

db.connect((err) => {
  if (err) {
    console.log('Error');
    throw err;
  }
  console.log('SQL Connected');
  // db.query('SELECT place,city,country,state,budget,description,image,rating from travel_info LIMIT 3;', (err, rows) => {
  //   if(!err){
  //     //app.set("view engine", "hbs");
  //     // console.log("row: ",rows);
  //     // console.log(JSON.parse(JSON.stringify(rows)));
  //     //res.render("index.hbs", {info: JSON.parse(JSON.stringify(rows))});
  //   }
  //   else{
  //     console.log(err);
  //     //res.send("Error");
  //   }
  // });
});

app.get('/', function (req, res) {
  try{
    db.query('SELECT place,city,country,state,budget,description,image,rating from travel_info LIMIT 3;', (err, rows) => {
      if(!err){
        app.set("view engine", "hbs");
        res.render("index.hbs", {info: JSON.parse(JSON.stringify(rows))});
      }
      else{
        res.send("Error");
      }
    });
  }catch (e) {
    console.log("exception: ",e);
    res.status(400).send(e);
  }  
});

//---------------------------------------home------------------------------------//

app.get('/home', async function (req, res) {
  try{
    db.query('SELECT place,city,country,state,budget,description,image,rating from travel_info LIMIT 3;', (err, rows) => {
      if(!err){
        app.set("view engine", "hbs");
        res.render("index.hbs", {info: JSON.parse(JSON.stringify(rows))});
      }
      else{
        res.send("Error");
      }
    });
  }catch (e) {
    console.log("exception: ",e);
    res.status(400).send(e);
  }
});

//--------------------------------------image storage--------------------------------------//

var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/images');
  },
  filename: function (req, file, cb) {
      var ext=file.originalname.substring(file.originalname.lastIndexOf('.'));
    cb(null, file.fieldname+'-'+Date.now()+ext);
  }
})

var upload = multer({ storage: storage })
app.use('/uploads',express.static('../images'));


//--------------------------------------Signup------------------------------------------//

app.post('/signup',upload.single('image'), async function (req, res) {
  try {
    const password = req.body.password;
    const repeat = req.body.repeatPassword;
    const name = req.body.name;
    const email = req.body.email;
    const phone = req.body.phone;
    const age = req.body.age;
    const gender = req.body.gender;
    const place = req.body.place;

    let file = req.file;
    let filename = 'images/'+file.filename;

    if (repeat == password) {
      db.query('INSERT into user (email,username,phone,age,gender,home,password,profile) values (?);', [[email, name, phone, age, gender, place, password,filename]], (err) => {
        if (!err) {
          res.status(201).sendFile(path + "/login1.html");
        }

        else {
          res.send(err);
        }
      })
    }
    else {
      alert("Re-enter password");
    }

  } catch (e) {
    res.status(400).send(e);
  }
});


//--------------------------------------Login------------------------------------------//

app.post('/login', async function (req, res) {
  try {
    const password = req.body.password;
    const email = req.body.email;
    req.session.userid = email;

    db.query('SELECT password from user WHERE email = ? LIMIT 1;', [email], (err, rows1) => {
      if (!err && rows1[0].password == password) {
        db.query('SELECT pid,place,city,country,state,budget,description,image,rating from travel_info', (err, rows) => {
          if(!err){
            app.set("view engine", "hbs");
            //console.log(JSON.parse(JSON.stringify(rows1)));
            res.render("feed.hbs", {info: JSON.parse(JSON.stringify(rows))});
          }
          else{
            res.send("Error");
          }
        });
     }
      else {
        res.status(201).sendFile(path + "/login1.html");
        //alert("Invalid Password")
      }
    });
    
  } catch (e) {
    res.status(400).send(e);
  }
});

//--------------------------------------feed------------------------------------------//

app.post('/feed', async function (req, res) {
  try {
    db.query('SELECT pid,place,city,country,state,budget,description,image,rating from travel_info', (err, rows) => {
      if(!err){
        app.set("view engine", "hbs");
        // console.log(JSON.parse(JSON.stringify(rows)));
        res.render("feed.hbs", {info: JSON.parse(JSON.stringify(rows))});
      }
      else{
        res.send("Error");
      }
    });
  } catch (e) {
    res.status(400).send(e);
  }
});

//--------------------------------------Forgot------------------------------------------//

app.post('/forgot', async function (req, res) {
  try {
    const password = req.body.password;
    const email = req.body.email;
    const repeat = req.body.repeatpassword;

    if(passwordrepeat==password){
      db.query('UPDATE user SET password = ? where email = ', [email,password], (err, rows) => {
        if (!err && repeat == password) {
          res.status(201).sendFile(path + "/login.html");
        }
        else {
          res.send("Invalid email or password");
        }
      })
    }
    else{
      alert("reenter password");
    }
    
  } catch (e) {
    res.status(400).send(e);
  }
});


//--------------------------------------Post----------------------------------------------//

app.post('/postit', upload.single('image'), async function (req, res) {
  try {
    let file = req.file;
    let filename = 'images/'+file.filename;
    const place = req.body.place;
    const city = req.body.city;
    const country = req.body.country;
    const state = req.body.state;
    const budget = req.body.budget;
    const description = req.body.description;
    const rating = req.body.rate;
    //console.log("helooooo");
    db.query('SELECT MAX(pid) as id from travel_info', (err, row) => {
      if(!err){
        var q = JSON.parse(JSON.stringify(row));
        var p_id = q[0].id;
        db.query('INSERT into travel_info (pid,userid,place,city,state,country,budget,description,image,rating) values (?);', [[p_id+1,req.session.userid, place, city, state, country, budget, description, filename, rating]], (err, rows) => {
          if (!err) {
            db.query('SELECT username,home,age,gender from user,travel_info WHERE email = ? LIMIT 1;', [req.session.userid], (err, rows) => {
              if (!err) {
                db.query('SELECT pid,place,city,country,state,budget,description,image,rating from travel_info WHERE userid = ?;', [req.session.userid], (err, rows1) => {
                  if(!err){
                    app.set("view engine", "hbs");
                    //console.log(JSON.parse(JSON.stringify(rows)));
                    //console.log(JSON.parse(JSON.stringify(rows1)));
                    res.render("profile.hbs", {info: JSON.parse(JSON.stringify(rows)), info1: JSON.parse(JSON.stringify(rows1))});
                  }
                  else{
                    res.send("Error");
                  }
                });
              }
              else {
                res.send("Invalid email or password");
              }
            });
          }
    
          else {
            res.send(err)
          }
        });
      }

      else{
        res.send(err)
      }
    });

  } catch (e) {
    res.status(400).send(e);
  }
});

//--------------------------------------profile------------------------------------------//

app.post('/profile', async function (req, res) {
  try {
    //console.log("hellloooo");
      db.query('SELECT username,home,age,gender,password,profile from user WHERE email = ? LIMIT 1;', [req.session.userid], (err, rows) => {
      if (!err) {
        db.query('SELECT pid,place,city,country,state,budget,description,image,rating from travel_info WHERE userid = ?;', [req.session.userid], (err, rows1) => {
          if(!err){
            app.set("view engine", "hbs");
            res.render("profile.hbs", {info: JSON.parse(JSON.stringify(rows)), info1: JSON.parse(JSON.stringify(rows1))});
            // console.log(JSON.parse(JSON.stringify(rows)));
          }
          else{
            res.send("Error");
          }
        });
      }
      else {
        console.log(err);
        res.send(err);

      }
    });
  } catch (e) {
    res.status(400).send(e);
  }
});


//--------------------------------------search------------------------------------------//

app.post('/search', async function (req, res) {
  try {
    const search= req.body.search;
    //console.log(search);

        db.query('SELECT place,city,country,state,budget,description,image,rating from travel_info WHERE city=?', [search],(err, rows) => {
          if(!err){
            app.set("view engine", "hbs");
            // console.log(JSON.parse(JSON.stringify(rows)));
            res.render("place1.hbs", {info: JSON.parse(JSON.stringify(rows))});
          }
          else{
            res.send("Error");
          }
        });
  } catch (e) {
    res.status(400).send(e);
  }
});




//--------------------------------------Rate------------------------------------------//

app.post('/place1', async function (req, res) {
  try {
    const id= req.body.pid;
    const rate = req.body.rate;

        db.query('SELECT pid,city,country,state,budget,description,image from travel_info ', (err, row) => {
          if(!err){
            db.query('SELECT id,rate,n from rating', (err, rows) => {
              if(!err){
                
                app.set("view engine", "hbs");
                // console.log(JSON.parse(JSON.stringify(rows)));
                res.render("place1.hbs", {info: JSON.parse(JSON.stringify(row))});
              }
              else{
                res.send("Error");
              }
            });
            app.set("view engine", "hbs");
            // console.log(JSON.parse(JSON.stringify(row)));
            res.render("place1.hbs", {info: JSON.parse(JSON.stringify(row))});
          }
          else{
            res.send("Error");
          }
        });
  } catch (e) {
    res.status(400).send(e);
  }
});

//----------------------------------------Postview--------------------------------------------//

app.post('/postview', async function (req, res) {
  try{
        var id = req.body.pid;
        // console.log("hello");
        // console.log(id);
        db.query('SELECT username,pid,place,city,country,state,budget,description,image,rating from user,travel_info WHERE pid = ? LIMIT 1;', [id], (err, rows) => {
          if(!err){
            app.set("view engine", "hbs");
            // console.log(JSON.parse(JSON.stringify(rows)));
            res.render("postview1.hbs",{info: JSON.parse(JSON.stringify(rows))});
          }
          else{
            res.send("Error");
          }
        });
     }
  catch (e) {
    res.status(400).send(e);
  }
});

//-----------------------------------------Port--------------------------------------------------//

app.listen(3000, function () {
  console.log("Port no. 3000")
});


