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
const { saveRedirectUrl, isLoggedIn } = require("./middleware.js");
const wrapAsync = require("./utils/wrapAsync.js");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const User = require("./models/users.model.js");
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
passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req, res, next) => {
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  res.locals.currUser = req.user;

  next();
});

app.get("/", (req, res) => {
  res.render("pages/home.ejs");
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
app.delete("/dashboard/:id",async(req,res,next)=>{
  let { id } = req.params;
  let deletedBlog = await Blog.findByIdAndDelete(id);
  console.log(deletedBlog);
  req.flash("success", " Blog Deleted");
  res.redirect("/profile");
})
 

app.get("/dashboard/:id/edit",async (req,res)=>{
  let { id } = req.params;
  const userBlog = await Blog.findById(id);
  if (!userBlog) {
    req.flash("error", " Blog You Requested does not exist!");
    res.redirect("/dashboard");
  }
  let originalImageUrls = userBlog.images.map(image => {
    let originalImageUrl = image.url;
    return originalImageUrl.replace("/upload", "/upload/w_200");
  });
  res.render("pages/editBlog.ejs", { userBlog,originalImageUrls });

})

app.put("/dashboard/:id", upload.array("Blog[images][]", 6), async (req, res) => {
  let { id } = req.params;
  // Ensure that id is a valid ObjectId
  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).send('Invalid ObjectId');
  }
  let updatedBlog = await Blog.findByIdAndUpdate(
    id,
    { ...req.body.blog }
  );
  if (!updatedBlog) {
    return res.status(404).send('Blog not found');
  }
  if(typeof req.files !== "undefined" && req.files.length > 0){
  const images = req.files.map((file) => {
    return {
      url: file.path,
      filename: file.filename,
    };
  });
  updatedBlog.images = images;
  }else{
    updatedBlog.images = updatedBlog.images
  }

  await updatedBlog.save();
  req.flash("success", "Blog Updated");
  res.redirect(`/dashboard/${id}`);
});

app.get("/profile", async (req, res) => {
  try {
    const userId = req.user._id;
    const userBlogs = await Blog.find({ owner: userId })
      .sort({ dateUploaded: -1 })
      .populate("owner");

    res.render("users/profile.ejs", { userBlogs });
  } catch (err) {
    console.error("Error fetching user's blogs:", err);
    res.status(500).send("Internal Server Error");
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
    let { username, email, password, role } = req.body;
    const newUser = new User({ email, username, role });
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
