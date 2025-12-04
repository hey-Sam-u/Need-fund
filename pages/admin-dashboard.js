// Load from Storage (patients + donations)
let patients = JSON.parse(localStorage.getItem("patientsList")) || [];
let donations = JSON.parse(localStorage.getItem("donationsList")) || [];

// Fill top cards
document.getElementById("totalPatients").textContent =
  "Total Patients: " + patients.length;
document.getElementById("verifiedPatients").textContent =
  "Verified: " + patients.filter((p) => p.verified).length;
document.getElementById("pendingPatients").textContent =
  "Pending: " + patients.filter((p) => !p.verified).length;

let total = donations.reduce((sum, d) => sum + Number(d.amount), 0);
document.getElementById("totalDonations").textContent =
  "Total Donations: ₹" + total;

// Fill patient table
const pTable = document.querySelector("#patientsTable tbody");
patients.forEach((p) => {
  pTable.innerHTML += `
    <tr>
      <td><img src="${p.img}" /></td>
      <td>${p.name}</td>
      <td>${p.hospital}</td>
      <td>${p.amount}</td>
      <td>${p.progress}%</td>
      <td>${p.verified ? "Yes" : "No"}</td>
      <td><button onclick="verifyPatient('${p.id}')">Verify</button></td>
    </tr>
  `;
});

// Fill donation logs
const dTable = document.querySelector("#donationTable tbody");
donations.forEach((d) => {
  dTable.innerHTML += `
    <tr>
      <td>${d.name}</td>
      <td>₹${d.amount}</td>
      <td>${d.method}</td>
      <td>${d.message}</td>
    </tr>
  `;
});

// Verify logic
function verifyPatient(id) {
  patients = patients.map((p) => {
    if (p.id === id) p.verified = true;
    return p;
  });

  localStorage.setItem("patientsList", JSON.stringify(patients));
  alert("Patient Verified ✔");
  location.reload();
}

// DARK MODE
document.getElementById("darkModeBtn").onclick = () => {
  document.body.classList.toggle("dark");
};
// Smooth scroll for "verify case"
const donateBtn = document.getElementById("donateBtn");
donateBtn.addEventListener("click", () => {
  window.location.href = "verify-case.html";
});
