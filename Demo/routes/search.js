var express = require('express');
var router = express.Router();

const concertBuilder = require('../public/concerts.js');

var userLat;
var userLong;




router.get('/',function (req, res, next) {
    artist = req.query.artist;
    concertBuilder.getArtistsFromTastedive(artist,function(artistList){
    concertBuilder.buildConcertList(artistList,userLat, userLong, function(concertList){
      res.send(concertList);
    });
  });
});


module.exports = router;
