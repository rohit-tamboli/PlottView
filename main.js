/***********************
 * CONFIG
 ***********************/
const CIRCLE_SCREEN_SIZE = 80;

/***********************
 * GLOBALS
 ***********************/
let plotCircles = [];
let locationMarkers = [];

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
function createSquareTexture(color, text) {
  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");

  // square background
  ctx.fillStyle = color;
  ctx.fillRect(8, 8, size - 16, size - 16);

  // optional border
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 3;
  ctx.strokeRect(8, 8, size - 16, size - 16);

  // plot number text
  // ctx.font = "bold 26px Arial";
  // ctx.fillStyle = "#ffffff";
  // ctx.textAlign = "center";
  // ctx.textBaseline = "middle";
  // ctx.fillText(text, size / 2, size / 2);

  return new THREE.CanvasTexture(canvas);
}


function createLocationMarkerTexture(label, color = "#ff3b3b") {
  const w = 256,
    h = 256;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");

  // LABEL (FIXED FONT + FIXED WIDTH)
  ctx.font = "bold 40px Arial";
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.shadowColor = "rgba(0,0,0,0.6)";
  ctx.shadowBlur = 4;

  ctx.fillText(label, w / 2, 28, 180); // 🔥 SAME visual size

  ctx.shadowBlur = 0;

  // STEM
  ctx.strokeStyle = color;
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(w / 2, 60);
  ctx.lineTo(w / 2, h - 70);
  ctx.stroke();

  // DOT
  ctx.beginPath();
  ctx.arc(w / 2, h - 45, 18, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();

  return new THREE.CanvasTexture(canvas);
}

/***********************
 * HELPERS
 ***********************/
function getColor(status) {
  if (status === "Booked") return 0xff0000;
  if (status === "Available") return 0x0000ff;
  if (status === "Ongoing") return 0xffff00;
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
  const colorHex = getColor(plot.status);
  const colorCss = "#" + colorHex.toString(16).padStart(6, "0");

  const material = new THREE.SpriteMaterial({
    map: createSquareTexture(colorCss),
    transparent: true,
    depthTest: false,
  });

  const sprite = new THREE.Sprite(material);
  sprite.position.set(...plot.position);
  sprite.scale.set(CIRCLE_SCREEN_SIZE, CIRCLE_SCREEN_SIZE, 1);

  sprite.ignoreClick = false;
  sprite.userData = plot;

  viewer.scene.add(sprite);
  plotCircles.push(sprite);
}

/***********************
 * ADD LOCATION (NON-CLICKABLE)
 ***********************/
function addLocationMarker(data) {
  const material = new THREE.SpriteMaterial({
    map: createLocationMarkerTexture(data.name),
    transparent: true,
    depthTest: false,
  });

  const marker = new THREE.Sprite(material);
  marker.position.set(...data.position);
  marker.scale.set(400, 400, 1);

  marker.ignoreClick = true; // 🚫 no click
  viewer.scene.add(marker);
  locationMarkers.push(marker);
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
 * SEARCH & FILTER
 ***********************/
document.getElementById("searchBox").addEventListener("input", (e) => {
  const v = e.target.value.toLowerCase();
  plotCircles.forEach((p) => {
    p.visible = p.userData.plot.toLowerCase().includes(v);
  });
});

document.querySelectorAll(".filter input").forEach((cb) => {
  cb.addEventListener("change", () => {
    const active = [...document.querySelectorAll(".filter input:checked")].map(
      (i) => i.dataset.status
    );
    plotCircles.forEach((p) => {
      p.visible = active.includes(p.userData.status);
    });
  });
});

/***********************
 * HOVER CURSOR (PLOTS ONLY)
 ***********************/
container.addEventListener("mousemove", (e) => {
  const rect = container.getBoundingClientRect();
  mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

  viewer.raycaster.setFromCamera(mouse, viewer.camera);

  const hits = viewer.raycaster.intersectObjects(
    [...plotCircles, ...locationMarkers],
    true
  );

  // 🔥 sirf plot par pointer
  const plotHit = hits.find((h) => !h.object.ignoreClick);

  container.style.cursor = plotHit ? "pointer" : "move";
});

/***********************
 * CLICK / TAP (PLOTS ONLY)
 ***********************/
const mouse = new THREE.Vector2();

function handleInteraction(clientX, clientY) {
  const rect = container.getBoundingClientRect();
  mouse.x = ((clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((clientY - rect.top) / rect.height) * 2 + 1;

  viewer.raycaster.setFromCamera(mouse, viewer.camera);

  const hits = viewer.raycaster.intersectObjects(
    [...plotCircles, ...locationMarkers],
    true
  );

  const hit = hits.find((h) => !h.object.ignoreClick);

  if (!hit) return;

  const plot = hit.object.userData;

  // 🔥 X Y Z PRINT
  console.log("Plot:", plot.plot);
  console.log("X:", plot.position[0]);
  console.log("Y:", plot.position[1]);
  console.log("Z:", plot.position[2]);

  showPlotCard(plot);
}

// desktop
container.addEventListener("click", (e) => {
  handleInteraction(e.clientX, e.clientY);
});

// mobile
let sx = 0,
  sy = 0,
  dragging = false;

container.addEventListener(
  "touchstart",
  (e) => {
    const t = e.touches[0];
    sx = t.clientX;
    sy = t.clientY;
    dragging = false;
  },
  { passive: true }
);

container.addEventListener(
  "touchmove",
  (e) => {
    const t = e.touches[0];
    if (Math.abs(t.clientX - sx) > 10 || Math.abs(t.clientY - sy) > 10) {
      dragging = true;
    }
  },
  { passive: true }
);

container.addEventListener(
  "touchend",
  (e) => {
    if (dragging) return;
    const t = e.changedTouches[0];
    handleInteraction(t.clientX, t.clientY);
  },
  { passive: true }
);

/***********************
 * CARD
 ***********************/
function showPlotCard(plot) {
  cardPlot.innerText = `Plot: ${plot.plot}`;
  cardSize.innerText = plot.size;
  cardStatus.innerText = plot.status;
  cardStatus.style.color = getStatusColor(plot.status);
  cardRemarks.innerText = plot.remarks;
  plotCard.classList.remove("hidden");
}

closeCard.addEventListener("click", () => {
  plotCard.classList.add("hidden");
});
