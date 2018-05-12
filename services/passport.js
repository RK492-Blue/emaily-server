const passport = require('passport');  // passport npm
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const mongoose = require('mongoose');
const keys = require('../config/keys');  // no need for .js extension.  Node automatically assumes.

const User = mongoose.model('users');

passport.serializeUser((user, done) => {        // user = existing user that we took out from the database
    done(null, user.id);                        // user.id is a unique id generated by Mongo, NOT the google id
                                                // after user has signed in, we only need to use our internal id
});

passport.deserializeUser((id, done) => {
    User.findById(id)
    .then(user => {
        done(null, user);
    });
});

passport.use(
    new GoogleStrategy(
        {
            clientID: keys.googleClientID,
            clientSecret: keys.googleClientSecret,
            callbackURL: '/auth/google/callback'
        }, 
        (accessToken, refreshToken, profile, done) => {
            // console.log('access token', accessToken);
            // console.log('refresh token', refreshToken);
            // console.log('profile', profile);

            User.findOne({ googleId: profile.id })      // search for user. Async 
            .then((existingUser) => {                   // promise
                if (existingUser){
                    // have record with given profile Id - user exists
                    done(null, existingUser);   // done(error, user_record)
                } else {
                    // user doesn't exist - create new user
                    new User({ googleId: profile.id })  // Mongoose model instance
                    .save()                             // save new user record
                    .then(user => done(null, user));    // callback another model instance. Use the promise callback by convention.
                }
            });
        }
    )
);