// verify-case.js
// Frontend demo: Case verification flow using localStorage.
// Key prefix used for storage:
const VER_KEY_PREFIX = "needfund_verified_";

// SAMPLE PATIENTS
const SAMPLE_PATIENTS = {
  "NF-1021": {
    name: "Raj Kumar",
    hospital: "City General Hospital",
    image: "../logo.png",
  },
  "NF-1022": {
    name: "Sita Devi",
    hospital: "St. Mary Clinic",
    image: "../hero.jpg",
  },
  "NF-1023": {
    name: "Vikram Singh",
    hospital: "Apollo Care",
    image: "../logo.png",
  },
};

// STEPS for fake AI scan
const STEPS = [
  { text: "Checking document clarity...", ms: 900 },
  { text: "Validating hospital ID...", ms: 1200 },
  { text: "Cross-matching patient details...", ms: 1400 },
  { text: "Confirming real-time status...", ms: 900 },
];

// DOM refs
const caseSelect = document.getElementById("caseSelect");
const previewBox = document.getElementById("previewBox");
const previewImg = document.getElementById("previewImg");
const previewName = document.getElementById("previewName");
const previewHospital = document.getElementById("previewHospital");

const uploadArea = document.getElementById("uploadArea");
const fileInput = document.getElementById("fileInput");
const uploadBtn = document.getElementById("uploadBtn");
const fileMeta = document.getElementById("fileMeta");
const fileThumb = document.getElementById("fileThumb");
const fileNameEl = document.getElementById("fileName");
const fileSizeEl = document.getElementById("fileSize");
const removeFileBtn = document.getElementById("removeFile");

const hospitalNameInput = document.getElementById("hospitalName");
const wardNoInput = document.getElementById("wardNo");
const verifyBtn = document.getElementById("verifyBtn");

const overlay = document.getElementById("overlay");
const stepsList = document.getElementById("stepsList");

const resultCard = document.getElementById("resultCard");
const rCase = document.getElementById("rCase");
const rHospital = document.getElementById("rHospital");
const rDoc = document.getElementById("rDoc");
const rTime = document.getElementById("rTime");
const applyBadgeBtn = document.getElementById("applyBadge");
const backToCasesBtn = document.getElementById("backToCases");

const backBtn = document.getElementById("backBtn");

// transient variables
let selectedCase = null;
let uploaded = null; // {name, size, dataURL}

// Populate case select on load
function populateCases() {
  Object.keys(SAMPLE_PATIENTS).forEach((id) => {
    const opt = document.createElement("option");
    opt.value = id;
    opt.textContent = id;
    caseSelect.appendChild(opt);
  });
}
populateCases();

// Back button
backBtn.addEventListener("click", () => {
  window.location.href = "patients.html";
});

// show preview when selecting
function showPreviewFor(caseId) {
  const s = SAMPLE_PATIENTS[caseId];
  if (!s) {
    previewBox.classList.add("hidden");
    selectedCase = null;
    return;
  }
  selectedCase = caseId;
  previewBox.classList.remove("hidden");
  previewImg.src = s.image;
  previewName.textContent = s.name;
  previewHospital.textContent = s.hospital;

  // auto-fill hospital input (user can edit)
  hospitalNameInput.value = s.hospital;
}
document.getElementById("loadPreview").addEventListener("click", () => {
  showPreviewFor(caseSelect.value);
});

// allow selecting by changing dropdown too
caseSelect.addEventListener("change", () => showPreviewFor(caseSelect.value));

// UPLOAD handlers (drag/drop + button)
uploadArea.addEventListener("click", () => fileInput.click());
uploadBtn.addEventListener("click", () => fileInput.click());

uploadArea.addEventListener("dragover", (e) => {
  e.preventDefault();
  uploadArea.classList.add("dragover");
});
uploadArea.addEventListener("dragleave", () =>
  uploadArea.classList.remove("dragover")
);
uploadArea.addEventListener("drop", (e) => {
  e.preventDefault();
  uploadArea.classList.remove("dragover");
  const f = e.dataTransfer.files && e.dataTransfer.files[0];
  if (f) handleFile(f);
});

fileInput.addEventListener("change", (e) => {
  const f = e.target.files && e.target.files[0];
  if (f) handleFile(f);
});

// file validation & preview
function handleFile(file) {
  const maxMB = 5;
  const allowed = ["image/png", "image/jpeg", "image/jpg"];
  if (!allowed.includes(file.type)) {
    alert("Only JPG/PNG allowed (demo).");
    return;
  }
  if (file.size > maxMB * 1024 * 1024) {
    alert("File too large. Max 5MB allowed.");
    return;
  }

  const reader = new FileReader();
  reader.onload = function (ev) {
    uploaded = {
      name: file.name,
      size: file.size,
      dataURL: ev.target.result,
    };
    fileMeta.classList.remove("hidden");
    fileThumb.src = uploaded.dataURL;
    fileNameEl.textContent = uploaded.name;
    fileSizeEl.textContent = `${(uploaded.size / 1024).toFixed(0)} KB`;
  };
  reader.readAsDataURL(file);
}

removeFileBtn.addEventListener("click", () => {
  uploaded = null;
  fileMeta.classList.add("hidden");
  fileThumb.src = "";
});

// VERIFY FLOW
verifyBtn.addEventListener("click", async () => {
  // validation
  if (!selectedCase) {
    alert("Select a Case ID first.");
    return;
  }
  if (!uploaded) {
    alert("Upload a hospital document (JPG/PNG).");
    return;
  }
  if (!hospitalNameInput.value.trim()) {
    alert("Enter hospital name.");
    return;
  }

  // disable form
  verifyBtn.disabled = true;

  // build step elements
  stepsList.innerHTML = "";
  STEPS.forEach((s) => {
    const el = document.createElement("div");
    el.className = "step";
    el.innerHTML = `<span class="dot"></span><span class="stext">${s.text}</span>`;
    stepsList.appendChild(el);
  });

  overlay.classList.remove("hidden");

  // run steps sequentially
  let totalMs = 0;
  for (let i = 0; i < STEPS.length; i++) {
    const step = STEPS[i];
    await runStep(i, step.ms);
    totalMs += step.ms;
  }

  // after steps show result
  overlay.classList.add("hidden");
  showResult(selectedCase, hospitalNameInput.value.trim(), uploaded);

  verifyBtn.disabled = false;
});

// helper to run individual step
function runStep(index, ms) {
  return new Promise((resolve) => {
    const stepEls = document.querySelectorAll(".step");
    const el = stepEls[index];
    // animate
    el.classList.add("running");
    setTimeout(() => {
      el.classList.add("done");
      // small tick icon can be added visually by CSS change
      resolve();
    }, ms);
  });
}

// show result card and store verification
function showResult(caseId, hospitalName, uploadedFile) {
  // build metadata
  const now = Date.now();
  const totalSec = STEPS.reduce((s, st) => s + st.ms, 0) / 1000;
  // fill result area
  rCase.textContent = caseId;
  rHospital.textContent = hospitalName;
  rDoc.textContent = uploadedFile.name;
  rTime.textContent =
    new Date(now).toLocaleString() + ` · ${totalSec.toFixed(1)}s`;

  // store in localStorage under key pattern
  const storeValue = {
    verified: true,
    verifiedAt: now,
    verifier: "Hospital AI Bot (demo)",
    docName: uploadedFile.name,
    docPreview: uploadedFile.dataURL, // optional; demo only
  };
  try {
    localStorage.setItem(VER_KEY_PREFIX + caseId, JSON.stringify(storeValue));
  } catch (e) {
    console.warn("localStorage write failed", e);
  }

  // show result card
  resultCard.classList.remove("hidden");

  // dispatch a custom event to notify same-tab listeners (patients page usually listens to 'storage' for other tabs)
  window.dispatchEvent(
    new CustomEvent("needfund:verified", { detail: { caseId, storeValue } })
  );
}

// apply badge (visually mark the patient preview on this page)
applyBadgeBtn.addEventListener("click", () => {
  // simply show badge visually in preview area
  // also keep data in localStorage (already set)
  alert(
    "Verified badge applied to patient (demo). If patients page is open in another tab, it will update automatically via storage event."
  );
});

// back to cases
backToCasesBtn.addEventListener("click", () => {
  window.location.href = "patients.html";
});

// optional: listen for Enter key on upload area for accessibility
uploadArea.addEventListener("keydown", (e) => {
  if (e.key === "Enter" || e.key === " ") fileInput.click();
});

/* Accessibility: keyboard focus styles (prefers-reduced-motion fallback) */
if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
  // reduce animation: immediately mark steps done
  STEPS.forEach((s, i) => {
    const stepEls = document.querySelectorAll(".step");
    if (stepEls[i]) stepEls[i].classList.add("done");
  });
}

// Storage listener: when another tab verifies/unverifies, you can choose to show toast or update preview
window.addEventListener("storage", (e) => {
  if (e.key && e.key.startsWith(VER_KEY_PREFIX)) {
    // Example: if the verified item is for current selectedCase, reflect changes in preview UI
    const keyCase = e.key.replace(VER_KEY_PREFIX, "");
    if (keyCase === selectedCase) {
      const newVal = JSON.parse(e.newValue);
      // show small confirmation
      // (we keep UI simple here)
      previewBox.classList.add("verified-now");
    }
  }
});
