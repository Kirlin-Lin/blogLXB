const path = require("path");
const url = require("url");
const fs = require("fs");
const mongoose = require("mongoose");
      mongoose.set('useFindAndModify', false);
const util = require("util");
const Category = require("../../model/Category");
const Article = require("../../model/Article");
const Faces = require("../../model/Faces");
const Rooms = require("../../model/Rooms");
const User = require("../../model/Users");
const querystring = require('querystring');
const moment = require("moment");
const Comment = require("../../model/Comment");
let info =  {};

/* 获取post参数 */
let post_fun = function(req,res,get_data){
    let post = "";
    //let element = "";     
    // 通过req的data事件监听函数，每当接受到请求体的数据，就累加到post变量中
    req.on('data', function(chunk){    
        post += chunk;
    });
    req.on('end', function(){   
        try{
            info =  {};
            get_data(JSON.parse(post));
        }catch(err){
            res.writeHead(200,{'Content-Type':'application/json;charset=utf-8'});
            res.end('{"message":"提交数据格式错误"}');
        }
    });
}

const router = {
    /* 标签查询 */
    "/router/cetegory":function(req,res){
        let fun_doc = function (params) {
            let setCate = [];
            let m = 0;
            let resRelust = function(n){
                    if(n == m){
                        if(setCate.length > 0){
                            info.code = 1;
                            info.message = "标签以及对应的文章数量";
                            info.data = setCate;
                            res.end(JSON.stringify(info));
                        }
                        else{
                            info.code = 0;
                            info.message = "暂无数据";
                            res.end(JSON.stringify(info));
                        }
                    }
                }
            Category.find({},{_id:1,category_name:1}).then(function(_rst){
                let n = _rst.length;
                if(params.type == "index"){
                    _rst.forEach(element => {
                        Article.countDocuments({category:element.id},(err,count) => {
                            m += 1;
                            if(count > 0){
                                let countCate = {
                                    id:element.id,
                                    category_name:element.category_name,
                                    count:count
                                }
                                setCate.push(countCate);
                            }
                            resRelust(n);
                        })
                    });
                }else if(params.type == "user"){
                    let userInfo = JSON.parse(req.userInfo);
                    if(userInfo){
                        _rst.forEach(element => {
                            Article.countDocuments({category:element.id,userInfo:userInfo.id},(err,count) => {
                                m += 1;
                                if(count > 0){
                                    let countCate = {
                                        id:element.id,
                                        category_name:element.category_name,
                                        count:count
                                    }
                                    setCate.push(countCate);
                                }
                                resRelust(n);
                            })
                        });
                    }
                }else if(params.type == "all"){
                    let   arrCate = [];
                    _rst.forEach(element => {
                        arrCate.push({
                            id:element.id,
                            cateName:element.category_name
                        });
                    });
                    info.code = 3;
                    info.data = arrCate;
                    info.message = "所有的标签分类";
                    res.end(JSON.stringify(info));
                }
            });
        }
        post_fun(req,res,fun_doc);
    },
    
    /* 文章发布 */
    "/router/post_article":function(req,res){
        let userInfo = JSON.parse(req.userInfo);
        if(userInfo.id){
            let fun_doc = function (params) {
                User.findById(userInfo.id,function(err,rst){
                    if(rst && rst.login_state == userInfo.login_state){
                        if(params.tit == ""){
                            info.code = 2;
                            info.message = "请输入标题";
                            res.end(JSON.stringify(info));
                        }else if(params.content == ""){
                            info.code = 3;
                            info.message = "内容不能为空";
                            res.end(JSON.stringify(info));
                        }else if(params.cateId == ""){
                            info.code = 4;
                            info.message = "请选择标签";
                            res.end(JSON.stringify(info));
                        }else {
                            if(params.type == "new"){
                                //随机取简介的字符长度，最少50个字
                                let endPtx = 50+50*Math.random();
                                let article  = new  Article({
                                    showImg:params.showImg,
                                    tit:params.tit,
                                    content:params.content,
                                    userInfo:userInfo.id,
                                    category:params.cateId,
                                    ptx:params.ptx.substr(0,endPtx) + "..."
                                });
                                article.save().then(function(doc){
                                    if(doc){
                                        info.code = 5;
                                        info.message = "发布成功";
                                        info.data = {id:doc.id,tit:doc.tit};
                                        res.end(JSON.stringify(info));
                                    }else{
                                        info.code = 1;
                                        info.message = "发布失败，请重新尝试";
                                        res.end(JSON.stringify(info));
                                    }
                                });
                            }else if(params.type == "modify"){
                                Article.findOne({_id:params.article_id,userInfo:userInfo.id}).then(function(ram){
                                    if(ram){
                                        let endPtx = 50+50*Math.random();
                                        let modify  ={
                                            showImg:params.showImg,
                                            tit:params.tit,
                                            content:params.content,
                                            category:params.cateId,
                                            ptx:params.ptx.substr(0,endPtx) + "..."
                                        };
                                        Article.updateOne({_id:params.article_id},modify).then(function(modifyRst){
                                            console.log(modifyRst)
                                            if(modifyRst.nModified == 1){
                                                Category.updateOne({_id:params.cateId},{$inc:{n:1}})
                                                .then(function(rat){
                                                    Category.updateOne({_id:params.oldCateId},{$inc:{n:-1}})
                                                    .then(function(rat){
                                                        info.code = 6;
                                                        info.data = {articleID:params.article_id}
                                                        info.message = "更新文章成功";
                                                        res.end(JSON.stringify(info));
                                                    });
                                                });
                                            }else{
                                                info.code = 7;
                                                info.message = "没有任何改变，无需更新";
                                                res.end(JSON.stringify(info));
                                            }
                                        });
                                    }else{
                                        info.code = 8;
                                        info.message = "只能更新自己的文章";
                                        res.end(JSON.stringify(info));
                                    }
                                });
                            }
                        }
                    }else{
                        info.code = 0;
                        info.message = "请先登录,才能发布文章";
                        res.end(JSON.stringify(info));
                    }
                });
            };
            post_fun(req,res,fun_doc);
        }else{
            info.code = 0;
            info.message = "请先登录,才能发布文章";
            res.end(JSON.stringify(info));
        }
    },
    /* 文章详情查询 */
    "/router/article_details/":function(req,res){
        let fun_doc = function(params){
            if(params.id !== ""){
               Article.findByIdAndUpdate(params.id,{$inc:{num:1}},{
                   new:true,
                   upsert:true,
                   runValidators:true,
                   setDefaultsOnInsert:true
                }).populate(["userInfo","category"]).then(function(ret){
                        let data = {
                            userId:ret.userInfo._id,
                            id:ret._id,
                            content:ret.content,
                            timer:moment(ret.timer).format("YYYY-MM-DD HH:mm:ss"),
                            nick_name:ret.userInfo.nick_name,
                            head_img:ret.userInfo.head_img,
                            tit:ret.tit,
                            category:ret.category.category_name,
                            cateId:ret.category._id,
                            num:ret.num
                        }
                        info.code = 1;
                        info.message = "文章详情";
                        info.data = data;
                        res.end(JSON.stringify(info));
                       
                }).catch(function(err){
                    info.code = 2;
                    info.message = "查询文章不存在";
                    res.end(JSON.stringify(info));
                });
            }else{
                info.code = 0;
                info.message = "查询参数为空";
                res.end(JSON.stringify(info));
            }
        }
        post_fun(req,res,fun_doc);
    },
    /* 个人中心 */
    "/router/userInfo/":function(req,res){
        let fun_doc = function(params){
            if(req.userInfo){
                let userInfo = JSON.parse(req.userInfo);
                User.findById(userInfo.id).then(function(ret){
                    if(ret && (userInfo.login_state == ret.login_state)){
                        let data = {
                            username:ret.username,
                            head_img:ret.head_img,
                            sex:ret.sex,
                            introduce:ret.introduce,
                            nick_name:ret.nick_name,
                            userId:ret.id
                        }
                        info.code = 1;
                        info.message = "用户登录状态";
                        info.data = data;
                        res.end(JSON.stringify(info));
                    }else{
                        info.code = 2;
                        info.message = "用户不存在";
                        res.end(JSON.stringify(info));
                    }
                });
            }else{
                info.code = 0;
                info.message = "未登录";
                res.end(JSON.stringify(info));
            }
        }
        post_fun(req,res,fun_doc);
    },
    /* 上传头像 */
    "/router/update_head/":function(req,res){
        let userInfo = JSON.parse(req.userInfo);
        let fun_doc = function(params){
            if(params){
                User.findById(userInfo.id).then(function(ret){
                   if(ret && ret.login_state == userInfo.login_state){
                        var src = params.src.replace(/@@@/g,":").replace(/!!!/g,"=").replace(/---/g,"+");
                        var base64Data = src.replace(/^data:image\/\w+;base64,/, "");
                        var dataBuffer = Buffer.from(base64Data, 'base64');
                        fs.writeFile("./public/images/user_head_"+userInfo.id+".jpg", dataBuffer, function(err,data) {
                            if(err){
                                info.code = 3;
                                info.message = "保存失败";
                                res.end(JSON.stringify(info));
                            }else{
                               User.updateOne({_id:userInfo.id},{head_img:"/public/images/user_head_"+userInfo.id+".jpg?versions="+new Date().toLocaleString()})
                               .then(function(rst){
                                    let userDate = {
                                        head_img:"/public/images/user_head_"+userInfo.id+".jpg"
                                    }
                                    info.code = 4;
                                    info.data = userDate;
                                    info.message = "保存成功";
                                    res.end(JSON.stringify(info));
                               });
                            }
                        });
                   }else{
                        info.code = 1;
                        info.message = "请先登录";
                        res.end(JSON.stringify(info));
                   }
                });
            }
            else{
                info.code = 2;
                info.message = "保存信息发生了错误";
                res.end(JSON.stringify(info));
            }
        };
        post_fun(req,res,fun_doc);
    },
    /* 分类查询 */
    "/router/zj_fl":function(req,res){
        let fun_doc = function(params) {
            let userInfo = JSON.parse(req.userInfo);
            User.findById(userInfo.id).then(function(ret){
                if(ret && ret.login_state == userInfo.login_state){
                    info.code = 2;
                    info.data = ret.zj_fl;
                    info.message = "分类信息";
                    res.end(JSON.stringify(info));
                }else{
                    info.code = 1;
                    info.message = "请先登录";
                    res.end(JSON.stringify(info));
                }
            });
        };
        post_fun(req,res,fun_doc);
    },
    
    /* 修改个人中心信息 */
    '/router/update_userInfo/':function(req,res){
        let userInfo = JSON.parse(req.userInfo);
        let fun_doc = function(params) {
            let updateObj = {
                sex:params.sex,
                nick_name:params.nick_name,
                introduce:params.introduce
            }
            User.updateOne({_id:userInfo.id},{$set:updateObj}).then(function(rst){
                if(rst)
                {
                    info.code = 2;
                    info.message = "更新成功";
                    res.end(JSON.stringify(info));
                }else{
                    info.code = 1;
                    info.data = arr;
                    info.message = "更新失败";
                    res.end(JSON.stringify(info));
                }
            });
        };
        post_fun(req,res,fun_doc);
    },
    "/router/face":function(req,res){
        let fun_doc = function(params)
        {
            if(params.faceId == ""){
                Faces.find({},{"face_list":0}).then(function(rst){
                   
                    let arr = [];
                    rst.forEach(function(element,index) {
                        let obj = {
                            name:element.name,
                            id:element.id,
                            show_Url:element.show_Url
                        }
                        arr.push(obj)
                    });
                    info.code = 1;
                    info.data = arr;
                    info.message = "所有表情包集合ID";
                    res.end(JSON.stringify(info));
                });
            }else{
                Faces.findById(params.faceId).then(function(rst){
                    info.code = 2;
                    info.data = {
                        name:rst.name,
                        face_list:rst.face_list,
                        id:rst.id
                    };
                    info.message = "表情包内容";
                    res.end(JSON.stringify(info));
                });
            }
        }
        post_fun(req,res,fun_doc);
    },
    /* 房间查询 */
    "/router/rooms":function(req,res){
        let userInfo = JSON.parse(req.userInfo);
        let fun_doc = function(params){
            if(userInfo){
                User.findById(userInfo.id).then(function(ret){
                    let arr = [];
                    Rooms.find({}).then(function(rst){
                        if(ret.tanglili == true){
                            rst.forEach(element => {
                                let obj = {
                                    ico_Url:element.ico_Url,
                                    id:element.id,
                                    name:element.name,
                                    room:element.room,
                                    tanglili:element.tanglili
                                };
                                arr.push(obj);
                            });
                        }else if(ret.tanglili == false){
                            rst.forEach(element => {
                                if(element.tanglili == false){
                                    let obj = {
                                        ico_Url:element.ico_Url,
                                        id:element.id,
                                        name:element.name,
                                        room:element.room,
                                        tanglili:element.tanglili
                                    };
                                    arr.push(obj);
                                }
                            });
                        }
                        info.code = 1;
                        info.data = arr;
                        info.message = "获取群聊列表";
                        res.end(JSON.stringify(info));
                    });
                });
            }
        }
        post_fun(req,res,fun_doc);
    },
    /* 发布评论 */
    "/router/inputCommment/":function(req,res){
        let fun_doc = function(params){
            if(params.content == ""){
                info.code = 3;
                info.message = "请不要发送空内容";
                res.end(JSON.stringify(info));
            }else{
                Article.findByIdAndUpdate(params.articleID,{$inc:{comments:1}},{
                        new:true,
                        upsert:true,
                        runValidators:true,
                        setDefaultsOnInsert:true
                    }).then(function(rmt){
                        if(rmt){
                            let comment = new Comment({
                                userID:params.userID,
                                articleID:params.articleID,
                                content:params.content,
                                floor:rmt.comments
                            });
                            comment.save().then(function(rst){
                                if(rst){
                                    info.code = 1;
                                    info.message = "评论成功";
                                    res.end(JSON.stringify(info));
                                }else{
                                    info.code = 0;
                                    info.message = "评论失败，请重新评论";
                                    res.end(JSON.stringify(info));
                                }
                            });
                        }
                });
            }
        };
        post_fun(req,res,fun_doc);
    },
    /* 获取评论 */
    "/router/ouputCommment/":function(req,res){
        let fun_doc = function(params){
            let pn = 10;
            Comment.countDocuments({articleID:params.articleID},function(err,count){
                if(count > 0){
                    Comment.find({articleID:params.articleID}).limit(pn).skip((params.currentPage - 1)*pn)
                    .sort({timer:-1}).populate(["userID"]).then(function(rmt){
                            let arr = [];
                            rmt.forEach(element => {
                            let mentObj = {
                                id:element.id,
                                userInfo:{
                                    userID:element.userID.id,
                                    head_img:element.userID.head_img,
                                    nick_name:element.userID.nick_name
                                },
                                timer:moment(element.timer).format("YYYY-MM-DD HH:mm:ss"),
                                content:element.content,
                                floor:element.floor
                            }
                            arr.push(mentObj);
                        });
                        info.code = 1;
                        info.count = count;
                        info.data = arr;
                        info.message = "获取评论";
                        info.pages = Math.ceil(count/pn);
                        res.end(JSON.stringify(info));
                    });
                }else{
                    info.code = 0;
                    info.message = "暂无评论，快来坐个沙发吧";
                    res.end(JSON.stringify(info));
                }
            });
        };
        post_fun(req,res,fun_doc);
    },
    /* 文章查询接口2 */
    "/router/query_artice":function(req,res){
        let fun_doc = function(params) {
            let pn = 10;
            let query = {}
            if(params.userID){
                query.userInfo = params.userID;
            }
            if(params.cateID){
                query.category = params.cateID;
            }
            Article.countDocuments(query,(err,count) =>{
                if(count == 0){
                    info.code = 1;
                    info.count = count;
                    info.message = "暂无数据";
                    res.end(JSON.stringify(info));
                }else{
                    Article.find(query).limit(pn).skip((params.page - 1)*pn).populate(["userInfo","category"])
                    .sort({timer:-1}).then(function(rst){
                        if(rst.length !== 0){
                            let arr = [];
                            let n = 0;
                            let get_commentCount = function () {
                                if(n < rst.length){
                                    let queryObj = rst[n];
                                    Comment.countDocuments({articleID:queryObj.id},function(err,cunt){
                                        if(!err){
                                            arr.push({
                                                nick_name:queryObj.userInfo.nick_name,
                                                category:queryObj.category.category_name,
                                                id:queryObj.id,
                                                tit:queryObj.tit,
                                                ptx:queryObj.ptx,
                                                num:queryObj.num,
                                                showImg:queryObj.showImg,
                                                comment:cunt
                                            });
                                            n += 1;
                                            get_commentCount();
                                        }
                                    }); 
                                }else{
                                    info.code = 2;
                                    info.count = count;
                                    info.data = arr;
                                    info.message = "获取评论";
                                    info.pages = Math.ceil(count/pn);
                                    res.end(JSON.stringify(info));
                                }
                            }
                            get_commentCount();
                        }else{
                            info.code = 3;
                            info.count = count;
                            info.pages = Math.ceil(count/pn);
                            info.message = "无数据了";
                            res.end(JSON.stringify(info));
                        }
                    });
                }
            });
        };
        post_fun(req,res,fun_doc);
    },
    /* 删除文章 */
    "/router/drop_article/":function(req,res){
        let userInfo = JSON.parse(req.userInfo);
        let fun_doc = function(params) {
            if(userInfo){
                Article.findOne({
                    _id:params.articleID,
                    userInfo:userInfo.id
                }).then(function(rst){
                    if(rst){
                        Article.deleteOne({
                            _id:params.articleID,
                            userInfo:userInfo.id
                        }).then(function(rmt){
                            if(rmt){
                                info.code = 1;
                                info.message = "文档删除成功";
                                res.end(JSON.stringify(info)); 
                            }else{
                                info.code = 2;
                                info.message = "文档删除失败，请稍后执行此操作";
                                res.end(JSON.stringify(info));
                            }
                        });
                    }else{
                        info.code = 0;
                        info.message = "要删除的文档不存在";
                        res.end(JSON.stringify(info));
                    }
                });
            }
        };
        post_fun(req,res,fun_doc);
    },
    /* 删除评论 */
    "/router/drop_comment/":function(req,res){
        let fun_doc = function(params) {
            let userInfo = JSON.parse(req.userInfo);
            if(userInfo){
                Comment.deleteOne({
                    _id:params.commentID,
                    userID:userInfo.id
                }).then(function(rst){
                    console.log(rst);  
                    if(rst){
                        info.code = 1;
                        info.message = "删除成功";
                        res.end(JSON.stringify(info));
                    }else{
                        info.code = 0;
                        info.message = "操作失败，请稍后执行此操作";
                        res.end(JSON.stringify(info));
                    }
                });
                  
            }
        };
        post_fun(req,res,fun_doc);
    }
}

    

module.exports = router;