const express = require("express");
const router = express.Router({ mergeParams: true});
const reviews = require("../controllers/reviews");

// For Serverside validation
const catchAsync = require("../utils/catchAsync");
const { validateReview, isLoggedIn, isReviewer} = require("../utils/middleware");

// Submit a new review
router.post('/', isLoggedIn, validateReview, catchAsync( reviews.newReview ))

// Delete a review
router.delete('/:reviewId', isLoggedIn, isReviewer, catchAsync( reviews.destroyReview ))

module.exports = router;