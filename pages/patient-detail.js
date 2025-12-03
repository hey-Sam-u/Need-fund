// ---------------------------
const p = JSON.parse(localStorage.getItem("selectedPatient"));

// If no patient data found, go back
if (!p) {
  window.location.href = "patients.html";
}

// ---------------------------
// FILL DATA IN PAGE
// ---------------------------
document.querySelector(".photo img").src = p.img;

if (p.verified) {
  document.querySelector(".verified-badge").style.display = "block";
} else {
  document.querySelector(".verified-badge").style.display = "none";
}

document.querySelector(".details h1").textContent = p.name;
document.querySelector(".hospital").textContent = p.hospital;
document.querySelector(".case-summary").textContent = p.summary;

document.querySelector(".progress").style.width = p.progress + "%";
document.querySelector(".amount-needed").textContent =
  "$" + p.amount + " needed";

// ---------------------------
// DONATE BUTTON
// ---------------------------
document.getElementById("donateBtn").addEventListener("click", () => {

  localStorage.setItem("donatePatient",JSON.stringify(p));
  window.location.href = "donate.html";

});
