var express = require('express');
var router = express.Router();
const concertBuilder = require('../public/concerts.js');
const request = require("request");

var userLat;
var userLong;

/* GET home page. */
router.get('/', function(req, res, next) {
  //console.log(req.url);
  res.render('index', { title: 'Concert Recommendation', location:false});
});

router.get('/after', function(req, res, next) {
  //console.log(req.query);
  res.render('index', { title: 'Concert Recommendation', location:false});
});




router.post('/setLocation',function(req,res,next){
  console.log(userLat,userLong);
  console.log(req.url);
  console.log(req.body);
  userLat=req.body.latitude;
  userLong=req.body.longitude;
  if (userLat=='' || userLong==''){
    userLat = null;
    userLong= null;
  }

  console.log(userLat,userLong);
  res.render('index', { title: 'Concert Recommendation', location:true});
});


router.get('/artist',function (req, res, next) {
    artist = req.query.artist;
    concertBuilder.getArtistsFromTastedive(artist, function(artistList){
      concertBuilder.buildConcertList(artistList, userLat, userLong, function(concertList){
      res.send(concertList);
    });
  });
});





module.exports = router;
