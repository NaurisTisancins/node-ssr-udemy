const express = require('express');
const {
    getTours,
    getTour,
    createTour,
    updateTour,
    deleteTour,
    getTourStats,
    getMonthlyPlan,
    getToursWithin,
    getDistances,
} = require('../controllers/tour.controller');
const {
    aliasTopTours,
} = require('../utils/aliasTopTours.middleware');
const {
    protect,
    restrict,
} = require("./../controllers/auth.controller");

const router = express.Router();


router.use("/:tourId/reviews", require("./reviewRoutes"));

router
    .route('/top-5-cheap')
    .get(aliasTopTours, getTours)

router
    .route('/tour-stats')
    .get(getTourStats)

router
    .route('/monthly-plan/:year')
    .get(
        protect,
        restrict("admin", "lead-guide", "guide"),
        getMonthlyPlan)

router
    .route("/tours-within/:distance/center/:latlng/unit/:unit").get(getToursWithin);
    // /tours-distance?distance=23&center=-40,45&unit=mi
    // /tours-distance/233/center/-40,45/unit/mi

router.route("/distances/:latlng/unit/:unit").get(getDistances)

router
    .route('/')
    .get(getTours)
    .post(protect, restrict("admin", "lead-guide"), createTour);

router
    .route('/:id')
    .get(getTour)
    .patch(
        protect,
        restrict("admin", "lead-guide"),
        updateTour
    ).delete(
        protect,
        restrict("admin", "lead-guide"),
        deleteTour);



module.exports = router;

