//ws://127.0.0.1:8080/socket.io/?EIO=3&transport=websocket
var io = require('socket.io')({
	transports: ['websocket']
, });

var userList = new Array();
var roomList = new Array();

var USER_COUNT = 0;

var io = io.attach(8080);

console.log('\n=============\n');
console.log("Server is On");
console.log('Time :  ' + new Date());
console.log('\n=============\n');

var room = {
	id: 0
	, name: 'Test'
	, readyPlayers: 0
	, maxPlayers: 2
	, userList: []
	, isPlay: false
};

roomList.push(room);

var user = {
	name: ""
	, socketID: ""
	, isPlayer: false
	, isHost: false
	, isReady: false
	, isBoss: false
	, isBossChild: false
	, keyCount: 0
	, characterKind: 0
	, objectKind: 0
};

userList.push(user);



io.on('connection', function (socket) {

	//유저 접속 카운트 갱신 ++
	UserConnect();

	//로그인
	socket.on('login', function (data) {
		console.log('[Login]' + new Date() + '\n\t' + socket.id + ' | ' + data.name);
		socket.leave(socket.room);
		socket.join('lobby');
		socket.room = 'lobby';

		//유저의 socket id를 갱신
		socket.emit('login', {
			socketID: socket.id
		});

		io.sockets.in(socket.room).emit('chat', {
			name: "[Join]"
			, message: data.name + "님이 접속 하셨습니다."
		});
	});

	//회원가입
	socket.on('register', function (data) {
		console.log('[Register]' + new Date() + '\n\t' + socket.id + ' | ' + data.name);

		var u = {
			name: data.name
			, socketID: socket.id
			, isPlayer: false
			, isHost: false
			, isReady: false
			, isBoss: false
			, isBossChild: false
			, keyCount: 0
			, characterKind: 0
			, objectKind: 0
		};

		userList.push(u);

		socket.leave(socket.room);
		socket.join('lobby');
		socket.room = 'lobby';

		//유저의 socket id를 갱신
		socket.emit('login', {
			socketID: socket.id
		});

		io.sockets.in(socket.room).emit('chat', {
			name: "[Join]"
			, message: data.name + "님이 접속 하셨습니다."
		});
	});

	//방 리스트
	socket.on('roomList', function (data) {
		//방 배열을 전송
		socket.emit('roomList', {
			roomList: roomList
		});
	});

	//방 생성
	socket.on('create', function (data) {
		//방 모델 생성
		var makeRoom = {
			id: GenerateRandomID(1, 10000)
			, name: data.roomName
			, countPlayers: 0
			, readyPlayers: 0
			, maxPlayers: data.maxPlayers
			, userList: []
			, isPlay: false
		};

		//배열에 추가
		roomList.push(makeRoom);

		//로비에 방 정보 전송
		io.sockets.in('lobby').emit('roomCreate', {
			room: makeRoom
		});

		socket.leave(socket.room);
		//room 입장
		socket.join(makeRoom.id + makeRoom.name);
		//socket의 room 지정
		socket.room = makeRoom.id + makeRoom.name;

		//클라이언트 완료 보내기
		socket.emit('enter', {
			roomName: makeRoom.id + makeRoom.name
			, isHost: true
		});

		console.log('[RoomInfo-Make]' + new Date() + '\n\tNo. ' + makeRoom.id + ' | ' + makeRoom.name);
	});

	//방 입장
	socket.on('enter', function (data) {
		//방을 검색
		var findRoom = FindRoom(data.roomName);

		//방이 없는 경우
		if (findRoom == null) {
			socket.emit('error', {
				errorCode: 1
			});
			console.log("[Error] " + new Date() + '\n' + socket.id + '가 존재하지 않는 방을 요청');
		} else {
			//방이 플레이 중이지 않은 경우
			if (!(findRoom.isPlay)) {
				//room 나가기
				socket.leave(socket.room);
				//room 입장
				socket.join(data.roomName);
				//socket의 room 지정
				socket.room = data.roomName;

				//클라이언트 완료 보내기
				socket.emit('enter', {
					roomName: data.roomName
					, isHost: false
				});

			} else {
				//플레이 중인 경우
				console.log('[JoinFail]' + findRoom.name + ' is Playing!');
			}
		}
	});


	//클라이언트의 방 접속 완료
	socket.on('join', function (data) {
		//방을 검색
		var findRoom = FindRoom(socket.room);

		//방이 없는 경우
		if (findRoom == null) {
			console.log("[Error] " + new Date() + '\n' + socket.id + '가 존재하지 않는 방을 요청');
		} else {
			//방이 있는 경우

			//유저 모델 생성
			var u = {
				name: data.name
				, socketID: socket.id
				, isPlayer: false
				, isHost: data.isHost
				, isReady: false
				, isBoss: false
				, isBossChild: false
				, isKeyHave: false
				, keyCount: 0
				, characterKind: data.characterKind
				, objectKind: 0
			}

			//유저 추가
			findRoom.userList.push(user);

			findRoom.countPlayers++;

			//추가된 유저를 보냄
			socket.broadcast.to(socket.room).emit('join', u);

			//
			if (findRoom.userList != null) {
				//현재 접속 유저에게 다른 유저들을 보냄
				socket.emit('userList', {
					userList: findRoom.userList
				});

				//로비에 방 정보 전송
				io.sockets.in('lobby').emit('roomJoin', {
					roomName: socket.room
					, count: findRoom.countPlayers
				});

			}
		}
	});


	//클라이언트의 준비 완료
	socket.on('ready', function (data) {
		//방을 검색
		var findRoom = FindRoom(socket.room);

		//방이 없는 경우
		if (findRoom == null) {
			console.log("[Error] " + new Date() + '\n' + socket.id + '가 존재하지 않는 방을 요청');
		} else {
			if (findRoom.userList != null) {
				//현재 접속 유저에게 다른 유저들을 보냄
				socket.emit('userList', {
					userList: findRoom.userList
				});

				var u = FindRoomInUser(findRoom, socket.id);

				if (u != null) {
					if (data.isReady) {
						u.isReady = true;
						findRoom.readyPlayers++;
					} else {
						u.isReady = false;
						findRoom.readyPlayers--;
					}

					console.log('[RoomInfo-Ready] : total = ' + findRoom.userList.length + ' | ready =  ' + findRoom.readyPlayers + ' / req = ' + findRoom.maxPlayers);

					io.sockets.in(socket.room).emit('ready', {
						socketID: u.socketID
						, isReady: data.isReady
						, readyPlayers: findRoom.readyPlayers
					});
				}
			}
		}
	});

	//클라이언트의 준비 완료
	socket.on('start', function (data) {

		var findRoom = FindRoom(socket.room);

		//방이 없는 경우
		if (findRoom == null) {
			console.log("[Error] " + new Date() + '\n' + socket.id + '가 존재하지 않는 방을 요청');
		} else {
			findRoom.isPlay = true;

			//방의 모든 유저 게임 시작.
			io.sockets.in(socket.room).emit('start', {
				a: 0
			});

			//방 배열을 전송
			socket.broadcast.to('lobby').emit('roomStart', {
				roomName: socket.room
				, isPlay: true
			});
		}
	});


	//게임방 아웃
	socket.on('exit', function (data) {

		var findRoom = FindRoom(socket.room);

		var name = "";

		if (findRoom != null) {
			for (var i = 0; i < findRoom.userList.length; i++) {
				if (socket.id == findRoom.userList[i].socketID) {
					name = findRoom.userList[i].name;
					console.log("[RoomInfo-Out] " + new Date() + '\n\tNo. ' + findRoom.id + ' | ' + findRoom.name + ' >> ' + name);
					findRoom.userList.splice(i, 1);
					findRoom.readyPlayers--;
					findRoom.countPlayers--;
					break;
				}
			}

			if (findRoom.userList.length > 0) {

				io.sockets.in(socket.room).emit('chat', {
					name: 'Notice'
					, message: name + '님이  나갔어요.'
				});

				io.sockets.in(socket.room).emit('exit', {
					name: name
				});

				//로비에 방 정보 전송
				io.sockets.in('lobby').emit('roomJoin', {
					roomName: socket.room
					, count: findRoom.countPlayers
				});

			} else {
				for (var i = 0; i < roomList.length; i++) {
					if (socket.room == roomList[i].id + roomList[i].name) {
						console.log("[RoomInfo-Remove] " + new Date() + '\n\tNo. ' + roomList[i].id + ' | ' + roomList[i].name);
						roomList.splice(i, 1);
						//로비에 방 정보 전송
						io.sockets.in('lobby').emit('roomDelet', {
							roomName: socket.room
						});
						break;
					}
				}
			}

			socket.leave(socket.room);
			socket.join('lobby');
			socket.room = 'lobby';

			socket.emit('out', {
				a: 1
			});
		}
	});

	//이동
	socket.on('move', function (data) {
		io.sockets.in(socket.room).emit('move', data);
	});

	//회전
	socket.on('rotate', function (data) {
		io.sockets.in(socket.room).emit('rotate', data);
	});

	//상태
	socket.on('state', function (data) {
		io.sockets.in(socket.room).emit('state', data);
	});

	//열쇠 조각
	socket.on('getKeyPart', function (data) {
		io.sockets.in(socket.room).emit('getKeyPart', data);
	});

	//열쇠 완성
	socket.on('getKey', function (data) {
		io.sockets.in(socket.room).emit('getKey', data);
	});

	//술래 지정
	socket.on('rootTag', function (data) {
		io.sockets.in(socket.room).emit('rootTag', data);
	});

	//술래 감염
	socket.on('childTag', function (data) {
		io.sockets.in(socket.room).emit('childTag', data);
	});

	//포탈 생성
	socket.on('portal',function(data){
		io.sockets.in(socket.room).emit('portal', data);
	});
	
	//포탈 열림
	socket.on('open', function (data) {
		io.sockets.in(socket.room).emit('open', data);
	});

	//포탈 닫힘
	socket.on('close', function (data) {
		io.sockets.in(socket.room).emit('close', data);
	});

	//채팅 입력 시 
	socket.on('chat', function (data) {
		console.log('[Chat] ' + new Date() + ' : ' + data.name + ' >> ' + data.message);

		io.sockets.in(socket.room).emit('chat', data);
	});

	//연결 해제 시
	socket.on('disconnect', function (data) {
		var findRoom = FindRoom(socket.room);

		var name = "";

		if (findRoom != null) {
			for (var i = 0; i < findRoom.userList.length; i++) {
				if (socket.id == findRoom.userList[i].socketID) {
					name = findRoom.userList[i].name;
					console.log("[RoomInfo-Out] " + new Date() + '\n\tNo. ' + findRoom.id + ' | ' + findRoom.name + ' >> ' + name);
					findRoom.userList.splice(i, 1);
					findRoom.readyPlayers--;
					break;
				}
			}

			if (findRoom.userList.length > 0) {

				io.sockets.in(socket.room).emit('chat', {
					name: 'Notice'
					, message: name + '님이  나갔어요.'
				});

				io.sockets.in(socket.room).emit('exit', {
					name: name
				});

				//로비에 방 정보 전송
				io.sockets.in('lobby').emit('roomJoin', {
					roomName: socket.room
					, count: findRoom.userList.length
				});

			} else {
				for (var i = 0; i < roomList.length; i++) {
					if (socket.room == roomList[i].id + roomList[i].name) {
						console.log("[RoomInfo-Remove] " + new Date() + '\n\tNo. ' + roomList[i].id + ' | ' + roomList[i].name);
						roomList.splice(i, 1);
						//로비에 방 정보 전송
						io.sockets.in('lobby').emit('roomDel', {
							roomName: socket.room
						});
						break;
					}
				}
			}
			socket.leave(socket.room);
			socket.join('lobby');
			socket.room = 'lobby';
			socket.emit('out', {
				a: 1
			});

		}
		//유저 접속 카운트 갱신 --
		UserDisconnect();
	});

});


function GenerateRandomID(min, max) {
	var ranNum = 0;
	do {
		ranNum = Math.floor(Math.random() * (max - min + 1)) + min;
	} while (CheckID(ranNum));
	return ranNum;
}

function CheckID(id) {
	for (var i = 0; i < roomList.length; i++) {
		if (id == roomList[i].id)
			return true;
	}
	return false;
}


function UserConnect() {
	++USER_COUNT;
	UserCountLog(new Date());
}

function UserDisconnect() {
	--USER_COUNT;
	UserCountLog(new Date());
}

function UserCountLog(date) {
	console.log('\n==========');
	console.log('[UserCount] ' + date + '\n현재 연결중인 유저수는 총 ' + USER_COUNT + " 명");
	console.log('==========\n');
}

function FindRoom(name) {
	if (roomList != null) {
		for (var i = 0; i < roomList.length; i++) {
			if (name == roomList[i].id + roomList[i].name)
				return roomList[i];
		}
	}
	return null;
}

function FindRoomInUser(room, user) {
	if (room.userList != null) {
		for (var i = 0; i < room.userList.length; i++) {
			if (room.userList[i].socketID == user)
				return room.userList[i];
		}
	}
	return null;
}