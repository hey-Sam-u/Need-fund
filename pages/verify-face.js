/* verify-face.js — FULL DUMMY MODE */

const selfieDrop = document.getElementById("selfie-drop");
const selfieInput = document.getElementById("selfie-input");
const selfieThumb = document.getElementById("selfie-thumb");

const caseInput = document.getElementById("case-id");
const startBtn = document.getElementById("start-match");
const retryBtn = document.getElementById("face-retry");
const proceedBtn = document.getElementById("face-proceed");

const overlay = document.getElementById("face-overlay");
const stepsArea = document.getElementById("stepsArea");

const faceResult = document.getElementById("face-result");
const faceScoreEl = document.getElementById("face-score");
const faceStatusEl = document.getElementById("face-status");
const faceBreakdown = document.getElementById("face-breakdown");
const meterFill = document.querySelector(".meter-fill");

let uploadedSelfie = null;

/* ---- CASE ID FREE MODE ---- */
function getCase() {
  let c = caseInput.value.trim();
  if (!c) {
    c = "CASE" + Math.floor(Math.random() * 90000 + 10000);
    caseInput.value = c;
  }
  return c.toUpperCase();
}

/* ---- SELFIE UPLOAD ---- */
selfieDrop.addEventListener("click", () => selfieInput.click());

selfieInput.addEventListener("change", (e) => {
  const f = e.target.files[0];
  if (!f) return;

  const reader = new FileReader();
  reader.onload = (ev) => {
    uploadedSelfie = ev.target.result;
    selfieThumb.src = uploadedSelfie;
    selfieThumb.classList.remove("hidden");

    startBtn.disabled = false;
  };
  reader.readAsDataURL(f);
});

/* ---- START MATCH ---- */
startBtn.addEventListener("click", async () => {
  if (!uploadedSelfie) {
    alert("Upload selfie first");
    return;
  }

  startBtn.disabled = true;
  retryBtn.disabled = true;

  overlay.classList.remove("hidden");
  stepsArea.innerHTML = "";

  const STEPS = [
    "Capturing selfie & liveliness…",
    "Detecting face landmarks…",
    "Comparing features…",
    "Anti-spoofing check…",
    "Generating confidence score…",
  ];

  for (let t of STEPS) {
    let div = document.createElement("div");
    div.className = "face-step";
    div.textContent = t;
    stepsArea.appendChild(div);

    await new Promise((r) => setTimeout(r, 900));
    div.classList.add("done");
  }

  overlay.classList.add("hidden");
  showFakeResult();
});

/* ---- FAKE RESULT ---- */
function showFakeResult() {
  const score = Math.floor(Math.random() * 20) + 78; // 78–98%
  const status =
    score >= 85 ? "Match OK" : score >= 75 ? "Review Recommended" : "Mismatch";

  const landmark = Math.floor(score - 10) + "%";

  faceResult.classList.remove("hidden");

  // meter animation
  const circ = 2 * Math.PI * 50;
  const offset = circ * (1 - score / 100);
  meterFill.style.strokeDashoffset = offset;

  faceScoreEl.textContent = score + "%";
  faceStatusEl.textContent = status;

  faceBreakdown.innerHTML = `Landmarks: ${landmark} · Liveliness: Passed · Anti-spoof: Low`;

  faceStatusEl.style.color =
    score >= 85 ? "var(--green)" : score >= 75 ? "var(--warn)" : "#dc3545";

  proceedBtn.disabled = false;
  retryBtn.disabled = false;
}

/* ---- RETRY ---- */
retryBtn.addEventListener("click", () => {
  uploadedSelfie = null;
  selfieThumb.classList.add("hidden");
  faceResult.classList.add("hidden");
  startBtn.disabled = true;
  proceedBtn.disabled = true;
});

/* ---- Proceed ---- */
proceedBtn.addEventListener("click", () => {
  const caseId = getCase();
  window.location.href = "verify-hologram.html?case=" + caseId;
});
