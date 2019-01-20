require("./config/config");

const _ = require("lodash");
const express = require("express");
const bodyParser = require("body-parser");
const { ObjectID } = require("mongodb");
const port = process.env.PORT || 3000;
const jwt = require("jsonwebtoken");

const app = express();
const { mongoose } = require("./db/mongoose");
const { Post } = require("./models/posts");
const { User } = require("./models/user");
const { authenticate } = require("./middleware/authenticate");
const cookieParser = require("cookie-parser");

app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cookieParser());
app.set("view engine", "ejs");

app.get("/", (req, res) => {
    var { token } = req.cookies;
    var results = {};
    if (!token) {
        Post.find({})
            .sort({ score: -1 })
            .then(posts => {
                return res.render("index", {
                    posts: posts,
                    token: null
                });
            })
            .catch(error => {
                console.log("no token error");
                res.status(404).send(error);
            });
    } else {
        Post.find({})
        .sort({ score: -1 })
        .then(posts => {
            results.posts = posts;
        })
        .then(() => {
            var decoded = jwt.verify(token, process.env.JWT_SECRET);
            return User.findOne({
                _id: decoded._id,
                "tokens.token": token,
                "tokens.access": "auth"
            }).then(user => {
                results.user = user;
            });
        })
        .then(() => {
            return res.render("index", {
                posts: results.posts,
                token: token,
                user: results.user
            });
        })
        .catch(error => {
            console.log("token exists error");
            res.status(404).send(error);
        });
    }
});

app.get("/login", (req, res) => {
    return res.render("login");
});

app.get("/logout", authenticate, (req, res) => {
    var { token } = req.cookies;
    if (!token) {
        return res
            .clearCookie("token")
            .status(200)
            .redirect("/");
    } else {

        req.user
        .removeToken(token)
        .then(() => {
            return res
            .clearCookie("token")
            .status(200)
            .redirect("/");
        })
        .catch(error => {
            res.status(404).send(error);
        });
    }
});

app.get("/myposts", authenticate, (req, res) => {
    Post.find({
        _creator: req.user._id
    })
        .then(
            posts => {
                return res.render("myposts", {
                    posts: posts,
                    user: req.user
                });
            },
            error => {
                res.status(400).send(error);
            }
        )
        .catch(error => {
            res.status(400).send(error);
        });
});

app.get("/account", authenticate, (req, res) => {
    var { token } = req.cookies;
    var decoded = jwt.verify(token, process.env.JWT_SECRET);
    User.findOne({
        _id: decoded._id,
        "tokens.token": token,
        "tokens.access": "auth"
    })
        .then(user => {
            return res.render("account", {
                user: user
            });
        })
        .catch(error => {
            res.status(404).send(error);
        });
});

app.post("/posts", authenticate, (req, res) => {
    let post = new Post({
        title: req.body.title,
        postType: req.body.postType,
        author: `${req.user.firstName} ${req.user.lastName}`,
        body: req.body.text,
        _creator: req.user._id,
        createdAt: new Date()
    });
    post.save()
        .then(() => {
            return res.redirect("/");
        })
        .catch(error => {
            res.status(404).send(error);
        });
});

app.post("/users", (req, res) => {
    var user = new User({
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        email: req.body.email,
        password: req.body.password
    });

    user.save()
        .then(() => {
            return user.generateAuthToken();
        })
        .then(token => {
            return res
                .status(200)
                .cookie("token", token, { httpOnly: true })
                .redirect("/");
        })
        .catch(error => {
            res.status(400).send(error);
        });
});

app.post("/users/login", (req, res) => {
    var body = _.pick(req.body, ["email", "password"]);
    User.findByCredentials(body.email, body.password)
        .then(user => {
            return user.generateAuthToken().then(token => {
                res.cookie("token", token, { httpOnly: true }).redirect("/");
            });
        })
        .catch(error => {
            res.status(400).send(error);
        });
});

app.post("/users/update", authenticate, (req, res) => {
    var body = _.pick(req.body, [
        "firstName",
        "lastName",
        "lastName",
        "email",
        "password"
    ]);

    Object.keys(body).forEach(key => body[key] == "" && delete body[key]);

    var { token } = req.cookies;
    var decoded = jwt.verify(token, process.env.JWT_SECRET);
    User.findOneAndUpdate(
        {
            _id: decoded._id,
            "tokens.token": token,
            "tokens.access": "auth"
        },
        { $set: body },
        { new: true }
    )
        .then(user => {
            if (!user) {
                return res.status(404).send();
            } else {
                return res.redirect("/");
            }
        })
        .catch(error => {
            res.status(400).send(error);
        });
});

app.get("/deletePost/:id", authenticate, (req, res) => {
    var id = req.params.id;

    if (!ObjectID.isValid(id)) {
        return res.status(404).send();
    } else {
        Post.findOneAndRemove({
            _id: id,
            _creator: req.user._id
        })
        .then(post => {
            if (!post) {
                return res.status(404).send();
            } else {
                return res.redirect("/myposts");
            }
        })
        .catch(error => {
            res.status(400).send(error);
        });
    }
});

app.post("/vote", authenticate, (req, res) => {
    if (req.body.voteType == "up") {
        Post.findById(req.body.postID)
            .then(post => {
                let userHasUpvotedBoolean = post.upvoters.includes(
                    req.user._id.toHexString()
                );
                let userHasDownVotedBoolean = post.downvoters.includes(
                    req.user._id.toHexString()
                );
                if (!userHasUpvotedBoolean && !userHasDownVotedBoolean) {
                    post.upvoters.push(req.user._id);
                    post.score = post.score + 1;
                    return post.save();
                } else if (!userHasUpvotedBoolean && userHasDownVotedBoolean) {
                    post.downvoters.pull(req.user._id);
                    post.upvoters.push(req.user._id);
                    post.score = post.score + 2;
                    return post.save();
                } else if (userHasUpvotedBoolean) {
                    post.upvoters.pull(req.user._id);
                    post.score = post.score - 1;
                    return post.save();
                }
            })
            .then(post => {
                let arrowColour = "";
                if (post.upvoters.includes(req.user._id.toHexString())) {
                    arrowColour = "red";
                } else {
                    arrowColour = "black";
                }

                res.json({
                    id: post._id,
                    score: post.score,
                    arrowColour: arrowColour,
                    voteType: "up"
                });
            })
            .catch(error => {
                res.status(400).send(error);
            });
    } else if (req.body.voteType == "down") {
        Post.findById(req.body.postID)
            .then(post => {
                let userHasUpvotedBoolean = post.upvoters.includes(
                    req.user._id.toHexString()
                );
                let userHasDownVotedBoolean = post.downvoters.includes(
                    req.user._id.toHexString()
                );
                if (!userHasDownVotedBoolean && !userHasUpvotedBoolean) {
                    post.downvoters.push(req.user._id);
                    post.score = post.score - 1;
                    return post.save();
                } else if (!userHasDownVotedBoolean && userHasUpvotedBoolean) {
                    post.upvoters.pull(req.user._id);
                    post.downvoters.push(req.user._id);
                    post.score = post.score - 2;
                    return post.save();
                } else if (userHasDownVotedBoolean) {
                    post.downvoters.pull(req.user._id);
                    post.score = post.score + 1;
                    return post.save();
                }
            })
            .then(post => {
                let arrowColour = "";
                if (post.downvoters.includes(req.user._id.toHexString())) {
                    arrowColour = "red";
                } else {
                    arrowColour = "black";
                }

                res.json({
                    id: post._id,
                    score: post.score,
                    arrowColour: arrowColour,
                    voteType: "down"
                });
            })
            .catch(error => {
                res.status(400).send(error);
            });
    }
});

app.post("/search", (req, res) => {
    let searchText = req.body.searchText;

    Post.find({ $text : { $search : searchText} }).then((posts) => {
        res.json({
            posts: posts
        });
    }).catch(error => {
        res.status(400).send(error);
    });
});

app.listen(port, () => {
    console.log(`Listening on port: ${port}`);
});

module.exports = { app };
