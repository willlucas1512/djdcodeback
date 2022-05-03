const User = require("../models/User");
const bcrypt = require("bcryptjs");
const localStrategy = require("passport-local").Strategy;

module.exports = function (passport) {
  passport.use(
    new localStrategy((email, password, done) => {
      console.log(email);
      console.log("heat wave");
      User.findOne({ email: email }, (err, user) => {
        console.log("heat wave");
        if (err) throw err;
        if (!user) return done(null, false);
        bcrypt.compare(password, user.password, (err, result) => {
          if (err) throw err;
          if (result === true) {
            return done(null, user);
          } else {
            return done(null, false);
          }
        });
      });
    })
  );

  passport.serializeUser((user, cb) => {
    console.log("heat wave");
    cb(null, user.id);
  });
  passport.deserializeUser((id, cb) => {
    console.log("heat wave");
    User.findOne({ _id: id }, (err, user) => {
      const userInformation = {
        email: user.email,
      };
      cb(err, userInformation);
    });
  });
};
