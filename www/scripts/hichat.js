window.onload = function(){
	//实例化并初始化程序
	var hichat = new HiChat();
	hichat.init();
}

//定义类
var HiChat = function(){
	this.socket = null;
};

//添加原型方法
HiChat.prototype = {
	init:function(){//初始化程序的方法
		var that = this;
		//建立与服务器的socket连接
		this.socket = io.connect();
		//监听socket的connect事件，表示连接已经建立
		this.socket.on('connect',function(){
			//连接到服务器后显示昵称输入框
			document.getElementById('info').textContent = 'get yourself a nickname :)';
            document.getElementById('nickWrapper').style.display = 'block';
            document.getElementById('nicknameInput').focus();
		})

		this.socket.on('nickExisted', function() {
		     document.getElementById('info').textContent = '!nickname is taken, choose another pls'; //显示昵称被占用的提示
		 });

		this.socket.on('loginSuccess', function() {
		     document.title = 'HaChat | ' + document.getElementById('nicknameInput').value;
		     document.getElementById('loginWrapper').style.display = 'none';//隐藏遮罩层显聊天界面
		     document.getElementById('messageInput').focus();//让消息输入框获得焦点
		 });

		this.socket.on('system',function(nickName,userCount,type){
			//判断用户是连接还是离开以显示不同信息
			var msg = nickName + (type =='login'?' joined':' left');
			//指定系统消息显示为红色
    		that._displayNewMsg('system ', msg, 'red');
			//将在线人数显示到页面顶部
			document.getElementById('status').textContent = userCount + (userCount > 1 ? ' users' : ' user') + ' online';
		})

		this.socket.on('newMsg',function(user,msg,color){
			that._displayNewMsg(user,msg,color);
		})

		this.socket.on('newImg',function(user,img){
			that._displayImage(user,img);
		})

		document.getElementById('loginBtn').addEventListener('click',function(){
			var nickName = document.getElementById('nicknameInput').value;
			//判空
			if(nickName.trim().length!=0){
				//当输入昵称时，发送一个login实践和昵称到服务器
				that.socket.emit('login',nickName);
			}else{
				//否则叫他输入
				document.getElementById('nicknameInput').focus();
			};
		},false);

		document.getElementById('sendBtn').addEventListener('click',function(){
			var messageInput = document.getElementById('messageInput'),
				msg = messageInput.value;
				//获取颜色值
        		color = document.getElementById('colorStyle').value;
				messageInput.value = '';
				messageInput.focus();
				if(msg.trim().length != 0){
					that.socket.emit('postMsg',msg,color);//把消息发送到服务器
					that._displayNewMsg('me',msg,color);//把自己的消息显示到窗口中
				};
		},false);

		document.getElementById('sendImage').addEventListener('change', function() {
		    //检查是否有文件被选中
		     if (this.files.length != 0) {
		        //获取文件并用FileReader进行读取
		         var file = this.files[0],
		             reader = new FileReader();
		         if (!reader) {
		             that._displayNewMsg('system', '!your browser doesn\'t support fileReader', 'red');
		             this.value = '';
		             return;
		         };
		         reader.onload = function(e) {
		            //读取成功，显示到页面并发送到服务器
		             this.value = '';
		             that.socket.emit('img', e.target.result);
		             that._displayImage('me', e.target.result);
		         };
		         reader.readAsDataURL(file);
		     };
		 }, false);

		this._initialEmoji();

		document.getElementById('emoji').addEventListener('click', function(e) {
		    var emojiwrapper = document.getElementById('emojiWrapper');
		    emojiwrapper.style.display = 'block';
		    e.stopPropagation();
		}, false);

		document.body.addEventListener('click', function(e) {
		    var emojiwrapper = document.getElementById('emojiWrapper');
		    if (e.target != emojiwrapper) {
		        emojiwrapper.style.display = 'none';
		    };
		});

		document.getElementById('emojiWrapper').addEventListener('click', function(e) {
		    //获取被点击的表情
		    var target = e.target;
		    if (target.nodeName.toLowerCase() == 'img') {
		        var messageInput = document.getElementById('messageInput');
		        messageInput.focus();
		        messageInput.value = messageInput.value + '[emoji:' + target.title + ']';
		    };
		}, false);

		document.getElementById('nicknameInput').addEventListener('keyup', function(e) {
		      if (e.keyCode == 13) {
		        var nickName = document.getElementById('nicknameInput').value;
		        if (nickName.trim().length != 0) {
		            that.socket.emit('login', nickName);
		        };
		    };
		}, false);
		
		document.getElementById('messageInput').addEventListener('keyup', function(e) {
		    var messageInput = document.getElementById('messageInput'),
		        msg = messageInput.value,
		        color = document.getElementById('colorStyle').value;
		    if (e.keyCode == 13 && msg.trim().length != 0) {
		        messageInput.value = '';
		        that.socket.emit('postMsg', msg, color);
		        that._displayNewMsg('me', msg, color);
		    };
		}, false);

	},

	//私有方法，用于接收要显示的消息
	_displayNewMsg: function(user, msg, color) {
	    var container = document.getElementById('historyMsg'),
	        msgToDisplay = document.createElement('p'),
	        date = new Date().toTimeString().substr(0, 8),
	        //将消息中的表情转换为图片
	        msg = this._showEmoji(msg);
	    msgToDisplay.style.color = color || '#000';
	    msgToDisplay.innerHTML = user + '<span class="timespan">(' + date + '): </span>' + msg;
	    container.appendChild(msgToDisplay);
	    container.scrollTop = container.scrollHeight;
	},

    //用于接收要显示的图片
    _displayImage: function(user, imgData, color) {
	    var container = document.getElementById('historyMsg'),
	        msgToDisplay = document.createElement('p'),
	        date = new Date().toTimeString().substr(0, 8);
	    msgToDisplay.style.color = color || '#000';
	    msgToDisplay.innerHTML = user + '<span class="timespan">(' + date + '): </span> <br/>' + '<a href="' + imgData + '" target="_blank"><img src="' + imgData + '"/></a>';
	    container.appendChild(msgToDisplay);
	    container.scrollTop = container.scrollHeight;
	},

	_initialEmoji: function() {
	    var emojiContainer = document.getElementById('emojiWrapper'),
	        docFragment = document.createDocumentFragment();
	    for (var i = 56; i > 0; i--) {
	        var emojiItem = document.createElement('img');
	        emojiItem.src = '../content/emoji/' + i + '.png';
	        emojiItem.title = i;
	        docFragment.appendChild(emojiItem);
	    };
	    emojiContainer.appendChild(docFragment);
	},

	_showEmoji: function(msg) {
	    var match, result = msg,
	        reg = /\[emoji:\d+\]/g,
	        emojiIndex,
	        totalEmojiNum = document.getElementById('emojiWrapper').children.length;
	    while (match = reg.exec(msg)) {
	        emojiIndex = match[0].slice(7, -1);
	        if (emojiIndex > totalEmojiNum) {
	            result = result.replace(match[0], '[X]');
	        } else {
	            result = result.replace(match[0], '<img class="emoji" src="../content/emoji/' + emojiIndex + '.png" />');
	        };
	    };
	    return result;
	}
}

