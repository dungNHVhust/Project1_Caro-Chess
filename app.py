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
    return render_template('index.html')

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
    if not players:
        cursor.execute('DELETE FROM Rooms WHERE room_id = ?', (room_id,))
    else:
        cursor.execute('UPDATE Rooms SET players = ? WHERE room_id = ?', (str(players), room_id))
    conn.commit()

    leave_room(room_id)
    emit('user_left', {'room_id': room_id, 'player': player}, room=room_id)
    
    response = make_response(jsonify({'success': True, 'message': 'Đã rời phòng!'}))
    response.delete_cookie('jwt_token')
    return response
        
        
if __name__ == '__main__' :
    socketio.run(app,debug=True,port=1750)