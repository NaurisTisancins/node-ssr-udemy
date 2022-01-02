const mongoose = require('mongoose');
const slugify = require('slugify');
const User = require('./user.model');
// const validator = require('validator');

const tourSchema = new mongoose.Schema({
    name: {
        type: String,
        require: [true, "A tour must have a name!"],
        unique: true,
        trim: true,
        maxLength: [40, 'A tour name must have sell or equal than 40 chars!'],
        minLength: [10, "A tour must have atleast 10 char!"],
        // validate: [validator.isAlpha, "A tour name must contain letters!"],
    },
    slug: String,
    duration: {
        type: Number,
        required: [true, "A tour must have a duration!"],
    },
    maxGroupSize: {
        type: Number,
        required: [true, "A tour must have a group size!"],
    },
    difficulty: {
        type: String,
        required: [true, "A tour must have a difficulty level!"],
        enum: {
            values: ["easy", "medium", "difficult"],
            message: "Difficulty is either: 'easy', 'medium', 'difficult'",
        },
    },
    ratingsAverage: {
        type: Number,
        default: 4.5,
        min: [1, "Rating must be above 1.0"],
        max: [5, "Rating must be below 5.0"],
        set: val => Math.round(val * 10) / 10,
    },
    ratingsQuantity: {
        type: Number,
        default: 0,
    },
    price: {
        type: Number,
        required: [true, "A tour must have price!"],
    },
    priceDiscount: {
        type: Number,
        validate: {
            //not gonna work on update
            validator: function (val) {
                // 'this' only point to current doc when created NEW
                return val < this.price;
            },
            message: "priceDiscount ({VALUE}) must be lower that this.price!"
        },
    },
    summary: {
        type: String,
        trim: true,
        required: [true, "A tour must have a summary for front page!"]
    },
    description: {
        type: String,
        trim: true,
    },
    imageCover: {
        type: String,
        required: [true, "A tour must hava cover image!"],
    },
    images: [String],
    startDates: [Date],
    secretTour: {
        type: Boolean,
        default: false,
    },
    startLocation: {
        //GeoJSON
        type: {
            type: String,
            default: "Point",
            enum: ["Point"]
        },
        coordinates: [Number],
        address: String,
        description: String,
    },
    locations: [
        {
            type: {
                type: String,
                default: "Point",
                enum: ["Point"],
            },
            coordinates: [Number],
            address: String,
            description: String,
            day: Number,
        }
    ],
    guides: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        }
    ],
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});//tourSchema

// tourSchema.index({ price: 1 });
tourSchema.index({ price: 1, ratingsAverage: -1 });
tourSchema.index({ slug: 1 });
tourSchema.index({ startLocation: "2dsphere" });

tourSchema.virtual('durationWeeks').get(function () {
    return this.duration / 7;
});
//VIRTUAL POPULATE
tourSchema.virtual("reviews", {
    ref: "Review",
    foreignField: "tour",//field we want to refference in other model
    localField: "_id",//the value we look for in foreign field
});

// doc middleware - runs before .save() and .create() commands except .insertMany()
tourSchema.pre('save', function (next) {
    this.slug = slugify(this.name, { lower: true });
    next();
});

// tourSchema.pre("save", async function (next) {
//     const guidesPromises = this.guides.map(async id => await User.findById(id));
//     this.guides = await Promise.all(guidesPromises);
//     next();
// });//populate guides Array with user objects on fetch

//QUERY MIDDLEWARE
tourSchema.pre(/^find/, function (next) {
    this.find({ secretTour: { $ne: true } });
    this.start = Date.now();
    next();
});

tourSchema.pre(/^find/, function (next) {
    this.populate({
        path: "guides",
        select: "-__v -passwordChangedAt",
    });
    next();
});

tourSchema.post(/^find/, function (docs, next) {
    console.log(`Query took ${Date.now() - this.start} milliseconds!`);
    next();

});
//AGGREGATION middleware
// tourSchema.pre("aggregate", function (next) {
//     this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });
//     next();
// });

const Tour = mongoose.model("Tour", tourSchema);
module.exports = Tour;
