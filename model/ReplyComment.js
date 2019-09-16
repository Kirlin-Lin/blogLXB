const mongoose = require('mongoose');
      mongoose.set('useFindAndModify', false);
/* 构建表结构 */
let reply_commentSchema = new mongoose.Schema({
    conmentID:{//回复评论ID
        type:mongoose.Schema.Types.ObjectId,
        ref:"Comment"
    },
    armourUserID:{ //甲方
        type:mongoose.Schema.Types.ObjectId,
        ref:"Users"
    },
    partyUserID:{//乙方
        type:mongoose.Schema.Types.ObjectId,
        ref:"Users"
    },
    articleID:{ //评论文章ID
        type:mongoose.Schema.Types.ObjectId,
        ref:"Article"
    },
    content:String, //回复内容
    timer:{  //回复时间
        type:Date,
        default:Date.now
    },
    floor:Number//楼层
}, {versionKey: false});

module.exports = mongoose.model('ReplyComment',reply_commentSchema,"reply_comment");