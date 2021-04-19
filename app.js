if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config()
}

// console.log(process.env.CLOUDINARY_CLOUD_NAME);
// console.log(process.env.CLOUDINARY_KEY);
// console.log(process.env.CLOUDINARY_SECRET);

const express = require('express')
const path = require('path')
const mongoose = require('mongoose')
const ejsMate = require('ejs-mate')
const methodOverride = require('method-override')
const session = require('express-session')
const MongoStore = require('connect-mongo')(session)
const flash = require('connect-flash')
const helmet = require('helmet')

require('dotenv').config()

// For Authentication
const passport = require('passport')
const LocalStrategy = require('passport-local')
const User = require('./models/user')

const ExpressError = require('./utils/ExpressError')

const mongoSanitize = require('express-mongo-sanitize')

const app = express()

// app.use(helmet({contentSecurityPolicy:false}));
const scriptSrcUrls = [
  // "https://stackpath.bootstrapcdn.com/",
  'https://api.tiles.mapbox.com/',
  'https://api.mapbox.com/',
  // "https://kit.fontawesome.com/",
  'https://cdnjs.cloudflare.com/',
  'https://cdn.jsdelivr.net',
]
const styleSrcUrls = [
  // "https://kit-free.fontawesome.com/",
  // "https://stackpath.bootstrapcdn.com/",
  'https://api.mapbox.com/',
  'https://api.tiles.mapbox.com/',
  'https://fonts.gstatic.com',
  'https://fonts.googleapis.com/',
  'https://use.fontawesome.com/',
  'https://cdn.jsdelivr.net',
]
const connectSrcUrls = [
  'https://api.mapbox.com/',
  'https://a.tiles.mapbox.com/',
  'https://b.tiles.mapbox.com/',
  'https://events.mapbox.com/',
]
const fontSrcUrls = ['https://fonts.gstatic.com']
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: [],
      connectSrc: ["'self'", ...connectSrcUrls],
      scriptSrc: ["'unsafe-inline'", "'self'", ...scriptSrcUrls],
      styleSrc: ["'self'", "'unsafe-inline'", ...styleSrcUrls],
      workerSrc: ["'self'", 'blob:'],
      objectSrc: [],
      imgSrc: [
        "'self'",
        'blob:',
        'data:',
        'https://res.cloudinary.com/teohkt/', //SHOULD MATCH YOUR CLOUDINARY ACCOUNT!
        'https://images.unsplash.com/',
      ],
      fontSrc: ["'self'", ...fontSrcUrls],
    },
  })
)

// Connecting to Database
// const dbUrl = process.env.DB_URL;
const dbUrl = process.env.MONGO_URI || 'mongodb://localhost:27017/eateries'
mongoose.connect(dbUrl, {
  useNewUrlParser: true,
  useCreateIndex: true,
  useUnifiedTopology: true,
  useFindAndModify: false,
})

const db = mongoose.connection
db.on('error', console.error.bind(console, 'connection error: '))
db.once('open', () => {
  console.log('Database Connected')
})

const secret = process.env.SECRET || 'secretCode'
const store = new MongoStore({
  url: dbUrl,
  secret: secret,
  touchAfter: 24 * 3600, // time period in seconds
})

store.on('error', function (e) {
  console.log('SESSION STORE ERROR: ', e)
})

// Setting up session for cookies
const sessionConfig = {
  store,
  name: 'monument',
  secret: secret,
  resave: false,
  saveUninitialized: true,
  cookie: {
    httpOnly: true,
    // secure: true,
    expires: Date.now() + 1000 * 60 * 60 * 24 * 7, //Date.now() returns miliseconds
    maxAge: 1000 * 60 * 60 * 24 * 7, //one week
  },
}

// Initializing session for cookies
app.use(session(sessionConfig))

// For Flash Messages
app.use(flash())

// For local Authentication
app.use(passport.initialize())
app.use(passport.session())
passport.use(new LocalStrategy(User.authenticate())) //.authenticate is a static method of passport-local-mongoose

passport.serializeUser(User.serializeUser())
passport.deserializeUser(User.deserializeUser())

// Connecting routes
const eateriesRoutes = require('./routes/eateries')
const reviewsRoutes = require('./routes/reviews')
const usersRoutes = require('./routes/users')

// Connecting directories and filenames
app.use(express.static(__dirname + '/public'))

app.engine('ejs', ejsMate)
app.set('view engine', 'ejs')
app.set('views', path.join(__dirname, 'views'))

// Parsing post data
app.use(express.urlencoded({ extended: true }))

//Used to include PUT method instead of standard GET/POST
app.use(methodOverride('_method'))

app.use(mongoSanitize())

app.use((req, res, next) => {
  // console.log(req.query);
  res.locals.currentUser = req.user
  res.locals.success = req.flash('success')
  res.locals.error = req.flash('error')
  next()
})

app.use('/eat', eateriesRoutes)
app.use('/eat/:id/reviews', reviewsRoutes)
app.use('/', usersRoutes)

// Home Page
app.get('/', (req, res) => {
  res.render('./pages/monuments')
})

// Error that pushes out for when no routes work
app.all('*', (req, res, next) => {
  next(new ExpressError('Page Not Found', 404))
})

// Error Response from async functions
app.use((err, req, res, next) => {
  const { statusCode = 500 } = err
  if (!err.message) err.message = 'Something went wrong'
  // res.status(statusCode).send(message);
  res.status(statusCode).render('./layouts/error', { err })
})

const port = process.env.PORT
app.listen(port, function () {
  console.log(`Monuments Connected, Serving on port ${port}`)
})
