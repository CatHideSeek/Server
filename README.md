# Server
게임 서버입니다.

#에러 코드
>> errorCode / int 번호

#서버 연결 성공(only 서버)
>> connection / x
: 현재 접속중인 유저 카운트를 갱신합니다.

#로그인
>> login / id, pw
: 아이디와 패스워드를 통해 계정 존재 여부 및 로그인을 시작합니다.
errorCode / 1 : 계정이 존재하지 않습니다. , 2 : 잘못된 비밀번호 입니다.
성공 시 :  userData / 유저 DB JSON 전송

#회원가입
>> register / id, pw, email, name
: 중복 아이디, 이메일 체크, 닉네임 체크 후 회원가입을 시작합니다.
errorCode / 1 : 중복된 아이디 입니다.. , 2 : 중복된 이메일 입니다. , 3 : 중복된 닉네임 입니다.
성공 시 :  userData / 유저 DB JSON 전송

#방 리스트
>> roomList / 더미 json
:로비 입장 후 방 리스트를 전송합니다.
성공 시 : roomList / 방 리스트

#방 생성
>> create / roomName, maxPlayer
: 방을 생성합니다.
성공 시 : (로비 유저에게) roomCre / 방 정보
	 : (요청자에게)  enter / 방번호+방이름 

#방 참가 신청
>> enter / roomName
: 방 입장을 시도 합니다.
errorCode / 1 : 존재하지 않는 방 입니다. , 2 : 이미 시작된 방입니다.
성공 시 : (요청자에게)  enter / 방번호+방이름

#방 접속 완료
>> join / userClass Info
errorCode / 1 : 존재하지 않는 방 입니다.
성공 시 :  (자신을 제외한 방 내 유저에게) join / userClass Info
	 : (요청자에게) userList / 방내 유저 리스트
	 : (로비 유저에게) roomJoin / roomName ,방 접속 수

#게임 준비
>> ready / name
: 게임 준비를 세팅합니다.
성공 시 : (방 내 모든 유저에게) ready / name

#게임 시작
>> start / roomName
: 게임을 시작합니다.
errorCode / 1 : 2명이상의 유저가 필요합니다. , 2 : 준비되지 않은 플레이어가 있습니다.
성공 시 : (방 내 모든 유저에게) start / roomName
	 : (로비 유저에게) roomStart / roomName , true

#게임 나가기
>> exit / roomName
: 게임을 나갑니다.
errorCode / 1 : 존재하지 않는 방 입니다.
성공 시 : (방 내  자신을 제외한 모든 유저에게) exit / name
	case 방 접속수 가 0인경우
	 : (로비 유저에게) roomDel / roomName
	else
	 : (로비 유저에게) roomJoin / roomName ,방 접속 수

#서버 연결 해제
: 게임과 연결을 종료합니다.

-게임 방인 경우
성공 시 : (방 내  자신을 제외한 모든 유저에게) exit / name
	case 방 접속수 가 0인경우
	 : (로비 유저에게) roomDel / roomName
else
	 : (로비 유저에게) roomJoin / roomName ,방 접속 수

#캐릭터 이동
>> move  / name, x, y, z
: 캐릭터 이동을 전송합니다.
성공 시 : move  / name, x, y, z

#캐릭터 회전
>> rotate/ name, x, y, z, w
: 캐릭터 이동을 전송합니다.
성공 시 : rotate/ name, x, y, z, w

#캐릭터 행동 상태 
>> state / 이름, 상태 번호
: 캐릭터의 현재 상태를 업데이트 합니다.
case -4 : 변신 해제
case -3 : 은신 해제
case -2 : 슬로우 해제
case -1 : 스턴 해제
case 0 : 보통(Default)
case 1 : 스턴
case 2 : 슬로우
case 3 : 은신
case 4 : 변신
 
성공 시 : state / 이름, 상태 번호

#열쇠 조각 획득
>> getKeyPart / name , 얻은 키 조각 번호 
: 얻은 키 조각을 공지 합니다.
성공 시 : getKeyPart / name , 얻은 키 조각 번호 

#열쇠 완성
>> getKey / name
: 완성 된 키를 공지합니다.
성공 시 : getKey / name

#술래 지정
>> rootTag / name
: 숙주 술래를 공지합니다.
성공 시 :  rootTag / name

#술래 감염
>> childTag / name
: 감염된 술래를 공지합니다.
성공 시 :  childTag / name

#포탈 오픈 
>> open / name
: 포탈 오픈을 공지합니다.
성공 시 : open / name

#포탈 해제
>> close / name
: 포탈 해제를 공지합니다.
성공 시 : close / name

#채팅
>> chat / name , message , where
: 채팅을 전송합니다.
where 의 구역 
1 :  로비
2 :  게임 방

성공 시 : >> chat / name , message , where
