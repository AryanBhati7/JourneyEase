const express = require("express");
const router = express.Router({mergeParams: true});
const wrapAsync = require("../utils/wrapAsync.js");
const {validateReview, isLoggedIn, isCommmentAuthor} = require("../middleware.js");
const commentController = require("../controllers/commentController.js");


//Reviews
//Post Review  Route
router.post("/",isLoggedIn, wrapAsync(commentController.createComment));


//Delete Review Route
router.delete("/:commentId",isLoggedIn,isCommmentAuthor,wrapAsync(commentController.destroyComment));

module.exports = router;


