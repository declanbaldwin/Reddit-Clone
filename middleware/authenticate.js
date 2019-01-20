var { User } = require("../models/user");

var authenticate = (req, res, next) => {
    console.log('start authentication');
    var {token} = req.cookies;
    User.findByToken(token)
        .then(user => {
            if (!user) {
                console.log('unable to find user');
                return Promise.reject("unable to find user");
            }
            req.user = user;
            req.token = token;
            next();
        })
        .catch(error => {
            console.log('error authenticating');
            res.status(401).send(error);
        });
};

module.exports = {
    authenticate
};