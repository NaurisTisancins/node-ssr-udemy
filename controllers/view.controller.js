const catchAsync = require("./../utils/catchAsync");
const Tour = require("./../models/tour.model");

exports.getOverview = catchAsync(async (req, res, next) => {
    //1) get tour data
    const tours = await Tour.find();
    // 2) build template

    // 3) render template using tour data

    res.status(200).render('overview', {
        title: "All Tours",
        tours,
    });
});

exports.getTour = catchAsync(async (req, res, next) => {
    const slug = req.params.slug;
    const tour = await Tour.findOne({ slug }).populate({
        path: "reviews",
        fields: "review rating user",
    });
    console.log(tour);
    res.status(200)
        .render('tour', {
        title: `${tour.name}`,
        tour,
    });
});

exports.getSignInForm = (req, res) => {
    res.status(200)
        .render('login', {
        title: 'Log into your account'
    });
};