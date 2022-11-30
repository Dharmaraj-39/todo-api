
module.exports = function (db) {

    return {

        requireAuthentication: function (req, res, next) {

            var token = req.get('auth');

            db.user.findByToken(token).then(function (user) {
                req.user = user;
                next();
            }).catch(function (e) {
                console.log(e);
                res.status(401).send();
            });
        }
    };
};