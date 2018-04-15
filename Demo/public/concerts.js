var config = require('../config');
const request = require("request");

const tastediveKey = config.tastedive;
const bandsintownKey = config.bandsintown;


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

function concertWithinDistance(numMiles,concert,userLat,userLong){
  if (distance(concert.venue.latitude,concert.venue.longitude,userLat,userLong) <= numMiles){
    return true;
  }
  else{
    return null;
  }
}

module.exports = {

  getArtistsFromTastedive:function(artist,callback){
    const options = {
      method: 'GET',
      url: 'https://tastedive.com/api/similar?',
      qs:{
        q: artist,
        k: tastediveKey,
        limit:5
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
  },

  getConcertsFromArtist:function(artist,callback) {
    const options = {
      method:'GET',
      baseUrl:'https://rest.bandsintown.com/artists/',
      url: artist+'/events?',
      qs:{
        app_id:bandsintownKey
      }
    };
    request(options,function(err,response,body) {
      //console.log(body);
      callback(body);
    });
  },

  buildConcertList:function (artistList, userLat, userLong,callback){
    concertList=[];
    counter = 0;
    for (var i in artistList){
      this.getConcertsFromArtist(artistList[i],function(concerts){
        concertJson = JSON.parse(concerts);
        for (var c in concertJson){
          if(!(userLat==null || userLong==null))
          {
            if(concertWithinDistance(50,concertJson[c],userLat,userLong)){ //replace 50 with user defined distance
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

}
