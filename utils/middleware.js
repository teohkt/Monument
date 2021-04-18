const Eateries = require('../models/eateries');
const Review = require('../models/review');
const ExpressError = require('../utils/ExpressError');
const { eaterySchema, reviewSchema } = require("../schemas");

module.exports.lastPage = (req,res,next) => {
    if(!req.isAuthenticated()) {
        req.session.returnTo = req.originalUrl;
    }
    next();
}

module.exports.isLoggedIn = (req, res, next) => {
    // console.log("REQ.USER...", req.user )
    // console.log(req.path, req.originalUrl)
    // console.log(req.originalUrl);
    req.session.returnTo = req.originalUrl;
    if(!req.isAuthenticated()) {
        req.flash('error', "Please Log In, or Sign up first");
        return res.redirect('/login');
    }
    next();
}

module.exports.validateEatery = (req, res, next) => {
    const { error } = eaterySchema.validate(req.body);
    // console.log(req.body);
    if(error){
        const msg = error.details.map(el => el.message).join(',');
        throw new ExpressError(msg, 400);
    } else {
        next();
    }
}

module.exports.validateReview = (req, res, next) => {
    const { error } = reviewSchema.validate(req.body);
    if(error){
        const msg = error.details.map(el => el.message).join(',');
        throw new ExpressError(msg, 400);
    } else {
        next();
    };
};

module.exports.isAuthor = async (req, res, next) => {
    const { id } = req.params;
    const eatery = await Eateries.findById(id);
    if(!eatery.author.equals(req.user._id)){
        req.flash('error', 'You do not have permission to edit');
        return res.redirect(`/eat/${id}`);
    }
    next();
};

module.exports.isReviewer = async (req, res, next) => {
    const { id, reviewId } = req.params;
    const review = await Review.findById(reviewId);
    if(!review.author.equals(req.user._id)){
        req.flash('error', 'You do not have permission to edit');
        return res.redirect(`/eat/${id}`);
    }
    next();
}