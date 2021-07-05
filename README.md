# Monument 2
This is a sample website used to demonstrate CRUD capability with RESTful routes. It is compleated using MongoDB, Express, Node.js (MEN stack). Currently hostend on Heroku (https://monument2.herokuapp.com/).

# Development
For development, a local MongoDB was used. 

## MongoDB setting up on Windows
Instructions on setting it up for windows was found here: 
>https://docs.mongodb.com/manual/tutorial/install-mongodb-on-windows/#install-mongodb-community-edition.

## MongoDB setting up on Mac
Instructions on setting it up for Mac was found here:
>https://docs.mongodb.com/manual/tutorial/install-mongodb-on-os-x/
To connect and use MongoDB, you can connect a mongo shell to the running instance with just the command `mongo`.

## Environment Variables
User validation was also included in the project, so new users needed to be inserted into the seeds file so that they could have access to edit posts.
At some point in the local development, the env file needs to be populated so that the application could be connected to cloudinary, where all the images were to be stored. .env files are included in the gitignore so that sensitive data would not be made public.

# MongoDB Atlas
MongoDB Atlas is an online version which is hosted by AWS, Google Cloud, or Azure. This project is using the free version, but it can be scaled up if necessary, making it a good choice to prototype on. The IP address needs to be white listed and users need to be set up for it to work.
When working with session, the default store is the memory store. We want to switch this to MongoDB, so we use the module `connect-mongo`.

# Creating New Dataset
Creating many entries for development purposes was necessary to help visualize what the full potential of the website could be. Within the seeds folder, there are real Canadian cities and two word lists. Using random numbers, these items were combined into objects containing name and location. To clear out the database and start fresh after modification, the index file can be re-ran
> node seeds/index.js

Users had to be manually created since the author object part of the postings were tied to an object ID. 

# Validation
Bootstrap validation was used for client side form validation. New entries and edits to the forms could not be submitted unless they were filled with text. Subtle error messages would appear near the appropriate fields that needed attention. 

Clientside validation could be bypassed with Postman, so additional server authentication was required. The 'joi' package was used to validate data by creating a schema that would check to see if the submitted data matched that before being passed into MongoDB. Postman was used to send form data (x-www-form-urlencoded through the body) to test validation and error handling.

Errors for invalid routes were caught by wrapping async functions with a function that created a next parameter, which was then passed onto a new route.

Errors and validation were refactored into their own files after development for ease of readability within the app.js file.

# Deleting

## Deleting reviews
This was accomplished through identifying both the comment ID and parent ID. The comment was removed with .findByIdAndDelete.
> await Review.findByIdAndDelete(reviewId);

while the parent's link to the comment had to be deleted with MongoDB's $pull operator.
> await Eateries.findByIdAndUpdate(id), { $pull: {reviews: reviewId} };

## Deleting Eatery and all associated data
Deleting the parent and associated children was done using mongoose middleware, findOneAndDelete. This middleware is only available to the function .findByIdAndDelete. If an alternate function was used to delete the parent object, .findOneAndDelete would not work. This snippet was saved under models.
```
EateriesSchema.post('findOneAndDelete', async function (doc) {
    console.log(doc)
    if(doc){
        await review.deleteMany({ 
            _id: {
                $in: doc.reviews
            }
        })
    }
})
```

## Deleting images
Deleting images is tricky because we need to indentify which images to delete with the update route. We can iterate over the images and pair it with a radio button with a value containing the images' filename. This filename can then be used to remove that particular file from the associated database. The following functions needs to be wrapped in an if statement that checks that there are images to delete, or else it can crash.

### Deleting images from mongodb
We need to use $pull to remove the picture object from the array.
> await eats.updateOne({ $pull: { images: { filename: { $in: req.body.deleteImages } } } })

### Deleting images from cloudinary
We can take advantage of cloundinary function destroy to remove the picture from cloudinary.
`````
        for (let filename of req.body.deleteImages) {
            console.log(filename);
            await cloudinary.uploader.destroy(filename);
        }
`````

# Refactoring
When refactoring for routes, you can use express.Router. 'app' needs to be changed to 'router'. Within the routes file, the export will also be needed.
> module.exports = router;

The following may also be needed if there are nested :ids.
> const router = express.Router({ mergeParams: true});

# Session and cookies
Using express-session, we set up cookies. This setup includes a secret code just for development purposes. When it is deployed, an environment code is given instead. These cookies were set to expire in 1 week, and Date.now() returns miliseconds.
`````
const session = require('express-session');
const sessionConfig = {
    secret: 'secretCode',
    resave: false,
    saveUninitialized: true,
    cookie: {
        httpOnly: true,
        expires: Date.now() + 1000 * 60 * 60 *24 * 7, //Date.now() returns miliseconds
        maxAge: 1000 * 60 * 60 *24 * 7 //one week
    }
};

app.use(session(sessionConfig));
`````

# Flash Messages
These are messages that are provided to the user to give some feedback. This must be set up after sessions to allow for cookies to be stores.

````
const flash = require('flash');
app.use(flash());
// Within the route, after the action
req.flash('success', 'Successfully made a new campground');
````

Before all the routes, this middleware can be added so that it is run at every route and save the need to pass it into every route.

`````
app.use((req, res, next) => {
    res.locals.success = req.flash('success');
    next();
})
`````

// Within the layouts at the top of the body

> <%= success %>

# Authentication with Passport
We will be using a combination of passport libraries to authenticate users. Passport also has functionality for facebook, twitter, and google, so it will not be hard to include those futures at a later date.

> npm i passport passport-local passport-local-mongoose

passport-local-mongoose will automatically set up the salt and hash when you register a new user.

For user login, you can add the middleware from passport, passport.authenticate, to check salt and hash the user password, and verify that against the database
> passport.authenticate('local', {failureFlash: true, failureRedirect: '/login'} )

After the user has logged in, it is persisted with  .serializeUser. This is a helper method attached to the request object, req.isAuthenticated().
>passport.serializeUser(User.serializeUser());

To log out the user, we can simply use this function from passport
> req.logout();

To check if we have a user signed in, we can call req.user
> res.locals.currentUser = req.user;

## Recognizing a signed up user to be logged in
After we register the user, we can save the info as an object and pass it back into the login route as so
`````
    const registeredUser = await User.register(user, password);
    req.login(registeredUser, err => {
        if(err) return next(err);
        req.flash('success', `Welcome to Monument2 ${username}`)
        res.redirect('/eat');
    })
`````

## Redirecting users after they are prompted to login
In order to remember where the user came from after they are sent to a re-login page, we store the origionalUrl in the session.

> req.session.returnTo = req.originalUrl;

Within the login route, we can call on returnTo, or have it go back to the standard landing page. Make sure to delete this session variable using:

> delete req.session.returnTo;

# Authorization
## Location Postings
Set up middleware isAuthor to check if currently signed in user (req.user._id) is the same as post author id (.author). If they are not, then the user gets redirected back to the origonl single posting. Made sure to use return to forcefully end the function.

## Review Postings
Needed to make sure to poplulate the review data since it was nested. This required a nested populate function.
`````
    const place = await (await (await Eateries.findById(req.params.id).populate({
        path:'reviews',
        populate: {
            path: 'author'
        }
    }).populate('author')));
`````
EJS was also used to show/hide the delete button for the reviews which was associated with the user. currentUser needed to be verified to be true, or else the page would crash and not load at all.

> <% if(currentUser && review.author.equals(currentUser.id)) { %> 

## Adding Controllers
Controllers allow us to slim down our routes by passing objects through instead of packing in all the lines of code. This is part of the  model-view-controller (MVC) architecture.

We can also combine get, put, and delete routes that share the same link. For example,

`````
router.get('/register', users.renderRegisterForm )

router.post('/register', catchAsync( users.postRegister ));
`````

can be combined into


`````
router.route('/register')
    .get( users.renderRegisterForm )
    .post( catchAsync( users.postRegister ));
`````

# Adding Stars
Used css library 'starability' which allows us to add stars instead of a slider using purely css and html.

# Uploading Images
Traditionally, use just parse url encoded forms, and we use express for that as 'app.use(express.urlencoded({extended:true}));` Images require forms to have another property `enctype="multipart/form-data"`, and in order to parse multipart/form-data, we need to use Multer, which is a node.js middleware.

**Make sure to include this property for forms in order for multer to work**
> enctype="multipart/form-data"

Following the docs, multer saves all the file uploads in a folder (will create a new one if not found). For production ready applications, the upload will be changed to AWS or cloudinary.
`````
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });
`````

Multiple images can be uploaded if the property multiple is added to the form as such:

> <input type="file" name="image" id="" multiple>

and the route, change single to arry:

`````
    .post(upload.array('image'), (req, res) => {
        console.log(req.body, req.file);
        res.send("It worked!")
    })
`````

## bs-custom-file-input
In order to see all the different files that are uploaded at once, a javascript library is needed. This javascript library is bs-custom-file-input, and the cdn version of it can be used, linked through a script tag within our boilerplate.ejs. This script MUST be placed in the header. This allows the page to be more dynamic by showing all the file names that are qued in a multi-file upload. the custom-file and custom-file-label are necessary for bs-custom-file-input to change the text. This is a working snippet for bootstrap 5 beta 1.

`````
<div class="mb-3 custom-file">
    <label for="image" class="form-label">Upload Images</label>
    <input class="form-control" type="file" id="image" name="image" multiple>
    <label class="form-control-label" for="image">
        <span class="form-file-text custom-file-label"></span>
    </label>
</div>
`````

## Cloudinary
We used cloudinary to store the images that users upload. These additional two libraries will help us connect to cloudinary and save the files after we add the necessary credentials.
> npm i cloudinary multer-storage-cloudinary

Following the docs for multer-storage-cloudinary, a config file was made under the foler cloudinary, and imported into the routes that used cloudinary.

Mongoose models, validation schemas, and routes needed to be updated for the new file type, and additional data (path and filename of the image which was stored on the cloud).

### Warning
Multer will upload the data first, and therefore it cannot be validated. During development, the upload middleware was sequenced before the validation. In a production environment, this would have to be changed to _____.

# Protecting environment variables
During development, we can us .env which is a file that stays on the local machine and does not get uploaded. We then use the npm dotenv to help load thse into our app.

`````
if(process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}
console.log(process.env.CLOUDINARY_CLOUD_NAME);
console.log(process.env.CLOUDINARY_KEY);
console.log(process.env.CLOUDINARY_SECRET);
`````
# Mapbox
This is used to create maps so that users can pin locations for a visible representation of locations. This is the docs used for @mapbox/mapbox-sdk
>https://github.com/mapbox/mapbox-sdk-js/blob/main/docs/services.md#geocoding

## Retrieving coordinates
We can pass the location data submitted by the user into mapbox's geocoder. The geocoder will output alot of info, but we are mainly focused on the geometry. Also note, that the coordinates of geometry is stored as [long, lat] instead of the traditional [lat, long].
`````
    const geoData = await geocoder.forwardGeocode({
        query: req.body.eatery.location,
        limit: 1
    }).send();
    // res.send(geoData.body.features[0].geometry);
`````

## Saving geoJSON data in mongoose
We can save the data that mapbox returns to us in our model using:
`````
geometry: {
        type: {
            type: String,
            enum: ['Point'],
            required: true
        },
        coordinates: {
            type: [Number],
            required: true
        }
    }
`````

## Cluster Map
The cluster map requires geojson data, but in a specific format. By referring to the sample code, we see that the geometry data is within the object of features, and other data must be placed under properties. The first step is to pass in our data as JSON with the following snippet.
``````
<script>
    const eateryPlaces = {features: <%- JSON.stringify(eateries) %>}
</script>
``````
The next step is to add a virtual property for the properties (ie name, description) by making a virtual property.
``````
EateriesSchema.virtual('properties.popUpMarkup').get(function() {
    return "Hello"
});
``````

Also note, that MongoDB does not transform virtuals to JSON, so we need the following attributes tagged at the end of the schema.
>const opts = { toJSON: {virtuals: true } };

# Security

## Mongo Injection
Although MongoDB is a NoSQL database, it can still suffer from injection attacks. For example, `db.users.find({username: req.body.username});` will retrieve the info for the specified username, but if `{"$gt": ""}` was used instead of req.body.username, it will return all users. `$gt` is an operator for greater than, and `""` is an empty string.

To prevent this, we will use express-mongo-sanitize to remove any keys that contain `$`. We can initialize it in our app.js file with:
``````
const mongoSanitize = require('express-mongo-sanitize');
app.use(mongoSanitize()); 
``````

This way, when we request queries such as `http://localhost:3000/?$gt=asdf`, it will automatically remove `$gt=asdf`.

## Cross-Site Scripting (XSS)
This is the typical script tag that is inserted into a form input that can be run everytime the form data is read.

With ejs, by using `<%= %>` (the `=` is the important part here), these brackets will escape the html, and html tags will not run since it is transformed into `&lt` and `&gt` instead of `<` and `>`.

Although we may believe that by using ejs, we are safe, there may still be vulnerabilities through other javascript. An example of this in this project is through the mapbox javascript. 

In order to avoid majority of this type of attack, we will be creating an extention for joi that can escape these tags. joi was previously used for schema detection and data validation. The express-sanitize package is an alternative. Within this .escapeHTML extension that we are creating for JOI, we will ue the package sanitize-html to do the actual stripping of data.

`````
const BaseJoi = require('joi');
const sanitizeHtml = require('sanitize-html');

const extension = (joi) => ({
    type: 'string',
    base: joi.string(),
    messages: {
        'string.escapeHTML': '{{#label}} must not include HTML!'
    },
    rules: {
        escapeHTML: {
            validate(value, helpers) {
                const clean = sanitizeHtml(value, {
                    allowedTags: [],
                    allowedAttributes: {},
                });
                if (clean !== value) return helpers.error('string.escapeHTML', { value })
                return clean;
            }
        }
    }
});

const Joi = BaseJoi.extend(extension);
`````

## Session Cookies
These cookies have a property of `httpOnly: true`, which means only html can access these cookies, and cannot be executed through javascript. If we add the property of `secure: true`, then the cookies can only be added through https instaed of http.

# Helmet
`````
const helmet = require('helmet');
app.use(helmet({contentSecurityPolicy:false}));
`````
One of the 11 middleware that the helmet package includes is contentSecurityPolicy(), which will break all apis in this project (unsplash images, maps, fonts). This is because this middleware checks to see if these external sources (directives) are allowed to be fetched from. In order to permit these sources, we need to specify them.

Within the apps folder, there are 3 arrays that are set up to allow for certain styles, scripts, and cdns. 

# Deployment
Deployment is done using Heroku. The computers that this project was build on needed to be setup with heroku packages. Once everything is set up, you need to log in using `heroku login` through the command line.

After loggin in, you can connect the project by using `heroku create` from the top level of the folder within the command line. We can check if it has successfully connected through `git remote -v`. We now should be able to see a heroku remote. We can always add an existing heroku git to our poject through
>`heroku git:remote -a app_name`

To push our project onto heroku servers, we use
>git push heroku master

Since we are deploying and not using our local directories, we need to make sure to update the locations that our app is drawing from. for example:
`````
const dbUrl = process.env.DB_URL || 'mongodb://localhost:27017/eateries'
const secret = process.env.SECRET || 'secretCode'
`````

We also have to ensure that we whitelist all ip addresses on mongo atlas since heroku servers will be running our app, and they cycle through many ip addresses.

We also need to add a start script since we have been manually starting our own apps with `nodemon`. The starting script will be placed within package.json within the script, and is simply `"start": "node app.js"`

In order to see the logs for the error, we can use `heroku logs --tail` since it is the heroku machines that are running our code.

# Setting up heroku environment variables
Heroku does not use .env files. We need to set it up through the web browser under Settings -> Config Vars. This can also be one through
>heroku config:set variable_name=variable_value
