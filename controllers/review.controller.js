const Review = require('./../models/review.model');
// const catchAsync = require("./../utils/catchAsync");
const factory = require("./handler.factory");

exports.setTourUserId = (req, res, next) => {
    if (!req.body.tour) req.body.tour = req.params.tourId;
    if (!req.body.user) req.body.user = req.user.id;
    next();
};
exports.getReview = factory.getOne(Review);
exports.getReviews = factory.getAll(Review);
exports.createReview = factory.createOne(Review);
exports.deleteReview = factory.deleteOne(Review);
exports.updateReview = factory.updateOne(Review);

// exports.checkIfAuthor = async (req, res, next) => {
//     const review = await Review.findById(req.params.id);
//     if (req.user.role !== 'admin') {
//         if (review.user.id !== req.user.id) return next(new AppError(`You cannot edit someone's else review.`, 403));//403 = permission denied
//     }
//     next();
// };
//MIDDLE WARE FROM COMMENT THAT AUTHENTICATES IF USER IS THE 
//AUTHOR OF THE REVIEW HES ABOUT TO DELETE