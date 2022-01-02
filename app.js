const path = require("path");
const express = require('express');
const morgan = require('morgan'); //logs request data
const rateLimit = require("express-rate-limit").default;//limit amount of requests
const helmet = require("helmet");
const mongoSanitize = require("express-mongo-sanitize");
const xss = require("xss-clean");
const hpp = require("hpp");
const cookieParser = require("cookie-parser");

const AppError = require("./utils/appError");
const errorMiddleware = require("./controllers/error.controller");

const app = express();

app.set("view engine", "pug");
app.set("views", path.join(__dirname, "views"));

// GLOBAL
app.use(express.static(path.join(__dirname, "public")));
app.use(helmet());

if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
};

const limiter = rateLimit({
    max: 100,
    windowMs: 60 * 60 * 1000,
    message: "Too many requests from this ip - try again after 1hr!",
});

app.use("/api", limiter);

app.use(express.json({
    limit: "10kb",
}));
app.use(cookieParser());

//Sanitize data agains NoSQL query injection and XSS
app.use(mongoSanitize());
app.use(xss());
app.use(hpp({
    whitelist: [
        "duration",
        "ratingsQuantity",
        "maxGroupSize",
        "difficulty",
        "price"
    ]
}));//prevent param pollution

app.use((req, res, next) => {
    req.requestTime = new Date().toISOString();
    console.log(req.cookies);
    next();
});

//API routes
app.use('/', require('./routes/viewRoutes'));
app.use('/api/v1/tours', require('./routes/tourRoutes'));
app.use('/api/v1/users', require('./routes/userRoutes'));
app.use('/api/v1/reviews', require('./routes/reviewRoutes'));

app.all("*", (req, res, next) => {
    next(new AppError(`Can't find ${req.originalUrl} on this server`, 404));
});//this will never get executed if any of the routes above finds a match - middleware order matters

app.use(errorMiddleware);

module.exports = app;
