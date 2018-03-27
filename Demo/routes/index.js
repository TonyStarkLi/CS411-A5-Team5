var express = require('express');
var router = express.Router();

const request = require("request");

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.post('/artist',function (req, res, next) {
    console.log(req.params);

    const u1 = 'https://tastedive.com/api/similar';
    const u2 = u1 + encodeURIComponent('red+hot+chili+peppers');
    console.log(u2);

    const options = {
        method: 'GET',
        url: 'https://tastedive.com/api/similar',
        q: 'red+hot+chili+peppers',
        k: '303685-CS411Con-VGAU9OYT'
    };

    op = encodeURI(options);

    console.log(op);

    request(options, function (error, response, body) {

        if (error) throw new Error(error);

        console.log("123");
        console.log(body);
        console.log(JSON.parse(body).Similar.Results);
        res.render('index', { title: 'BTC Rates', result: JSON.parse(body).Similar.Info });

    })

})

module.exports = router;
