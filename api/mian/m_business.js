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

let info =  {};
/* 获取post参数 */
let post_fun = function(req,res,get_data){
    let post="";
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




let m_business = {
    /* 查询首页文章列表 */
    "/m_business/index/artice_list":function(req,res){
        let getData = function(params){
            let pn = 10;
            Article.find().limit(pn).skip((params.page - 1)*pn).populate(["userInfo"])
            .sort({timer:-1}).then(function(rst){
                if(rst.length > 0){
                    let n = 0;
                    let arr = [];
                    let getCommentsCount = function(){
                        let omb = rst[n];
                        Comment.countDocuments({articleID:omb.id},function(err,commentCount){

                            let obj = {
                                id:omb.id,
                                tit:omb.tit,
                                showImg:omb.showImg,
                                userInfo:{
                                    nick_name:omb.userInfo.nick_name
                                },
                                num:omb.num,
                                ptx:omb.ptx,
                                commentCount:commentCount,
                                timer:moment(omb.timer).format("YYYY-MM-DD HH:mm:ss")
                            }
                            arr.push(obj);
                            n += 1;
                            if(n < rst.length){
                                getCommentsCount();
                            }else{
                                info.code = 2;
                                info.articles = arr;
                                info.message = "首页文章查询";
                                res.end(JSON.stringify(info));
                            }
                        });
                    }
                    getCommentsCount();
                }else{
                    info.code = 1;
                    info.message = "无数据";
                    res.end(JSON.stringify(info));
                }
            });
        }
        post_fun(req,res,getData);
    },
    /* 查询文章详情 */
    "/m_business/detailes_m/":function(req,res){
        let getData = function(params){
            Article.findByIdAndUpdate(params.id,{$inc:{num:1}},{
                    new:true,
                    upsert:true,
                    runValidators:true,
                    setDefaultsOnInsert:true
                 }).populate(["userInfo"]).then(function(ret){
                if(ret){
                    let obj = {
                        tit:ret.tit,
                        comments:ret.comments,
                        num:ret.num,
                        timer:moment(ret.timer).format("YYYY-MM-DD HH:mm:ss"),
                        content:ret.content,
                        userID:ret.userInfo.id,
                        head_img:ret.userInfo.head_img,
                        nick_name:ret.userInfo.nick_name
                    }
                    info.code = 1;
                    info.articleDetails = obj;
                    info.message = "文章详情";
                    res.end(JSON.stringify(info));
                }else{
                    info.code = 0;
                    info.message = "文章不存在";
                    res.end(JSON.stringify(info));
                }
            });
        };
        post_fun(req,res,getData);
    }
}

module.exports = m_business;