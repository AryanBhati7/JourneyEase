const mongoose = require("mongoose");

const Schema = mongoose.Schema;
const passportLocalMongoose = require("passport-local-mongoose");

const userSchema = new Schema({
    email: {
      type: String,
      required: true,
      unique: true,
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      required: true,
      default: 'user',
    },
    bio:{
      type:String,
    },
    avatar:{
      avatarUrl:{
        type:String
      },
    },
      social:{
        linkedin:{
          type:String,
        },
        github:{
          type:String,
        },
        instagram:{
          type:String,
        },
        twitter:{
          type:String,
        },
      }
    
  });


userSchema.plugin(passportLocalMongoose);
module.exports = mongoose.model("User",userSchema);