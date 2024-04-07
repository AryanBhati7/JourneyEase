const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync.js");
const Blog = require("../models/blog.models.js");
const {isLoggedIn, isOwner,validateListing} = require("../middleware.js");
const dashboardController = require("../controllers/dashboardController.js");
const multer  = require('multer')
const {storage} = require("../cloudConfig.js");
const upload = multer({ storage });
const mongoose = require("mongoose");
router.route("/")
.get(
    isLoggedIn,
    wrapAsync(dashboardController.index)
    ) 
.post(
    isLoggedIn, 
    upload.array("Blog[images][]", 6),
    wrapAsync(dashboardController.createNewBlog)
    )
    router.get("/search",dashboardController.search);
    router.get("/form",isLoggedIn,dashboardController.renderCreateForm);

    router.route("/:id")
    .get(wrapAsync(dashboardController.blogRead))
    .put(
        isLoggedIn,
        isOwner,
        upload.array("Blog[images][]", 6),
        wrapAsync(dashboardController.updateBlog)
        )
    .delete(
        isLoggedIn,
        isOwner,
        wrapAsync(dashboardController.destroyBog)
        )

router.get("/:id/edit", isLoggedIn,isOwner,wrapAsync(dashboardController.renderEditform));


module.exports=router;