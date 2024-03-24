
const Blog = require("./models/blog.models");
const ExpressError = require("./utils/ExpressError");
// const {blogSchema} = require("./schema");


module.exports.isLoggedIn = (req,res,next)=>{
    if(!req.isAuthenticated()){
        //redirectUrl
        req.session.redirectUrl = req.originalUrl;
        req.flash("error","You Must Be Logged In");
        return res.redirect("/login");
    }
    next();
}

module.exports.saveRedirectUrl = (req,res,next)=>{
    if(req.session.redirectUrl){
        res.locals.redirectUrl = req.session.redirectUrl;
    };
    next();
 };


// module.exports.isAdmin= async(req,res,next)=>{
//     if(res.locals.currUser.role != "admin"){
//         req.flash("error","You are Not the Admin");
//         return res.redirect(`/`);
//     };
//     next();
// };


// //Validate Images
// module.exports.validateImage = (req,res,next)=>{
//     let {error} = imageSchema.validate(req.body);
//     if(error){
//         console.log(error);
//         let errMsg = error.details.map((el)=>el.message).join(",");
//         throw new ExpressError(400,errMsg,error);
//     }else{
//         next();
//     }
// };
