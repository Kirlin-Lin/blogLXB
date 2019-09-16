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
            var newNumStr = "";
            if(res.code == 1){
                var write_article = 'href="/view/user/write_article"';
                var locationURL = window.location.href;
                var noReadNewCound = res.data.noReadNewCound;
                var noReadReplyNewsCound = res.data.noReadReplyNewsCound;
                if(locationURL.indexOf("/write_article") !== -1 || locationURL.indexOf("/modify_article") !== -1){
                    write_article = '';
                }
                if(res.data.noReadNewCound > 0 || res.data.noReadReplyNewsCound > 0){
                    newNumStr = '<em >'+(res.data.noReadNewCound + res.data.noReadReplyNewsCound)+'</em>';
                }

                var head_str = res.data.head_img.split("?")[0];
               
                lorgStr = '<div class="user_info"><a href="/view/user/chat?roomName=web前端&roomID=web&index=0&head_img='+head_str+'&nick_name='
                        +res.data.nick_name+'&userId='+res.data.userId+'" class="room_go"><span class="iconfont">&#xe622;</span>聊天室</a>'
                        + '<a class="img_user_head" href="/view/user/user_info?userID='+res.data.userId+'"><img src="'+res.data.head_img+'"></a>'
                        + '<a '+write_article+' class="iconfont write_btn">&#xe673; 写文章</a></div>';
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
            + '</div><div class="new_put">'
            
            + '<div class="put"><input id="searchInput"  type="text" oninput="search_fun(0,this)" placeholder="输入查询信息">'
            + '<em onclick="search_fun(1,2)" class="iconfont">&#xe65a;</em></div>'
            + '<a href="/view/user/news?index=0&noReadReplyNewsCound='+noReadReplyNewsCound+'" '
            + 'class="news iconfont"> &#xe61c; '+newNumStr+' 消息</a>'

            + '<a href="/view/main/cdn" class="news iconfont">  &#xe8b3;  私有cdn</a>'
           
            + '</div>' + lorgStr +'</div></div>';
        }
    });
    if(footer){
        var footerStr = '路小北  粤ICP备16068758号-3  <a target="_blank" style="margin-left:20px;color:#999" href="http://www.beian.gov.cn/portal'
        +'/registerSystemInfo?recordcode=44030702002415"><img  style="width:20px;height:20px;display:inline-block;vertical-align:-5px;" src="https://www.blogls.com/public/images/gonganbeian.png"> 粤公网安备 44030702002415号</a>';
        footer.innerHTML = '<div class="footer">'+footerStr+'</div>';
    }
}

var searchValue = "";
search_fun = function(n,obj){
    if(n == 0){
        searchValue = obj.value;
    }else{
        var searchPageUrl = window.location.href;
        if(searchPageUrl.indexOf("/view/main/search_article") == -1){
            window.location.href = "/view/main/search_article?searchValue="+searchValue;
        }else{
            console.log("当前为搜索页面");
            query_article_fun(searchValue);
        }
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