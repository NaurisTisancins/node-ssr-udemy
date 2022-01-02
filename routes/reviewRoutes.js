const express = require("express");
const {
    createReview,
    getReviews,
    deleteReview,
    updateReview,
    setTourUserId,
    getReview,
} = require("./../controllers/review.controller");
const {
    protect,
    restrict,
} = require("./../controllers/auth.controller");

const router = express.Router({ mergeParams: true });

router.use(protect);

router
    .route("/")
    .post(
        restrict("user", "admin"),
        setTourUserId,
        createReview
    ).get(getReviews);

router
    .route("/:id")
    .get(getReview)
    .delete(restrict("user", "admin"),deleteReview)
    .patch(restrict("user", "admin"), updateReview)

module.exports = router;