const mongoose = require('mongoose');
mongoose.set('useFindAndModify', false);
/* 构建表结构 */
let replyNewsSchema = new mongoose.Schema({
    replyCommentID:{ //评论回复ID
        type:mongoose.Schema.Types.ObjectId,
        ref:"ReplyComment"
    },
    articleID:{ //文章ID
        type:mongoose.Schema.Types.ObjectId,
        ref:"Article"
    },
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
    read:{
        type:Boolean,
        default:false
    },
    timer:{  //回复时间
        type:Date,
        default:Date.now
    }
}, {versionKey: false});

module.exports = mongoose.model('ReplyNews',replyNewsSchema,"reply_news");