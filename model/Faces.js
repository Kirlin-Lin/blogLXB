const mongoose = require('mongoose');
      mongoose.set('useFindAndModify', false);
/* 构建表结构 */
let facesSchema = new mongoose.Schema({
    name:String,
    show_Url:String,//显示ico
    face_list:Array//表情包列表
}, {versionKey: false});

module.exports = mongoose.model('Faces',facesSchema,"faces");