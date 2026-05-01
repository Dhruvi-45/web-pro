fetch('/api/rooms?hostel=GH')
  .then(res => res.json())
  .then(data => {
    const container = document.getElementById('rooms');
    container.innerHTML = '';

    if (data.length === 0) {
      container.innerHTML = `<p class="empty">No rooms found for GH</p>`;
      return;
    }

    data.forEach(room => {
      const div = document.createElement('div');
      div.classList.add('room');

      if (room.status === "Available") {
        div.classList.add('available');
      } else {
        div.classList.add('occupied');
      }

      div.innerHTML = `
        <h3>${room.roomNumber}</h3>
        <p><strong>Status:</strong> ${room.status}</p>
        <p><strong>Block:</strong> ${room.block}</p>
        <p><strong>Floor:</strong> ${room.floor}</p>
        <p><strong>Capacity:</strong> ${room.capacity}</p>
      `;

      container.appendChild(div);
    });
  })
  .catch(err => {
    console.error(err);
  });