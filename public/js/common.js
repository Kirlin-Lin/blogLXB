var $ = {};
$.ajax = function(obj){
    var xmlhttp = new XMLHttpRequest();
    var send_data = JSON.stringify(obj.data);
        xmlhttp.onreadystatechange=function(){
            if (xmlhttp.readyState==4 && xmlhttp.status==200){
                obj.success(JSON.parse(xmlhttp.responseText));
            }
        }
        xmlhttp.open("post",obj.url,true);
        xmlhttp.send(send_data);
}
/* 顶部导航和底部导航 以及全局使用的用户信息*/
get_head_foot = function(){
   var header = document.getElementById("header");
   var footer = document.getElementById("footer");
   var lorgStr = '';
    $.ajax({
        url:'/router/userInfo/',
        data:{},
        success:function(res){
            if(res.code == 1){
                var head_str = res.data.head_img.split("?")[0];
                // <a href="" class="news"><em>5</em>消息</a>
                lorgStr = '<div class="user_info"><a href="/view/user/chat?roomName=web前端&roomID=web&index=0&head_img='+head_str+'&nick_name='
                        +res.data.nick_name+'&userId='+res.data.userId+'" class="room_go"><span class="iconfont">&#xe622;</span>聊天室</a>'
                        + '<a class="img_user_head" href="/view/user/user_info?userID='+res.data.userId+'"><img src="'+res.data.head_img+'"></a>'
                        + '<a href="/view/user/write_article" class="iconfont write_btn">&#xe673; 发布</a></div>';
            }else{
                lorgStr = '<div class="sign_box"><a href="/view/user/chat" class="room_go"><span class="iconfont">&#xe622;</span>聊天室</a>'
                        + '<a href="/view/main/login"><button class="sgin_in">登录</button>'
                        + '</a><a href="/view/main/regist"><button class="sgin_up">注册</button></a></div>';
            }
            header.innerHTML 
            = '<div class="header">'
            + '<div class="info">'
            + '<div class="logo">'
            + '<a href="/"><img src="/public/images/logo.png" alt=""></a>'
            + '</div><div class="new_put"><a href="/view/user/news" '
            + ' class="news iconfont"> &#xe61c; <em>5</em>消息</a></span>'
            + '<div class="put"><input type="text" placeholder="输入查询信息"><em class="iconfont">&#xe65a;</em></div></div>'
            + lorgStr +'</div></div>';
        }
    });
    if(footer){
        footer.innerHTML = '<div class="footer">路小北   粤ICP备16068758号-2 </div>';
    }
}

/* 获取url参数 */
function getQueryVariable(variable){
    var query = window.location.search.substring(1);
    var vars = query.split("&");
    for (var i=0;i<vars.length;i++) {
            var pair = vars[i].split("=");
            if(pair[0] == variable){return pair[1];}
    }
    return(false);
}

/* 取src中的参数 */
function getParamSrc(variable,url){
    var query = url.split("?")[1];
    var vars = query.split("&");
    for (var i=0;i<vars.length;i++) {
            var pair = vars[i].split("=");
            if(pair[0] == variable){return pair[1];}
    }
    return(false);
}