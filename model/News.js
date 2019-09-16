const mongoose = require('mongoose');
mongoose.set('useFindAndModify', false);
/* 构建表结构 */
let newsSchema = new mongoose.Schema({
    articleID:{ //文章ID
        type:mongoose.Schema.Types.ObjectId,
        ref:"Article"
    },
    otherID:{ //文章作者ID
        type:mongoose.Schema.Types.ObjectId,
        ref:"Users"
    },
    commentUserID:{ //评论用户ID
        type:mongoose.Schema.Types.ObjectId,
        ref:"Users"
    },
    commentID:{ //评论ID
        type:mongoose.Schema.Types.ObjectId,
        ref:"Comment"
    },
    read:{
        type:Boolean,
        default:false
    },
    timer:{
        type:Date,
        default:Date.now
    }
}, {versionKey: false});

module.exports = mongoose.model('News',newsSchema,"news");