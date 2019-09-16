const mongoose = require('mongoose');
mongoose.set('useFindAndModify', false);
/* 构建表结构 */
let roomsSchema = new mongoose.Schema({
    name:String,
    tanglili:{
        type:Boolean,
        default:false
    },
    room:String,
    ico_Url:String,//显示ico
}, {versionKey: false});

module.exports = mongoose.model('Rooms',roomsSchema,"rooms");