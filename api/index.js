const express= require('express');
const cors=require ('cors');
const mongoose = require("mongoose");
require('dotenv').config()
const cookieParser = require('cookie-parser');
const bcrypt = require('bcryptjs');
const User = require('./models/User.js');
const Place = require('./models/Place.js');
const Booking = require('./models/Booking.js');
const bcryptSalt = bcrypt.genSaltSync(10);
const jwt = require('jsonwebtoken');
const imageDownloader = require('image-downloader');
const multer = require('multer');
const fs = require('fs');

const app=express();

// app.use(cors());
const jwtSecret = 'fasefraw4r5r3wq45wdfgw34twdfg';
app.use(express.json());
app.use(cookieParser());
app.use('/uploads', express.static(__dirname+'/uploads'));

app.use(cors({
  credentials: true,
  origin: 'http://localhost:5173',
  // origin: 'https://bookitupp.netlify.app',
}));

console.log(__dirname);
console.log(process.env.MONGO_URL)
mongoose.connect(process.env.MONGO_URL);


app.get('/test', (req,res,next) => {
    res.json('test ok');
  });

  function getUserDataFromReq(req) {
    return new Promise((resolve, reject) => {
      jwt.verify(req.cookies.token, jwtSecret, {}, async (err, userData) => {
        if (err) throw err;
        resolve(userData);
      });
    });
  }

app.post('/register', async (req,res) => {
    const {name,email,password} = req.body;
    try {
      const userDoc = await User.create({
        name,
        email,
        password:bcrypt.hashSync(password, bcryptSalt),
      });
      res.json(userDoc);
    } catch (e) {
      res.status(422).json(e);
    } 
  });
  app.post('/login', async (req,res) => {
    // mongoose.connect(process.env.MONGO_URL);
    const {email,password} = req.body;
    const userDoc = await User.findOne({email});
    if (userDoc) {
      const passOk = bcrypt.compareSync(password, userDoc.password);
      if (passOk) {
        jwt.sign({
          email:userDoc.email,
          id:userDoc._id
        }, jwtSecret, {}, (err,token) => {
          if (err) throw err;
          res.cookie('token', token).json(userDoc);
        });
      } else {
        res.status(422).json('pass not ok');
      }
    } else {
      res.json('not found');
    }
  });
  app.get('/profile', (req,res) => {
    // mongoose.connect(process.env.MONGO_URL);
    const {token} = req.cookies;
    if (token) {
      jwt.verify(token, jwtSecret, {}, async (err, userData) => {
        if (err) throw err;
        const {name,email,_id} = await User.findById(userData.id);
        res.json({name,email,_id});
      });
    } else {
      res.json(null);
    }
  });
  app.post('/logout', (req,res) => {
    res.cookie('token', '').json(true);
  });

  app.post('/upload-by-link', async (req,res) => {
    const {link} = req.body;
    const newName =  'photo'+ Date.now() + '.jpg';
    await imageDownloader.image({
      url: link,
      dest: __dirname +'/uploads/' +newName,
       // dest: '/tmp/' +newName,
    });
    // const url = await uploadToS3('/tmp/' +newName, newName, mime.lookup('/tmp/' +newName));
    // res.json(url);
    res.json(newName);
  });
  
  const photosMiddleware = multer({dest:'uploads/'});
  app.post('/upload', photosMiddleware.array('photos', 100), async (req,res) => {
    const uploadedFiles = [];
    for (let i = 0; i < req.files.length; i++) {
      const {path,originalname} = req.files[i];
      const parts=originalname.split('.');
      const ext=parts[parts.length-1];
      const newPath= path+ '.' + ext;
      fs.renameSync(path,newPath);
      uploadedFiles.push(newPath.replace('uploads/',''));
      // const {path,originalname,mimetype} = req.files[i];
      // const url = await uploadToS3(path, originalname, mimetype);
      // uploadedFiles.push(url);
    }
    res.json(uploadedFiles);
  });

  app.post('/places', (req,res) => {
    mongoose.connect(process.env.MONGO_URL);
    const {token} = req.cookies;
    const {
      title,address,addedPhotos,description,price,
      perks,extraInfo,checkIn,checkOut,maxGuests,
    } = req.body;
    jwt.verify(token, jwtSecret, {}, async (err, userData) => {
      if (err) throw err;
      const placeDoc = await Place.create({
        owner:userData.id,
        price,title,address,photos:addedPhotos,description,
        perks,extraInfo,checkIn,checkOut,maxGuests,
      });
      res.json(placeDoc);
    });
  });

  app.get('/user-places', (req,res) => {
    mongoose.connect(process.env.MONGO_URL);
    const {token} = req.cookies;
    jwt.verify(token, jwtSecret, {}, async (err, userData) => {
      const {id} = userData;
      res.json( await Place.find({owner:id}) );
    });
  });

  app.get('/places/:id', async (req,res) => {
    // mongoose.connect(process.env.MONGO_URL);
    const {id} = req.params;
    res.json(await Place.findById(id));
  });
  
  app.put('/places', async (req,res) => {
    // mongoose.connect(process.env.MONGO_URL);
    const {token} = req.cookies;
    const {
      id, title,address,addedPhotos,description,
      perks,extraInfo,checkIn,checkOut,maxGuests,price,
    } = req.body;
    jwt.verify(token, jwtSecret, {}, async (err, userData) => {
      if (err) throw err;
      const placeDoc = await Place.findById(id);
      if (userData.id === placeDoc.owner.toString()) {
        placeDoc.set({
          title,address,photos:addedPhotos,description,
          perks,extraInfo,checkIn,checkOut,maxGuests,price,
        });
        await placeDoc.save();
        res.json('ok');
      }
    });
  });
  app.get('/places/:id', async (req,res) => {
    // mongoose.connect(process.env.MONGO_URL);
    const {id} = req.params;
    res.json(await Place.findById(id));
  });
  app.get('/places', async (req,res) => {
    // mongoose.connect(process.env.MONGO_URL);
    res.json( await Place.find() );
  });

  app.post('/bookings', async (req, res) => {
    // mongoose.connect(process.env.MONGO_URL);
    const userData = await getUserDataFromReq(req);
    const {
      place,checkIn,checkOut,numberOfGuests,name,phone,price,
    } = req.body;
    Booking.create({
      place,checkIn,checkOut,numberOfGuests,name,phone,price,
      user:userData.id,
    }).then((doc) => {
      res.json(doc);
    }).catch((err) => {
      throw err;
    });
  });
  
  
  app.get('/bookings', async (req,res) => {
    // mongoose.connect(process.env.MONGO_URL);
    const userData = await getUserDataFromReq(req);
    res.json( await Booking.find({user:userData.id}).populate('place') );
  });
app.listen(4000);
//new BSfpOPtFb4fkmD9V
//4sqsL3JTF338HLlX