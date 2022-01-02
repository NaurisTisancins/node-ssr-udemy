const express = require('express');
const User = require('../models/user.model');
const factory = require("./../controllers/handler.factory");
const {
    getUsers,
    getUser,
    createUser,
    updateUser,
    deleteUser,
    updateSelf,
    deleteSelf,
    getSelf,
} = require('../controllers/user.controller');
const {
    signup,
    signin,
    forgotPassword,
    resetPassword,
    updatePassword,
    protect,
    restrict,
} = require("./../controllers/auth.controller");


const router = express.Router();

//auth routes
router.post("/signup", signup);
router.post("/signin", signin);
//reset/forgot password
router.post("/forgot-password", forgotPassword);
router.patch("/reset-password/:token", resetPassword);

//Authentication needed for following routes
router.use(protect);
//update password
router.patch("/update-password", updatePassword);

//user own function routes#
router.get("/user-data", getSelf, factory.getOne(User));
router.patch("/update-self", updateSelf);
router.delete("/delete-self", deleteSelf);


router.use(restrict("admin"));
//admin routes
router
    .route('/')
    .get(getUsers)
    // .post(createUser);

router
    .route('/:id')
    .get(getUser)
    .patch(updateUser)
    .delete(deleteUser);

module.exports = router;
