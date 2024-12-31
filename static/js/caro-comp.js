let socket = io.connect('http://' + document.domain + ':' + location.port);

let boardElement = document.getElementById('board');
let statusElement = document.getElementById('status');
let board = [];
let currentPlayer='X';
let deph_easy = 1;
let deph_medium = 2;
let deph_hard = 3;
let deph_hell = 4;


document.addEventListener("DOMContentLoaded", function () {
    const popup = document.getElementById("popup_SetDifficulty");
    const closePopup = document.getElementById("closePopup_SetDifficulty");
    const difficultyElement = document.getElementById("difficulty");
    const difficultyButtons = document.querySelectorAll(".btn-difficulty");

    // Mở popup (bạn có thể thêm sự kiện để hiển thị popup)
    function openPopup() {
        popup.style.display = "flex"; // Hiển thị popup
    }

    // Đóng popup
    function closePopupHandler() {
        popup.style.display = "none"; // Ẩn popup
    }

    // Xử lý khi chọn độ khó
    function selectDifficulty(event) {
        const difficulty = event.target.id; 
        difficultyElement.innerText = difficulty; 
        closePopupHandler(); // Đóng popup
    }

    // Gắn sự kiện cho nút đóng popup
    closePopup.addEventListener("click", closePopupHandler);

    // Gắn sự kiện cho các nút chọn độ khó
    difficultyButtons.forEach((button) => {
        button.addEventListener("click", selectDifficulty);
    });

    // Mở popup khi load (hoặc thêm sự kiện để mở popup)
    openPopup();
});

//Tạo bảng 15x15
for(let i=0;i<15;i++){
    for(let j=0;j<15;j++){
        let cell = document.createElement('div');
        cell.classList.add('cell');
        cell.addEventListener('click',handleClick, {once:true});
        boardElement.appendChild(cell);
        board.push(cell);
    }
}

function handleClick(e){
    e.target.textContent = currentPlayer;
    e.target.classList.add(currentPlayer.toLowerCase());
    //Highlight cell
    e.target.classList.add('highlight');
    let index = board.indexOf(e.target);
    setTimeout(()=>{
        if(checkWin(index,currentPlayer)) {
            showNotification('You Wins!',"success");
            alert('You Wins!');
            resetGame();
        }
    },150);
    currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
    const computerMove = getComputerMove();
        // Kiểm tra xem ô đã được đánh chưa
        if (board[computerMove[0] * 15 + computerMove[1]].textContent === '') {
            board[computerMove[0] * 15 + computerMove[1]].textContent = currentPlayer;
            board[computerMove[0] * 15 + computerMove[1]].classList.add(currentPlayer.toLowerCase());
            board[computerMove[0] * 15 + computerMove[1]].classList.add('highlight'); // Highlight the cell
            if (checkWin(computerMove[0] * 15 + computerMove[1], currentPlayer)) {
                setTimeout(function() {
                    // showNotification('Computer wins!',"success");
                    alert('Computer Win!!!');
                    resetGame();
                }, 150); 
            }
            currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
        }
}
// Hàm kiểm tra vị trí hợp lệ
function isValidPosition(x, y) {
    return x >= 0 && x < 15 && y >= 0 && y < 15 ;
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
            if (!isValidPosition(x, y) || board[x * 15 + y].textContent !== player) {
                break;
            }
            count++;
        }
        for (let i = 1; i < 5; i++) {
            let x = row - dx * i;
            let y = col - dy * i;
            if (!isValidPosition(x, y) || board[x * 15 + y].textContent !== player) {
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

// Hàm kiểm tra điều kiện thắng tổng quát (tính toán dựa trên trạng thái bảng)
function checkWinCondition(player) {
    for (let i = 0; i < 15; i++) {
        for (let j = 0; j < 15; j++) {
            let index = i * 15 + j;
            if (board[index].textContent === player && checkWin(index, player)) {
                return true;
            }
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
    console.log('Game reset');
}

//Thuật toán minimax với cắt tia alpha-beta
function minimax(depth, isMaximizing, alpha, beta) {
    if (depth === 0) {
        return evaluateBoard('O') - evaluateBoard('X');  // Điểm dựa trên sự đánh giá mức độ nguy hiểm
    }

    // Kiểm tra thắng thua
    if (checkWinCondition('O')) {
        return 10;
    }
    if (checkWinCondition('X')) {
        return -10;
    }

    if (isMaximizing) {
        let bestScore = -Infinity;
        for (let i = 0; i < 15; i++) {
            for (let j = 0; j < 15; j++) {
                if (board[i * 15 + j].textContent === "") {
                    board[i * 15 + j].textContent = 'O';
                    let score = minimax(depth - 1, false, alpha, beta);
                    board[i * 15 + j].textContent = "";
                    bestScore = Math.max(score, bestScore);
                    alpha = Math.max(alpha, score);
                    if (beta <= alpha) {
                        break; // Cắt tia
                    }
                }
            }
        }
        return bestScore;
    } else {
        let bestScore = Infinity;
        for (let i = 0; i < 15; i++) {
            for (let j = 0; j < 15; j++) {
                if (board[i * 15 + j].textContent === "") {
                    board[i * 15 + j].textContent = 'X';
                    let score = minimax(depth - 1, true, alpha, beta);
                    board[i * 15 + j].textContent = "";
                    bestScore = Math.min(score, bestScore);
                    beta = Math.min(beta, score);
                    if (beta <= alpha) {
                        break; // Cắt tia
                    }
                }
            }
        }
        return bestScore;
    }
}


//Đánh  giá mức độ nguy hiểm 
function evaluateBoard(player) {
    let score = 0;
    let opponent = (player === 'X') ? 'O' : 'X';
    
    // Đánh giá hàng, cột và chéo theo từng hướng.
    let directions = [
        [-1, -1], [-1, 0], [-1, 1], [0, 1]
    ];
    
    for (let i = 0; i < 15; i++) {
        for (let j = 0; j < 15; j++) {
            if (board[i * 15 + j].textContent === player) {
                for (let [dx, dy] of directions) {
                    let countPlayer = 1;
                    let countOpponent = 0;
                    let x = i, y = j;
                    
                    // Tính điểm cho người chơi.
                    for (let k = 1; k < 5; k++) {
                        x += dx;
                        y += dy;
                        if (isValidPosition(x, y)) {
                            if (board[x * 15 + y].textContent === player) {
                                countPlayer++;
                            } else if (board[x * 15 + y].textContent === opponent) {
                                countOpponent++;
                                break;
                            }
                        }
                    }
                    // Nếu có chuỗi dài 4 của người chơi thì điểm cao.
                    if (countPlayer === 4) {
                        score += 1000; 
                    } 
                    // Nếu đối thủ có chuỗi dài 4 thì cần phải ngừng lại.
                    if (countOpponent === 3) {
                        score -= 1000; 
                    }
                }
            }
        }
    }
    return score;
}

//Tìm nước đi tốt nhất dựa trên minimax
function getComputerMove() {
    const difficulty = document.getElementById("difficulty").innerText; 
    if(difficulty === 'hell'){
        const bestPoints = getBestPoints();
        const randomIndex = Math.floor(Math.random() * bestPoints.length);
        return bestPoints[randomIndex];
    } else {
        let bestScore = -Infinity;
    let move = null;
    let depth = difficulty === 'easy' ? deph_easy : difficulty === 'medium' ? deph_medium : deph_hard ;

    for (let i = 0; i < 15; i++) {
        for (let j = 0; j < 15; j++) {
            if (board[i * 15 + j].textContent === "") {
                // Kiểm tra các ô lân cận
                let isNearby = false;
                for (let dx = -1; dx <= 1; dx++) {
                    for (let dy = -1; dy <= 1; dy++) {
                        let x = i + dx;
                        let y = j + dy;
                        if (isValidPosition(x, y) && board[x * 15 + y].textContent !== "") {
                            isNearby = true;
                            break;
                        }
                    }
                }

                if (!isNearby) continue;

                // Áp dụng Minimax để tính điểm
                board[i * 15 + j].textContent = 'O';
                let score = minimax(depth - 1, false, -Infinity, Infinity);
                board[i * 15 + j].textContent = "";

                if (score > bestScore) {
                    bestScore = score;
                    move = [i, j];
                }
            }
        }
    }
    return move;
    }
}


//HELL MODE

// Hằng số đánh giá điểm
const MAP_SCORE_COMPUTER = new Map([
    [5, Infinity],
    [4, 10000],
    [3, 5000],
    [2, 3000],
    [1, 1000]
])

const MAP_POINT_HUMAN = new Map([
    [4, 1000000],
    [3, 800],
    [2, 400],
    [1, 10],
    [0, 0]
])

// Hàm đánh giá điểm cho từng vị trí trên bảng
function evaluatePosition(row, col, player) {
    const directions = [
        [0, 1], // Ngang
        [1, 0], // Dọc
        [1, 1], // Chéo phải
        [1, -1] // Chéo trái
    ];

    let maxScore = -Infinity;

    for (const [dx, dy] of directions) {
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

        // maxScore = Math.max(maxScore, count);
        maxScore = Math.max(maxScore, MAP_SCORE_COMPUTER.get(count) || 0);
    }

    return maxScore;
}

// Hàm kiểm tra số điểm phòng thủ
function evaluateDefensePosition(row, col, player) {
    const directions = [
        [0, 1], // Ngang
        [1, 0], // Dọc
        [1, 1], // Chéo phải
        [1, -1] // Chéo trái
    ];

    let maxScore = 0; // Đặt giá trị thấp để ưu tiên phòng thủ

    for (const [dx, dy] of directions) {
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
        
        // maxScore = Math.max(maxScore, count);
        maxScore = Math.max(maxScore, MAP_POINT_HUMAN.get(count) || 0);
    }

    return maxScore;
}

// Hàm lấy danh sách các điểm có điểm số cao nhất
function getBestPoints() {
    let maxAttackScore = -Infinity;
    let maxDefenseScore = -Infinity;
    let bestAttackPoints = [];
    let bestDefensePoints = [];

    for (let i = 0; i < 15; i++) {
        for (let j = 0; j < 15; j++) {
            if (board[i * 15 + j].textContent === "") {
                const attackScore = evaluatePosition(i, j, 'O');
                const defenseScore = evaluateDefensePosition(i, j, 'X');

                if (attackScore > maxAttackScore) {
                    maxAttackScore = attackScore;
                    bestAttackPoints = [
                        [i, j]
                    ];
                } else if (attackScore === maxAttackScore) {
                    bestAttackPoints.push([i, j]);
                }

                if (defenseScore > maxDefenseScore) {
                    maxDefenseScore = defenseScore;
                    bestDefensePoints = [
                        [i, j]
                    ];
                } else if (defenseScore === maxDefenseScore) {
                    bestDefensePoints.push([i, j]);
                }
            }
        }
    }

    // Ưu tiên tấn công nếu có điểm tấn công cao hơn, ngược lại ưu tiên phòng thủ
    return maxAttackScore >= maxDefenseScore ? bestAttackPoints : bestDefensePoints;
}