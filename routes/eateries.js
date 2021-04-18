const express = require('express')
const router = express.Router()
const catchAsync = require('../utils/catchAsync')
const eateries = require('../controllers/eateries')
const Eateries = require('../models/eateries')
// for serverside validation
const { isLoggedIn, validateEatery, isAuthor, lastPage } = require('../utils/middleware')

// For parsing of enctype="multipart/form-data
const multer = require('multer')
// this tells multer to save in local storage, instead we want to save in cloudinary
// const upload = multer({ dest: 'uploads/' });
const { storage } = require('../cloudinary')
const upload = multer({ storage })

router
  .route('/')
  // // List of all the eateries
  .get(catchAsync(eateries.index))
  // Send form data to CREATE eateries
  .post(isLoggedIn, upload.array('image'), validateEatery, catchAsync(eateries.postNewEatery))
// Testing upload to cloudinary
// .post(upload.array('image'), (req, res) => {
//     console.log(req.body, req.files);

//     res.send("It worked!")
// })

// Create new eateries
router.get('/new', isLoggedIn, eateries.newEateryForm)

router
  .route('/:id')
  // Show individual eateries (READ)
  .get(lastPage, catchAsync(eateries.individualEatery))
  // Send form data to UPDATE eateries
  .put(isLoggedIn, isAuthor, upload.array('image'), validateEatery, catchAsync(eateries.postEditEatery))
  // Delete Campground
  .delete(isLoggedIn, isAuthor, catchAsync(eateries.destroyEatery))

// Edit eateries
router.get('/:id/edit', isLoggedIn, isAuthor, catchAsync(eateries.editEateryForm))

module.exports = router
