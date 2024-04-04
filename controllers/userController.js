const User = require("../models/users.model");





module.exports.renderSignUpform = (req, res) => {
    res.render("users/signup.ejs");
  }

  module.exports.signUp = async (req, res, next) => {
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
  }

  module.exports.renderLoginForm = (req, res) => {
    res.render("users/login.ejs");
  }

  module.exports.login = (req, res, next) => {
    req.flash("success", "Welcome Back to JourneyEase");
    let redirectUrl = res.locals.redirectUrl || "/dashboard";
    res.redirect(redirectUrl);
  };

  module.exports.logout = (req, res, next) => {
    req.logout((err) => {
      if (err) {
        return next(err);
      }
      req.flash("success", "You Logged Out!!");
      res.redirect("/");
    });
  };