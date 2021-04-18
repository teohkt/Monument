const express = require('express');
const router = express.Router();
const catchAsync = require('../utils/catchAsync');
const passport = require('passport')

const users = require('../controllers/users');

router.route('/register')
    .get( users.renderRegisterForm )
    .post( catchAsync( users.postRegister ));

router.route('/login')
    .get( users.loginForm )
    .post( passport.authenticate('local', {failureFlash: true, failureRedirect: '/login'}), users.postLogin );

router.get('/logout', users.logout);

module.exports = router;