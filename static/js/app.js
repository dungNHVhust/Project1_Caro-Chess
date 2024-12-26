let socket = io.connect('http://' + document.domain + ':' + location.port);
function showRules() {
    showNotification("Luật chơi Caro: ...");
}
//PopUp
const openPopUpBtn = document.getElementById("openPopup");
const popUp = document.getElementById("popup");
const closePopupBtn = document.getElementById("closePopup");

openPopUpBtn.addEventListener("click", () => {
    popUp.style.display="flex";
})

closePopupBtn.addEventListener("click", () => {
    popUp.style.display="none";
})

//Create Room 
const openCreateRoomBtn = document.getElementById("createRoom")
const popUpCreateRoom = document.getElementById("popup_CreateRoom")
const closeCreateRoomBtn = document.getElementById("closePopup_CreateRoom")

openCreateRoomBtn.addEventListener("click",() => {
    popUpCreateRoom.style.display="flex";
    popUp.style.display="none";
})

closeCreateRoomBtn.addEventListener("click",()=> {
    popUpCreateRoom.style.display="none";
})

//Room
function generateRoomID() {
    return Math.floor(100000 + Math.random() * 900000); // 6 chữ số
  }

  // Hiển thị ID phòng ngẫu nhiên khi tải trang
  document.getElementById('roomID').textContent = generateRoomID();

  // Đóng popup
  function closePopup() {
    document.getElementById('popup_CreateRoom').style.display="none";
  }

//Join Room
const openJoinRoomBtn = document.getElementById('joinRoom')
const popUpJoinRoom = document.getElementById('popup_JoinRoom')
const closeJoinRoomBtn = document.getElementById('closePopup_JoinRoom')

openJoinRoomBtn.addEventListener('click',() => {
    popUpJoinRoom.style.display="flex";
    popUp.style.display="none";
})
closeJoinRoomBtn.addEventListener('click',()=>{
    popUpJoinRoom.style.display='none';
})

 // Create Room
 function createRoom() {
    const roomID = document.getElementById('roomID').textContent;
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();

    if (!username || !password) {
      showNotification("Vui lòng nhập đầy đủ thông tin!","warning");
      return;
    }

    // Gửi thông tin đến server qua fetch API
    fetch('/create-room', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        room_id: roomID,
        username: username,
        password: password,
      }),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          showNotification(`Phòng ${roomID} đã được tạo thành công!`,"success");
          closePopup();
          window.location.href = `/caro-on`;
        } else {
          showNotification(`${data.message}`,"error" || 'Đã xảy ra lỗi!',"error");
          closePopup();
          window.location.href = '/';
        }
      })
      .catch((error) => {
        console.error('Lỗi:', error);
        showNotification('Không thể tạo phòng, vui lòng thử lại!',"error");
        closePopup();
        window.location.href = '/';
      });
  }

  //Join Room
  function joinRoom() {
    const roomID = document.getElementById('room_ID').value.trim();
    const username = document.getElementById('joinRoom_username').value.trim();
    const password = document.getElementById('joinRoom_password').value.trim();

    if (!roomID || !username || !password) {
        showNotification("Vui lòng nhập đầy đủ thông tin!","warning");
        return;
    }

    // Gửi thông tin đến server qua fetch API
    fetch('/join-room', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            room_id: roomID,
            username: username,
            password: password,
        }),
    })
        .then((response) => response.json())
        .then((data) => {
            if (data.success) {
                alert(`Tham gia phòng ${roomID} thành công!`);
                window.location.href = `/caro-on`;
            } else {
              showNotification(data.message || 'Đã xảy ra lỗi!');
            }
        })
        .catch((error) => {
            console.error('Lỗi:', error);
            showNotification('Không thể tham gia phòng, vui lòng thử lại!');
        });
}
  

  
