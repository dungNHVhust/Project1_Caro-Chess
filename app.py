from flask import Flask,render_template
from flask_socketio import SocketIO,emit

app = Flask(__name__)
socketio =  SocketIO(app,async_mode = 'gevent')

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/caro-off')
def off():
    return render_template('caro-off.html')
@app.route('/caro-comp')
def comp():
    return render_template('caro-comp.html')

@socketio.on('move')
def handle_move(data):
    emit('move',data,broadcast=True)
    


if __name__ == '__main__' :
    socketio.run(app,debug=True,port=1750)