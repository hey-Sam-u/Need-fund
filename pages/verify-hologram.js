/* verify-hologram.js
   Demo hologram verification (frontend only).
   Saves doc under needfund_doc_<CASE>, hologram under needfund_holo_<CASE>
*/

const DOC_KEY_PREFIX = "needfund_doc_";
const HOLO_KEY_PREFIX = "needfund_holo_";
const EVENT_KEY = "needfund_event";

const caseInput = document.getElementById("case-id");
const caseHint = document.getElementById("case-hint");

const dropArea = document.getElementById("drop-area");
const docInput = document.getElementById("doc-input");
const docInputBtn = document.getElementById("doc-input-btn");

const preview = document.getElementById("preview");
const docThumb = document.getElementById("doc-thumb");
const docName = document.getElementById("doc-name");
const docSize = document.getElementById("doc-size");
const removeDocBtn = document.getElementById("remove-doc");
const keepDocBtn = document.getElementById("keep-doc");

const startBtn = document.getElementById("start-holo");
const retryBtn = document.getElementById("holo-retry");
const proceedBtn = document.getElementById("holo-proceed");

const holoResult = document.getElementById("holo-result");
const holoTime = document.getElementById("holo-time");
const fingerprintEl = document.getElementById("fingerprint");

const overlay = document.getElementById("holo-overlay");
const stepsArea = document.getElementById("stepsArea");
const laserLine = document.getElementById("laser-line");
const docPreviewMini = document.getElementById("doc-preview-mini");
const overlayCancel = document.getElementById("overlay-cancel");

const STEPS = [
  { text: "Initializing hologram scanner…", ms: 900 },
  { text: "Scanning security features…", ms: 1100 },
  { text: "Verifying microprints & UV patterns…", ms: 1400 },
  { text: "Generating document fingerprint…", ms: 900 },
];

let CASE_ID = null;
let uploadedDoc = null;
let cancelRequested = false;

/* helpers: resolve case id from active_case -> ?case -> manual */
function getCaseFromStorage() {
  const c = localStorage.getItem("active_case");
  return c ? c.toUpperCase() : null;
}
function getCaseFromURL() {
  const p = new URLSearchParams(window.location.search);
  return p.get("case") ? p.get("case").toUpperCase() : null;
}

/* init */
function init() {
  CASE_ID = getCaseFromStorage() || getCaseFromURL() || null;
  if (CASE_ID) {
    caseInput.value = CASE_ID;
    caseInput.setAttribute("readonly", "");
    caseHint.textContent = `Case: ${CASE_ID}`;
    loadDocPreview(CASE_ID);
    loadHoloResult(CASE_ID);
  } else {
    caseHint.textContent = "Type case ID (any dummy allowed)";
    caseInput.removeAttribute("readonly");
    caseInput.placeholder = "e.g. NF-1023";
    caseInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        const v = caseInput.value.trim().toUpperCase();
        if (!v) return alert("Enter case ID");
        CASE_ID = v;
        caseInput.setAttribute("readonly", "");
        caseHint.textContent = `Case: ${CASE_ID}`;
        // try load saved doc/result
        loadDocPreview(CASE_ID);
        loadHoloResult(CASE_ID);
        localStorage.setItem("active_case", CASE_ID);
      }
    });
  }

  /* wire upload */
  docInputBtn.addEventListener("click", () => docInput.click());
  dropArea.addEventListener("click", () => docInput.click());

  dropArea.addEventListener("dragover", (e) => {
    e.preventDefault();
    dropArea.classList.add("dragover");
  });
  dropArea.addEventListener("dragleave", () =>
    dropArea.classList.remove("dragover")
  );
  dropArea.addEventListener("drop", (e) => {
    e.preventDefault();
    dropArea.classList.remove("dragover");
    const f = e.dataTransfer.files && e.dataTransfer.files[0];
    if (f) handleFile(f);
  });

  docInput.addEventListener("change", (e) => {
    const f = e.target.files && e.target.files[0];
    if (f) handleFile(f);
  });

  removeDocBtn.addEventListener("click", removeDoc);
  keepDocBtn.addEventListener("click", () =>
    alert("Keeping document for this case (demo).")
  );

  startBtn.addEventListener("click", startHologram);
  retryBtn.addEventListener("click", clearHoloResult);
  proceedBtn.addEventListener("click", () => {
    if (!CASE_ID) return;
    window.location.href = `verify-final.html?case=${encodeURIComponent(
      CASE_ID
    )}`;
  });

  overlayCancel.addEventListener("click", () => {
    // request cancel and let process stop gracefully
    cancelRequested = true;
  });

  // storage listener (other tab)
  window.addEventListener("storage", (e) => {
    if (!e.key) return;
    if (e.key === "active_case") {
      const newC = e.newValue ? e.newValue.toUpperCase() : null;
      if (newC && newC !== CASE_ID) {
        CASE_ID = newC;
        caseInput.value = CASE_ID;
        caseInput.setAttribute("readonly", "");
        caseHint.textContent = `Case: ${CASE_ID}`;
        loadDocPreview(CASE_ID);
        loadHoloResult(CASE_ID);
      }
    }
    if (CASE_ID && e.key === DOC_KEY_PREFIX + CASE_ID) loadDocPreview(CASE_ID);
    if (CASE_ID && e.key === HOLO_KEY_PREFIX + CASE_ID) loadHoloResult(CASE_ID);
  });
}

/* handle file upload */
function handleFile(file) {
  const allowed = ["image/png", "image/jpeg", "image/jpg"];
  if (!allowed.includes(file.type)) {
    alert("Only JPG/PNG allowed (demo).");
    return;
  }
  if (file.size > 5 * 1024 * 1024) {
    alert("Max 5MB.");
    return;
  }

  const reader = new FileReader();
  reader.onload = function (ev) {
    uploadedDoc = {
      name: file.name,
      size: file.size,
      dataURL: ev.target.result,
      uploadedAt: Date.now(),
    };
    showPreview(uploadedDoc);
    // store under doc key if CASE_ID present, otherwise store after user sets case (store with "UNKNOWN" for demo)
    const keyCase = CASE_ID || "UNKNOWN";
    try {
      localStorage.setItem(
        DOC_KEY_PREFIX + keyCase,
        JSON.stringify(uploadedDoc)
      );
      localStorage.setItem(
        EVENT_KEY,
        JSON.stringify({ type: "doc", case: keyCase, time: Date.now() })
      );
    } catch (e) {
      console.warn("ls fail", e);
    }
  };
  reader.readAsDataURL(file);
}

/* show preview */
function showPreview(obj) {
  docThumb.src = obj.dataURL;
  docName.textContent = obj.name;
  docSize.textContent = `${Math.round(obj.size / 1024)} KB`;
  preview.classList.remove("hidden");
  // set mini preview in overlay
  docPreviewMini.style.backgroundImage = `url('${obj.dataURL}')`;
  docPreviewMini.classList.remove("hidden");
  startBtn.disabled = false;
}

/* remove doc */
function removeDoc() {
  uploadedDoc = null;
  preview.classList.add("hidden");
  docThumb.src = "";
  startBtn.disabled = true;
  if (CASE_ID) {
    localStorage.removeItem(DOC_KEY_PREFIX + CASE_ID);
    localStorage.setItem(
      EVENT_KEY,
      JSON.stringify({ type: "doc-removed", case: CASE_ID, time: Date.now() })
    );
  }
}

/* load doc preview from storage */
function loadDocPreview(caseId) {
  if (!caseId) return;
  const raw = localStorage.getItem(DOC_KEY_PREFIX + caseId);
  if (!raw) {
    // nothing
    preview.classList.add("hidden");
    startBtn.disabled = true;
    return;
  }
  try {
    const obj = JSON.parse(raw);
    uploadedDoc = obj;
    showPreview(obj);
  } catch (e) {}
}

/* start hologram scanning flow */
async function startHologram() {
  // ensure CASE_ID exists
  if (!CASE_ID) {
    const val = caseInput.value.trim().toUpperCase();
    if (!val) {
      alert("Enter Case ID");
      return;
    }
    CASE_ID = val;
    caseInput.setAttribute("readonly", "");
    caseHint.textContent = `Case: ${CASE_ID}`;
    localStorage.setItem("active_case", CASE_ID);
    // attempt to load any stored doc saved under this case
    loadDocPreview(CASE_ID);
  }

  // require doc
  const docKey = DOC_KEY_PREFIX + CASE_ID;
  if (!localStorage.getItem(docKey) && !uploadedDoc) {
    alert("Please upload document first.");
    return;
  }

  // reset cancel flag
  cancelRequested = false;

  // show overlay
  overlay.classList.remove("hidden");
  laserLine.classList.add("laser-anim");

  // build steps
  stepsArea.innerHTML = "";
  STEPS.forEach((s) => {
    const el = document.createElement("div");
    el.className = "step";
    el.textContent = s.text;
    stepsArea.appendChild(el);
  });

  // run sequentially
  for (let i = 0; i < STEPS.length; i++) {
    if (cancelRequested) break;
    const s = STEPS[i];
    await waitMs(s.ms);
    if (cancelRequested) break;
    const node = stepsArea.children[i];
    if (node) node.classList.add("done");
  }

  // stop laser
  laserLine.classList.remove("laser-anim");

  if (cancelRequested) {
    overlay.classList.add("hidden");
    cancelRequested = false;
    return;
  }

  // generate fingerprint and animate typing
  const fp = generateFingerprint();
  overlay.classList.add("hidden");
  holoResult.classList.remove("hidden");
  proceedBtn.disabled = false;
  holoTime.textContent = `Verified at ${new Date().toLocaleString()}`;

  // type fingerprint
  fingerprintEl.textContent = "";
  let idx = 0;
  const t = setInterval(() => {
    fingerprintEl.textContent += fp[idx] || "";
    idx++;
    if (idx >= fp.length) {
      clearInterval(t);
      saveResult(CASE_ID, fp);
    }
  }, 28);
}

/* helper wait */
function waitMs(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

/* generate 32-char hex fingerprint */
function generateFingerprint() {
  const chars = "abcdef0123456789";
  let s = "";
  for (let i = 0; i < 32; i++)
    s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

/* save holo result */
function saveResult(caseId, fingerprint) {
  try {
    const docKey = DOC_KEY_PREFIX + caseId;
    localStorage.setItem(
      HOLO_KEY_PREFIX + caseId,
      JSON.stringify({ fingerprint, checkedAt: Date.now(), docRef: docKey })
    );
    localStorage.setItem(
      EVENT_KEY,
      JSON.stringify({ type: "holo", case: caseId, time: Date.now() })
    );
  } catch (e) {
    console.warn("save failed", e);
  }
}

/* clear holo result */
function clearHoloResult() {
  if (!CASE_ID) {
    alert("No case selected");
    return;
  }
  localStorage.removeItem(HOLO_KEY_PREFIX + CASE_ID);
  localStorage.setItem(
    EVENT_KEY,
    JSON.stringify({ type: "holo-removed", case: CASE_ID, time: Date.now() })
  );
  holoResult.classList.add("hidden");
  proceedBtn.disabled = true;
}

/* load existing holo result */
function loadHoloResult(caseId) {
  if (!caseId) return;
  const raw = localStorage.getItem(HOLO_KEY_PREFIX + caseId);
  if (!raw) return;
  try {
    const obj = JSON.parse(raw);
    holoResult.classList.remove("hidden");
    fingerprintEl.textContent = obj.fingerprint || "";
    holoTime.textContent = `Verified at ${new Date(
      obj.checkedAt
    ).toLocaleString()}`;
    proceedBtn.disabled = false;
  } catch (e) {}
}

/* init on load */
init();
