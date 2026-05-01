const user = JSON.parse(localStorage.getItem("user"));

// 🔐 protect route
if (!user || user.hostel !== "GH") {
  alert("Unauthorized");
  window.location.href = "/";
}

// 🔥 fetch rooms
fetch('/api/rooms?hostel=GH')
  .then(res => res.json())
  .then(data => {
    console.log("Rooms:", data);

    const container = document.getElementById("rooms");

    data.forEach(room => {
      const div = document.createElement("div");
      div.innerHTML = `
        <p>
          Room: ${room.roomNumber} |
          Block: ${room.block} |
          Status: ${room.status}
        </p>
      `;
      container.appendChild(div);
    });
  });