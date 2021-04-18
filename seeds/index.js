const mongoose = require('mongoose')
const Eaterie = require('../models/eateries')
const Review = require('../models/review')

const { descriptors, places } = require('./titles.js')
const cities = require('./cities.js')
const { users } = require('./user.js')
const { images } = require('./images.js')
const { comments } = require('./comments.js')

const dotenv = require('dotenv')
const review = require('../models/review')

dotenv.config()

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useCreateIndex: true,
  useUnifiedTopology: true,
})

const db = mongoose.connection
db.on('error', console.error.bind(console, 'connection error: '))
db.once('open', () => {
  console.log('Database Connected')
})

const sample = (array) => array[Math.floor(Math.random() * array.length)]

const seedDB = async () => {
  await Eaterie.deleteMany({})
  await Review.deleteMany({})
  for (let i = 0; i < 50; i++) {
    const randNumb = Math.floor(Math.random() * 1738)
    const randPrice = Math.ceil(Math.random() * 5)
    const randImage = Math.floor(Math.random() * 9)
    const randUser = Math.ceil(Math.random() * 3)

    const place = new Eaterie({
      title: `${sample(descriptors)} ${sample(places)}`,
      // image: 'https://source.unsplash.com/collection/251966/1600x900',
      images: images[randImage],
      location: `${cities[randNumb].city}, ${cities[randNumb].province_id}`,
      description:
        'Bacon ipsum dolor amet tail prosciutto ham kevin pig salami turducken pancetta turkey. Boudin alcatra hamburger, salami andouille short loin tail chislic ribeye strip steak kevin sausage porchetta cupim picanha. Chislic beef ribs andouille tri-tip. Beef ham hock beef ribs ham tongue strip steak pancetta rump salami short loin fatback.',
      price: '$'.repeat(randPrice),
      author: `${users[randUser]}`,
      geometry: { type: 'Point', coordinates: [`${cities[randNumb].lng}`, `${cities[randNumb].lat}`] },
      reviews: [],
      rating: 0,
    })
    await place.save()
  }
  const allEateries = await Eaterie.find({})
  for (let place of allEateries) {
    let counter = 0
    for (i = 0; i < 3; i++) {
      const randCom = Math.ceil(Math.random() * 3)
      const randPrice = Math.ceil(Math.random() * 5)
      const randUser = Math.ceil(Math.random() * 3)
      const review = new Review({
        body: `${comments[randCom].body}`,
        rating: randPrice,
        author: `${users[randUser]}`,
      })
      counter += randPrice
      place.reviews.push(review)
      await review.save()
      await place.save()
    }
    place.rating = (counter / 3).toFixed(1)
    await place.save()
  }
}

seedDB().then(() => {
  mongoose.connection.close()
})
