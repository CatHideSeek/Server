//ws://127.0.0.1:8080/socket.io/?EIO=3&transport=websocket
var io = require('socket.io')({
    transports: ['websocket'],
});

var userList = new Array();
var roomList = new Array();

var USER_COUNT = 0;

var io = io.attach(8080);

console.log('\n======1.75ver=======\n');
console.log('\n======HideSeek=======\n');
console.log("Server is On");
console.log('Time :  ' + new Date());
console.log('\n=============\n');

var room = {
    id: 0,
    name: 'Lobby',
    pw: -1,
    countPlayers: 0,
    readyPlayers: 0,
    maxPlayers: 100000,
    userList: [],
    isPlay: false
};

var roomTest = {
    id: 0,
    name: 'Test',
    pw: -1,
    countPlayers: 0,
    readyPlayers: 0,
    maxPlayers: 2,
    userList: [],
    isPlay: false
};

roomList.push(room);

roomList.push(roomTest);

var user = {
    name: "",
    socketID: "",
    isPlayer: false,
    isHost: false,
    isReady: false,
    isBoss: false,
    isBossChild: false,
    keyCount: 0,
    characterKind: 0,
    objectKind: 0
};

io.on('connection', function (socket) {

    //유저 접속 카운트 갱신 ++
    UserConnect();

    //가입
    socket.on('register', function (data) {

        if (FindUserName(data.name)) {

            console.log('[Register]' + new Date() + '\n\t' + socket.id + ' | ' + data.name);




            socket.leave(socket.room);
            socket.join(roomList[0].id + roomList[0].name);
            socket.room = roomList[0].id + roomList[0].name;
            console.log(socket.room);

            //유저의 socket id를 갱신
            socket.emit('register', {
                name: data.name,
                socketID: socket.id
            });

            socket.broadcast.to(socket.room).emit('chat', {
                name: "[Join]",
                message: data.name + "님이 접속 하셨습니다.",
                where: 0
            });
        } else {
            socket.emit('errorcode', {
                code: 0
            });
        }
    });

    socket.on('lobbyEnter', function (data) {

        var user = {
            name: data.name,
            socketID: socket.id,
            isPlayer: false,
            isHost: false,
            isReady: false,
            isBoss: false,
            isBossChild: false,
            keyCount: 0,
            characterKind: 0,
            objectKind: 0
        };



        socket.emit('roomList', {
            roomList: roomList
        });



        roomList[0].userList.push(user);

        if (roomList[0].userList != null) {
            //현재 접속 유저에게 다른 유저들을 보냄
            socket.emit('lobbyEnter', {
                userList: roomList[0].userList
            });


            //추가된 유저를 보냄
            io.sockets.in(socket.room).emit('lobbyEnterUser', user);
        }
    });


    function FindUserName(name) {
        for (var i = 0; i < userList.length; i++) {
            if (userList[i].name == name)
                return false;

        }
        return true;

    }


    //방 리스트
    socket.on('roomList', function (data) {
        //방 배열을 전송
        socket.emit('roomList', {
            roomList: roomList
        });
    });

    //방 생성
    socket.on('roomCreate', function (data) {
        //방 모델 생성
        var makeRoom = {
            id: GenerateRandomID(1, 10000),
            name: data.roomName,
            pw: data.pw,
            countPlayers: 0,
            readyPlayers: 0,
            maxPlayers: data.maxPlayers,
            userList: [],
            isPlay: false
        };

        //배열에 추가
        roomList.push(makeRoom);

        console.log("name : " + socket.room);

        //로비에 방 정보 전송
        io.sockets.in('lobby').emit('lobbyCreate', {
            room: makeRoom
        });

        //socket.leave(socket.room);
        //room 입장
        //socket.join(makeRoom.id + makeRoom.name);
        //socket의 room 지정
        //socket.room = makeRoom.id + makeRoom.name;

        //클라이언트 완료 보내기
        socket.emit('roomEnter', {
            roomName: makeRoom.id + makeRoom.name,
            isHost: true
        });

        console.log('[RoomInfo-Make]' + new Date() + '\n\tNo. ' + makeRoom.id + ' | ' + makeRoom.name);
    });

    //방 입장
    socket.on('roomEnter', function (data) {
        //방을 검색
        var findRoom = FindRoom(data.roomName);

        console.log(data.roomName);

        //방이 없는 경우
        if (findRoom == null) {
            console.log("[roomEnter-Error] " + new Date() + '\n' + socket.id + '가 존재하지 않는 방을 요청');
            console.log("[RoomList]" + roomList);
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
                socket.emit('roomEnter', {
                    roomName: data.roomName
                });
            } else {
                //플레이 중인 경우
                console.log('[JoinFail]' + findRoom.name + ' is Playing!');
            }
        }
    });


    //클라이언트의 방 접속 완료
    socket.on('roomJoin', function (data) {
        //방을 검색
        var findRoom = FindRoom(socket.room);

        //방이 없는 경우
        if (findRoom == null) {
            console.log("[roomJoin-Error] " + new Date() + '\n' + socket.id + '가 존재하지 않는 방을 요청');
            console.log("[RoomList]" + roomList);
        } else {

            console.log("[roomJoin] join is work");

            //방이 있는 경우
            //유저 모델 생성
            var user = {
                name: data.name,
                socketID: socket.id,
                isPlayer: false,
                isHost: data.isHost,
                isReady: false,
                isBoss: false,
                isBossChild: false,
                isKeyHave: false,
                keyCount: 0,
                characterKind: data.characterKind,
                objectKind: 0
            }

            //유저 추가
            findRoom.userList.push(user);

            ++findRoom.countPlayers;

            console.log(user.isHost);


            if (findRoom.userList != null) {
                //현재 접속 유저에게 다른 유저들을 보냄
                socket.emit('userList', {
                    userList: findRoom.userList
                });

                //추가된 유저를 보냄
                io.sockets.in(socket.room).emit('roomJoin', user);

                //로비에 방 정보 전송
                io.sockets.in('lobby').emit('lobbyJoin', {
                    roomName: socket.room,
                    count: findRoom.countPlayers
                });

            }
        }
    });


    //클라이언트의 준비 완료
    socket.on('roomReady', function (data) {
        //방을 검색
        var findRoom = FindRoom(socket.room);

        //방이 없는 경우
        if (findRoom == null) {
            console.log("[roomReady-Error] " + new Date() + '\n' + socket.id + '가 존재하지 않는 방을 요청');
        } else {
            if (findRoom.userList != null) {
                //현재 접속 유저에게 다른 유저들을 보냄

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

                    io.sockets.in(socket.room).emit('roomReady', {
                        socketID: u.socketID,
                        isReady: data.isReady,
                        readyPlayers: findRoom.readyPlayers
                    });

                    if (findRoom.readyPlayers >= 2) {
                        //방의 모든 유저 게임 시작.
                        io.sockets.in(socket.room).emit('roomStart', {
                            a: 0
                        });
                    }
                }
            }
        }
    });

    //클라이언트의 준비 완료
    socket.on('roomStart', function (data) {

        var findRoom = FindRoom(socket.room);

        //방이 없는 경우
        if (findRoom == null) {
            console.log("[Error] " + new Date() + '\n' + socket.id + '가 존재하지 않는 방을 요청');

        } else {
            if (socket.room != "0Test")
                findRoom.isPlay = true;

            //방의 모든 유저 게임 시작.
            io.sockets.in(socket.room).emit('roomStart', {
                a: 0
            });

            //방 배열을 전송
            socket.broadcast.to('lobby').emit('lobbyStart', {
                roomName: socket.room,
                isPlay: true
            });
        }
    });


    //게임방 아웃
    socket.on('roomExit', function (data) {

        var findRoom = FindRoom(socket.room);

        var name = "";

        if (findRoom != null) {
            for (var i = 0; i < findRoom.userList.length; i++) {
                if (socket.id == findRoom.userList[i].socketID) {
                    name = findRoom.userList[i].name;
                    console.log("[RoomInfo-Out] " + new Date() + '\n\tNo. ' + findRoom.id + ' | ' + findRoom.name + ' >> ' + name);
                    findRoom.userList.splice(i, 1);
                    findRoom.countPlayers--;
                    break;
                }
            }

            if (findRoom.userList.length > 0) {

                io.sockets.in(socket.room).emit('chat', {
                    name: 'Notice',
                    message: name + '님이  나갔어요.'
                });

                io.sockets.in(socket.room).emit('roomExit', {
                    name: name
                });

                //로비에 방 정보 전송
                io.sockets.in('lobby').emit('lobbyJoin', {
                    roomName: socket.room,
                    count: findRoom.countPlayers
                });

            } else {
                if (socket.room != "0Test") {
                    for (var i = 0; i < roomList.length; i++) {
                        if (socket.room == roomList[i].id + roomList[i].name) {
                            console.log("[RoomInfo-Remove] " + new Date() + '\n\tNo. ' + roomList[i].id + ' | ' + roomList[i].name);
                            roomList.splice(i, 1);
                            //로비에 방 정보 전송
                            io.sockets.in('lobby').emit('lobbyDelet', {
                                roomName: socket.room
                            });
                            break;
                        }
                    }
                } else {
                    console.log("[TEST] 테스트 방에서 " + name + "이 나갔습니다.");
                }
            }

            socket.leave(socket.room);
            socket.join('lobby');
            socket.room = 'lobby';

            socket.emit('roomOut', {
                a: 1
            });
        }
    });

    //맵 정보
    socket.on('map', function (data) {
        socket.broadcast.to(socket.room).emit('map', data);
    });

    //스폰 정보
    socket.on('spawnPos', function (data) {
        socket.broadcast.to(socket.room).emit('spawnPos', data);
    });

    //트랩
    socket.on('trap', function (data) {
        socket.broadcast.to(socket.room).emit('trap', data);
    });

    //맵생성기
    socket.on('generator', function (data) {
        socket.broadcast.to(socket.room).emit('generator', data);
    });

    //맵생성 완료 알림
    socket.on('initEnd', function (data) {
        socket.broadcast.to(socket.room).emit('initEnd', data);
    });

    //고양이 모델 정보
    socket.on('modelType', function (data) {
        socket.broadcast.to(socket.room).emit('modelType', data);
    });

    //이동
    socket.on('move', function (data) {
        socket.broadcast.to(socket.room).emit('move', data);
    });

    //회전
    socket.on('rotate', function (data) {
        socket.broadcast.to(socket.room).emit('rotate', data);
    });

    //상태
    socket.on('state', function (data) {
        socket.broadcast.to(socket.room).emit('state', data);
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
    socket.on('portalCreate', function (data) {
        io.sockets.in(socket.room).emit('portalCreate', data);
    });

    //포탈 열림
    socket.on('portalOpen', function (data) {
        console.log("portal is open");
        io.sockets.in(socket.room).emit('portalOpen', data);
    });

    //포탈 닫힘
    socket.on('portalClose', function (data) {
        io.sockets.in(socket.room).emit('portalClose', data);
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
                    findRoom.countPlayers--;
                    break;
                }
            }

            if (findRoom.userList.length > 0) {

                io.sockets.in(socket.room).emit('chat', {
                    name: 'Notice',
                    message: name + '님이  나갔어요.'
                });

                io.sockets.in(socket.room).emit('roomExit', {
                    name: name
                });

                //로비에 방 정보 전송
                io.sockets.in('lobby').emit('lobbyJoin', {
                    roomName: socket.room,
                    count: findRoom.countPlayers
                });

            } else {
                if (findRoom.id != 0) {
                    for (var i = 0; i < roomList.length; i++) {
                        if (socket.room == roomList[i].id + roomList[i].name) {
                            console.log("[RoomInfo-Remove] " + new Date() + '\n\tNo. ' + roomList[i].id + ' | ' + roomList[i].name);
                            roomList.splice(i, 1);
                            //로비에 방 정보 전송
                            io.sockets.in('lobby').emit('lobbyDelet', {
                                roomName: socket.room
                            });
                            break;
                        }
                    }
                } else {
                    console.log("[TEST] 테스트 방에서 " + name + "이 나갔습니다.");
                }
            }

            socket.leave(socket.room);
            socket.join('lobby');
            socket.room = 'lobby';

            socket.emit('roomOut', {
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