var express = require('express');
var router = express.Router();

const request = require("request");
const querystring = require("querystring");

router.get('/:name', function(req, res, next) {

    console.log(req.params.name)
    const artist = req.params.name
    const options = {
        method: 'GET',
        baseUrl: 'https://rest.bandsintown.com/artists/',
        url: artist+'/events?',
        qs: {
            app_id: '2a7380d65c50ddc8e86c33f0ebd7d7a7'
        }
    }
    request(options, function (err, response, body) {

        data = JSON.parse(body)

        res.render('concertInfo', { title: 'Concert Information', name: artist, result: data});
    })

});


module.exports = router;