//Get a router instance
const express = require('express')
const router = express.Router()
const request = require('request'); // "Request" library

//Grab configs for Spotify
const spotifyConfig = require('../config/spotify')

//Connect to user database
const User = require('../models/User')

const passport = require('passport')
const SpotifyStrategy = require('passport-spotify').Strategy;


/*
 Once authenticated, Spotify will pass back oauth tokens and the user's Spotify profile,
 which we will use as a key in the database. Passport uses the Twitter ID from the
 profile in its serialize/deserialize methods
 */
var scope = 'user-read-private user-read-email user-top-read';
passport.use(new SpotifyStrategy({
        clientID: spotifyConfig.client_id,
        clientSecret: spotifyConfig.client_secret,
        callbackURL: spotifyConfig.redirect_uri,
        scope: scope
    },
    function(accessToken, refreshToken, expires_in, profile, done) {

        //console.log(profile.displayName)
        const get_user_artists = function(user_id) {
            var user_artists_call = {
                url: 'https://api.spotify.com/v1/me/top/artists?limit=3', //Top three artists
                headers: { 'Authorization': 'Bearer ' + accessToken },
                json: true
            };
            return new Promise(function(resolve, reject){
                request.get(user_artists_call,  function(error, response, body){
                    var artists = [];
                    for (item in body.items){
                        var artist = body.items[item].name
                        artists.push(artist);
                    }
                    resolve(artists)
                });
            });
        }

        User.findOne({spotifyId: String(profile.id)} , function (err, results) {
            if (err) {
                console.log(err)
                return done(err, null)
            }
            if (results) {
                console.log("already saved")
            } else {
                console.log("need to save it")

                // Save user top 3 artists and user id
                get_user_artists(profile.id).then(function(user_data){
                    User.create({spotifyId: String(profile.id), username: String(profile.displayName), artists: user_data })
                }, function(err) {
                    console.log(err); // Error: "It broke"
                })

                console.log("saved")

            }
            return done(null, profile)
        })
    }
));



passport.serializeUser(function (user, done) {
    console.log('in serialize, setting id on session:', user.id)
    done(null, user.id)
})

passport.deserializeUser(function (id, done) {
    console.log('in deserialize with id', id)
    User.findOne({spotifyId: String(id)}, function (err, user) {
        done(err, user)
    })
})


router.get('/success', function (req, res, next) {
    console.log("success")
    res.redirect('/')
})

router.get('/logout', function (req, res, next) {

    req.logOut()
    res.clearCookie()
    res.status = 401
    //
    // req.session.destroy(function (err) {
    //     res.redirect('/'); //Inside a callback… bulletproof!
    // });

    res.redirect('/')
})

//OAuth Step 1
router.get('/spotify',
    passport.authenticate('spotify'))

//OAuth Step 2
router.get('/callback',
    passport.authenticate('spotify', { failureRedirect: '/' }),
    function(req, res) {
        // Successful authentication, redirect home.
        res.cookie('authStatus', 'true')
        res.cookie('authInfo', req.user.id)
        res.redirect('/');
    });

module.exports = router
