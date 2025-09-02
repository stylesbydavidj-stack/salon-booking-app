// owner.js: Handles owner dashboard login and metrics computation.

document.addEventListener("DOMContentLoaded", () => {
  const loginBtn = document.getElementById("ownerLoginBtn");
  loginBtn.addEventListener("click", handleLogin);
});

function handleLogin() {
  const passwordInput = document.getElementById("ownerPassword");
  const errorMsg = document.getElementById("loginError");
  const dashboard = document.getElementById("dashboard");
  const loginSection = document.getElementById("loginSection");
  const password = passwordInput.value;
  // In real application, authentication would be secure. Here it's hard-coded for demonstration.
  const correctPassword = "admin123";
  if (password === correctPassword) {
    // Hide login section, show dashboard
    loginSection.style.display = "none";
    dashboard.style.display = "block";
    errorMsg.style.display = "none";
    computeAndDisplayMetrics();
  } else {
    errorMsg.style.display = "block";
  }
}

function computeAndDisplayMetrics() {
  const appointments = JSON.parse(localStorage.getItem("appointments") || "[]");
  // Compute revenue and counts
  let revenue = 0;
  const revenueByHour = {};
  appointments.forEach((appt) => {
    const service = servicesData.find((s) => s.id === appt.serviceId);
    if (!service) return;
    revenue += service.price;
    const hour = parseInt(appt.time.split(":" )[0], 10);
    revenueByHour[hour] = (revenueByHour[hour] || 0) + service.price;
  });
  const transactions = appointments.length;
  const avgSale = transactions > 0 ? revenue / transactions : 0;
  // Update DOM
  document.getElementById("totalRevenue").textContent = `$${revenue.toFixed(2)}`;
  document.getElementById("transactionsCount").textContent = transactions;
  document.getElementById("averageSale").textContent = `$${avgSale.toFixed(2)}`;
  // Build bar chart
  buildBarChart(revenueByHour);
}

function buildBarChart(data) {
  const barChart = document.getElementById("barChart");
  barChart.innerHTML = "";
  // Determine hours range (9 to 17)
  const hours = [];
  for (let h = 9; h < 17; h++) hours.push(h);
  const values = hours.map((h) => data[h] || 0);
  const maxVal = Math.max(...values, 1);
  hours.forEach((hour, idx) => {
    const val = values[idx];
    const barWrapper = document.createElement("div");
    barWrapper.className = "bar";
    const bar = document.createElement("div");
    const heightPercent = (val / maxVal) * 100;
    bar.style.height = `${heightPercent}%`;
    bar.textContent = val > 0 ? `$${val.toFixed(0)}` : "";
    barWrapper.appendChild(bar);
    const label = document.createElement("div");
    label.className = "bar-label";
    label.textContent = `${hour}:00`;
    barWrapper.appendChild(label);
    barChart.appendChild(barWrapper);
  });
}
