const mongoose = require("mongoose");
const User = require("./user.model");
const Tour = require("./tour.model");

const reviewSchema = new mongoose.Schema({
    review: {
        type: String,
        required: [true, "Review cannot be empty!"]
    },
    rating: {
        type: Number,
        min: 1,
        max: 5,
        required: [true, "Review must have a rating!"],
    },
    tour: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Tour",
        required: [true, "Review must belong to a tour!"]
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: [true, "Review must belong to a user!"]
    }

}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
});

// populate user and tour fields 
reviewSchema.pre(/^find/, function (next) {
    this.populate({
        path: "user",
        select: "name photo"
    });
    next();
});

reviewSchema.statics.calcAverageRating = async function (tourId) {
    const stats = await this.aggregate([
        {
            $match: { tour: tourId }
        },
        {
            $group: {
                _id: "$tour",
                nRatings: { $sum: 1 },
                avgRating: { $avg: "$rating" }
            }
        }
    ]);
    // console.log(stats);
    if (stats.length > 0) {
        await Tour.findByIdAndUpdate(tourId, {
            ratingsQuantity: stats[0].nRating,
            ratingsAverage: stats[0].avgRating
        });
    } else {
        await Tour.findByIdAndUpdate(tourId, {
            ratingsQuantity: 0,
            ratingsAverage: 0
        });
    }
};

reviewSchema.index({
    tour: 1,
    user: 1
}, {
    unique: true,
});

reviewSchema.post("save", function () {
    this.constructor.calcAverageRating(this.tour);
});

reviewSchema.post(/^findOneAnd/, async function (doc, next) {
    await doc.constructor.calcAverageRating(doc.tour);
    next();
});

const Review = mongoose.model("Review", reviewSchema);
module.exports = Review;