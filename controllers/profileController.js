const User = require("../models/users.model");
const Blog = require("../models/blog.models");
const mongoose = require("mongoose");

module.exports.renderProfile = async (req, res) => {
    
      const id = req.params.id
      console.log(req.session.passport.user)
      const userBlogs = await Blog.find({ owner: id })
        .sort({ dateUploaded: -1 })
        .populate("owner");
  
      res.render("users/profile.ejs", { userBlogs, user: req.user });
  }

  module.exports.renderProfileEdit = async (req, res) => {
    
      const id = req.params.id;
      const editUser = await User.findById(id);
      if (!editUser) {
        req.flash("User You requested Does not exist");
      }
      res.render("users/profile.edit.ejs", { editUser });
  };



  module.exports.updateProfile = async (req, res) => {
    try {
      let id = req.params.id;
      console.log(req.session.user);
      if (!mongoose.isValidObjectId(id)) {
        return res.status(400).send("Invalid ObjectId");
      }
      let updatedUser = await User.findByIdAndUpdate(id, req.body.User);
  console.log(updatedUser);
      if (typeof req.file !== "undefined") {
        let avatarUrl = req.file.path;
        updatedUser.avatar = { avatarUrl };
        await updatedUser.save();
      }
      req.flash("success", "Profile Updated");
      res.redirect(`/profile/${id}`);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  };

