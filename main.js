/***********************
 * CONFIG
 ***********************/
const CIRCLE_SCREEN_SIZE = 100;

/***********************
 * GLOBALS
 ***********************/
let plotCircles = [];
let locationMarkers = [];

let activePlot = null;
let blinkTimer = null;

/***********************
 * DOM
 ***********************/
const container = document.querySelector(".image-container");
const plotCard = document.getElementById("plotCard");
const cardPlot = document.getElementById("cardPlot");
const cardSize = document.getElementById("cardSize");
const cardStatus = document.getElementById("cardStatus");
const cardRemarks = document.getElementById("cardRemarks");
const closeCard = document.getElementById("closeCard");

/***********************
 * PANORAMA
 ***********************/
const panorama = new PANOLENS.ImagePanorama("images/panorama.jpg");

const viewer = new PANOLENS.Viewer({
  container,
  autoRotate: true,
  autoRotateSpeed: 0.3,
});

viewer.add(panorama);
container.style.cursor = "move";

// plots always upright
viewer.addUpdateCallback(() => {
  plotCircles.forEach((mesh) => {
    mesh.lookAt(viewer.camera.position);
    mesh.rotation.z = 0;
  });
});

/***********************
 * SHEET URLS
 ***********************/
const PLOT_SHEET_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vQ4kxCdoeLrM_mn4SxCkoalBkZHYASdwrCUiuKZsBMX5TrUKZePAy5gmZlOuaRAG6-LYFL6SEtJ3HK3/pub?gid=0&single=true&output=csv";

const LOCATION_SHEET_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vQ4kxCdoeLrM_mn4SxCkoalBkZHYASdwrCUiuKZsBMX5TrUKZePAy5gmZlOuaRAG6-LYFL6SEtJ3HK3/pub?gid=34569269&single=true&output=csv";

/***********************
 * TEXTURES
 ***********************/
function createSquareTexture(color) {
  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = color;
  ctx.fillRect(8, 8, size - 16, size - 16);

  ctx.strokeStyle = "#fff";
  ctx.lineWidth = 3;
  ctx.strokeRect(8, 8, size - 16, size - 16);

  return new THREE.CanvasTexture(canvas);
}

function createLocationMarkerTexture(label, color = "#ff3b3b") {
  const w = 256,
    h = 256;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");

  /* ======================
     LABEL STYLE CONFIG
  ====================== */
  const fontSize = 12;
  const paddingX = 7;
  const paddingY = 3;
  const radius = 3;

  ctx.font = `bold ${fontSize}px Arial`;
  ctx.textAlign = "center";
  ctx.textBaseline = "top";

  // text width
  const textWidth = ctx.measureText(label).width;
  const boxWidth = textWidth + paddingX * 2;
  const boxHeight = fontSize + paddingY * 2;

  const boxX = (w - boxWidth) / 2;
  const boxY = 20;

  /* ======================
     BACKGROUND BOX
  ====================== */
  ctx.fillStyle = "red";
  roundRect(ctx, boxX, boxY, boxWidth, boxHeight, radius);
  ctx.fill();

  /* ======================
     BORDER
  ====================== */
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  roundRect(ctx, boxX, boxY, boxWidth, boxHeight, radius);
  ctx.stroke();

  /* ======================
     TEXT
  ====================== */
  ctx.fillStyle = "#ffffff";
  ctx.shadowColor = "rgba(0,0,0,0.6)";
  ctx.shadowBlur = 4;
  ctx.fillText(label.toUpperCase(), w / 2, boxY + paddingY);
  ctx.shadowBlur = 0;

  /* ======================
     STEM
  ====================== */

  const STEM_HEIGHT = 120; // 👈 yahan se control hoga
  const STEM_WIDTH = 2; // 👈 stem thickness
  const DOT_RADIUS = 14;

  ctx.strokeStyle = color;
  ctx.lineWidth = STEM_WIDTH;
  ctx.beginPath();

  // stem start (label ke niche)
  const stemStartY = boxY + boxHeight + 5;

  // stem end (dot ke upar)
  const stemEndY = stemStartY + STEM_HEIGHT;

  ctx.moveTo(w / 2, stemStartY);
  ctx.lineTo(w / 2, stemEndY);
  ctx.stroke();

  /* ======================
     DOT
  ====================== */

  // ctx.beginPath();
  // ctx.arc(w / 2, stemEndY + DOT_RADIUS + 2, DOT_RADIUS, 0, Math.PI * 2);
  // ctx.fillStyle = color;
  // ctx.fill();

  return new THREE.CanvasTexture(canvas);
}

/* ======================
   Rounded Rect Helper
====================== */
function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

/***********************
 * HELPERS
 ***********************/
function getColor(status) {
  if (status === "Booked") return 0xff4c4c;   // #ff4c4c  #ff0000
  if (status === "Available") return 0x3232ff; // #3232ff #0000ff
  if (status === "Ongoing") return 0xffff66; // #ffff66 #ffff00
  return 0xffffff;
}

function getStatusColor(status) {
  if (status === "Booked") return "red";
  if (status === "Available") return "blue";
  if (status === "Ongoing") return "orange";
  return "black";
}

/***********************
 * ADD PLOT
 ***********************/
function addPlot(plot) {
  const colorCss = "#" + getColor(plot.status).toString(16).padStart(6, "0");

  const material = new THREE.MeshBasicMaterial({
    map: createSquareTexture(colorCss),
    transparent: true,
    opacity: 0, // 👈 invisible
    depthTest: false,
  });

  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), material);

  mesh.position.set(...plot.position);
  mesh.scale.set(CIRCLE_SCREEN_SIZE, CIRCLE_SCREEN_SIZE, 1);
  mesh.userData = plot;
  mesh.ignoreClick = false;

  mesh.visible = true; // 🔥 DEFAULT HIDDEN

  viewer.scene.add(mesh);
  plotCircles.push(mesh);
}

/***********************
 * ADD LOCATION
 ***********************/
function addLocationMarker(data) {
  const sprite = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: createLocationMarkerTexture(data.name),
      transparent: true,
      depthTest: false,
    })
  );

  sprite.position.set(...data.position);
  sprite.scale.set(2000, 2000, 1);
  sprite.ignoreClick = true;

  panorama.add(sprite);
  locationMarkers.push(sprite);
}

/***********************
 * FETCH DATA
 ***********************/
fetch(PLOT_SHEET_URL)
  .then((r) => r.text())
  .then((csv) => {
    csv
      .split("\n")
      .slice(1)
      .forEach((row) => {
        if (!row.trim()) return;
        const [plot, status, size, remarks, x, y, z] = row.split(",");
        addPlot({
          plot,
          status,
          size,
          remarks,
          position: [parseFloat(x), parseFloat(y), parseFloat(z)],
        });
      });
  });

fetch(LOCATION_SHEET_URL)
  .then((r) => r.text())
  .then((csv) => {
    csv
      .split("\n")
      .slice(1)
      .forEach((row) => {
        if (!row.trim()) return;
        const [name, remarks, x, y, z] = row.split(",");
        addLocationMarker({
          name,
          remarks,
          position: [parseFloat(x), parseFloat(y), parseFloat(z)],
        });
      });
  });

/***********************
 * FILTER (CHECKED ONLY)
 ***********************/
document.querySelectorAll(".filter input").forEach((cb) => {
  cb.addEventListener("change", () => {
    // jo checked hain
    const activeStatuses = [
      ...document.querySelectorAll(".filter input:checked"),
    ].map((i) => i.dataset.status);

    // agar kuch bhi checked nahi
    if (activeStatuses.length === 0) {
      plotCircles.forEach((p) => {
        p.material.opacity = 0; // ❌ hide
      });
      return;
    }

    plotCircles.forEach((p) => {
      if (activeStatuses.includes(p.userData.status)) {
        p.material.opacity = 0.5; // ✅ show
      } else {
        p.material.opacity = 0; // ❌ hide
      }
    });
  });
});

// sab checkbox unchecked
document.querySelectorAll(".filter input").forEach((cb) => {
  cb.checked = false;
});

// sab plots invisible
plotCircles.forEach((p) => {
  p.material.opacity = 0;
});

/***********************
 * INTERACTION
 ***********************/
const mouse = new THREE.Vector2();

function handleInteraction(x, y) {
  const rect = container.getBoundingClientRect();
  mouse.x = ((x - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((y - rect.top) / rect.height) * 2 + 1;

  viewer.raycaster.setFromCamera(mouse, viewer.camera);
  const hit = viewer.raycaster.intersectObjects(plotCircles, true)[0];

  if (!hit) return;

  const mesh = hit.object;
  const plot = mesh.userData;

  startHighlightBlink(mesh);
  showPlotCard(plot);
}

container.addEventListener("click", (e) =>
  handleInteraction(e.clientX, e.clientY)
);

/***********************
 * CARD
 ***********************/
function showPlotCard(plot) {
  cardPlot.innerText = plot.plot;
  cardSize.innerText = plot.size;
  cardStatus.innerText = plot.status;
  cardStatus.style.color = getStatusColor(plot.status);
  cardRemarks.innerText = plot.remarks;
  plotCard.classList.remove("hidden");
}

closeCard.addEventListener("click", () => plotCard.classList.add("hidden"));

let touchStartX = 0;
let touchStartY = 0;
let isDragging = false;

container.addEventListener(
  "touchstart",
  (e) => {
    const t = e.touches[0];
    touchStartX = t.clientX;
    touchStartY = t.clientY;
    isDragging = false;
  },
  { passive: true }
);

container.addEventListener(
  "touchmove",
  (e) => {
    const t = e.touches[0];
    const dx = Math.abs(t.clientX - touchStartX);
    const dy = Math.abs(t.clientY - touchStartY);

    // agar finger thoda bhi move hua → drag
    if (dx > 8 || dy > 8) {
      isDragging = true;
    }
  },
  { passive: true }
);

container.addEventListener(
  "touchend",
  (e) => {
    // agar drag hua → click ignore
    if (isDragging) return;

    const t = e.changedTouches[0];
    handleInteraction(t.clientX, t.clientY);
  },
  { passive: true }
);

// WhatsApp
initWhatsAppButton(panorama, viewer, container);

// google map
initGoogleMapButton();

/***********************
 * SEARCH
 ***********************/

const searchFab = document.getElementById("search-fab");
const floatingSearch = document.getElementById("floating-search");

searchFab.addEventListener("click", () => {
  floatingSearch.classList.toggle("active");
  if (floatingSearch.classList.contains("active")) {
    floatingSearch.focus();
  }
});

// blur → auto close
floatingSearch.addEventListener("blur", () => {
  floatingSearch.classList.remove("active");
});

// 🔥 CONNECT WITH YOUR EXISTING SEARCH
floatingSearch.addEventListener("input", (e) => {
  const v = e.target.value.toLowerCase();
  plotCircles.forEach((p) => {
    p.material.opacity = p.userData.plot.toLowerCase().includes(v) ? 1 : 0;
  });
});

// HIGHLIGHT & BLINK FUNCTION

function startHighlightBlink(mesh) {

  // 🔥 previous plot clean
  if (activePlot && activePlot !== mesh) {
    resetActivePlot();
  }

  activePlot = mesh;

  let visible = true;

  blinkTimer = setInterval(() => {
    visible = !visible;
    mesh.material.opacity = visible ? 1 : 0.3;
    mesh.material.color.set(0xffff00);
  }, 400);
}


function resetActivePlot() {
  if (!activePlot) return;

  // stop blinking
  if (blinkTimer) {
    clearInterval(blinkTimer);
    blinkTimer = null;
  }

  // ⭐ highlight remove
  activePlot.material.color.set(0xffffff);

  // ✅ opacity FILTER ke hisaab se
  const activeStatuses = getActiveStatuses();

  if (
    activeStatuses.length === 0 ||
    !activeStatuses.includes(activePlot.userData.status)
  ) {
    activePlot.material.opacity = 0; // filter ke bahar → hide
  } else {
    activePlot.material.opacity = 0.5; // filter ke andar → visible
  }

  activePlot = null;
}


function getActiveStatuses() {
  return [...document.querySelectorAll(".filter input:checked")]
    .map(cb => cb.dataset.status);
}
