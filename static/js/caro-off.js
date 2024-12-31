// Kết nối socket thông qua LAN (BUILD TRÊN LOCAL)
let socket = io.connect('http://' + document.domain + ':' + location.port);

// Khai báo bảng và người chơi đầu được sử dụng "X"
let boardElement = document.getElementById('board');
let statusElement = document.getElementById('status');
let board = [];
let currentPlayer = 'X';

// Tạo bảng 15x15 
for (let i = 0; i < 15; i++) {
    for (let j = 0; j < 15; j++) {
        let cell = document.createElement('div');
        cell.classList.add('cell');
        cell.addEventListener('click', handleClick, { once: true });
        boardElement.appendChild(cell);
        board.push(cell);
    }
}

// Handle mỗi Click và xử lý logic sau mỗi lần chọn vị trí
function handleClick(e) {
    e.target.textContent = currentPlayer;
    e.target.classList.add(currentPlayer.toLowerCase());
    // Highlight cell sau khi đánh
    e.target.classList.add('highlight');
    let index = board.indexOf(e.target);
    setTimeout(() => {
        if (checkWin(index, currentPlayer)) {
            showNotification(`${currentPlayer} wins!`,"success");
            // alert(currentPlayer + ' wins!');
            resetGame();
        } else {
            currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
        }
    }, 50);
}

// Hàm kiểm tra trả về kết quả (Thắng - Hòa)
function checkWin(index, player) {
    let row = Math.floor(index / 15);
    let col = index % 15;
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
            if (x < 0 || x >= 15 || y < 0 || y >= 15 || board[x * 15 + y].textContent !== player) {
                break;
            }
            count++;
        }
        for (let i = 1; i < 5; i++) {
            let x = row - dx * i;
            let y = col - dy * i;
            if (x < 0 || x >= 15 || y < 0 || y >= 15 || board[x * 15 + y].textContent !== player) {
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
}

