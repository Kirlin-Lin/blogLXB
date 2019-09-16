const mongoose = require('mongoose');
      mongoose.set('useFindAndModify', false);
/* 构建表结构 */
let usersSchema = new mongoose.Schema({
    category_name:String,
    type:String
}, {versionKey: false});

module.exports = mongoose.model('Category',usersSchema,"category");