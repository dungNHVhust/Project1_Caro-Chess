function showRules() {
    alert("Luật chơi Caro: ...");
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
