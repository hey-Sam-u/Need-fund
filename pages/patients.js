// ---------------------------
// PATIENT DATA
// ---------------------------
const patients = [
  {
    name: "John Doe",
    hospital: "City Hospital",
    summary: "Needs urgent surgery for appendicitis.",
    amount: 5000,
    progress: 45,
    verified: true,
    urgent: true,
    img: "../patient-home1.png",
  },
  {
    name: "Jane Smith",
    hospital: "Metro Medical Center",
    summary: "Critical care for heart condition.",
    amount: 8000,
    progress: 70,
    verified: true,
    urgent: true,
    img: "../patient-home2.png",
  },
  {
    name: "Rahul Sharma",
    hospital: "Sunshine Hospital",
    summary: "Cancer treatment required immediately.",
    amount: 12000,
    progress: 20,
    verified: false,
    urgent: true,
    img: "../patient-home3.png",
  },
  {
    name: "Aisha Khan",
    hospital: "Metro Medical Center",
    summary: "Kidney transplant support needed.",
    amount: 15000,
    progress: 30,
    verified: true,
    urgent: false,
    img: "../patient-home4.png",
  },
  {
    name: "David Miller",
    hospital: "City Hospital",
    summary: "Accident emergency surgery required.",
    amount: 9000,
    progress: 55,
    verified: false,
    urgent: true,
    img: "../patient-home5.png",
  },
  {
    name: "Suman Patel",
    hospital: "Healing Touch Clinic",
    summary: "Severe dengue, requires ICU treatment.",
    amount: 3000,
    progress: 80,
    verified: true,
    urgent: false,
    img: "../patient-home6.png",
  },
];

// ---------------------------
// RENDER CARDS
// ---------------------------
const container = document.getElementById("patients-cards");

function renderPatients(list) {
  container.innerHTML = "";

  list.forEach((p) => {
    container.innerHTML += `
      <div class="patient-card appear">
        <div class="card-photo">
          <img src="${p.img}" alt="Patient Photo" />
          ${p.verified ? `<span class="verified-badge">✔ Verified</span>` : ""}
        </div>

        <div class="card-info">
          <h3>${p.name}</h3>
          <p class="hospital">${p.hospital}</p>
          <p class="summary">${p.summary}</p>

          <div class="progress-bar">
            <div class="progress" style="width:${p.progress}%"></div>
          </div>

          <p class="amount-needed">$${p.amount} needed</p>

          <a href="patient-detail.html" class="btn"
             onclick='viewPatient(${JSON.stringify(p)})'>
             View Details
          </a>
        </div>
      </div>
    `;
  });
}

renderPatients(patients);

// ---------------------------
// SAVE CLICKED PATIENT
// ---------------------------
function viewPatient(data) {
  localStorage.setItem("selectedPatient", JSON.stringify(data));
}

// ---------------------------
// FILTERS
// ---------------------------
const filterUrgent = document.getElementById("filter-urgent");
const filterVerified = document.getElementById("filter-verified");
const filterAmount = document.getElementById("filter-amount");
const searchInput = document.getElementById("search-input");
const filterHospital = document.getElementById("filter-hospital");

// Fill hospital dropdown
(function loadHospitals() {
  const hospitals = [...new Set(patients.map((p) => p.hospital))];
  hospitals.forEach((h) => {
    filterHospital.innerHTML += `<option value="${h}">${h}</option>`;
  });
})();

// APPLY FILTERS
function applyFilters() {
  let filtered = [...patients];

  if (filterUrgent.value === "yes") filtered = filtered.filter((p) => p.urgent);
  if (filterVerified.value === "yes")
    filtered = filtered.filter((p) => p.verified);
  if (filterHospital.value !== "")
    filtered = filtered.filter((p) => p.hospital === filterHospital.value);

  const text = searchInput.value.toLowerCase();
  if (text.trim() !== "") {
    filtered = filtered.filter(
      (p) =>
        p.name.toLowerCase().includes(text) ||
        p.hospital.toLowerCase().includes(text)
    );
  }

  if (filterAmount.value === "low")
    filtered.sort((a, b) => a.amount - b.amount);

  if (filterAmount.value === "high")
    filtered.sort((a, b) => b.amount - a.amount);

  renderPatients(filtered);
}

filterUrgent.addEventListener("change", applyFilters);
filterVerified.addEventListener("change", applyFilters);
filterAmount.addEventListener("change", applyFilters);
searchInput.addEventListener("input", applyFilters);
filterHospital.addEventListener("change", applyFilters);

// Smooth scroll for "Donate Now"
const donateBtn = document.getElementById("donateBtn");
donateBtn.addEventListener("click", () => {
  window.location.href = "verify-case.html";
});
