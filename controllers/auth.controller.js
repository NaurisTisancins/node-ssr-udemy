const crypto = require("crypto");
const { promisify } = require("util");
const jwt = require("jsonwebtoken");
const User = require("./../models/user.model");
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const sendEmail = require('./../utils/email');

const signToken = id => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXP_TIME
    });
};

const createSendToken = (user, statusCode, res) => {
    const token = signToken(user._id);
    const cookieOptions = {
        expires: new Date(
            Date.now() + process.env.JWT_COOKIE_EXPIRATION * 24 * 60 * 60 * 1000
        ),
        httpOnly: true,
    };
    //ass cookie secure:true only works in production
    if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;
    res.cookie("jwt", token, cookieOptions);

    user.password = undefined;

    res.status(statusCode).json({
        status: "success",
        token,
        data: {
            user,
        }
    });
};

exports.signup = catchAsync(async (req, res, next) => {
    const newUser = await User.create({
        name: req.body.name,
        email: req.body.email,
        password: req.body.password,
        passwordConfirm: req.body.passwordConfirm,
        passwordChangedAt: req.body.passwordChangedAt,
        role: req.body.role,
    });
    createSendToken(newUser, 201, res);
});//signup

exports.signin = catchAsync(async (req, res, next) => {
    const { email, password } = req.body;
    if (!email || !password) {
        //dont forget to use return to not set headers after a respnse is sent to aclient
        return next(new AppError("Please provide email and password!", 400));
    };
    const user = await User.findOne({ email }).select("+password");
    if (!user || !await user.correctPassword(password, user.password)) {
        return next(new AppError("Incorrect email or password!", 401));
        //401 === unauthorized
    };
    createSendToken(user, 200, res);
});//login

exports.protect = catchAsync(async (req, res, next) => {
    //1) Get the token
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
        token = req.headers.authorization.split(" ")[1];
    } else if (req.cookies.jwt) {
        token = req.cookies.jwt;
    };

    if (!token) {
        return next(new AppError("Unauthorized! Please log in", 401));//401 = not authorized
    };
    //2) Verify Token
    //verify() This means that there is a token on the client's side, and that is passes the jwt verification. However, the server decides to begin running app.
    const decodedToken = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
    //3) Check if user exists
    const user = await User.findById(decodedToken.id);
    if (!user) {
        return next(new AppError("The user for this token no longer exists.", 401))
    };
    //4) Check if passwords have been changed after JWT issue
    if (user.changedPasswordAfter(decodedToken.iat)) {
        return next(new AppError("Password has been changed, log in again!", 401));
    };
    // GRANT access to the protected route
    req.user = user;
    next();
});//protected route middleware

exports.restrict = (...roles) => {
    //checks if user has permissions to do anything on protected routes
    return (req, res, next) => {
        //roles = array of roles
        if (!roles.includes(req.user.role)) {
            return next(new AppError("No permission for this action", 403));//403 = forbiden
        };

        next();
    };
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
    //1) get user based on posted email
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
        return next(new AppError("No user found with that email address.", 404));
        //404 = notfound
    };
    //2) generate random token
    const resetToken = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });

    //3) Send back as an email
    const resetURL = `${req.protocol}://${req.get("host")}/api/v1/users/reset-password/${resetToken}`;

    const message = `Password reset: Submit a PATCH req with your new password and passwordConfirm to: ${resetURL}.\n If it wasn't you who requested to change password, please ignore this email.`;

    try {
        await sendEmail({
            email: user.email,
            subject: "Your password reset token! Valid for 10 minutes!",
            message
        });

        res.status(200).json({
            status: "success",
            message: "Token sent to email!",
        });
    } catch (err) {
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save({ validateBeforeSave: false });
        return next(new AppError("There was an error sending the email. Try again later!", 500));//500 = server error
    };
});//forgotpassword

exports.resetPassword = catchAsync(async (req, res, next) => {
    // 1) get user based on token
    const hashedToken = crypto
        .createHash("sha256")
        .update(req.params.token)
        .digest("hex");

    const user = await User
        .findOne({
            passwordResetToken: hashedToken,
            passwordResetExpires: {
                $gt: Date.now()
            }
        });
    //2) if token is valid and there is a user, set new pass
    if (!user) {
        return next(new AppError("Token is invalid or expired!", 400));//bad request
    }
    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();//this time LEAVE validators on as we need to check the
    //password validity on saving
    //3) update changedPasswordAt prop

    //4 ) log the user in, send JWT
    createSendToken(user, 200, res);
});//resetPassword

exports.updatePassword = catchAsync(async (req, res, next) => {
    //1) Get the user from the collection
    const user = await User.findById(req.user.id).select("+password");
    //2 ) check if the posted password is correct
    if (!(await user
        .correctPassword(req.body.passwordCurrent, user.password))) {
        console.log(req.body.passwordCurrent, user.password);
        return next(new AppError("Current password you entered is wrong.", 401));
    }
    //3) If password is correct -> update
    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    await user.save();

    //4) log user in with the new password - create JWT
    createSendToken(user, 200, res);

});//update password withour forgeting

// Only for rendered pages, no errors!
exports.isSignedIn = async (req, res, next) => {
    if (req.cookies.jwt) {
        try {
            // 1) verify token
            const decoded = await promisify(jwt.verify)(
                req.cookies.jwt,
                process.env.JWT_SECRET
            );

            // 2) Check if user still exists
            const currentUser = await User.findById(decoded.id);
            if (!currentUser) {
                return next();
            }

            // 3) Check if user changed password after the token was issued
            if (currentUser.changedPasswordAfter(decoded.iat)) {
                return next();
            }

            // THERE IS A LOGGED IN USER
            res.locals.user = currentUser;
            return next();
        } catch (err) {
            return next();
        }
    }
    next();
};