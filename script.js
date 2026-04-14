// script.js — Day 4 (Before/After Slider)

const CLOUD_NAME = "dfyqteuvt";
const UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;

const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const snapBtn = document.getElementById("snapBtn");
const startBtn = document.getElementById("startBtn");
const flipBtn = document.getElementById("flipBtn");
const preview = document.getElementById("preview");
const placeholder = document.getElementById("placeholder");
const status = document.getElementById("status");
const beforeImg = document.getElementById("beforeImg");
const afterImg = document.getElementById("afterImg");
const beforeWrap = document.getElementById("beforeWrap");
const divider = document.getElementById("divider");
const compareBox = document.getElementById("compareBox");

let currentFacing = "user";
let stream = null;
let isDragging = false;

// ── Camera controls ──────────────────────────────

async function startCamera() {
  setStatus("Starting camera...");
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: currentFacing },
      audio: false,
    });
    video.srcObject = stream;
    video.classList.remove("hidden");
    placeholder.classList.add("hidden");
    startBtn.disabled = true;
    snapBtn.disabled = false;
    flipBtn.disabled = false;
    setStatus("Camera ready! Strike a pose 😊");
  } catch {
    setStatus("Could not access camera. Please allow permission.");
  }
}

async function flipCamera() {
  if (stream) stream.getTracks().forEach((t) => t.stop());
  currentFacing = currentFacing === "user" ? "environment" : "user";
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: currentFacing },
      audio: false,
    });
    video.srcObject = stream;
    video.style.transform =
      currentFacing === "user" ? "scaleX(-1)" : "scaleX(1)";
    setStatus("Camera switched!");
  } catch {
    setStatus("Could not switch camera.");
  }
}

// ── Take photo + upload ───────────────────────────

async function takePhoto() {
  const ctx = canvas.getContext("2d");
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  ctx.drawImage(video, 0, 0);

  const originalDataUrl = canvas.toDataURL("image/jpeg");

  document.querySelector(".camera-box").classList.add("hidden");
  document.querySelector(".controls").classList.add("hidden");
  preview.classList.remove("hidden");
  setStatus("Uploading photo... ⏳");

  try {
    const blob = await new Promise((resolve) =>
      canvas.toBlob(resolve, "image/jpeg")
    );
    const formData = new FormData();
    formData.append("file", blob);
    formData.append("upload_preset", "clearsnap_preset");

    setStatus("AI is retouching your skin... ✨");
    const res = await fetch(UPLOAD_URL, { method: "POST", body: formData });
    const data = await res.json();

    if (data.secure_url) {
      const publicId = data.public_id;
      const transforms =
        "e_improve:60,e_sharpen:50,e_brightness:10,e_saturation:15";
      const retouchedUrl =
        "https://res.cloudinary.com/" +
        CLOUD_NAME +
        "/image/upload/" +
        transforms +
        "/" +
        publicId +
        ".jpg";
      console.log("Retouched URL:", retouchedUrl);

      // After sits behind, full size
      afterImg.src = retouchedUrl;
      afterImg.style.transform = "scaleX(-1)";
      afterImg.style.position = "absolute";
      afterImg.style.top = "0";
      afterImg.style.left = "0";
      afterImg.style.width = "100%";
      afterImg.style.height = "100%";
      afterImg.style.objectFit = "cover";

      // Before sits on top inside clipping wrap
      beforeImg.src = originalDataUrl;
      beforeImg.style.transform = "scaleX(-1)";
      beforeImg.style.width = compareBox.offsetWidth + "px";
      beforeImg.style.height = "100%";
      beforeImg.style.objectFit = "cover";

      // Wait for after image to load then reset slider
      afterImg.onload = () => {
        setSlider(50);
        document.getElementById("downloadBtn").disabled = false;
      };

      // Reset slider to 50% when new photo loads
      setSlider(50);
      setStatus("Drag the slider to compare! 👆");
    } else {
      setStatus("Upload failed. Check your Cloudinary preset.");
    }
  } catch {
    setStatus("Something went wrong. Try again!");
  }
}

// ── Before/after slider logic ─────────────────────

function setSlider(percent) {
  beforeWrap.style.width = percent + "%";
  divider.style.left = percent + "%";
}

function getPercent(e) {
  const rect = compareBox.getBoundingClientRect();
  const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
  return Math.min(100, Math.max(0, (x / rect.width) * 100));
}

// Mouse events
compareBox.addEventListener("mousedown", () => (isDragging = true));
document.addEventListener("mouseup", () => (isDragging = false));
document.addEventListener("mousemove", (e) => {
  if (isDragging) setSlider(getPercent(e));
});

// Touch events (mobile)
compareBox.addEventListener("touchstart", () => (isDragging = true), {
  passive: true,
});
compareBox.addEventListener("touchend", () => (isDragging = false), {
  passive: true,
});
compareBox.addEventListener(
  "touchmove",
  (e) => {
    if (isDragging) setSlider(getPercent(e));
  },
  { passive: true }
);

// ── Retake ────────────────────────────────────────

function retakePhoto() {
  document.querySelector(".camera-box").classList.remove("hidden");
  document.querySelector(".controls").classList.remove("hidden");
  preview.classList.add("hidden");
  setStatus("Ready when you are!");
}

// Download the retouched photo
function downloadPhoto() {
  const link = document.createElement("a");
  link.href = afterImg.src;
  link.download = "clearsnap-retouched.jpg";
  link.target = "_blank";
  link.click();
}

function setStatus(msg) {
  status.textContent = msg;
}

// Share the app link
async function shareApp() {
  const shareData = {
    title: "ClearSnap — Acne-Free Photobooth",
    text: "Take a photo and let AI clear your skin! Try ClearSnap 👇",
    url: window.location.href,
  };

  try {
    if (navigator.share) {
      await navigator.share(shareData);
      setStatus("Thanks for sharing! 🙌");
    } else {
      // Fallback for desktop — copy link to clipboard
      await navigator.clipboard.writeText(window.location.href);
      setStatus("Link copied to clipboard! 📋");
    }
  } catch (err) {
    setStatus("Could not share. Try copying the link manually.");
  }
}
