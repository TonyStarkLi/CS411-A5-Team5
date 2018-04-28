var express = require('express');
var router = express.Router();

//Connect to user database
const User = require('../models/User')

router.get('/:spotifyId', function (req, res, next) {
    //console.log(req.params.spotifyId)
    User.findOne({spotifyId: req.params.spotifyId}, function (err, result) {
        //console.log("the result")
        //console.log(result)
        res.json(result)
    })
})

module.exports = router;