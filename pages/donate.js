const donateForm = document.getElementById("donateForm");
const successMsg = document.getElementById("successMsg");

const payMethod = document.getElementById("payMethod");
const upiBox = document.getElementById("upiBox");
const cashBox = document.getElementById("cashBox");
const bankBox = document.getElementById("bankBox");

// LOAD PATIENT INFO
const dp = JSON.parse(localStorage.getItem("donatePatient"));

if (dp) {
  document.getElementById("pName").textContent = dp.name;
  document.getElementById("pHospital").textContent = dp.hospital;
  document.querySelector(".patient-photo").src = dp.img;
  document.querySelector(".p-story").textContent = dp.summary;

  document.querySelector(".p-bar").style.width = dp.progress + "%";
  document.querySelector(".needed-label").textContent =
    "₹" + dp.amount + " needed";
}

function updatePaymentUI() {
  upiBox.style.display = "none";
  cashBox.style.display = "none";
  bankBox.style.display = "none";

  if (payMethod.value === "upi") upiBox.style.display = "block";
  if (payMethod.value === "cash") cashBox.style.display = "block";
  if (payMethod.value === "bank") bankBox.style.display = "block";
}

payMethod.addEventListener("change", updatePaymentUI);
updatePaymentUI(); // default

donateForm.addEventListener("submit", (e) => {
  e.preventDefault();

  const name = document.getElementById("donorName").value;
  const amount = document.getElementById("amount").value;
  const message = document.getElementById("message").value;

  // Dummy payment simulation
  setTimeout(() => {
    // Show success popup
    successMsg.style.display = "block";

    // Clear form
    donateForm.reset();

    // Hide popup after 3 seconds
    setTimeout(() => {
      successMsg.style.display = "none";
    }, 3000);

    // Optional: Update dummy progress bar on patient-detail page
    // Could use localStorage or API later
    console.log(`Donor: ${name}, Amount: ${amount}, Message: ${message}`);
  }, 500); // simulate processing delay
});
