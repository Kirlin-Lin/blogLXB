const mongoose = require('mongoose');
mongoose.set('useFindAndModify', false);
/* 构建表结构 */
let usersSchema = new mongoose.Schema({
    username:String,//邮箱和账号
    passwd:String,//密码
    nick_name:{//昵称
        type:String,
        default:"快给自己换个好听的昵称吧"
    },
    regEmailMath:String,//邮箱注册验证
    lock:Number,//判断账号是否注册成功0,未验证,1注册成功
    login_time:Date,//最近一次登录时间
    login_state:String,//登陆状态
    head_img:{//头像
        type:String,
        default:"/public/images/default_head.jpg"
    },
    date:{ //注册时间 ，默认为当前注册时间
        type:Date,
        default:Date.now
    },sex:{//性别
        type:String,
        default:"未知"
    },introduce:{//个人介绍
        type:String,
        default:"我是一个假的程序员"
    },
    tanglili:{
        type:Boolean,
        default:false
    },
    news:{
        commentNews:Number,
        sysNews:Number
    }
}, {versionKey: false});

module.exports = mongoose.model('Users',usersSchema,"users");