
if(process.env.NODE_ENV !="production"){
  require('dotenv').config();
}
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

const dashboardRouter = require("./routes/dashboardRoute.js");
const commentRouter = require("./routes/commentsRoutes.js");
const userRouter = require("./routes/userRoutes.js");
const profileRouter = require("./routes/profileRouter.js")


const wrapAsync = require("./utils/wrapAsync.js");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const User = require("./models/users.model.js");
const Comment = require("./models/comment.model.js");
const multer = require("multer");
const { storage } = require("./cloudConfig");
const upload = multer({ storage });

const MONGO_URL = process.env.MONGODB_URL

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
    secret:process.env.STORE_SECRET ,
  },
  touchAfter: 24 * 3600,
});

store.on("error", () => {
  console.log("Error in MONGO SESSION STORE", err);
});

const sessionOption = {
  store,
  secret: process.env.SESSION_OPTION_SECRET,
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

app.use("/dashboard",dashboardRouter);
app.use("/dashboard/:id/comment",commentRouter);
app.use("/profile",profileRouter);
app.use("/",userRouter);


app.get("/", (req, res) => {
  res.render("pages/home.ejs", { currUser: req.user });
});

app.get("/about", (req, res) => {
  res.render("pages/about.ejs");
});

app.get("/blog", async (req, res) => {
  const allBlog = await Blog.find({}).sort({ dateUploaded: -1 });
  res.render("pages/blog.ejs", { allBlog });
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
