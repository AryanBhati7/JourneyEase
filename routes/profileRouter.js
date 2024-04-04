const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync.js");
const User = require("../models/users.model.js");
const passport = require("passport");
const { saveRedirectUrl, isLoggedIn } = require("../middleware.js");
const profileController = require("../controllers/profileController.js");
const multer  = require('multer')
const {storage} = require("../cloudConfig.js");
const upload = multer({ storage });
const mongoose = require("mongoose");


router.route("/:id")
.get(wrapAsync(profileController.renderProfile))
.post(
    upload.single("User[avatar]"),
    wrapAsync(profileController.updateProfile)
    );

router.get("/:id/edit",isLoggedIn,profileController.renderProfileEdit);

module.exports=router;