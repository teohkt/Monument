const Eateries = require('../models/eateries')
const { cloudinary } = require('../cloudinary')
const mbxGeocoding = require('@mapbox/mapbox-sdk/services/geocoding')
const mapBoxToken = process.env.MAPBOX_TOKEN

const geocoder = mbxGeocoding({ accessToken: mapBoxToken })

module.exports.index = async (req, res) => {
  const allEateries = await Eateries.find({})
  var perPage = 8
  var pageQuery = parseInt(req.query.page)
  var pageNumber = pageQuery ? pageQuery : 1
  Eateries.find({})
    .skip(perPage * pageNumber - perPage)
    .limit(perPage)
    .exec(function (err, partialEateries) {
      Eateries.countDocuments().exec(function (err, count) {
        if (err) {
          console.log(err)
        } else {
          res.render('./pages/eateries/index', {
            totalEateries: allEateries,
            eateries: partialEateries,
            current: pageNumber,
            pages: Math.ceil(count / perPage),
          })
        }
      })
    })
}

module.exports.newEateryForm = (req, res) => {
  res.render('./pages/eateries/new')
}

module.exports.postNewEatery = async (req, res, next) => {
  const geoData = await geocoder
    .forwardGeocode({
      query: req.body.eatery.location,
      limit: 1,
    })
    .send()
  // res.send(geoData.body.features[0].geometry);

  const eatery = new Eateries(req.body.eatery)
  eatery.geometry = geoData.body.features[0].geometry

  // multer gives us req.files, which contains the uploaded image data
  eatery.images = req.files.map((f) => ({ url: f.path, filename: f.filename }))
  eatery.author = req.user._id
  await eatery.save()

  console.log(eatery)

  req.flash('success', 'Successfully made a new location')
  res.redirect(`/eat/${eatery._id}`)
}

module.exports.individualEatery = async (req, res) => {
  const place = await Eateries.findById(req.params.id)
    .populate({
      path: 'reviews',
      populate: {
        path: 'author',
      },
    })
    .populate('author')
  // console.log(place);
  if (!place) {
    req.flash('error', 'Eatery could not be found')
    res.redirect('/eat')
  }
  res.render('./pages/eateries/show', { place })
}

module.exports.editEateryForm = async (req, res) => {
  const place = await Eateries.findById(req.params.id)
  if (!place) {
    req.flash('error', 'Eatery could not be found')
    res.redirect('/eat')
  }
  res.render('./pages/eateries/edit', { place })
}

module.exports.postEditEatery = async (req, res) => {
  // console.log(req.body)

  const { id } = req.params
  const eats = await Eateries.findByIdAndUpdate(id, { ...req.body.eatery })
  // multer gives us req.files, which contains the uploaded image data
  if (req.files) {
    const imgs = req.files.map((f) => ({ url: f.path, filename: f.filename }))
    eats.images.push(...imgs)
  }
  await eats.save()

  if (req.body.deleteImages) {
    for (let filename of req.body.deleteImages) {
      console.log(filename)
      await cloudinary.uploader.destroy(filename)
    }
    // console.log(req.body.deleteImages)
    await eats.updateOne({ $pull: { images: { filename: { $in: req.body.deleteImages } } } })
    // console.log(eats);
  }

  req.flash('success', 'Successfully updated location')
  res.redirect(`/eat/${id}`)
}

module.exports.destroyEatery = async (req, res) => {
  const { id } = req.params
  await Eateries.findByIdAndDelete(id)
  req.flash('success', 'Successfully deleted location')
  res.redirect('/eat')
}
