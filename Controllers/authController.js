'use strict';
const jwt = require('jsonwebtoken');
const passport = require('passport');
const {validationResult} = require('express-validator');
const userModel = require('../Models/userModel');
const bcrypt = require('bcryptjs');

// Handle login
const login = (req, res) => {
  console.log(`authController login req.body: `, req.body);
  passport.authenticate('local', {session: false}, (err, user, info) => {
    console.log('authController authenticate', user);
    if (err || !user) {
      return res.status(400).json({
        message: 'Something is not right',
        user: user,
      });
    }
    req.login(user, {session: false}, (err) => {
      if (err) {
        res.send(err);
      }
      // generate a signed son web token with the contents of user object and return it in the response
      const token = jwt.sign(user, process.env.JWT);
      return res.json({user, token});
    });
  })(req, res);
};

// For creating user
const user_create_post = async (req, res, next) => {
  // Extract the validation errors from a request.
  const errors = validationResult(req);

  try {
    // Check for email availability, if email is already in database don't allow creation
    const status = await userModel.checkEmailAvailability(req);

    const available = status === undefined ? true : false;

    // Email was available
    if (available) {
      // Check for errors in input
      if (!errors.isEmpty()) {
        console.log('user create error', errors);
        res.send(errors.array());
      } else {
        // No errors
        // bcrypt password
        const salt = bcrypt.genSaltSync(10);
        const hash = bcrypt.hashSync(req.body.password, salt);
        req.body.password = hash;

        // Admin always defaults to 0
        req.body.admin = 0;

        console.log('authController: salt and hash craeted, pw hashed');

        if (await userModel.insertUser(req)) {
          next();
        } else {
          res.status(400).json({error: 'register error'});
        }
      }
    } else {
      // Email wasn't available
      res.json({Message: 'Email is already taken'});
    }
  } catch (e) {
    console.error(e.message);
  }
};

// Handle logout
const logout = (req, res) => {
  req.logout();
  res.json({message: 'logout'});
};

module.exports = {
  login,
  logout,
  user_create_post,
};