const mongoose = require('mongoose');
mongoose.set('useFindAndModify', false);
/* 构建表结构 */
let commentSchema = new mongoose.Schema({
    userID:{ //评论用户ID
        type:mongoose.Schema.Types.ObjectId,
        ref:"Users"
    },
    articleID:{ //评论文章ID
        type:mongoose.Schema.Types.ObjectId,
        ref:"Article"
    },
    content:String, //评论内容
    timer:{  //评论时间
        type:Date,
        default:Date.now
    },
    floor:Number//楼层
}, {versionKey: false});

module.exports = mongoose.model('Comment',commentSchema,"comments");