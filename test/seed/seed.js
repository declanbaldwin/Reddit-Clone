const { ObjectID } = require("mongodb");
const { Post } = require("./../../models/posts");
const { User } = require("./../../models/user");
const jwt = require("jsonwebtoken");

const user1ID = new ObjectID();

const users = [{
    _id: user1ID,
    firstName: "user first name",
    lastName: "user last name",
    email: 'user1@example.com',
    password: 'password1',
    tokens: [{
        access: 'auth',
        token: jwt.sign({_id: user1ID, access: 'auth'}, process.env.JWT_SECRET).toString()
      }]
}];

const populateUsers = (done) => {
    User.deleteMany({}).then(() => {
        var userOne = new User(users[0]).save();
         return Promise.resolve(userOne);
    }).then(() => {
        done();
    })
    .catch(error => {
        console.log(error);
    });
};

module.exports = {users, populateUsers};
