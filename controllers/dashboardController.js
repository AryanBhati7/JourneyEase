const Blog = require("../models/blog.models");
const mongoose = require("mongoose");

module.exports.index = async (req, res) => {
  const allBlog = await Blog.find({})
    .sort({ dateUploaded: -1 })
    .populate("owner");
  res.render("dashboard/dashboard.ejs", { allBlog });
};

module.exports.search = async (req, res) => {
    let query = {};
    const searchQuery = req.query.q; 
    if (searchQuery) {
        query = {
            $or: [
                { destination: { $regex: searchQuery, $options: 'i' } },
                { experience: { $regex: searchQuery, $options: 'i' } },
                { country: { $regex: searchQuery, $options: 'i' } },
                { state: { $regex: searchQuery, $options: 'i' } },
                { budget: parseFloat(searchQuery) }
            ]
        };
    }

    try {
        const allBlog = await Blog.find(query)
            .populate("owner");

        // Sort the search results based on whether any field matches the search query
        allBlog.sort((a, b) => {
            const aMatches = Object.values(a.toObject()).some(value => {
                if (typeof value === 'string' && value !== undefined) {
                    try {
                        return value.toLowerCase().includes(searchQuery.toLowerCase());
                    } catch (error) {
                        console.error("Error converting value to lower case:", error);
                        return false;
                    }
                }
                return false;
            });
            const bMatches = Object.values(b.toObject()).some(value => {
                if (typeof value === 'string' && value !== undefined) {
                    try {
                        return value.toLowerCase().includes(searchQuery.toLowerCase());
                    } catch (error) {
                        console.error("Error converting value to lower case:", error);
                        return false;
                    }
                }
                return false;
            });

            // Prioritize blog posts with matching fields
            if (aMatches) return -1;
            if (bMatches) return 1;
            return 0;
        });

        res.render("dashboard/dashboard.ejs", { allBlog });
    } catch (error) {
        console.error("Error fetching blogs:", error);
        res.status(500).send("Error fetching blogs");
    }
};


module.exports.createNewBlog = async (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).send("No files were uploaded.");
  }

  const images = req.files.map((file) => {
    return {
      url: file.path,
      filename: file.filename,
    };
  });
  const newBlog = new Blog(req.body.blog);
  newBlog.owner = req.user._id;
  newBlog.images = images;
  const saveBlog = await newBlog.save();
  console.log(saveBlog);
  res.redirect("/dashboard");
};

module.exports.renderCreateForm = (req, res) => {
  res.render("pages/createBlog.ejs");
};

module.exports.blogRead = async (req, res) => {
  //Full Blog Will be seen here
  const blogs = await Blog.findById(req.params.id)
    .sort({ dateUploaded: -1 })
    .populate({ path: "comment", populate: { path: "author" } })
    .populate("owner");

  if (!blogs) {
    return res.status(404).json({ error: "Blog not found" });
  }
  res.render("dashboard/blogread", { blogs });
};

module.exports.updateBlog = async (req, res) => {
  let { id } = req.params;
  // Ensure that id is a valid ObjectId
  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).send("Invalid ObjectId");
  }
  let updatedBlog = await Blog.findByIdAndUpdate(id, { ...req.body.blog });
  if (!updatedBlog) {
    return res.status(404).send("Blog not found");
  }
  if (typeof req.files !== "undefined" && req.files.length > 0) {
    const images = req.files.map((file) => {
      return {
        url: file.path,
        filename: file.filename,
      };
    });
    updatedBlog.images = images;
  } else {
    updatedBlog.images = updatedBlog.images;
  }

  await updatedBlog.save();
  req.flash("success", "Blog Updated");
  res.redirect(`/dashboard/${id}`);
};

module.exports.destroyBog = async (req, res, next) => {
  let { id } = req.params;
  let currUser = req.user;
  let deletedBlog = await Blog.findByIdAndDelete(id);
  console.log(deletedBlog);
  req.flash("success", " Blog Deleted");
  res.redirect(`/profile/${currUser._id}`);
};

module.exports.renderEditform = async (req, res) => {
  let { id } = req.params;
  const userBlog = await Blog.findById(id);
  if (!userBlog) {
    req.flash("error", " Blog You Requested does not exist!");
    res.redirect("/dashboard");
  }
  let originalImageUrls = userBlog.images.map((image) => {
    let originalImageUrl = image.url;
    return originalImageUrl.replace("/upload", "/upload/w_200");
  });
  res.render("pages/editBlog.ejs", { userBlog, originalImageUrls });
};
