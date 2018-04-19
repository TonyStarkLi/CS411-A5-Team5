var config = require('../config');
var express = require('express'); // Express web server framework
var request = require('request'); // "Request" library
var querystring = require('querystring');
var cookieParser = require('cookie-parser');

var client_id = config.spotify_clientID; // Your client id
var client_secret = config.spotify_secret;
var redirect_uri = 'http://localhost:3000/login/spotify_oauth'; // Your redirect uri

/**
 * Generates a random string containing numbers and letters
 * @param  {number} length The length of the string
 * @return {string} The generated string
 */
var generateRandomString = function(length) {
  var text = '';
  var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  for (var i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
};

var stateKey = 'spotify_auth_state';

var router = express.Router();

//router.use(express.static(__dirname + '/public'))
//   .use(cookieParser());

router.use(cookieParser());

router.get('/', function(req, res) {
  var state = generateRandomString(16);
  res.cookie(stateKey, state);

  // your application requests authorization
  var scope = 'user-read-private user-read-email user-top-read';
  res.redirect('https://accounts.spotify.com/authorize?' +
               querystring.stringify({
    response_type: 'code',
    client_id: client_id,
    scope: scope,
    redirect_uri: redirect_uri,
    state: state
  }));
});


router.get('/spotify_oauth', function(req, res) {
  // your application requests refresh and access tokens
  // after checking the state parameter

  var code = req.query.code || null;
  var state = req.query.state || null;
  var storedState = req.cookies ? req.cookies[stateKey] : null;

  if (state === null || state !== storedState) {
    console.log('state mismatch');
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
        redirect_uri: redirect_uri,
        grant_type: 'authorization_code'
      },
      headers: {
        'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64'))
      },
      json: true
    };


    request.post(authOptions, function(error, response, body) {
      if (!error && response.statusCode === 200) {
        var access_token = body.access_token,
            refresh_token = body.refresh_token;


        let get_user_id = function(){
          return new Promise(function(resolve, reject){
            var user_info_call = {
              url: 'https://api.spotify.com/v1/me/',
              headers: { 'Authorization': 'Bearer ' + access_token },
              json: true
            };
            request.get(user_info_call, function(error, response, body) {
              resolve(body.id)
            });
          });
        }

        let get_user_artists = function(user_id) {
          var user_music_data = {data: []}
          var user_artists_call = {
            url: 'https://api.spotify.com/v1/me/top/artists', //Top three artists
            headers: { 'Authorization': 'Bearer ' + access_token },
            json: true,
            qs:{
              limit:3
            }
          };
          return new Promise(function(resolve, reject){
            request.get(user_artists_call,  function(error, response, body){
              for (item in body.items){
                var artists = body.items[item].name
                user_music_data.data.push({
                  "user_id": user_id,
                  "artists": artists
                });
              }
              resolve(user_music_data)
            });
          });
        }


        //database

        let insertInto_user_data = function(user_data){
          /*const client = new Client();
        client.connect().then(() =>{
          for (track_val in user_data.data){
            var sql = 'INSERT INTO public.user_data VALUES ($1, $2)'
            var current_val = user_data.data[track_val]
            var params = [current_val.user_id, current_val.song_artists[0].name];
            client.query(sql, params);

          }
        })*/
          console.log('do database stuff');

        }




        let redirectHome = function(){
          var options = {
            url: 'https://api.spotify.com/v1/me',
            headers: { 'Authorization': 'Bearer ' + access_token },
            json: true
          };

          // use the access token to access the Spotify Web API
          request.get(options, function(error, response, body) {
            res.redirect('/after?' +
                querystring.stringify({
                  access_token: access_token, // this is being passed directly into the html, not being used in any further node things
                  refresh_token: refresh_token          //as such, you need an html page (pug file) that actually has those parameters. then use them in future requests (hidden inputs or angular, or whatever)
                }));
          });
        }

        let dataStoreAndRedirect = function(user_data){
          insertInto_user_data(user_data);
          redirectHome();
        }



       get_user_id().then(function(fromResolve){
          get_user_artists(fromResolve).then(function(user_data){
            //insertInto_user_data(user_data);
            dataStoreAndRedirect(user_data);
          })
        });
        // we can also pass the token to the browser to make requests from there

      } else {
        res.redirect('/#' +
                     querystring.stringify({
          error: 'invalid_token'
        }));
      }
    });
  }
});


//anything that doesnt need to have /login in front of it should probably get moved to the index router
// in fact. i could probably just move the get('/login') to the index router and cut this out completely
// get user artists should probably also have its own router.get('blah blah')
//  --> so that it doesnt need to be inside the original login get
// /spotify_oauth should probably just set global variables for the tokens and all other calls be made elsewhere
router.get('/refresh_token', function(req, res) {
  // requesting access token from refresh token
  var refresh_token = req.query.refresh_token;
  var authOptions = {
    url: 'https://accounts.spotify.com/api/token',
    headers: { 'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64')) },
    form: {
      grant_type: 'refresh_token',
      refresh_token: refresh_token
    },
    json: true
  };

  request.post(authOptions, function(error, response, body) {
    if (!error && response.statusCode === 200) {
      var access_token = body.access_token;
      res.send({
        'access_token': access_token
      });
    }
  });
});


module.exports = router;
