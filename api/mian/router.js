const path = require("path");
const url = require("url");
const fs = require("fs");
const util = require("util");
const Category = require("../../model/Category");
const Article = require("../../model/Article");
const Faces = require("../../model/Faces");
const Rooms = require("../../model/Rooms");
const User = require("../../model/Users");
const querystring = require('querystring');
const moment = require("moment");
const Comment = require("../../model/Comment");
const News = require("../../model/News");
const ReplyComment = require("../../model/ReplyComment");
const ReplyNews = require("../../model/ReplyNews");
const QRCode = require('qrcode')
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
            Category.find({},{_id:1,category_name:1,type:1}).then(function(_rst){
                let n = _rst.length;
                if(params.type == "index"){
                    _rst.forEach(element => {
                        Article.countDocuments({category:element.id},(err,count) => {
                            m += 1;
                            if(count > 0){
                                let countCate = {
                                    id:element.id,
                                    category_name:element.category_name,
                                    type:element.type,
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
                            cateName:element.category_name,
                            type:element.type
                        });
                    });
                    info.code = 3;
                    info.data = arrCate;
                    info.message = "所有的标签分类";
                    res.end(JSON.stringify(info));
                }else if(params.type == "other"){
                    _rst.forEach(element => {
                        Article.countDocuments({category:element.id,userInfo:params.userID},(err,count) => {
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
                                let random_num = 0;
                                let sum = function(m,n){
                                　　random_num = Math.floor(Math.random()*(m - n) + n);
                                }
                                sum(300,500);
                                //随机取简介的字符长度，最少50个字
                                let article  = new  Article({
                                    showImg:params.showImg,
                                    tit:params.tit,
                                    content:params.content,
                                    userInfo:userInfo.id,
                                    category:params.cateId,
                                    ptx:params.ptx,
                                    num:random_num
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
                Article.findById(params.id).then(function(rmt){
                    if(rmt){
                        Article.findByIdAndUpdate(params.id,{$inc:{num:1}},{
                            new:true,
                            upsert:true,
                            runValidators:true,
                            setDefaultsOnInsert:true
                         }).populate(["userInfo","category"]).then(function(ret){
                             if(ret){
                                let QRCodeUrl = "";
                                QRCode.toDataURL('https://www.blogls.com/view/main/Detailes_m?id='+ret._id,function (err, url) {
                                    QRCodeUrl = decodeURIComponent(url);
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
                                        num:ret.num,
                                        QRCode:QRCodeUrl
                                    }
                                    info.code = 1;
                                    info.message = "文章详情";
                                    info.data = data;
                                    res.end(JSON.stringify(info));
                                });
                             }else{
                                 info.code = 2;
                                 info.message = "查询文章不存在";
                                 res.end(JSON.stringify(info));
                             }
                         }).catch(function(err){
                             info.code = 2;
                             info.message = "查询文章不存在";
                             res.end(JSON.stringify(info));
                         });
                    }else{
                        info.code = 2;
                        info.message = "查询文章不存在";
                        res.end(JSON.stringify(info));
                    }
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

                        News.countDocuments({
                            otherID:userInfo.id,
                            read:false
                        },function(err,noReadNewCound){
                            ReplyNews.countDocuments({
                                partyUserID:userInfo.id,
                                read:false
                            },function(err,noReadReplyNewsCound){
                                let data = {
                                    registerTimer:moment(ret.date).format("YYYY-MM-DD HH:mm:ss"),
                                    username:ret.username,
                                    head_img:ret.head_img,
                                    sex:ret.sex,
                                    introduce:ret.introduce,
                                    nick_name:ret.nick_name,
                                    userId:ret.id,
                                    noReadNewCound:noReadNewCound,
                                    noReadReplyNewsCound:noReadReplyNewsCound
                                }
                                info.code = 1;
                                info.message = "用户登录状态";
                                info.data = data;
                                res.end(JSON.stringify(info));
                            })
                        });
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
                        fs.writeFile("./public/user.head.pic/user_head_"+userInfo.id+".jpg", dataBuffer, function(err,data) {
                            if(err){
                                info.code = 3;
                                info.message = "保存失败";
                                res.end(JSON.stringify(info));
                            }else{
                               User.updateOne({_id:userInfo.id},{head_img:"/public/user.head.pic/user_head_"+userInfo.id+".jpg?versions="+new Date().toLocaleString()})
                               .then(function(rst){
                                    let userDate = {
                                        head_img:"/public/user.head.pic/user_head_"+userInfo.id+".jpg"
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
            if(params.nick_name == ""){
                info.code = 3;
                info.message = "亲，昵称不能设置为空";
                res.end(JSON.stringify(info));
            }else if(params.introduce == ""){
                info.code = 4;
                info.message = "亲，个人简介不能为空，说点什么吧";
                res.end(JSON.stringify(info));
            }else{
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
            }
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

                                    let news = new News({
                                        articleID:params.articleID,
                                        commentUserID:params.userID,
                                        commentID:rst.id,
                                        otherID:params.otherID
                                    });
                                    news.save().then(function(newsRst){});

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
                        let n = 0;
                        let query_replyComment = function(){
                            if(n < rmt.length){
                                let replyObj = rmt[n];
                                ReplyComment.find({conmentID:replyObj.id}).populate(["armourUserID","partyUserID"])
                                .sort({timer:-1}).then(function(rcmt){
                                    let replyComent = [];
                                    if(rcmt){
                                        rcmt.forEach(element => {
                                            let repO = {
                                                id:element.id,
                                                partyUserID:{
                                                    id:element.partyUserID.id,
                                                    nick_name:element.partyUserID.nick_name
                                                },
                                                armourUserID:{
                                                    id:element.armourUserID.id,
                                                    nick_name:element.armourUserID.nick_name
                                                },
                                                content:element.content,
                                                floor:element.floor,
                                                timer:moment(element.timer).format("YYYY-MM-DD HH:mm:ss")
                                            };
                                            replyComent.push(repO);
                                        });
                                    }
                                    let mentObj = {
                                        id:replyObj.id,
                                        userInfo:{
                                            id:replyObj.userID.id,
                                            userID:replyObj.userID.id,
                                            head_img:replyObj.userID.head_img,
                                            nick_name:replyObj.userID.nick_name
                                        },
                                        replyComent:replyComent,
                                        timer:moment(replyObj.timer).format("YYYY-MM-DD HH:mm:ss"),
                                        content:replyObj.content,
                                        floor:replyObj.floor
                                    }
                                    arr.push(mentObj);
                                    n += 1;
                                    query_replyComment();
                                });
                            }else{
                                info.code = 1;
                                info.count = count;
                                info.data = arr;
                                info.message = "获取评论";
                                info.pages = Math.ceil(count/pn);
                                res.end(JSON.stringify(info));
                            }
                        }
                        query_replyComment();


                       
                        /* rmt.forEach(element => {
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
                        res.end(JSON.stringify(info)); */
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
            /*如果搜索存在，就按搜索查询，否则按照其他的查询*/
            if(params.searchValue){
                query.tit = {$regex:new RegExp(params.searchValue,"gi")};
            }else{
                if(params.searchValue == ""){
                    info.code = 5;
                    info.count = 0;
                    info.message = "请输入查询关键词";
                    res.end(JSON.stringify(info));
                    return "";
                }else{
                    if(params.userID){
                        query.userInfo = params.userID;
                    }
                    if(params.cateID){
                        query.category = params.cateID;
                    }  
                }
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
                                            try{
                                                arr.push({
                                                    nick_name:queryObj.userInfo.nick_name,
                                                    head_img:queryObj.userInfo.head_img,
                                                    category:queryObj.category.category_name,
                                                    id:queryObj.id,
                                                    tit:queryObj.tit,
                                                    ptx:queryObj.ptx,
                                                    num:queryObj.num,
                                                    showImg:queryObj.showImg,
                                                    comment:cunt,
                                                    timer:moment(queryObj.timer).format("YYYY-MM-DD HH:mm:ss")
                                                });
                                            }catch(err){
                                                console.log(err);
                                            }
                                            n += 1;
                                            get_commentCount();
                                        }else{
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
                            if(rmt.deletedCount == 1){
                                Comment.deleteMany({articleID:params.articleID}).then(function(rnt){});
                                News.deleteMany({articleID:params.articleID}).then(function(rnt){});
                                ReplyComment.deleteMany({articleID:params.articleID}).then(function(rnt){});
                                ReplyNews.deleteMany({articleID:params.articleID}).then(function(rnt){});
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
                    News.deleteOne({commentID:params.commentID}).then(function(rmt){
                        ReplyComment.deleteMany({conmentID:params.commentID})
                        .then(function(rdt){});
                        ReplyNews.deleteMany({conmentID:params.commentID})
                        .then(function(rdt){});
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
                });
            }
        };
        post_fun(req,res,fun_doc);
    },
    /* 他人用户信息查询 */
    "/router/otherInfo/":function(req,res){
        let fun_doc = function(params) {
            User.findById(params.userID).then(function(rst){
                if(rst){
                    let obj = {
                        introduce:rst.introduce,
                        id:rst.id,
                        nick_name:rst.nick_name,
                        sex:rst.sex,
                        head_img:rst.head_img,
                        reGdate:moment(rst.date).format("YYYY-MM-DD HH:mm:ss"),
                        email:rst.username
                    }
                    info.code = 1;
                    info.data = obj;
                    info.message = "他人用户信息";
                    res.end(JSON.stringify(info));
                }else{
                    info.code = 0;
                    info.message = "用户信息不存在";
                    res.end(JSON.stringify(info));
                }
            });
        };
        post_fun(req,res,fun_doc);
    },
    /* 评论回复 */
    "/router/reply_comment/":function(req,res){
        let fun_doc = function(params) {
            let userInfo = JSON.parse(req.userInfo);
            if(userInfo){
                if(params.content == ""){
                    info.code = 4;
                    info.message = "请，说点什么吧";
                    res.end(JSON.stringify(info));
                }else{
                    params.armourUserID = userInfo.id;
                    let reply_comment = new ReplyComment(params);
                    reply_comment.save().then(function(ret){
                        if(ret){
                            ReplyComment.findById(ret.id).populate(["armourUserID","partyUserID","conmentID"])
                            .then(function(rmt){
                                if(rmt){
                                    /* 发送消息 */
                                    let replyNews = ReplyNews({
                                        replyCommentID:rmt.id,
                                        armourUserID:params.armourUserID,
                                        partyUserID:params.partyUserID,
                                        conmentID:params.conmentID,
                                        articleID:params.articleID
                                    });
                                    replyNews.save().then(function(rgt){ });
                                    
                                    let obj = {
                                        partyUserID:{
                                            id:rmt.partyUserID.id,
                                            nick_name:rmt.partyUserID.nick_name
                                        },
                                        conmentID:{
                                            id:rmt.conmentID.id,
                                        },
                                        armourUserID:{
                                            id:rmt.armourUserID.id,
                                            nick_name:rmt.armourUserID.nick_name
                                        },
                                        id:rmt.id,
                                        content:rmt.content,
                                        floor:rmt.floor,
                                        timer:moment(rmt.timer).format("YYYY-MM-DD HH:mm:ss")
                                    };
    
                                    info.code = 1;
                                    info.data = obj;
                                    info.message = "回复成功";
                                    res.end(JSON.stringify(info));
                                }else{
                                    info.code = 2;
                                    info.message = "回复不存在";
                                    res.end(JSON.stringify(info));
                                }
    
                                
                            });
                        }else{
                            info.code = 0;
                            info.message = "失败";
                            res.end(JSON.stringify(info));
                        }
                    });
                }
            }
        };
        post_fun(req,res,fun_doc);
    },
    /* 消息查询 */
    "/router/query_news":function(req,res){
        let fun_doc = function(params) {
            let userInfo = JSON.parse(req.userInfo);
            if(userInfo){
                let pn = 10;
                /* 查询总信息数量 */
                News.countDocuments({
                    otherID:userInfo.id
                },function(err,count){
                    if(count > 0){
                         /* 查询未读信息数量 */
                        News.countDocuments({
                            otherID:userInfo.id,
                            read:false
                        },function(err,noReadCount){
                            News.find({otherID:userInfo.id}).skip(pn*(params.page - 1)).limit(10).sort({timer:-1})
                            .populate(["articleID","commentUserID","commentID"]).then(function(rst){
                                if(rst.length > 0){
                                    let arr = [];
                                    rst.forEach((element,index) => {
                                        if(element.commentID){
                                            let obj = {};
                                            obj.commentUser = {
                                                id:element.commentUserID.id,
                                                nick_name:element.commentUserID.nick_name,
                                                head_img:element.commentUserID.head_img
                                            }
                                            
                                            obj.commentID = {
                                                id:element.commentID.id,
                                                content:element.commentID.content
                                            }
                                            obj.timer = moment(element.timer).format("YYYY-MM-DD HH:mm:ss");
                                            obj.articleID = {
                                                id:element.articleID.id,
                                                tit:element.articleID.tit
                                            }
                                            arr.push(obj);
                                        }
                                    });
                                    info.noReadCount = noReadCount;
                                    info.count = count;
                                    info.code = 1;
                                    info.data = arr;
                                    info.message = "评论消息查询";
                                    res.end(JSON.stringify(info));

                                    News.updateMany({otherID:userInfo.id,read:false},{read:true})
                                    .then(function(rmt){});
                                }else{
                                    info.code = 2;
                                    info.message = "没有更多了";
                                    res.end(JSON.stringify(info));
                                }
                            });
                        });
                    }else{
                        info.code = 0;
                        info.message = "暂无消息";
                        res.end(JSON.stringify(info));
                    }
                });
            }
        };
        post_fun(req,res,fun_doc);
    },
    /* 查询评论回复 */
    "/router/queryReply":function(req,res){
        let fun_doc = function(params) {
            let userInfo = JSON.parse(req.userInfo);
            if(userInfo){
                let pn = 10;
                /* 查询总信息数量 */
                ReplyNews.countDocuments({partyUserID:userInfo.id},function(err,count){
                    if(count > 0){
                        ReplyNews.countDocuments({
                            partyUserID:userInfo.id,
                            read:false
                        },function(err,noReadCount){

                            ReplyNews.find({partyUserID:userInfo.id}).skip(pn*(params.page - 1)).limit(10).sort({timer:-1})
                            .populate(["replyCommentID","articleID","conmentID","armourUserID","partyUserID"]).then(function(rpt){
                                if(rpt.length > 0){
                                    let arr = [];
                                    rpt.forEach(element => {
                                        let obj = {
                                            id:element.id,
                                            replyCommentID:{
                                                id:element.replyCommentID.id,
                                                content:element.replyCommentID.content
                                            },
                                            articleID:{
                                                id:element.articleID.id,
                                                tit:element.articleID.tit
                                            },
                                            conmentID:{
                                                id:element.conmentID.id,
                                                floor:element.conmentID.floor
                                            },
                                            armourUserID:{
                                                id:element.armourUserID.id,
                                                nick_name:element.armourUserID.nick_name,
                                                head_img:element.armourUserID.head_img
                                            },
                                            partyUserID:{
                                                id:element.partyUserID.id,
                                                nick_name:element.partyUserID.nick_name,
                                                head_img:element.partyUserID.head_img
                                            },
                                            timer: moment(element.timer).format("YYYY-MM-DD HH:mm:ss")
                                        }
                                        arr.push(obj)
                                    });

                                    info.noReadCount = noReadCount;
                                    info.count = count;
                                    info.code = 1;
                                    info.data = arr;
                                    info.message = "回复评论消息查询";
                                    res.end(JSON.stringify(info));

                                    ReplyNews.updateMany({partyUserID:userInfo.id,read:false},{read:true})
                                    .then(function(rmt){});

                                }else{
                                    info.code = 2;
                                    info.message = "没有更多了";
                                    res.end(JSON.stringify(info)); 
                                }
                            })
                           
                        });
                    }else{
                        info.code = 0;
                        info.message = "暂无消息";
                        res.end(JSON.stringify(info));
                    }
                });
            }
        }
        post_fun(req,res,fun_doc);
    },
    /* 首页推荐用户 */
    "/router/query_recommend":function(req,res){
        let fun_doc = function(params) {
            User.find({recommend:true}).sort({recommendNum:-1}).then(function(rst){
                if(rst.length > 0){
                    let arr = [];
                    let n = 0;
                    let query_func = function(){
                        let userObj = rst[n];
                        if(n < rst.length){
                            Article.countDocuments({userInfo:userObj.id},function(err,count){
                                let obj = {
                                    id:userObj.id,
                                    nick_name:userObj.nick_name,
                                    head_img:userObj.head_img,
                                    count:count
                                }
                                arr.push(obj);
                                n++;
                                query_func();
                            });
                        }else{
                            info.code = 1;
                            info.data = arr;
                            info.message = "推荐列表";
                            res.end(JSON.stringify(info));
                        }
                    }
                    query_func();
                }else{
                    info.code = 0;
                    info.message = "无推荐用户";
                    res.end(JSON.stringify(info));
                }
            });
        }
        post_fun(req,res,fun_doc);
    },
    /* 删除发给自己评论咨询 */
    "/router/drop_reply":function(req,res){
        let fun_doc = function(params) {
            let userInfo = JSON.parse(req.userInfo);
            if(userInfo){
                ReplyNews.deleteOne({_id:params.ReplyNewsID,partyUserID:userInfo.id}).then(function(rst){
                    if(rst.deletedCount == 1){
                        info.code = 1;
                        info.message = "删除成功";
                        res.end(JSON.stringify(info));
                        ReplyComment.deleteOne({_id:params.replyCommentID}).then(function(rnt){});
                    }else{
                        info.code = 0;
                        info.message = "删除失败";
                        res.end(JSON.stringify(info));
                    }
                });
            }
        }
        post_fun(req,res,fun_doc);
    },
    /* 删除回复评论 */
    "/router/drop_replyUser":function(req,res){
        let fun_doc = function(params) {
            let userInfo = JSON.parse(req.userInfo);
            if(userInfo){
                ReplyComment.deleteOne({_id:params.ReplyCommentID,armourUserID:userInfo.id}).then(function(rst){
                    if(rst.deletedCount == 1){
                        info.code = 1;
                        info.message = "删除成功";
                        res.end(JSON.stringify(info));
                        ReplyNews.deleteOne({replyCommentID:params.ReplyCommentID}).then(function(rnt){});
                    }else{
                        info.code = 0;
                        info.message = "删除失败";
                        res.end(JSON.stringify(info));
                    }
                })
            }
        };
        post_fun(req,res,fun_doc);
    }
}

    

module.exports = router;