const checkAuthorization = function (req, res, next) {
    if (!req.isAuthenticated())
        res.sendStatus(401)
    else next()
}

module.exports = checkAuthorization