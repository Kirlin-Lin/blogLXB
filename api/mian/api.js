const path = require("path");
const url = require("url");
const fs = require("fs");
const util = require("util");
const nodemailer = require("nodemailer");
const querystring = require("querystring");
const User = require("../../model/Users");
const crypto = require('crypto');
const randomFloat = require("random-float");
const moment = require("moment");
const multiparty = require('multiparty');
const Motto = require("../../model/Motto");
const gm = require('gm').subClass({ imageMagick: true });

let encrypt_fun = function(username){
    let secret = randomFloat(10, 100).toString();
    let hash = crypto.createHmac('sha256', secret)
                .update('-----------------------------'+username)
                .digest('hex');
    return hash;
}

let info = {
    code:0,
    message:""
};

/* 读取html文件 */
let read_html_fun = function(req,res){
    /* 拼接路径找到html */
    try{
        let fileSrc = "";
        let pathname = url.parse(req.url,true).pathname;
        read_file_fun  = function(fileSrc,req,res){
            fs.readFile(fileSrc,function(err,data){
                if(err) {
                    res.writeHead(200,{'Content-Type':'text/plain;charset=utf-8'});
                    res.end("文件不存在");
                }else{
                    res.writeHead(200,{'Content-Type':'text/html;charset=utf-8'});
                    res.end(data);
                }
            });
        }
        if(pathname == "/"){
            fileSrc =  "./view/main/index.html";
            read_file_fun(fileSrc,req,res);
        }else if(pathname.indexOf("/view/main") !== -1){
            fileSrc =  "./view/main/" + path.basename(pathname) + ".html";
            read_file_fun(fileSrc,req,res);
        }else if(pathname.indexOf("/view/user/") !== -1){
            let userInfo = req.cookies.get("userInfo");
            if(userInfo){
                userInfo = JSON.parse(userInfo);
                User.findOne({_id:userInfo.id}).then(function(rst){
                    if(rst && rst.login_state == userInfo.login_state){
                        fileSrc =  "./view/user/" + path.basename(pathname) + ".html";
                        read_file_fun(fileSrc,req,res);
                    }else{
                        /* 未登陆,跳转到登录页面 */
                        fileSrc =  "./view/main/login.html";
                        read_file_fun(fileSrc,req,res);
                       /*  res.writeHead(200,{'Content-Type':'text/html;charset=utf-8'});
                        res.end('未登陆,先去登陆 <a href="/public/view/main/login">登陆</a>'); */
                    }
                });
            }else{
                /* 未登陆,跳转到登录页面 */
                fileSrc =  "./view/main/login.html";
                read_file_fun(fileSrc,req,res);
            }
        }
    }catch(err){
        console.log(err)
    }
}

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
/* 发送邮件 */
let sendemail_fun = function(username,data,result){
    let date = new Date();
    let transporter = nodemailer.createTransport({
        service: 'qq',
        port: 465, // SMTP 端口
        secureConnection: true, // 使用 SSL
        auth: {
            user: '523705068@qq.com',
            //这里密码不是qq密码，是你设置的smtp密码
            pass: 'XXXXXXXXXXXXXXXXXXXXX'
        }
    });
    let options = {  
        from: '523705068@qq.com', // 发送者  
        to:username, // 接受者,可以同时发送多个,以逗号隔开  
        subject: data.tit, // 标题  
        //text: 'Hello world', // 文本  
        html: `<img src="https://www.blogls.com/public/system_pic/register_show_adv.jpg"><br><br><p>幸福的感觉</p><p>然后,旁若无人的痴然而笑</p>
        <p>---------------路小北</p>
        <a href="https://www.blogls.com`+data.url
        +`?regEmailMath=`+data.regEmailMath+`">点击链接，`+data.type+`！https://www.blogls.com`+data.url+`?regEmailMath=`+data.regEmailMath+`</a>
        `
    };
    transporter.sendMail(options,function(err,success){
        if(err){
            result(0);
        }else{
            result(1);
        }
    });
}




const api = {
     /* 读取html */
    "read_main_html":function(req,res){
        read_html_fun(req,res);
    },
    /* 上传图片 */
    "/upload/images":function(req,res){
        let userInfo = JSON.parse(req.userInfo);
        let form = new multiparty.Form({
            uploadDir:"./public/artwork_pic/",
            keepExtensions: true
        });
        form.on('error', function (err) {
            console.log('Error parsing form: ' + err.stack);
        });
        form.on('file', (name, file) => {
            if(file.path.indexOf(".gif") !== -1){
                let dateStr = moment(new Date()).format("YYYY-MM-DD HH:mm:ss").split(" ");
                let dateilsUrl = "/public/gif/__"+userInfo.id+dateStr[0]+'__'+dateStr[1]+".gif";
                gm('./'+file.path)
                .write("."+dateilsUrl,function(err){
                    if(!err){
                        let err = {
                            "errno": 0,
                            details_pic:{
                                name:"详情图",
                                url:dateilsUrl
                            },
                            thumbnail_pic:{
                                name:"首页缩略图",
                                url:dateilsUrl
                            },
                        }
                        res.end(JSON.stringify(err));
                    }
                });
            }else if(file.path.indexOf(".svg") !== -1){
                let dateStr = moment(new Date()).format("YYYY-MM-DD HH:mm:ss").split(" ");
                let dateilsUrl = "/public/svg/__"+userInfo.id+dateStr[0]+'__'+dateStr[1]+".svg";
                gm('./'+file.path)
                .write("."+dateilsUrl,function(err){
                    if(!err){
                        let err = {
                            "errno": 0,
                            details_pic:{
                                name:"详情图",
                                url:dateilsUrl
                            },
                            thumbnail_pic:{
                                name:"首页缩略图",
                                url:dateilsUrl
                            },
                        }
                        res.end(JSON.stringify(err));
                    }
                });
            }else{
                let dateStr = moment(new Date()).format("YYYY-MM-DD HH:mm:ss").split(" ");
                let dateilsUrl = "/public/details_pic/__"+userInfo.id+dateStr[0]+'__'+dateStr[1]+".jpg";
                let thumbnailUrl = "/public/thumbnail_pic/__"+userInfo.id+dateStr[0]+'__'+dateStr[1]+".jpg";
                /* 裁剪详情页图片 */
                gm('./'+file.path).
                size(function(err,data){
                    console.log(data)
                    if(data.width < 800){
                        this.resize(data.width)
                        .setFormat("JPEG")
                        .quality(61)
                        .write("."+dateilsUrl,function(err){
                            if(!err){
                                if(data.width/data.height > 8/5){
                                    this.resize(null,100)
                                    .setFormat("JPEG")
                                    .quality(61)
                                    .write("."+thumbnailUrl,function(err){
                                        if(!err){
                                            console.log("裁剪成功")
                                            let err = {
                                                "errno": 0,
                                                details_pic:{
                                                    name:"详情图",
                                                    url:dateilsUrl
                                                },
                                                thumbnail_pic:{
                                                    name:"首页缩略图",
                                                    url:thumbnailUrl
                                                },
                                            }
                                            res.end(JSON.stringify(err));
                                        }
                                    });
                                }else{
                                    this.resize(200)
                                    .setFormat("JPEG")
                                    .quality(61)
                                    .write("."+thumbnailUrl,function(err){
                                        if(!err){
                                            console.log("裁剪成功")
                                            let err = {
                                                "errno": 0,
                                                details_pic:{
                                                    name:"详情图",
                                                    url:dateilsUrl
                                                },
                                                thumbnail_pic:{
                                                    name:"首页缩略图",
                                                    url:thumbnailUrl
                                                },
                                            }
                                            res.end(JSON.stringify(err));
                                        }
                                    });
                                }
                            }
                        })
                    }else if(data.width >= 800){
                        this.resize(800)
                        .setFormat("JPEG")
                        .quality(61)
                        .write("."+dateilsUrl,function(err){
                            if(!err){
                                if(data.width/data.height > 8/5){
                                    this.resize(null,100)
                                    .setFormat("JPEG")
                                    .quality(61)
                                    .write("."+thumbnailUrl,function(err){
                                        if(!err){
                                            console.log("裁剪成功")
                                            let err = {
                                                "errno": 0,
                                                details_pic:{
                                                    name:"详情图",
                                                    url:dateilsUrl
                                                },
                                                thumbnail_pic:{
                                                    name:"首页缩略图",
                                                    url:thumbnailUrl
                                                },
                                            }
                                            res.end(JSON.stringify(err));
                                        }
                                    });
                                }else{
                                    this.resize(200)
                                    .setFormat("JPEG")
                                    .quality(61)
                                    .write("."+thumbnailUrl,function(err){
                                        if(!err){
                                            console.log("裁剪成功")
                                            let err = {
                                                "errno": 0,
                                                details_pic:{
                                                    name:"详情图",
                                                    url:dateilsUrl
                                                },
                                                thumbnail_pic:{
                                                    name:"首页缩略图",
                                                    url:thumbnailUrl
                                                },
                                            }
                                            res.end(JSON.stringify(err));
                                        }
                                    });
                                }
                            }
                        })
                    }
                })
            }
        });
        form.on('close', function () {
            console.log('Upload completed!');
        });
        form.parse(req,function(err,fields, files){
            console.log(fields)
        });
    },
    POST:{
        /* 验证邮箱 */
        "/api/post/reg_email":function(req,res){
            post_fun(req,res,function(rst){
                User.findOne({
                    regEmailMath:rst.regEmailMath
                }).then(function(findret){
                    if(findret){
                        User.updateOne({regEmailMath:rst.regEmailMath},{lock:1},function(err,doc){
                            if(err){
                                info.code = 1;
                                info.message = "亲，验证失败，请重新注册或者验证";
                                res.end(JSON.stringify(info));
                            }else{
                                info.code = 2;
                                info.message = "注册成功";
                                res.end(JSON.stringify(info));
                            }
                        });
                    }else{
                        info.code = 0;
                        info.message = "亲，验证册失败，请重新注册";
                        res.end(JSON.stringify(info));
                    }
                });
            });
        },
        /*密码找回*/
        "/api/post/passwd_new":function(req,res){
            let fun_doc = function (params) {
                User.updateOne({regEmailMath:params.regEmailMath},{
                    passwd:params.passwd,
                    regEmailMath:0
                }).then(function(rst){
                    if(rst.nModified == 1){
                        info.code = 1;
                        info.message = "密码找回成功";
                        res.end(JSON.stringify(info));
                    }else{
                        info.code = 0;
                        info.message = "亲，验证已经失效，请重新找回";
                        res.end(JSON.stringify(info));
                    }
                });
            };
            post_fun(req,res,fun_doc);
        },
        /* 用户登录 */
        "/api/post/sign_in":function(req,res){
            post_fun(req,res,function(_result){
                let obj = {
                    username:_result.username,
                }
                User.findOne(obj).then(function(_res){
                    if(_res){
                      //  User.updateOne(obj,{login_time:})
                        if(_res.passwd !== _result.passwd){
                            info.code = 1;
                            info.message = "亲，密码错误，请重新输入";
                            res.end(JSON.stringify(info));
                        }else if(_res.passwd == _result.passwd){
                            if(_res.lock == 0){
                                info.code = 2;
                                info.message = "亲，账号还未验证，请前往邮箱验证";
                                res.end(JSON.stringify(info));
                            }else if(_res.lock == 1){
                                let hash = encrypt_fun(_result.username);
                                User.updateOne(obj,{
                                    login_time:new Date(),
                                    login_state:hash
                                },function(err,succ){
                                    if(succ){
                                        
                                        req.cookies.set("userInfo",JSON.stringify({
                                            id:_res.id,
                                            login_state:hash
                                        }));
                                        info.code = 3;
                                        info.message = "登录成功";
                                        info.username = _res.username;
                                        res.end(JSON.stringify(info));
                                    }
                                })
                            }
                        }
                    }else{
                        info.code = 0;
                        info.message = "亲，账号不存在";
                        res.end(JSON.stringify(info));
                    }
                });
            });
        },
         /* 用户注册 */
        "/api/post/sign_up":function(req,res){
            post_fun(req,res,function(result){
                let reg_email  = /^([A-Za-z0-9_\-\.])+\@([A-Za-z0-9_\-\.])+\.([A-Za-z]{2,4})$/;
                let reg =  reg_email.test(result.username);
                    if(reg){
                        if(result.passwd == ""){
                            info.code = 1;
                            info.message = "请输入个密码吧，亲";
                            res.end(JSON.stringify(info));
                        }else if(result.nick_name == ""){
                            info.code = 2;
                            info.message = "亲，给自己取个昵称吧";
                            res.end(JSON.stringify(info));
                        }else{
                            reg_user(req,res,result);
                        }
                    }else{
                        info.code = 0;
                        info.message = "亲，邮箱格式不正确";
                        res.end(JSON.stringify(info));
                    }
            });
            /*查询注册用户写入数据库,待邮箱验证 */
            reg_user = function(req,res,result){
                 /* 加密隨機字串 */
                let hash = encrypt_fun(result.username);
                User.findOne({
                    username:result.username
                }).then(function(findrst){

                    if(findrst){
                        if(findrst.lock == 1){
                            info.code = 3;
                            info.message = "亲，账号已经被注册";
                            res.end(JSON.stringify(info));
                        }else{
                            User.updateOne({username:result.username},{regEmailMath:hash},function(err,doc){
                                if(doc){
                                    sendemail_fun(result.username,{
                                        tit:"欢迎注册路小北",
                                        url:"/view/main/reg_email",
                                        regEmailMath:hash,
                                        type:'进行邮箱验证'
                                    },function(emailrst){
                                        if(emailrst == 1){
                                            info.code = 5;
                                            info.message = "亲，邮件已发送，请前往邮箱验证！";
                                            res.end(JSON.stringify(info));
                                        }
                                    });
                                }
                            })
                        }
                    }else{
                        let sumFun = function(m,n){
                        　　let num = Math.floor(Math.random()*(m - n) + n);
                            return num;
                        }
                        let sum = sumFun(1,80);
                        let head_img = "";
                            if(sum < 10){
                               head_img = "/public/images/head_img_0"+sum+".jpg";
                            }else{
                               head_img = "/public/images/head_img_"+sum+".jpg";
                            }

                        let sumMotto = sumFun(1,100);

                        Motto.findOne().skip(sumMotto).then(function(rst){
                            let user = new User({
                                username:result.username,
                                passwd:result.passwd,
                                nick_name:result.nick_name,
                                regEmailMath:hash,
                                lock:0,
                                head_img:head_img,
                                introduce:rst.content
                            });
                            user.save().then(function(saverst){
                                /* 写入成功以后发送邮件 */
                                if(saverst){
                                    sendemail_fun(result.username,
                                        {
                                            url:"/view/main/reg_email",
                                            regEmailMath:hash,
                                            tit:"欢迎注册路小北",
                                            type:'进行邮箱验证'
                                        },function(emailrst){
                                        if(emailrst == 1){
                                            info.code = 5;
                                            info.message = "亲，邮件发送成功，请前往验证！";
                                            res.end(JSON.stringify(info));
                                        }
                                    });
                                }
                            }); 
                        });
                    }
                });
            }
        },
        /* 退出登录 */
        "/api/post/out_login":function(req,res){
            let userInfo = JSON.parse(req.userInfo);
            let fun_doc = function (params) {
                User.findByIdAndUpdate(userInfo.id,{$set:{login_state:params.login_state}},{new:true}).then(function(ret){
                    if(ret){
                        req.cookies.set("userInfo",null);
                        info.code = 1;
                        info.message = "退出成功";
                        res.end(JSON.stringify(info));
                    }
                })
            };
            post_fun(req,res,fun_doc);
        },
        /*找回密码*/
        "/api/post/retrieve":function(req,res){
            let fun_doc = function (params) {
                let reg_email  = /^([A-Za-z0-9_\-\.])+\@([A-Za-z0-9_\-\.])+\.([A-Za-z]{2,4})$/;
                let reg =  reg_email.test(params.username);
                    if(reg){
                        /* 加密随机字串 */
                        let hash = encrypt_fun(params.username);
                        User.findOneAndUpdate({username:params.username},{regEmailMath:hash},{new:true}).then(function(rst){
                            console.log(rst)
                            if(rst){
                                sendemail_fun(rst.username,
                                    {
                                        url:"/view/main/passwd_new",
                                        regEmailMath:hash,
                                        tit:"路小北密码找回",
                                        type:'修改新密码'
                                    },function(emailrst){
                                    if(emailrst == 1){
                                        info.code = 1;
                                        info.message = "邮件发送成功，请前往邮箱重新构建密码";
                                        res.end(JSON.stringify(info));
                                    }
                                });
                            }else{
                               info.code = 2;
                               info.message = "邮箱不存在或者未被注册";
                               res.end(JSON.stringify(info)); 
                            }
                        });
                }else{
                    info.code = 0;
                    info.message = "邮箱格式不正确";
                    res.end(JSON.stringify(info));
                }
            };
            post_fun(req,res,fun_doc);
        }
    }
}

module.exports = api;