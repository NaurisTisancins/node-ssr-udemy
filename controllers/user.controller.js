const User = require("./../models/user.model");
const catchAsync = require("./../utils/catchAsync");
const AppError = require('./../utils/appError');
const factory = require("./handler.factory");

const filterObj = (obj, ...fields) => {
    const newObj = {};
    Object.keys(obj).forEach(el => {
        if (fields.includes(el)) newObj[el] = obj[el];
    });
    return newObj;
};

//dont update passwords with this
exports.getUser = factory.getOne(User);
exports.getUsers = factory.getAll(User);
exports.updateUser = factory.updateOne(User);
exports.deleteUser = factory.deleteOne(User);

exports.updateSelf = catchAsync(async (req, res, next) => {
    //1) Create error if user POSTS password data
    if (req.body.password || req.body.passwordConfirm) {
        return next(new AppError("This route is not for password updates: use '/update-password'", 400))//bad request
    };
    //2) Update user document
    const filteredBody = filterObj(req.body, "name", "email");

    const updatedUser = await User
        .findByIdAndUpdate(
            req.user.id,
            filteredBody, {
            new: true,
            runValidators: true,
        });

    res.status(200).json({
        status: "success",
        data: {
            user: updatedUser,
        }
    });
});//updateSelf

exports.deleteSelf = (catchAsync(async (req, res, next) => {
    await User.findByIdAndUpdate(req.user.id, { active: false });
    res.status(204).json({
        status: "success",
        data: null,
    });
}));//deleteSelf
//get user from the user object that is created when logging in
exports.getSelf = (req, res, next) => {
    req.params.id = req.user.id;
    next();
};

// exports.createUser = (req, res, next) => {
//     res.status(500).json({
//         status: "error",
//         message: "This route is not defined! Please use /signup route instead!"
//     });
// };