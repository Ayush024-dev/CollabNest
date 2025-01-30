import mongoose,{ Schema } from "mongoose";

const postSchema= new Schema({
    postId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    type:{
        type: String,
    },
    field:{
        type: String,
    },
    content:{
        type: String,
        required: [true, "Please Provide Content!!"]
    },
    image:[{
        type: String
    }],
    likes:{
        type: Map,
      of: Boolean,
      default:{}
    }
    
},
{ timestamps:true }
)

const Post= mongoose.model("PostSchema",postSchema);

export default Post