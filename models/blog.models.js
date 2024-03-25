const mongoose = require("mongoose")
const Schema = mongoose.Schema;
const Comment = require("./comment.model");

const blogSchema = new Schema(
    {
        images:[{
            url:String,
            filename:String,
        }],
        destination:{
            type:String,
            require:true,
        },
        state:{
            type:String,
            require:true,
        },
        country:{
            type:String,
            require:true,
        },
        budget:{
            type:Number,
            require:true,
        },
        experience:{
            type:String,
            require:true,
        },
        dateUploaded:{
            type:Date,
            default:Date.now,
        },
        owner:{
            type:Schema.Types.ObjectId,
            ref:"User",
        },
        comment:[{
            type:Schema.Types.ObjectId,
            ref:"Comment",
        }],
    }
)

const Blog = mongoose.model("Blog",blogSchema);

module.exports = Blog;