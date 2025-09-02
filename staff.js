// staff.js: Build weekly calendar to display appointments and allow status updates.

document.addEventListener("DOMContentLoaded", () => {
  buildCalendar();
});

// Determine color for categories
const categoryColors = {
  Cuts: "#00b3b3",
  Color: "#9f5bd5",
  Styling: "#f0a500",
  Treatments: "#e8615a",
  Extensions: "#6fa8dc",
};

function buildCalendar() {
  const container = document.getElementById("calendarContainer");
  container.innerHTML = "";
  const table = document.createElement("table");
  table.className = "calendar-table";

  // Calculate Monday of current week
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0 (Sun) - 6 (Sat)
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate() + mondayOffset
  );

  // Table header: time column + each day (Mon-Sun)
  const thead = document.createElement("thead");
  const headerRow = document.createElement("tr");
  const emptyTh = document.createElement("th");
  headerRow.appendChild(emptyTh);
  for (let i = 0; i < 7; i++) {
    const date = new Date(
      monday.getFullYear(),
      monday.getMonth(),
      monday.getDate() + i
    );
    const dayName = date.toLocaleDateString(undefined, { weekday: "short" });
    const dayDate = date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
    const th = document.createElement("th");
    th.textContent = `${dayName}\n${dayDate}`;
    headerRow.appendChild(th);
  }
  thead.appendChild(headerRow);
  table.appendChild(thead);

  // Body: time slots
  const tbody = document.createElement("tbody");
  const openHour = 9;
  const closeHour = 17;
  const incrementMinutes = 30;
  for (let hour = openHour; hour < closeHour; hour++) {
    for (let minute = 0; minute < 60; minute += incrementMinutes) {
      const row = document.createElement("tr");
      // Time cell
      const timeCell = document.createElement("td");
      timeCell.className = "time";
      const hh = String(hour).padStart(2, "0");
      const mm = String(minute).padStart(2, "0");
      timeCell.textContent = `${hh}:${mm}`;
      row.appendChild(timeCell);
      // Day cells
      for (let i = 0; i < 7; i++) {
        const cell = document.createElement("td");
        row.appendChild(cell);
      }
      tbody.appendChild(row);
    }
  }
  table.appendChild(tbody);
  container.appendChild(table);
  // Fill appointments
  fillAppointments(monday, table);
}

function fillAppointments(monday, table) {
  const appointments = JSON.parse(localStorage.getItem("appointments") || "[]");
  // Map each row/time to row index
  // We'll compute once: openHour 9, 30-min increments -> index = (hour - 9) * 2 + (minute / 30)
  const tbody = table.querySelector("tbody");
  appointments.forEach((appt) => {
    const service = servicesData.find((s) => s.id === appt.serviceId);
    if (!service) return;
    const dateParts = appt.date.split("-").map((x) => parseInt(x, 10));
    const apptDate = new Date(dateParts[0], dateParts[1] - 1, dateParts[2]);
    // Determine day index relative to Monday
    const dayOffset = Math.floor((apptDate - monday) / (24 * 60 * 60 * 1000));
    if (dayOffset < 0 || dayOffset > 6) return;
    // Determine row index
    const [hStr, mStr] = appt.time.split(":");
    const hour = parseInt(hStr, 10);
    const minute = parseInt(mStr, 10);
    const rowIndex = (hour - 9) * 2 + minute / 30;
    if (rowIndex < 0) return;
    const row = tbody.children[rowIndex];
    if (!row) return;
    const cell = row.children[dayOffset + 1]; // +1 for time column
    // Create appointment entry element
    const entry = document.createElement("div");
    entry.className = "appointment-entry";
    entry.style.backgroundColor = categoryColors[service.category] || "#444";
    entry.style.color = "#030a18";
    entry.textContent = `${service.name}\n${appt.client.name}`;
    // Status label clickable to cycle through statuses
    const statusLabel = document.createElement("div");
    statusLabel.className = "status-selector";
    statusLabel.textContent = appt.status;
    statusLabel.addEventListener("click", () => {
      appt.status = nextStatus(appt.status);
      statusLabel.textContent = appt.status;
      // Save updated status back to localStorage
      const all = JSON.parse(localStorage.getItem("appointments") || "[]");
      const idx = all.findIndex((a) => a.id === appt.id);
      if (idx !== -1) {
        all[idx].status = appt.status;
        localStorage.setItem("appointments", JSON.stringify(all));
      }
    });
    entry.appendChild(statusLabel);
    cell.appendChild(entry);
  });
}

// Cycle through statuses for staff convenience
function nextStatus(current) {
  const order = ["Scheduled", "Checked-In", "In Progress", "Completed", "No-Show"];
  const idx = order.indexOf(current);
  return order[(idx + 1) % order.length];
}
