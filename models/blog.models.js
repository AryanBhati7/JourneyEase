const mongoose = require("mongoose")
const Schema = mongoose.Schema;

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
        }
    }
)

const Blog = mongoose.model("Blog",blogSchema);

module.exports = Blog;
