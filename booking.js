// booking.js handles the dynamic functionality of the booking page.

// Selected service is stored here when the user clicks "Select" on a service card.
let selectedService = null;

// Populate the category bar and services grid on page load.
document.addEventListener("DOMContentLoaded", () => {
  populateCategoryBar();
  // Default show all categories initially.
  filterAndDisplayServices();
  setupFormListeners();
});

// Generate unique categories and create buttons for each.
function populateCategoryBar() {
  const categoryBar = document.getElementById("categoryBar");
  categoryBar.innerHTML = "";
  const categories = Array.from(new Set(servicesData.map((s) => s.category)));
  // Include an "All" category to show all services.
  const allBtn = createCategoryButton("All");
  categoryBar.appendChild(allBtn);
  categories.forEach((cat) => {
    const btn = createCategoryButton(cat);
    categoryBar.appendChild(btn);
  });
  // Set the "All" button as active by default.
  allBtn.classList.add("active");
}

function createCategoryButton(category) {
  const btn = document.createElement("button");
  btn.textContent = category;
  btn.className = "category-btn";
  btn.addEventListener("click", () => {
    // Remove active class from all buttons
    document
      .querySelectorAll(".category-btn")
      .forEach((el) => el.classList.remove("active"));
    // Add active class to clicked button
    btn.classList.add("active");
    filterAndDisplayServices(category === "All" ? null : category);
  });
  return btn;
}

// Filter services by category (or all if category is null) and display them.
function filterAndDisplayServices(category = null) {
  const servicesGrid = document.getElementById("servicesGrid");
  servicesGrid.innerHTML = "";
  const filtered = category
    ? servicesData.filter((s) => s.category === category)
    : servicesData.slice();
  filtered.forEach((service) => {
    const card = createServiceCard(service);
    servicesGrid.appendChild(card);
  });
}

function createServiceCard(service) {
  const card = document.createElement("div");
  card.className = "service-card";
  const title = document.createElement("h3");
  title.textContent = service.name;
  const desc = document.createElement("p");
  desc.textContent = service.description;
  const info = document.createElement("div");
  info.className = "service-info";
  const durationSpan = document.createElement("span");
  durationSpan.textContent = `Duration: ${service.duration} min`;
  const priceSpan = document.createElement("span");
  priceSpan.textContent = `Price: $${service.price.toFixed(2)}`;
  info.appendChild(durationSpan);
  info.appendChild(priceSpan);
  const selectBtn = document.createElement("button");
  selectBtn.className = "select-btn";
  selectBtn.textContent = "Select";
  selectBtn.addEventListener("click", () => {
    handleServiceSelection(service);
  });
  card.appendChild(title);
  card.appendChild(desc);
  card.appendChild(info);
  card.appendChild(selectBtn);
  return card;
}

// When a service is selected, store it and reveal the booking form.
function handleServiceSelection(service) {
  selectedService = service;
  // Show the form container
  const formContainer = document.getElementById("bookingFormContainer");
  formContainer.style.display = "block";
  // Reset form fields
  document.getElementById("bookingForm").reset();
  // Clear time options
  const timeSelect = document.getElementById("appointmentTime");
  timeSelect.innerHTML = '<option value="">--Select time--</option>';
  // Deposit note if required
  const depositNote = document.getElementById("depositNote");
  if (service.price >= 100 || service.duration >= 120) {
    depositNote.style.display = "block";
    depositNote.textContent =
      "A deposit is required for this service. Your card will be charged at the time of booking.";
  } else {
    depositNote.style.display = "none";
    depositNote.textContent = "";
  }
  // Disable confirm button until inputs are filled and policy accepted
  updateConfirmButtonState();
  // Scroll to form
  formContainer.scrollIntoView({ behavior: "smooth" });
}

// Setup event listeners for form inputs to enable/disable confirm button and update times when date changes.
function setupFormListeners() {
  const dateInput = document.getElementById("appointmentDate");
  const timeSelect = document.getElementById("appointmentTime");
  const form = document.getElementById("bookingForm");
  dateInput.addEventListener("change", () => {
    populateTimeOptions(dateInput.value);
    updateConfirmButtonState();
  });
  form.addEventListener("input", updateConfirmButtonState);
  form.addEventListener("submit", submitAppointment);
}

// Populate available time slots based on selected date, service duration, and salon rules.
function populateTimeOptions(dateStr) {
  const timeSelect = document.getElementById("appointmentTime");
  timeSelect.innerHTML = '<option value="">--Select time--</option>';
  if (!dateStr) return;
  // Business hours: 9:00 to 17:00 in 30-min increments
  const openHour = 9;
  const closeHour = 17;
  const incrementMinutes = 30;
  // Parse selected date
  const [year, month, day] = dateStr.split("-").map((x) => parseInt(x, 10));
  const selectedDate = new Date(year, month - 1, day);
  const now = new Date();
  // Get existing appointments from localStorage to prevent conflicts
  const existing = JSON.parse(localStorage.getItem("appointments") || "[]");
  // Build time slots
  for (let hour = openHour; hour < closeHour; hour++) {
    for (let minute = 0; minute < 60; minute += incrementMinutes) {
      const slot = new Date(year, month - 1, day, hour, minute);
      // Rule: no same-day bookings less than 2 hours from now
      if (
        selectedDate.toDateString() === now.toDateString() &&
        slot.getTime() - now.getTime() < 2 * 60 * 60 * 1000
      ) {
        continue;
      }
      // Check for conflicts with existing appointments
      let conflict = false;
      for (const appt of existing) {
        if (appt.date === dateStr) {
          // compute start and end times for the appointment
          const [apptHour, apptMin] = appt.time.split(":" ).map((x) => parseInt(x, 10));
          const apptStart = new Date(year, month - 1, day, apptHour, apptMin);
          const apptEnd = new Date(
            apptStart.getTime() + servicesData.find((s) => s.id === appt.serviceId).duration * 60000
          );
          const slotEnd = new Date(
            slot.getTime() + (selectedService ? selectedService.duration * 60000 : 0)
          );
          if (
            (slot >= apptStart && slot < apptEnd) ||
            (slotEnd > apptStart && slotEnd <= apptEnd) ||
            (slot <= apptStart && slotEnd >= apptEnd)
          ) {
            conflict = true;
            break;
          }
        }
      }
      if (conflict) continue;
      const option = document.createElement("option");
      // Format time as HH:MM with leading zeros
      const hh = String(hour).padStart(2, "0");
      const mm = String(minute).padStart(2, "0");
      option.value = `${hh}:${mm}`;
      option.textContent = `${hh}:${mm}`;
      timeSelect.appendChild(option);
    }
  }
}

// Enable or disable Confirm button based on form validity
function updateConfirmButtonState() {
  const name = document.getElementById("clientName").value.trim();
  const email = document.getElementById("clientEmail").value.trim();
  const phone = document.getElementById("clientPhone").value.trim();
  const date = document.getElementById("appointmentDate").value;
  const time = document.getElementById("appointmentTime").value;
  const policy = document.getElementById("policyCheck").checked;
  const confirmBtn = document.getElementById("confirmBtn");
  // only enable if a service is selected and all inputs are filled and policy checked
  if (
    selectedService &&
    name &&
    email &&
    phone &&
    date &&
    time &&
    policy
  ) {
    confirmBtn.disabled = false;
  } else {
    confirmBtn.disabled = true;
  }
}

// Handle form submission: store appointment and show confirmation
function submitAppointment(event) {
  event.preventDefault();
  if (!selectedService) return;
  const date = document.getElementById("appointmentDate").value;
  const time = document.getElementById("appointmentTime").value;
  const name = document.getElementById("clientName").value.trim();
  const email = document.getElementById("clientEmail").value.trim();
  const phone = document.getElementById("clientPhone").value.trim();
  const depositRequired = selectedService.price >= 100 || selectedService.duration >= 120;
  // Build appointment object
  const appointment = {
    id: Date.now(),
    serviceId: selectedService.id,
    serviceName: selectedService.name,
    date,
    time,
    client: { name, email, phone },
    depositRequired,
    status: "Scheduled",
  };
  // Save to localStorage
  const existing = JSON.parse(localStorage.getItem("appointments") || "[]");
  existing.push(appointment);
  localStorage.setItem("appointments", JSON.stringify(existing));
  // Show confirmation alert
  alert(
    `Thank you, ${name}! Your appointment for ${selectedService.name} on ${date} at ${time} has been booked.` +
      (depositRequired
        ? " A deposit has been noted and will be processed in the final version."
        : " We will hold your card on file (no charge now).")
  );
  // Reset selection and form
  selectedService = null;
  document.getElementById("bookingFormContainer").style.display = "none";
  document.getElementById("bookingForm").reset();
  updateConfirmButtonState();
}
