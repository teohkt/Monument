const mongoose = require('mongoose');
const review = require('./review');
const Schema = mongoose.Schema;

// https://res.cloudinary.com/teohkt/image/upload/v1608503149/Monument2/ys7uwacnwyclnz1oqrzt.png

const ImageSchema = new Schema({
    url:String,
    filename: String
});

ImageSchema.virtual('thumbnail').get(function() {
    return this.url.replace('/upload', '/upload/w_200');
})

const opts = { toJSON: {virtuals: true } };

const EateriesSchema = new Schema ({
    title: String,
    images: [ImageSchema],
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
    },
    price: String,
    rating: String,
    description: String,
    location: String,
    author: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    reviews: [
        {
            type: Schema.Types.ObjectId,
            ref: 'Review'
        }
    ]
}, opts);

EateriesSchema.virtual('properties.popUpMarkup').get(function() {
    return `
        <a href="/eat/${this._id}">${this.title}</a>
        </br><p>${this.location}</p>
    `
    
});

EateriesSchema.post('findOneAndDelete', async function (doc) {
    // console.log(doc)
    if(doc){
        await review.deleteMany({ 
            _id: {
                $in: doc.reviews
            }
        })
    }
})

module.exports = mongoose.model('Eateries', EateriesSchema)