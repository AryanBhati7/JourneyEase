
const Blog = require("./models/blog.models");
const Comment = require("./models/comment.model");
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
module.exports.isOwner = async(req,res,next)=>{
    let {id} = req.params;
    let listing = await Blog.findById(id);
    if(! listing.owner.equals(res.locals.currUser._id)){
        req.flash("error","You are Not the Owner Of these Blog");
        return res.redirect(`/listings/${id}`);
    };
    next();
};

module.exports.isCommmentAuthor = async(req,res,next)=>{
    let { id,commentId} = req.params;
    let comment = await Comment.findById(commentId);
    if(! comment.author.equals(res.locals.currUser._id)){
        req.flash("error","You did not Post These Comment");
        return res.redirect(`/dashboard/${id}`);
    };
    next();
};