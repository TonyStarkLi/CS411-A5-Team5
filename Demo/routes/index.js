var express = require('express');
var router = express.Router();

const request = require("request");

var userLat;
var userLong;

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Concert Recommendation', location:false});
});


router.post('/setLocation',function(req,res,next){
  console.log(userLat,userLong);
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
    getArtistsFromTastedive(artist,function(artistList){
    buildConcertList(artistList,function(concertList){
      res.send(concertList);

    //const u1 = 'https://tastedive.com/api/similar';
    //const u2 = u1 + encodeURIComponent('red+hot+chili+peppers');
    //console.log(u2);

    /*   const options = {
        method: 'GET',
        url: 'https://tastedive.com/api/similar?',
        qs:{
          q: artist,
          k: '303685-CS411Con-VGAU9OYT'
        }
    };

    op = encodeURI(options);
    console.log(op);
    request(options, function (error, response, body) {
      console.log(options)

        if (error) throw new Error(error);
        //console.log(body);
        artistsJSON = JSON.parse(body).Similar.Results;
        artists = [];
        for(var i in artistsJSON){
          artists.push(artistsJSON[i].Name);
        }
        console.log(artists);
        res.render('similarartists', { searchartist:artist, similarartists:artists});

    });*/
    });
  });
});

function getArtistsFromTastedive(artist,callback){
  const options = {
    method: 'GET',
    url: 'https://tastedive.com/api/similar?',
    qs:{
      q: artist,
      k: '303685-CS411Con-VGAU9OYT'
    }
  };

  request(options, function (error, response, body) {

    if (error) throw new Error(error);
    //console.log(body);
    artistsJSON = JSON.parse(body).Similar.Results;
    artists = [artist];
    for(var i in artistsJSON){
      artists.push(artistsJSON[i].Name);
    }

    callback(artists);
  });
}

function getConcertsFromArtist(artist,callback) {
  const options = {
    method:'GET',
    baseUrl:'https://rest.bandsintown.com/artists/',
    url: artist+'/events?',
    qs:{
      app_id:'2a7380d65c50ddc8e86c33f0ebd7d7a7'
    }
  };
  request(options,function(err,response,body) {
    //console.log(body);
    callback(body);
  });
}

function buildConcertList(artistList,callback){
  concertList=[];
  counter = 0;
  for (var i in artistList){
    getConcertsFromArtist(artistList[i],function(concerts){
      concertJson = JSON.parse(concerts);
      for (var c in concertJson){
        if(!(userLat==null || userLong==null))
        {
          if(concertWithinDistance(50,concertJson[c])){ //replace 50 with user defined distance
             concertList.push(concertJson[c]);
          }
        }
        else {
          concertList.push(concertJson[c]);
        }
      }
      counter+=1;
      if(counter==artistList.length){
        callback(concertList);
      }
    });

  }
}



// from https://www.geodatasource.com/developers/javascript
function distance(lat1, lon1, userLat, userLong) {
	var radlat1 = Math.PI * lat1/180
	var raduserLat = Math.PI * userLat/180
	var theta = lon1-userLong
	var radtheta = Math.PI * theta/180
	var dist = Math.sin(radlat1) * Math.sin(raduserLat) + Math.cos(radlat1) * Math.cos(raduserLat) * Math.cos(radtheta);
	dist = Math.acos(dist)
	dist = dist * 180/Math.PI
	dist = dist * 60 * 1.1515
	return dist
}

function concertWithinDistance(numMiles,concert){
  if (distance(concert.venue.latitude,concert.venue.longitude,userLat,userLong) <= numMiles){
    return true;
  }
  else{
    return null;
  }
}








module.exports = router;
