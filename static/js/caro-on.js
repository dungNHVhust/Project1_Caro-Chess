let socket = io.connect('http://' + document.domain + ':' + location.port);
const savedSocketId = localStorage.getItem('socket_id');
const room_ID = document.getElementById('roomInfo').textContent.split(':')[1].trim();
let check = [];
let currentTurn = 1;
// Load page
window.addEventListener('DOMContentLoaded', () => {
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
  let playerInfoElement = document.getElementById('player-info');
  
  playerCount.textContent = `Total Players: ${data.total_player}`;
  if(data.total_player == 1) {
    player1.textContent = `Player: ${data.player} - Symbol: X`;
  } else {
    player1.textContent = `Player: ${data.player == currentPlayer ? currentPlayer : data.enemy} - Symbol: ${data.player == currentPlayer ? 'O' : 'X'}`;
    player2.textContent = `Enemy: ${data.player == currentPlayer ? data.enemy : data.player} - Symbol: ${data.player == currentPlayer ? 'X' : 'O'}`;
    if(data.player == currentPlayer) { 
      check.push('O'); 
    } else {
      check.push('X');
    }
    playerInfoElement.textContent = 'Bạn là: ' + check[0];
  }
  // if(data.total_player == 2) {
  //   resetGame();
  // }
  
});

//Leave Room 
function leaveRoom(){
  // const room_ID = document.getElementById('roomInfo').textContent.split(':')[1].trim();
  const playerName = document.getElementById('player-1').textContent.split(':')[1].trim();
  socket.emit('leave_room', { 'room_id': room_ID, 'username': playerName });
  window.location.href = `/`;
}
socket.on('user_left',(data) => {
  if (data.error) {
    console.error('Error:', data.error);
    return;
  }
  alert("Đối thủ đã rời khỏi phòng!!!!")
  window.location.href = `/`;
})

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


// Handle mỗi Click và xử lý logic sau mỗi lần chọn vị trí
function handleClick(e) {
  if (currentTurn % 2 == ((check[0] == 'X') ? 1 : 0)) {
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
          socket.emit('playerMove', { room_id: room_ID, index: board.indexOf(e.target), player: e.target.textContent, currentTurn: currentTurn });
          stopCountdownme(); // Dừng đếm khi người chơi hiện tại di chuyển
          startCountdownenemy();
      } else {
          alert('Ô này đã được đánh rồi');
      }
  } else {
      alert('Chưa đến lượt của bạn!');
  }
}

// Socket listener để xác định lượt đánh của đối thủ
socket.on('opponentMove', function(data) {
  let index = data.index;
  let opponentSymbol = (check[0] === 'X') ? 'O' : 'X';

  // Kiểm tra xem ô đã được đánh chưa
  if (board[index].textContent === '') {
      board[index].textContent = opponentSymbol;
      board[index].classList.add(opponentSymbol.toLowerCase());
      board[index].classList.add('highlight');

      // Kiểm tra điều kiện thắng và xử lý
      if (checkWin(index, opponentSymbol)) {
          setTimeout(function() {
              alert(opponentSymbol + ' wins!');
              resetGame();
          }, 100); // Thêm trễ 100ms
      }
      // Chuyển lượt cho người chơi hiện tại
      currentTurn++;
      setTimeout(startCountdownme, 0);
      setTimeout(stopCountdownenemy, 0);
  }
});

// Hàm kiểm tra trả về kết quả (Thắng - Hòa)
function checkWin(index, player) {
  let row = Math.floor(index / 20);
  let col = index % 20;
  let directions = [
      [-1, -1],
      [-1, 0],
      [-1, 1],
      [0, 1]
  ];
  for (let [dx, dy] of directions) {
      let count = 1;
      for (let i = 1; i < 5; i++) {
          let x = row + dx * i;
          let y = col + dy * i;
          if (x < 0 || x >= 20 || y < 0 || y >= 20 || board[x * 20 + y].textContent !== player) {
              break;
          }
          count++;
      }
      for (let i = 1; i < 5; i++) {
          let x = row - dx * i;
          let y = col - dy * i;
          if (x < 0 || x >= 20 || y < 0 || y >= 20 || board[x * 20 + y].textContent !== player) {
              break;
          }
          count++;
      }
      if (count >= 5) {
          return true;
      }
  }
  return false;
}

function resetGame() {
  // Xóa tất cả các nước đi trên bảng
  for (let i = 0; i < board.length; i++) {
      board[i].textContent = '';
      board[i].addEventListener('click', handleClick); // Thêm lại sự kiện click vào ô
      board[i].classList.remove('x', 'o', 'highlight'); // Xóa các sự kiện highlight và tô màu 
  }
  // Đặt lại người chơi hiện tại
  currentPlayer = 'X';
  currentTurn = 1;
  startCountdownenemy();
  startCountdownme();
  stopCountdownme();
  stopCountdownenemy();
}

var countdownne;
var remainingTimeme;
var countdownenemy;
var remainingTimeenemy;

function startCountdownme() {
    clearInterval(countdownme);
    remainingTimeme = 30;
    countdownme = setInterval(function() {
        const minutes = Math.floor(remainingTimeme / 60);
        const seconds = remainingTimeme % 60;
        const formattedTime = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
        document.getElementById('countdownme').textContent = 'Thời gian còn lại của bạn: ' + formattedTime;
        remainingTimeme--;
        if (remainingTimeme <= -2) {
            clearInterval(countdownme);
            alert('Hết giờ! Bạn đã thua. Bấm để chơi ván khác!');
            resetGame();
        }
    }, 1000);
}

function startCountdownenemy() {
    clearInterval(countdownenemy);
    remainingTimeenemy = 30;
    countdownenemy = setInterval(function() {
        const minutes = Math.floor(remainingTimeenemy / 60);
        const seconds = remainingTimeenemy % 60;
        const formattedTime = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
        document.getElementById('countdownenemy').textContent = 'Thời gian còn lại của đối thủ: ' + formattedTime;
        remainingTimeenemy--;
        if (remainingTimeenemy <= -2) {
            clearInterval(countdownenemy);
            alert('Đối thủ đã thua. Bấm để chơi ván khác!');
            resetGame();
        }
    }, 1000);
}

// Dừng đếm khi người chơi di chuyển
function stopCountdownme() {
    clearInterval(countdownme);
    document.getElementById('countdownme').textContent = 'Thời gian còn lại của bạn: 0:30';
}

function stopCountdownenemy() {
    clearInterval(countdownenemy);
    document.getElementById('countdownenemy').textContent = 'Thời gian còn lại của đối thủ: 0:30';
}
