const AppError = require("./../utils/appError");

const handleCastErrorDB = err => {
    const message = `Invalid ${err.path}: ${err.value}`;
    return new AppError(message, 400);//400 === 'Bad Request'
};//mongoose cast error response

const handleDuplicatefieldsDB = err => {
    const value = err.errmsg.match(/(?<=((?<=[\s,.:;"']|^)["']))(?:(?=(\\?))\2.)*?(?=\1)/gmu)[0];
    const message = `Duplicate field value: ${value}. Please use another value.`;
    return new AppError(message, 400);//bad request = 400
};//mongo duplicate error response

const handleValidationErrorDB = err => {
    const errors = Object.values(err.errors).map(el => el.message);
    const message = `Invalid input data. ${errors.join(". ")}`;
    return new AppError(message, 400);
};//mongo validation error response handler

const handleJWTError = () => new AppError("Invalid token. Log in again!", 401);
const handleJWTExpiredError = () => new AppError("Token has expired. Log in again!", 401);

const sendErrorDev = (err, res) => {
    res.status(err.statusCode).json({
        status: err.status,
        message: err.message,
        stack: err.stack,
        error: err,
    });
};//development error response

const sendErrorProd = (err, res) => {
    //Operational error that is trusted
    if (err.isOperational) {
        res.status(err.statusCode).json({
            status: err.status,
            message: err.message,
        });

        //Programming or other kind of error that we don't want to leak 
    } else {
        console.log("PROGRAMMING ERROR (sendErrorProd)", err);
        res.status(500).json({
            status: "error",
            message: "Something went wrong :(!"
        });
    }
};//production error response

module.exports = (err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || "error";

    if (process.env.NODE_ENV === 'development') {
        sendErrorDev(err, res);
    } else if (process.env.NODE_ENV === 'production') {
        // let error = Object.assign(err);
        // data base validation errors
        if (err.name === "CastError") err = handleCastErrorDB(error);
        if (err.code === 11000) err = handleDuplicatefieldsDB(error);
        if (err.name === "ValidationError") err = handleValidationErrorDB(error);
        if (err.name === "JsonWebTokenError") err = handleJWTError();
        if (err.name === "TokenExpiredError") err = handleJWTExpiredError();
        sendErrorProd(err, res);
    };

};//basically errorHandler