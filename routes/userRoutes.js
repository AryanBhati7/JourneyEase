const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync.js");
const User = require("../models/users.model.js");
const passport = require("passport");
const { saveRedirectUrl, isLoggedIn } = require("../middleware.js");
const userController = require("../controllers/userController.js");




router.route("/signup")
.get(userController.renderSignUpform)
.post(wrapAsync(userController.signUp));

router.route("/login")
.get(userController.renderLoginForm)
.post(
    saveRedirectUrl,
    passport.authenticate("local", {
    failureRedirect: "/user/login",
    failureFlash: true,
  }),
    wrapAsync(userController.login)
    )

router.get("/logout",userController.logout);

module.exports = router;