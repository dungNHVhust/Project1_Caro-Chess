from flask import Flask,render_template, request, jsonify,g,make_response
from flask_socketio import SocketIO,emit,join_room, leave_room
import hashlib
import sqlite3
import jwt
from datetime import datetime, timedelta
import json

app = Flask(__name__)
SECRET_KEY = "your_secret_key"
socketio =  SocketIO(app,async_mode = 'gevent')

def get_db():
    db = getattr(g, '_database', None)
    if db is None:
        db = g._database = sqlite3.connect('rooms.db')
        db.row_factory = sqlite3.Row  # Kết quả trả về dạng từ điển
    return db

@app.teardown_appcontext
def close_connection(exception):
    db = getattr(g, '_database', None)
    if db is not None:
        db.close()


@app.route('/')
def index():
    token = request.cookies.get('Token')
    if not token:
        return render_template('index.html')
    else :
        response = make_response(render_template('index.html'))
        response.set_cookie('Token', '', expires=0)
        return response

@app.route('/caro-off')
def off():
    return render_template('caro-off.html')
@app.route('/caro-comp')
def comp():
    return render_template('caro-comp.html')
@app.route('/caro-on')
def on():
    token = request.cookies.get('Token')
    if not token:
        return render_template('index.html', error="Bạn chưa đăng nhập hoặc cookie đã hết hạn!")

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
        room_id = payload['room_id']
        username = payload['username']
    except jwt.ExpiredSignatureError:
        return render_template('index.html', error="Token đã hết hạn!")
    except jwt.InvalidTokenError:
        return render_template('index.html', error="Token không hợp lệ!")
    return render_template('caro-on.html', room_id=room_id, player=username)


@socketio.on('move')
def handle_move(data):
    emit('move',data,broadcast=True)
    
#Room 
@app.route('/create-room', methods=['POST'])
def create_room():
    
    data = json.loads(request.data)
    room_id = data.get('room_id')
    username = data.get('username')
    password = data.get('password')
    password_hash = hashlib.sha256(password.encode()).hexdigest()

    if not room_id or not username or not password:
        return jsonify({'success': False, 'message': 'Thiếu thông tin!'})

    conn = get_db()
    cursor = conn.cursor()

    cursor.execute('SELECT * FROM Rooms WHERE room_id = ?', (room_id,))
    if cursor.fetchone():
        return jsonify({'success': False, 'message': 'Phòng đã tồn tại!'})

    cursor.execute('INSERT INTO Rooms (room_id, password) VALUES (?, ?)', (room_id, password_hash))
    conn.commit()

    payload = {
        'room_id': room_id,
        'username': username,
        'exp': datetime.utcnow() + timedelta(hours=1)  # Token hết hạn sau 1 giờ
    }
    token = jwt.encode(payload, SECRET_KEY, algorithm='HS256')

    response = make_response(jsonify({'success': True, 'message': 'Tạo phòng thành công!'}))
    response.set_cookie('Token', token, httponly=True, secure=False)  # Disable secure=True for testing locally

    return response
#Join Room
@app.route('/join-room', methods=['POST'])
def join_Room():
    
    data = json.loads(request.data)
    room_id = data.get('room_id')
    username = data.get('username')
    password = data.get('password')
    password_hash = hashlib.sha256(password.encode()).hexdigest()

    if not room_id or not username or not password:
        return jsonify({'success': False, 'message': 'Thiếu thông tin!'})

    db = get_db()
    cursor = db.cursor()

    cursor.execute("SELECT password, players FROM Rooms WHERE room_id = ?", (room_id,))
    room_data = cursor.fetchone()

    if not room_data:
        return jsonify({'success': False, 'message': 'Phòng không tồn tại!'})

    stored_password, players_json = room_data
    players = json.loads(players_json)

    if stored_password != password_hash:
        return jsonify({'success': False, 'message': 'Mật khẩu không chính xác!'})

    if len(players) >= 2:
        return jsonify({'success': False, 'message': 'Phòng đã đầy!'})

    db.commit()

    payload = {
        'room_id': room_id,
        'username': username,
        'exp': datetime.utcnow() + timedelta(hours=1)
    }
    token = jwt.encode(payload, SECRET_KEY, algorithm='HS256')

    response = make_response(jsonify({'success': True, 'message': 'Tham gia phòng thành công!'}))
    response.set_cookie('Token', token, httponly=True, secure=False)

    return response




@socketio.on('joinRoom')
def handle_join_room(data):
    room_id = data['room_id']
    username = data['username']

    conn = get_db()
    cursor = conn.cursor()

    cursor.execute('SELECT * FROM Rooms WHERE room_id = ?', (room_id,))
    room = cursor.fetchone()
    if not room:
        emit('error', {'message': 'Phòng không tồn tại!'})
        return

    players = json.loads(room['players'])  # Use json.loads instead of eval for safety
    if len(players) > 2:
        emit('room_full', {'message': 'Phòng đã đầy!'})
        return

    symbol = 'X' if len(players) == 0 else 'O'
    player = {'id': request.sid, 'symbol': symbol, 'username': username}
    print(f"Join room : {request.sid}")
    players.append(player)

    cursor.execute('UPDATE Rooms SET players = ? WHERE room_id = ?', (json.dumps(players), room_id))
    conn.commit()
    if room_id:
        join_room(room_id)
    
    enemy = None
    if len(players) == 2 and username == players[1]['username']:
        enemy = players[0]['username']
        
    emit('room_joined', {
        'room_id': room_id,
        'player':username,
        'players': players,
        'total_player': len(players),
        'enemy': enemy,
        'message': 'Bạn đã tham gia phòng thành công!'
    }, room=room_id)
    

@socketio.on('leave_room')
def handle_leave_room(data):
    room_id = data['room_id']

    conn = get_db()
    cursor = conn.cursor()

    # Kiểm tra phòng tồn tại
    cursor.execute('SELECT * FROM Rooms WHERE room_id = ?', (room_id,))
    room = cursor.fetchone()
    if not room:
        return 'Room does not exist', 400

    players = eval(room['players'])
    player = next((p for p in players if p['id'] == request.sid), None)
    if player is None:
        return 'Player not in room', 400

    players.remove(player)
    
    cursor.execute('DELETE FROM Rooms WHERE room_id = ?', (room_id,))
    conn.commit()

    leave_room(room_id)
    emit('user_left', {'room_id': room_id, 'player': player}, room=room_id)
    
    response = make_response(jsonify({'success': True, 'message': 'Đã rời phòng!'}))
    response.delete_cookie('Token')
    return response

# Xử lý sự kiện Disconnect
@socketio.on('disconnect')
def handle_disconnect():
    user_id = request.sid  # Lấy ID của người chơi mất kết nối

    # Tìm phòng mà người chơi đang tham gia
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT room_id, players FROM Rooms")
    rooms = cursor.fetchall()
    disconnected_player = None
    room_id = None

    # Duyệt qua tất cả các phòng để tìm người chơi mất kết nối
    for room in rooms:
        current_room_id = room[0]
        players_json = room['players']
        players_json = players_json.replace("'", '"')
        players=json.loads(players_json)

        for player in players:
            if request.sid == player.get('id'):
                disconnected_player = player
                room_id = current_room_id
                players.remove(player)
                break
            
        if disconnected_player:
            # Cập nhật danh sách players mới vào database
            updated_players_json = json.dumps(players)
            cursor.execute("UPDATE Rooms SET players = ? WHERE room_id = ?", (updated_players_json, room_id))
            conn.commit()
            print(f"User {user_id} was in room {room_id} and has been removed")
            emit('user_left', {'room_id': room_id, 'player': player}, room=room_id)
            
    cursor.close()
    conn.close()
    

# Cập nhật các bước đánh của người chơi
@socketio.on('playerMove')
def on_move(data):
    room_id = data['room_id']

    conn = get_db()
    cursor = conn.cursor()

    # Lấy thông tin phòng từ cơ sở dữ liệu
    cursor.execute('SELECT * FROM Rooms WHERE room_id = ?', (room_id,))
    room = cursor.fetchone()

    if not room:
        emit('invalidMove', {'message': 'Room does not exist'}, room=request.sid)
        return

    # Lấy danh sách người chơi trong phòng
    players = json.loads(room['players'])  # Parse JSON từ trường players

    # Tìm người chơi hiện tại dựa trên request.sid
    player = next((p for p in players if p['id'] == request.sid), None)
    if not player:
        emit('invalidMove', {'message': 'You are not in this room'}, room=request.sid)
        return

    # Gửi bước đánh của người chơi hiện tại đến tất cả người chơi trong phòng
    emit('playerMove', data, room=room_id, include_self=True)

    # Xác định đối thủ của người chơi hiện tại
    opponent = next((p for p in players if p['id'] != request.sid), None)

    if opponent and player['symbol'] != opponent['symbol']:
        # Gửi bước đánh của đối thủ đến toàn bộ phòng, tránh gửi lại cho chính người chơi hiện tại
        emit('opponentMove', data, room=room_id, skip_sid=request.sid)
    else:
        # Handle nếu không phải lượt của người chơi hoặc không xác định được đối thủ
        emit('invalidMove', {'message': 'It is not your turn or opponent not found'}, room=request.sid)

    # Đóng kết nối cơ sở dữ liệu
    conn.close()     
        
if __name__ == '__main__' :
    socketio.run(app,debug=True,port=1750)