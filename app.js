const express = require("express");
const app = express();
const path = require("path");
const port = 8080;
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const favicon = require("serve-favicon");
const session = require("express-session");
const mongoose = require("mongoose");
const Blog = require("./models/blog.models");
const MongoStore = require("connect-mongo");
const flash = require("connect-flash");
const ExpressError = require("./utils/ExpressError.js");
const {
  saveRedirectUrl,
  isLoggedIn,
  isCommmentAuthor,
  isOwner,
} = require("./middleware.js");
const wrapAsync = require("./utils/wrapAsync.js");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const User = require("./models/users.model.js");
const Comment = require("./models/comment.model.js");
const multer = require("multer");
const { storage } = require("./cloudConfig");
const upload = multer({ storage });

const MONGO_URL =
  "mongodb+srv://arjun12345bhandari:D4igTLqjmffPe9oN@cluster3.iolho9r.mongodb.net/?retryWrites=true&w=majority&appName=Cluster3";

app.use(favicon(path.join(__dirname, "public", "/assets/favicon.ico")));
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.engine("ejs", ejsMate);
app.use(express.static(path.join(__dirname, "public")));

main()
  .then(() => {
    console.log("DB connected");
  })
  .catch((err) => {
    console.log(err);
  });

async function main() {
  await mongoose.connect(MONGO_URL);
}

const store = MongoStore.create({
  mongoUrl: MONGO_URL,
  crypto: {
    secret: "qwertyuioplkjhgfdsazxcvbnm",
  },
  touchAfter: 24 * 3600,
});

store.on("error", () => {
  console.log("Error in MONGO SESSION STORE", err);
});

const sessionOption = {
  store,
  secret: "asdefrelkoeurjvbbshdgterkcv",
  resave: false,
  saveUninitialized: true,
  cookie: {
    expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    httpOnly: true,
  },
};

app.use(session(sessionOption));
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());
//passport.use(new LocalStrategy(User.authenticate()));

passport.use(
  new LocalStrategy(
    { usernameField: "email" },

    function (email, password, done) {
      User.findOne({ email: email })
        .then((currUser) => {
          if (!currUser) {
            return done(null, false, { message: "Incorrect email." });
          }
          currUser.authenticate(password, (err, isAuthenticated) => {
            if (err) {
              return done(err);
            }
            if (!isAuthenticated) {
              return done(null, false, { message: "Incorrect password." });
            }
            return done(null, currUser);
          });
        })
        .catch((err) => done(err)); // Handle errors from User.findOne()
    }
  )
);

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req, res, next) => {
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  res.locals.currUser = req.user;

  next();
});

app.get("/", (req, res) => {
  res.render("pages/home.ejs", { currUser: req.user });
});

app.get("/about", (req, res) => {
  res.render("pages/about.ejs");
});

app.get("/dashboard", isLoggedIn, async (req, res) => {
  const allBlog = await Blog.find({})
    .sort({ dateUploaded: -1 })
    .populate("owner");
  res.render("dashboard/dashboard.ejs", { allBlog });
});
app.get("/blog", async (req, res) => {
  const allBlog = await Blog.find({}).sort({ dateUploaded: -1 });
  res.render("pages/blog.ejs", { allBlog });
});

app.post("/dashboard", upload.array("Blog[images][]", 6), async (req, res) => {
  try {
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
  } catch (error) {
    console.log(error.stack);
    res.status(500).send("Error uploading files");
  }
});

app.get("/blog/form", isLoggedIn, (req, res) => {
  res.render("pages/createBlog.ejs");
});

app.get("/dashboard/:id", async (req, res) => {
  //Full Blog Will be seen here

  try {
    const blogs = await Blog.findById(req.params.id)
      .sort({ dateUploaded: -1 })
      .populate({ path: "comment", populate: { path: "author" } })
      .populate("owner");

    if (!blogs) {
      return res.status(404).json({ error: "Blog not found" });
    }
    res.render("dashboard/blogread", { blogs });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});

app.delete("/dashboard/:id", isOwner, async (req, res, next) => {
  let { id } = req.params;
  let currUser = req.user;
  let deletedBlog = await Blog.findByIdAndDelete(id);
  console.log(deletedBlog);
  req.flash("success", " Blog Deleted");
  res.redirect(`/profile/${currUser._id}`);
});

app.get("/dashboard/:id/edit", async (req, res) => {
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
});

app.put(
  "/dashboard/:id",
  upload.array("Blog[images][]", 6),
  async (req, res) => {
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
  }
);

app.post("/dashboard/:id/comment", async (req, res) => {
  let { id } = req.params;
  let commentData = req.body.comment;

  // Check if the comment is empty
  if (!commentData || !commentData.comment.trim()) {
    req.flash("error", "Comment cannot be empty");
    return res.redirect(`/dashboard/${id}`);
  }

  try {
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
  } catch (error) {
    console.error(error);
    req.flash("error", "Failed to add comment");
    res.redirect(`/dashboard/${id}`);
  }
});

app.delete(
  "/dashboard/:id/comment/:commentId",
  isLoggedIn,
  isCommmentAuthor,
  async (req, res) => {
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
);

app.get("/profile/:id", async (req, res) => {
  try {
    const id = req.params.id
    console.log(req.session.passport.user)
    const userBlogs = await Blog.find({ owner: id })
      .sort({ dateUploaded: -1 })
      .populate("owner");

    res.render("users/profile.ejs", { userBlogs, user: req.user });
  } catch (err) {
    console.error("Error fetching user's blogs:", err);
    res.status(500).send("Internal Server Error");
  }
})
app.get("/profile/:id/edit", async (req, res) => {
  try {
    const id = req.params.id;
    const editUser = await User.findById(id);
    if (!editUser) {
      req.flash("User You requested Does not exist");
    }
    res.render("users/profile.edit.ejs", { editUser });
  } catch (e) {
    console.log("Error Occuring on fetching user Profile", e);
    res.status(500).send("Internal Server Error");
  }
});



app.post("/profile/:id", upload.single("User[avatar]"), async (req, res) => {
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
});


app.get("/login", (req, res) => {
  res.render("users/login.ejs");
});

app.post(
  "/login",
  saveRedirectUrl,
  passport.authenticate("local", {
    failureRedirect: "/login",
    failureFlash: true,
  }),
  (req, res, next) => {
    req.flash("success", "Welcome Back to JourneyEase");
    let redirectUrl = res.locals.redirectUrl || "/dashboard";
    res.redirect(redirectUrl);
  }
);
app.get("/signup", (req, res) => {
  res.render("users/signup.ejs");
});

app.post("/signup", async (req, res, next) => {
  try {
    let { username,email, password, role} = req.body;
    const newUser = new User({
      email,
      role,
      username,
      bio:"",
      avatar: { avatarUrl: "", filename: "" },
      social: {
        facebook:"",
        instagram: "",
        youtube: "",
        twitter:"",
      },
    });
    let registerUser = await User.register(newUser, password);
    console.log(registerUser);
    req.login(registerUser, (err) => {
      if (err) {
        return next(err);
      }
      req.flash("success", "Welcome to JourneyEase");
      res.redirect("/dashboard");
    });
  } catch (err) {
    req.flash("error", err.message);
    res.redirect("/signup");
  }
});

app.get("/logout", (req, res, next) => {
  req.logout((err) => {
    if (err) {
      return next(err);
    }
    req.flash("success", "You Logged Out!!");
    res.redirect("/");
  });
});

app.all("*", (req, res, next) => {
  next(new ExpressError(404, "Page Not Found"));
});

app.use((err, req, res, next) => {
  let { statusCode = 500, message = "Something Went Wrong!" } = err;
  res.status(statusCode).render("pages/error.ejs", { message });
});

app.listen(port, () => {
  console.log(`Server Running at ${port}`);
});
