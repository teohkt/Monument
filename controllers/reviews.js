const Review = require('../models/review')
const Eateries = require('../models/eateries')

module.exports.newReview = async (req, res) => {
  const place = await Eateries.findById(req.params.id)
  const review = new Review(req.body.review)

  review.author = req.user._id

  place.reviews.push(review)
  await review.save()
  await place.save()

  let counter = 0
  for (let ratingValue of place.reviews) {
    console.log(ratingValue)
    let { rating } = await Review.findById(ratingValue)
    counter += rating
  }
  console.log(counter)
  const avgRating = (counter / place.reviews.length).toFixed(1)

  place.rating = avgRating
  await place.save()

  req.flash('success', 'Successfully created new review')
  res.redirect(`/eat/${place._id}`)
}

module.exports.destroyReview = async (req, res) => {
  const { id, reviewId } = req.params
  await Eateries.findByIdAndUpdate(id, { $pull: { reviews: reviewId } })
  await Review.findByIdAndDelete(reviewId)
  req.flash('success', 'Successfully deleted review')
  res.redirect(`/eat/${id}`)
}
