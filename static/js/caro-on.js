let socket = io.connect('http://' + document.domain + ':' + location.port);
const savedSocketId = localStorage.getItem('socket_id');

// Load page
window.addEventListener('DOMContentLoaded', () => {
  const room_ID = document.getElementById('roomInfo').textContent.split(':')[1].trim();
  
  const playerName = document.getElementById('player-1').textContent.split(':')[1].trim();
  socket.emit('joinRoom', { 'room_id': room_ID, 'username': playerName });
});


socket.on('room_joined', (data) => {
  // Kiểm tra nếu có lỗi trong dữ liệu trả về
  if (data.error) {
    console.error('Error:', data.error);
    return;
  }
  // Nếu có thông tin về phòng, cập nhật giao diện
  const currentPlayer = document.querySelector("#player").textContent.trim();
  const playerCount = document.getElementById('player-count');
  const player1 = document.getElementById('player-1');
  const player2 = document.getElementById('player-2');
  
  playerCount.textContent = `Total Players: ${data.total_player}`;
  if(data.total_player == 1) {
    player1.textContent = `Player: ${data.player} - Symbol: X`;
  } else {
    player1.textContent = `Player: ${data.player == currentPlayer ? currentPlayer : data.enemy} - Symbol: ${data.player == currentPlayer ? 'O' : 'X'}`;
    player2.textContent = `Enemy: ${data.player == currentPlayer ? data.enemy : data.player} - Symbol: ${data.player == currentPlayer ? 'X' : 'O'}`;
  }
  

});

  // Khai báo bảng và người chơi đầu được sử dụng "X"
let boardElement1 = document.getElementById('board');
let statusElement1 = document.getElementById('status');
let board = [];
let currentPlayer;

// Tạo biến để theo dõi số lượng người chơi trong phòng
let playerCount = 0;

// Tạo bảng 20x20 
for (let i = 0; i < 20; i++) {
    for (let j = 0; j < 20; j++) {
        let cell = document.createElement('div');
        cell.classList.add('cell');
        cell.addEventListener('click', handleClick, { once: true });
        boardElement1.appendChild(cell);
        board.push(cell);
    }
}

let roomID;
let check = [];

// Handle mỗi Click và xử lý logic sau mỗi lần chọn vị trí
function handleClick(e) {
  if (currentTurn % 2 === ((check[0] === players[0].symbol) ? 1 : 0)) {
      // Kiểm tra xem ô đã được đánh chưa và xem có phải lượt của người chơi này không
      if (e.target.textContent === '') {
          e.target.textContent = check[0];
          // Thêm CSS vào symbol
          e.target.classList.add(check[0].toLowerCase());
          e.target.classList.add('highlight');
          if (checkWin(board.indexOf(e.target), check[0])) {
              setTimeout(function() {
                  alert(check[0] + ' wins!');
                  resetGame();
              }, 100); // Thêm trễ 100ms
          } else {
              currentTurn++;
          }
          socket.emit('playerMove', { room_id: roomID, index: board.indexOf(e.target), player: e.target.textContent, currentTurn: currentTurn });
          stopCountdownme(); // Dừng đếm khi người chơi hiện tại di chuyển
          startCountdownenemy();
      } else {
          alert('Ô này đã được đánh rồi');
      }
  } else {
      alert('Chưa đến lượt của bạn!');
  }
}


