var express = require('express');
var router = express.Router();
var request = require('request'); // "Request" library
const spotifyConfig = require('../config/spotify')
const querystring = require('querystring');
const User = require('../models/User')

var stateKey = 'spotify_auth_state';


//GET Fetch all users
router.get('/db', function (req, res, next) {

    User.find({}, function (err, results) {
        res.json(results)
    })
})


/* Login page page. */
router.get('/', function(req, res, next) {
    var state = generateRandomString(16);
    res.cookie(stateKey, state);

    // your application requests authorization
    var scope = 'user-read-private user-read-email user-top-read';
    res.redirect('https://accounts.spotify.com/authorize?' +
        querystring.stringify({
            response_type: 'code',
            client_id: spotifyConfig.client_id,
            scope: scope,
            redirect_uri: spotifyConfig.redirect_uri,
            state: state
        }));
});

router.get('/callback', function(req, res) {

    var code = req.query.code || null;
    var state = req.query.state || null;
    var storedState = req.cookies ? req.cookies[stateKey] : null;

    if (state === null || state !== storedState) {
        res.redirect('/#' +
            querystring.stringify({
                error: 'state_mismatch'
            }));
    } else {
        res.clearCookie(stateKey);
        var authOptions = {
            url: 'https://accounts.spotify.com/api/token',
            form: {
                code: code,
                redirect_uri: spotifyConfig.redirect_uri,
                grant_type: 'authorization_code'
            },
            headers: {
                'Authorization': 'Basic ' + (new Buffer(spotifyConfig.client_id + ':' + spotifyConfig.client_secret).toString('base64'))
            },
            json: true
        };

        request.post(authOptions, function(error, response, body) {
            if (!error && response.statusCode === 200) {

                var access_token = body.access_token,
                    refresh_token = body.refresh_token;

                const get_user_id = function(){

                    return new Promise(function(resolve, reject){
                        var user_info_call = {
                            url: 'https://api.spotify.com/v1/me/',
                            headers: { 'Authorization': 'Bearer ' + access_token },
                            json: true
                        };

                        request.get(user_info_call, function(error, response, body) {
                            resolve(body.id);
                        });
                    })
                }



                const get_user_artists = function(user_id) {
                    
                    var user_music_data = {data: []}
                    var user_artists_call = {
                        url: 'https://api.spotify.com/v1/me/top/artists?limit=3', //Top three artists
                        headers: { 'Authorization': 'Bearer ' + access_token },
                        json: true
                    };
                    return new Promise(function(resolve, reject){
                        request.get(user_artists_call,  function(error, response, body){
                            var artists = [];
                            for (item in body.items){
                                var artist = body.items[item].name
                                artists.push(artist);
                            }
                            user_music_data.data.push({
                                "user_id": user_id,
                                "artists": artists
                            });
                            resolve(user_music_data)
                        });
                    });
                }


                //  //database
                 const insertInto_user_data = function(userData){
                    User.create(userData)
                 }

                get_user_id().then(function(fromResolve){
                    get_user_artists(fromResolve).then(function(user_data){

                        const info = user_data["data"][0]

                        User.findOne({user_id: String(info["user_id"])} , function (err, results) {
                            if (err) {console.log(err)}
                            if (results) {
                                console.log("alreald saved")
                            } else {
                                console.log("need to save it")
                                insertInto_user_data(user_data["data"][0])

                            }
                        })

                    }, function(err) {
                        console.log(err); // Error: "It broke"
                    })
                }, function(err) {
                    console.log(err); // Error: "It broke"
                })


                // we can also pass the token to the browser to make requests from there
                res.redirect('/users/#' +
                    querystring.stringify({
                        access_token: access_token,
                        refresh_token: refresh_token
                    }));
            } else {
                res.redirect('/#' +
                    querystring.stringify({
                        error: 'invalid_token'
                    }));
            }
        });
    }
});



var generateRandomString = function(length) {
    var text = '';
    var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

    for (var i = 0; i < length; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
};


module.exports = router;
