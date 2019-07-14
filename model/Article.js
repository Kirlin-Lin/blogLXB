const mongoose = require('mongoose');
      mongoose.set('useFindAndModify', false);
/* 构建表结构 */
let articleSchema = new mongoose.Schema({
    tit:String,//文章标题
    ptx:String,//文章简介
    userInfo:{ //文章作者
        type:mongoose.Schema.Types.ObjectId,
        ref:"Users"
    },
    category:{ //文章分类
        type:mongoose.Schema.Types.ObjectId,
        ref:"Category"
    },
    content:String,//文章内容
    timer:{   //发布时间
        type:Date,
        default:Date.now
    },
    num:{//访问次数
        type:Number,
        default:0
    },
    showImg:String,
    comments:{//有过的评论总数量
        type:Number,
        default:0
    },
}, {versionKey: false});

module.exports = mongoose.model('Article',articleSchema,"article");