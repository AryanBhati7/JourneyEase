const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const commentSchema = new Schema({
comment:{
    type:String,
},
like:{
    type:Number,
    min:0,
    max:1,
},
createdAt:{
    type:Date,
    default: Date.now,
},
author:{
    type:Schema.Types.ObjectId,
    ref:"User",
}
});

module.exports = mongoose.model("Comment",commentSchema);