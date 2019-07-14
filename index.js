const http = require("http");
const url = require("url");
const fs = require("fs");
const mongoose = require("mongoose");
const router = require("./api/mian/router");
const api = require("./api/mian/api");
const Cookise = require("cookies");
const IO = require('socket.io');
const Users = require("./model/Users");



/* 服务函数 */
service_fun = function(req,res){
    if(req.url !== "/favicon.ico"){
        req.cookies = new Cookise(req,res);
        req.userInfo = req.cookies.get("userInfo");
        try{
            let pathname = url.parse(req.url,true).pathname;
            if((pathname.indexOf("/view/") !== -1) || (pathname == "/") ){
                api["read_main_html"](req,res);
            }else if(pathname.indexOf("/upload/images") !== -1){
                api["/upload/images"](req,res);
            }else if(pathname.indexOf("/api/post/") !== -1){
                api.POST[pathname](req,res);
            }else if(pathname.indexOf("/router/") !== -1){
                router[pathname](req,res);
            }else if("/kuauyu"){
                res.setHeader('Access-Control-Allow-Origin','*');
                res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Content-Length, Authorization, Accept, X-Requested-With , yourHeaderFeild');
                res.setHeader('Access-Control-Allow-Methods', 'PUT, POST, GET, DELETE, OPTIONS');
                res.write("nginx负载均衡成功");
                res.write("nginx动态静态分离成功");
                res.end("跨域成功");
            }
        }catch(err){
            console.log(err);
            res.writeHead(200,{'Content-Type':'text/plain;charset=utf-8'});
            res.end('{"message":"访问的路径不存在或者出错了"}');
        }
    };
}


const server = http.createServer(service_fun);
// 创建socket服务
const socketIO =  IO(server);
let roomInfo = {};

socketIO.on("connection",function(socket){
    let user;
    let roomID;
    /* 加入房间 */
    socket.on("joinRoom",function (user) {
        user = user;
        roomID = user.roomID;

        /* join(房间名)加入房间 */
        if (!roomInfo[roomID]) {
            roomInfo[roomID] = [];
        }
        /* 加入房間 */
        if(roomInfo[roomID].indexOf(user.userId) == -1){
            roomInfo[roomID].push(user.userId);
            socket.join(roomID);
        }
        socketIO.to(roomID).emit('sys',{
            user:user,
            msg:'进入'+user.roomName+'聊天室',
            count:roomInfo[roomID].length
        });
        /* 离开房间 */
        socket.on('disconnect', function () {
            try{
                var index = roomInfo[roomID].indexOf(user.userId);
                if (index !== -1) {
                    roomInfo[roomID].splice(index, 1);
                }
                socket.leave(roomID); 
                socketIO.to(roomID).emit('sys',{
                    user:user,
                    msg:'退出'+user.roomName+'聊天室',
                    count:roomInfo[roomID].length
                });
            }catch(err){
                console.log(err)
            }
        });

        /* 接受用戶發送的信息 */
        socket.on("message",function(data){
            console.log(data);
            socketIO.to(roomID).emit('msg',data,user);
        });
    });
});

/* 添加监听 */
mongoose.connect('mongodb://admin:123456@www.baidu.com/blog?authSource=admin',{ useNewUrlParser: true },function(error){
        if(error){
            console.log(error);
        }else{
            server.listen(9080);
            console.log("启动成功");
        };
});