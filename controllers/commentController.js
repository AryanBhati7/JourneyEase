const Comment = require("../models/comment.model.js");
const Blog = require("../models/blog.models");

module.exports.createComment = async (req, res) => {
    let { id } = req.params;
    let commentData = req.body.comment;
  
    // Check if the comment is empty
    if (!commentData || !commentData.comment.trim()) {
      req.flash("error", "Comment cannot be empty");
      return res.redirect(`/dashboard/${id}`);
    }
      let blog = await Blog.findById(id);
      if (!blog) {
        req.flash("error", "Blog not found");
        return res.redirect("/dashboard");
      }
  
      let newComment = new Comment(commentData);
      newComment.author = req.user._id;
      blog.comment.push(newComment);
      await newComment.save();
      await blog.save();
  
      req.flash("success", "New comment added");
      res.redirect(`/dashboard/${id}`);

  }


  module.exports.destroyComment = async (req, res) => {
    let { id, commentId } = req.params;
    // console.log(commentId);
    try {
      await Blog.findByIdAndUpdate(id, { $pull: { comments: commentId } });
      await Comment.findByIdAndDelete(commentId);
      req.flash("success", "Comment Deleted");
      res.redirect(`/dashboard/${id}`);
    } catch (error) {
      console.error(error);
      req.flash("error", "Failed to delete Comment");
      res.redirect(`/dashboard/${id}`);
    }
  }