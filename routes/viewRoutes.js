const express = require("express");
const {
    getOverview,
    getTour,
    getSignInForm,
} = require('./../controllers/view.controller');
const {
    isSignedIn,
    protect,
} = require("./../controllers/auth.controller");


const router = express.Router();

router.use(isSignedIn);

router.get("/", getOverview);
router.get("/tour/:slug", getTour);
router.get('/login', getSignInForm);

module.exports = router;
//ctr+shift+l = add cursor to all selected instances