/* --------------------------
   CONSTANTS / STORAGE PREFIX
---------------------------*/
const VER_KEY_PREFIX = "needfund_verified_";

/* UI elements */
const caseInput = document.getElementById("case-input");
const loadBtn = document.getElementById("load-btn");
const summaryBox = document.getElementById("summary-box");

const tileOCR = document.getElementById("tile-ocr").querySelector("span");
const tileFace = document.getElementById("tile-face").querySelector("span");
const tileHolo = document.getElementById("tile-holo").querySelector("span");
const tileScore = document.getElementById("tile-score").querySelector("span");

const manualFields = document.getElementById("manual-fields");
const manualName = document.getElementById("manual-name");
const manualHospital = document.getElementById("manual-hospital");

const applyBtn = document.getElementById("apply-verify");

const seal = document.getElementById("seal");
const sealText = document.getElementById("seal-text");

const certificate = document.getElementById("certificate");
const certName = document.getElementById("cert-name");
const certCase = document.getElementById("cert-case");
const certHospital = document.getElementById("cert-hospital");
const certTime = document.getElementById("cert-time");

const downloadBtn = document.getElementById("download-cert");
const undoBtn = document.getElementById("undo-verify");
const loader = document.getElementById("loader-overlay");

document.getElementById("back-btn").onclick = () => history.back();

/* --------------------------
   LOAD CASE DATA
---------------------------*/
loadBtn.onclick = () => {
  const CASE = caseInput.value.trim();
  if (!CASE) return alert("Enter Case ID");

  summaryBox.classList.remove("hidden");

  // Read dummy stored values if exist (from other pages)
  const ocr = JSON.parse(
    localStorage.getItem("needfund_ocr_" + CASE) || "null"
  );
  const face = JSON.parse(
    localStorage.getItem("needfund_face_" + CASE) || "null"
  );
  const holo = JSON.parse(
    localStorage.getItem("needfund_holo_" + CASE) || "null"
  );
  const doc = JSON.parse(
    localStorage.getItem("needfund_doc_" + CASE) || "null"
  );

  // Fill tiles
  tileOCR.textContent = ocr ? "Present" : "No data — manual allowed";
  tileFace.textContent = face ? face.score + "%" : "No data";
  tileHolo.textContent = holo ? "Detected" : "Not detected";
  tileScore.textContent = "—";

  // Allow manual fields
  manualFields.classList.remove("hidden");

  // If OCR had basic info, fill
  if (ocr?.name) manualName.value = ocr.name;
  if (doc?.hospital) manualHospital.value = doc.hospital;
};

/* --------------------------
   APPLY VERIFICATION
---------------------------*/
applyBtn.onclick = () => {
  const CASE = caseInput.value.trim();
  if (!CASE) return alert("Enter Case ID first");

  // Collect sources again
  const ocr = JSON.parse(
    localStorage.getItem("needfund_ocr_" + CASE) || "null"
  );
  const face = JSON.parse(
    localStorage.getItem("needfund_face_" + CASE) || "null"
  );
  const holo = JSON.parse(
    localStorage.getItem("needfund_holo_" + CASE) || "null"
  );

  let score = 0;

  if (ocr) score += 30;
  if (face) score += Math.min(50, face.score * 0.5);
  if (holo) score += 20;

  score = Math.min(100, Math.round(score));

  tileScore.textContent = score;

  let status = "NOT_VERIFIED";
  if (score >= 75) status = "VERIFIED";
  else if (score >= 60) status = "REVIEW";

  // Show loader for 1s
  loader.classList.remove("hidden");

  setTimeout(() => {
    loader.classList.add("hidden");

    // Show seal
    sealText.textContent = status.replace("_", " ");
    seal.classList.remove("hidden");

    // Show certificate
    certificate.classList.remove("hidden");

    // Fill certificate
    certName.textContent = manualName.value || "—";
    certCase.textContent = CASE;
    certHospital.textContent = manualHospital.value || "—";
    certTime.textContent = new Date().toLocaleString();

    // Save final object
    const obj = {
      verified: status === "VERIFIED",
      status,
      score,
      verifiedAt: Date.now(),
      verifier: "Hospital AI Bot (demo)",
      sources: {
        ocr: !!ocr,
        face: face || null,
        holo: !!holo,
      },
      name: manualName.value || null,
      hospital: manualHospital.value || null,
    };

    localStorage.setItem(VER_KEY_PREFIX + CASE, JSON.stringify(obj));

    localStorage.setItem(
      "needfund_event",
      JSON.stringify({
        type: "verified",
        case: CASE,
        time: Date.now(),
      })
    );
  }, 1000);
};

/* --------------------------
   DOWNLOAD CERTIFICATE
---------------------------*/
downloadBtn.onclick = () => {
  window.print();
};

/* --------------------------
   UNDO VERIFICATION
---------------------------*/
undoBtn.onclick = () => {
  const CASE = caseInput.value.trim();
  if (!CASE) return;

  localStorage.removeItem(VER_KEY_PREFIX + CASE);

  seal.classList.add("hidden");
  certificate.classList.add("hidden");
  summaryBox.classList.remove("hidden");
  tileScore.textContent = "—";
};
const donateBtn = document.getElementById("donateBtn");
donateBtn.addEventListener("click", () => {
  window.location.href = "admin-dashboard.html";
});
