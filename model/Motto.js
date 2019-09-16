const mongoose = require('mongoose');
mongoose.set('useFindAndModify', false);
/* 构建表结构 */
let mottoSchema = new mongoose.Schema({
    content:String
}, {versionKey: false});

module.exports = mongoose.model('Motto',mottoSchema,"motto");