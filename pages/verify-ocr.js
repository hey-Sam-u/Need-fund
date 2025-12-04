/* verify-ocr.js
   Final working version (improved)
   - Reads ?case= from URL (or allow manual entry if missing)
   - Saves uploaded doc under needfund_doc_<CASE>
   - Saves extracted OCR under needfund_ocr_<CASE>
   - Emits localStorage event key 'needfund_event'
*/

/* CONSTANTS & SAMPLE DATA */
const DOC_KEY_PREFIX = "needfund_doc_";
const OCR_KEY_PREFIX = "needfund_ocr_";
const VER_KEY_PREFIX = "needfund_verified_";

const SAMPLE_OCR = {
  "NF-1021": {
    name: "Raj Kumar",
    dob: "1990-05-12",
    gender: "Male",
    id: "A-1021",
  },
  "NF-1022": {
    name: "Sita Devi",
    dob: "1986-11-03",
    gender: "Female",
    id: "B-2109",
  },
  "NF-1023": {
    name: "Vikram Singh",
    dob: "1978-02-20",
    gender: "Male",
    id: "C-3092",
  },
};

/* DOM refs */
const caseInput = document.getElementById("case-id");
const caseInfo = document.getElementById("case-info");

const dropArea = document.getElementById("drop-area");
const docInput = document.getElementById("doc-input");
const docInputBtn = document.getElementById("doc-input-btn");

const preview = document.getElementById("preview");
const docThumb = document.getElementById("doc-thumb");
const docName = document.getElementById("doc-name");
const docSize = document.getElementById("doc-size");
const retryBtn = document.getElementById("retry-btn");

const startBtn = document.getElementById("start-ocr");
const overlay = document.getElementById("ocr-overlay");
const stepsArea = document.getElementById("stepsArea");

const extracted = document.getElementById("extracted");
const extName = document.getElementById("ext-name");
const extDob = document.getElementById("ext-dob");
const extGender = document.getElementById("ext-gender");
const extId = document.getElementById("ext-id");

const confidenceVal = document.getElementById("confidence-val");
const meterFill = document.querySelector(".meter-fill");

const proceedBtn = document.getElementById("proceed-next");
const hospitalNameInput = document.getElementById("hospitalName");

const backLink = document.getElementById("backLink");

/* Steps and durations (ms) */
const STEPS = [
  { text: "Analyzing document clarity...", ms: 900 },
  { text: "Detecting text zones (OCR)...", ms: 1100 },
  { text: "Parsing fields (Name, DOB, Gender)...", ms: 1300 },
  { text: "Calculating confidence & anti-fraud checks...", ms: 900 },
];

/* transient state */
let CASE_ID = null;
let uploadedFile = null; // {name,size,dataURL,uploadedAt}

/* Utility - read case from URL ?case= */
function readCaseFromURL() {
  const params = new URLSearchParams(window.location.search);
  const c = params.get("case");
  return c ? c.toUpperCase() : null;
}

/* initialize page */
function init() {
  CASE_ID = readCaseFromURL();

  // ensure overlay hidden on load
  overlay.classList.add("hidden");

  if (!CASE_ID) {
    // allow manual entry fallback
    caseInput.value = "";
    caseInput.removeAttribute("readonly");
    caseInfo.textContent =
      "No case in URL — type case (e.g. NF-1023) and press Enter";
    caseInput.placeholder = "Type case ID and press Enter";
    // set up Enter handler to set CASE_ID
    caseInput.addEventListener("keydown", function onManualEnter(e) {
      if (e.key === "Enter") {
        const val = caseInput.value.trim().toUpperCase();
        if (!val) {
          alert("Please enter a Case ID (e.g. NF-1023)");
          return;
        }
        CASE_ID = val;
        caseInput.value = CASE_ID;
        caseInput.setAttribute("readonly", "");
        caseInput.removeEventListener("keydown", onManualEnter);
        caseInfo.textContent = "Manual case set — you can upload and proceed";
        // try restoring stored doc/ocr if present
        restoreStoredForCase();
      }
    });
  } else {
    // use CASE_ID from URL
    caseInput.value = CASE_ID;
    caseInput.setAttribute("readonly", "");
    if (SAMPLE_OCR[CASE_ID]) {
      caseInfo.textContent = `${SAMPLE_OCR[CASE_ID].name} · ${SAMPLE_OCR[CASE_ID].id}`;
    } else {
      caseInfo.textContent = "Unknown case (demo will generate values)";
    }
    // restore any stored doc/ocr
    restoreStoredForCase();
  }

  // defensive: ensure start/proceed disabled until proper state
  startBtn.disabled = true;
  proceedBtn.disabled = true;
}

/* restore any stored doc or ocr for current CASE_ID */
function restoreStoredForCase() {
  if (!CASE_ID) return;
  const docKey = DOC_KEY_PREFIX + CASE_ID;
  const stored = localStorage.getItem(docKey);
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      restoreDocPreview(parsed);
    } catch (e) {}
  }
  const ocrKey = OCR_KEY_PREFIX + CASE_ID;
  const ocrStored = localStorage.getItem(ocrKey);
  if (ocrStored) {
    try {
      const parsed = JSON.parse(ocrStored);
      fillExtracted(parsed);
      proceedBtn.disabled = false;
    } catch (e) {}
  }
}

/* ------------------ File handling ------------------ */

/* click handlers */
docInputBtn.addEventListener("click", () => docInput.click());
dropArea.addEventListener("click", () => docInput.click());

/* drag/drop UX */
dropArea.addEventListener("dragover", (e) => {
  e.preventDefault();
  dropArea.classList.add("dragover");
});
dropArea.addEventListener("dragleave", () => {
  dropArea.classList.remove("dragover");
});
dropArea.addEventListener("drop", (e) => {
  e.preventDefault();
  dropArea.classList.remove("dragover");
  const f = e.dataTransfer.files && e.dataTransfer.files[0];
  if (f) handleFile(f);
});

/* file input change */
docInput.addEventListener("change", (e) => {
  const f = e.target.files && e.target.files[0];
  if (f) handleFile(f);
});

/* handle file: validate and preview */
function handleFile(file) {
  const allowed = ["image/png", "image/jpeg", "image/jpg"];
  const maxMB = 5;
  if (!allowed.includes(file.type)) {
    alert("Only JPG/PNG files allowed (demo).");
    return;
  }
  if (file.size > maxMB * 1024 * 1024) {
    alert("File too large. Max 5MB.");
    return;
  }

  const reader = new FileReader();
  reader.onload = function (ev) {
    uploadedFile = {
      name: file.name,
      size: file.size,
      dataURL: ev.target.result,
      uploadedAt: Date.now(),
    };
    showPreview(uploadedFile);
    // save doc to localStorage under DOC_KEY_PREFIX (optional demo)
    try {
      if (CASE_ID)
        localStorage.setItem(
          DOC_KEY_PREFIX + CASE_ID,
          JSON.stringify(uploadedFile)
        );
      localStorage.setItem(
        "needfund_event",
        JSON.stringify({
          type: "doc",
          case: CASE_ID || "UNKNOWN",
          time: Date.now(),
        })
      );
    } catch (e) {
      console.warn("localStorage write failed", e);
    }
  };
  reader.readAsDataURL(file);
}

/* show preview UI */
function showPreview(fileObj) {
  docThumb.src = fileObj.dataURL;
  docName.textContent = fileObj.name;
  docSize.textContent = `${Math.round(fileObj.size / 1024)} KB`;
  preview.classList.remove("hidden");
  startBtn.disabled = false;
}

/* restore preview from stored doc */
function restoreDocPreview(parsed) {
  uploadedFile = parsed;
  if (parsed && parsed.dataURL) {
    showPreview(parsed);
  }
}

/* remove file */
retryBtn.addEventListener("click", () => {
  uploadedFile = null;
  preview.classList.add("hidden");
  startBtn.disabled = true;
  // remove stored doc
  try {
    if (CASE_ID) localStorage.removeItem(DOC_KEY_PREFIX + CASE_ID);
    localStorage.setItem(
      "needfund_event",
      JSON.stringify({
        type: "doc-removed",
        case: CASE_ID || "UNKNOWN",
        time: Date.now(),
      })
    );
  } catch (e) {}
  // hide extracted as well
  extracted.classList.add("hidden");
  proceedBtn.disabled = true;
});

/* ------------------ OCR flow ------------------ */

/* start OCR handler */
startBtn.addEventListener("click", async (ev) => {
  // If CASE_ID missing at click time, attempt to read manual input
  if (!CASE_ID) {
    const manual = caseInput.value.trim().toUpperCase();
    if (manual) {
      CASE_ID = manual;
      caseInput.value = CASE_ID;
      caseInput.setAttribute("readonly", "");
      caseInfo.textContent = "Manual case set — you can proceed";
    }
  }

  if (!CASE_ID) {
    alert(
      "Case ID not set. Add ?case=NF-1023 to URL or type case ID in the Case ID box."
    );
    return;
  }
  if (!uploadedFile) {
    alert("Please upload a document first.");
    return;
  }
  if (!hospitalNameInput.value.trim()) {
    alert("Enter hospital name.");
    return;
  }

  // disable inputs
  startBtn.disabled = true;
  docInput.disabled = true;
  docInputBtn.disabled = true;
  dropArea.setAttribute("aria-hidden", "true");

  // build steps UI
  stepsArea.innerHTML = "";
  STEPS.forEach((s) => {
    const div = document.createElement("div");
    div.className = "ocr-step";
    div.innerHTML = `<span class="dot" aria-hidden></span><span class="stext">${s.text}</span>`;
    stepsArea.appendChild(div);
  });

  // show overlay and focus trap
  overlay.classList.remove("hidden");
  // keep track of last focus
  const lastFocus = document.activeElement;
  overlay.querySelector(".overlay-panel").focus?.();

  // sequentially run steps
  let totalMs = 0;
  for (let i = 0; i < STEPS.length; i++) {
    const s = STEPS[i];
    await runOcrStep(i, s.ms);
    totalMs += s.ms;
  }

  // done: hide overlay
  overlay.classList.add("hidden");
  lastFocus && lastFocus.focus?.();

  // compute extracted fields
  const extractedObj = buildExtracted(CASE_ID);
  extractedObj.extractedAt = Date.now();
  extractedObj.processingMs = totalMs;

  // Save OCR to localStorage under OCR_KEY_PREFIX
  try {
    localStorage.setItem(
      OCR_KEY_PREFIX + CASE_ID,
      JSON.stringify(extractedObj)
    );
    localStorage.setItem(
      "needfund_event",
      JSON.stringify({ type: "ocr", case: CASE_ID, time: Date.now() })
    );
  } catch (e) {
    console.warn("localStorage write failed", e);
  }

  // show UI result
  fillExtracted(extractedObj);

  // enable proceed
  proceedBtn.disabled = false;
  proceedBtn.removeAttribute("aria-disabled");
});

/* run a single step: reveal then mark done after ms */
function runOcrStep(index, ms) {
  return new Promise((resolve) => {
    const nodes = document.querySelectorAll(".ocr-step");
    const el = nodes[index];
    if (!el) {
      setTimeout(resolve, ms);
      return;
    }
    // reveal (fade) + then mark done
    el.style.opacity = 1;
    setTimeout(() => {
      el.classList.add("done");
      resolve();
    }, ms);
  });
}

/* build extracted object using sample mapping or generated values */
function buildExtracted(caseId) {
  const base = SAMPLE_OCR[caseId];
  let name, dob, gender, id;
  if (base) {
    name = base.name;
    dob = base.dob;
    gender = base.gender;
    id = base.id;
  } else {
    name = "Ajay Verma";
    dob = "1988-07-11";
    gender = ["Male", "Female"][Math.floor(Math.random() * 2)];
    id = "D-" + Math.floor(1000 + Math.random() * 9000);
  }
  const raw = 88 + Math.random() * 10; // 88..98
  const confidence = Math.round(raw * 10) / 10;
  return { name, dob, gender, id, confidence };
}

/* fill UI with extracted */
function fillExtracted(obj) {
  extName.textContent = obj.name;
  extDob.textContent = obj.dob;
  extGender.textContent = obj.gender;
  extId.textContent = obj.id;

  confidenceVal.textContent = `${obj.confidence}%`;
  // animate meter (circle r=40 => circumference ~251.327)
  const circ = 2 * Math.PI * 40;
  const pct = Math.max(0, Math.min(100, obj.confidence));
  const offset = circ * (1 - pct / 100);
  if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    meterFill.style.transition =
      "stroke-dashoffset 900ms cubic-bezier(.2,.9,.3,1)";
  } else {
    meterFill.style.transition = "none";
  }
  meterFill.style.strokeDashoffset = offset;
  extracted.classList.remove("hidden");
}

/* proceed button - navigate to next step (example: verify-face.html) */
proceedBtn.addEventListener("click", () => {
  if (!CASE_ID) return;
  window.location.href = `verify-face.html?case=${encodeURIComponent(CASE_ID)}`;
});

/* retry / undo OCR */
retryBtn.addEventListener("click", () => {
  uploadedFile = null;
  preview.classList.add("hidden");
  startBtn.disabled = true;
  try {
    if (CASE_ID) localStorage.removeItem(DOC_KEY_PREFIX + CASE_ID);
    if (CASE_ID) localStorage.removeItem(OCR_KEY_PREFIX + CASE_ID);
    localStorage.setItem(
      "needfund_event",
      JSON.stringify({
        type: "ocr-removed",
        case: CASE_ID || "UNKNOWN",
        time: Date.now(),
      })
    );
  } catch (e) {}
  extracted.classList.add("hidden");
  proceedBtn.disabled = true;
});

/* helper: restore stored doc preview if present (called within init) */
function restoreDocPreview(parsedDoc) {
  if (parsedDoc && parsedDoc.dataURL) {
    uploadedFile = parsedDoc;
    showPreview(parsedDoc);
    startBtn.disabled = false;
  }
}

/* accessibility: start on Enter key when Start OCR focused */
startBtn.addEventListener("keyup", (e) => {
  if (e.key === "Enter" && !startBtn.disabled) startBtn.click();
});

/* overlay keyboard handler (focus trap) */
overlay.addEventListener("keydown", (e) => {
  if (e.key === "Tab" && !overlay.classList.contains("hidden")) {
    const panel = overlay.querySelector(".overlay-panel");
    const focusable = panel.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  } else if (e.key === "Escape") {
    // do not close overlay during processing
    e.preventDefault();
  }
});

/* Storage listener: update UI if other tab writes OCR for same case */
window.addEventListener("storage", (e) => {
  if (e.key && e.key.startsWith(OCR_KEY_PREFIX)) {
    const keyCase = e.key.replace(OCR_KEY_PREFIX, "");
    if (keyCase === CASE_ID && e.newValue) {
      try {
        const parsed = JSON.parse(e.newValue);
        fillExtracted(parsed);
        proceedBtn.disabled = false;
      } catch (e) {}
    }
  }
});

// Smooth scroll for "verify face"
const faceverifyBtn = document.getElementById("faceverifyBtn");
faceverifyBtn.addEventListener("click", () => {
  window.location.href = "verify-face.html";
});

/* init on load */
init();
