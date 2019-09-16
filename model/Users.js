const mongoose = require('mongoose');
mongoose.set('useFindAndModify', false);
/* 构建表结构 */
let usersSchema = new mongoose.Schema({
    username:String,//邮箱和账号
    passwd:String,//密码
    nick_name:String,//昵称
    regEmailMath:String,//邮箱注册验证
    lock:Number,//判断账号是否注册成功0,未验证,1注册成功
    login_time:Date,//最近一次登录时间
    login_state:String,//登陆状态
    head_img:String,//头像
    date:{ //注册时间 ，默认为当前注册时间
        type:Date,
        default:Date.now
    },sex:{//性别
        type:String,
        default:"未知"
    },introduce:String,//个人简介
    tanglili:{
        type:Boolean,
        default:false
    }
}, {versionKey: false});

module.exports = mongoose.model('Users',usersSchema,"users");