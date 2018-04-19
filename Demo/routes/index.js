var express = require('express');
var router = express.Router();

const request = require("request");
const querystring = require("querystring");

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Go Musicians', show_table: true });
});

router.get('/artist',function (req, res, next) {

    artist = req.query.artist;
    console.log(artist);

    url = 'https://tastedive.com/api/similar?';
    const param = {
        q: artist,
        k: '303685-CS411Con-VGAU9OYT'
    }
    url = url + querystring.stringify(param);
    console.log("request url: ", url);

    const options = {
        method: 'GET',
        url: url
    };

    request(options, function (error, response, body) {

        if (error) throw new Error(error);
        artistsJSON = JSON.parse(body).Similar.Results;
        artists = [];
        for(var i in artistsJSON){
          artists.push(artistsJSON[i].Name);
        }
        console.log(artists);
        res.render('index', { title: 'Similar Artists Results', result: artists});

    })

})

module.exports = router;
