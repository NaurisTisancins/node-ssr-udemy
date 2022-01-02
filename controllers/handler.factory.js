const catchAsync = require("./../utils/catchAsync");
const AppError = require("./../utils/appError");
const APIFeatures = require('../utils/APIFeatures');

exports.deleteOne = Model => catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndDelete(req.params.id);
    if (!doc) {
        return next(new AppError('No document found with that id', 404));
    }
    res.status(204).json({
        status: "success",
        data: null,
    });
});//deleteOne

exports.updateOne = Model => catchAsync(async (req, res, next) => {
    const doc = await Model
        .findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true,// makes sure validation is applied
        });
    if (!doc) {
        return next(new AppError('No document found with that id', 404));
    }
    res.status(200).json({
        status: "success",
        data: {
            document: doc,
        }
    });
});//updateToru

exports.createOne = Model => catchAsync(async (req, res, next) => {
    const newDoc = await Model.create(req.body);
    res.status(201).json({
        status: 'success',
        data: { document: newDoc }
    });
});//createTour

exports.getOne = (Model, populateOptions) => catchAsync(async (req, res, next) => {
    let query = Model.findById(req.params.id);
    if (populateOptions) {
        query = query.populate(populateOptions);
    }
    const doc = await query;
    if (!doc) {
        return next(new AppError('No document found with that id', 404));
    }
    res.status(200).json({
        status: "success",
        data: { document: doc }
    });
});//getOneById

exports.getAll = Model => catchAsync(async (req, res, next) => {
    //allows nested GET reviews on tour (hack)
    let filter = {};
    if (req.params.tourId) filter = { tour: req.params.tourId };
    //execute the query
    const features = new APIFeatures(Model.find(filter), req.query)
        .filter()
        .sort()
        .limit()
        .paginate();

    // const doc = await features.query.explain();
    const doc = await features.query;
    //send response
    res.status(200).json({
        status: "success",
        results: doc.length,
        data: { document: doc }
    });
});//getTours

//////////////////////////////////////////////////////////////////////
// To restrict the fields that can be changed when updating a review(or any other model):

// In handlerFactory.js:

// near the top, create the filterObj function to filter on object to only have elements with keys found in an allowedFields array:

// const filterObj = (obj, allowedFields) => {
//     const newObj = {};
//     Object.keys(obj).forEach((el) => {
//         if (allowedFields.includes(el)) newObj[el] = obj[el];
//     });
//     return newObj;
// };
// (the above was adapted from code in userController.js, but is passed an array).



// Then change exports.updateOne to accept an optional array of fields, and if it's present and truthy use the filterObj function created above to filter the request body using that array:

// exports.updateOne = (Model, updateFields) =>
//     catchAsync(async (req, res, next) => {
//         let filteredBody;
//         if (updateFields) {
//             filteredBody = filterObj(req.body, updateFields);
//         } else {
//             filteredBody = req.body;
//         }
//         const doc = await Model.findByIdAndUpdate(req.params.id, filteredBody, {
//             new: true,
//             runValidators: true,
//         });

//         if (!doc) ...

// in reviewController.js, pass an array with the fields that are allowed to be updated:

// exports.updateReview = factory.updateOne(Review, ['review', 'rating']); 

// For other controllers, no change is necessary unless you want to restrict the allowed fields to update for them too-- if there's no "updateFields" parameter, updateOne() will just process as it did before.

// The other issue, about changing other users' reviews, I don't remember at this point if Jonas ever addressed it, but the code I came up with is:



// in authController.js:

// exports.checkIfUser = async (req, res, next) => {
//     const review = await Review.findById(req.params.id);
//     if (req.user.role !== 'admin' && review.user.id !== req.user.id)
//         return next(new AppError("You cannot update some else's review.", 403));
//     next();
// };


// in reviewRoutes.js:

// router
//     .route('/:id')
//     .get(reviewController.getReview)
//     .patch(
//         authController.restrictTo('user', 'admin'),
//         authController.checkIfUser,
//         reviewController.updateReview
//     )
//     .delete(
//         authController.restrictTo('user', 'admin'),
//         authController.checkIfUser,
//         reviewController.deleteReview
//     );