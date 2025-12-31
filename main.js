/***********************
 * CONFIG
 ***********************/
const CIRCLE_SCREEN_SIZE = 40; // plot circle size (px)
const LOCATION_MARKER_SIZE = { w: 60, h: 80 }; // pin size

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
  autoRotateSpeed: 0.3
});

viewer.add(panorama);
container.style.cursor = "move";

/***********************
 * SHEET URLS
 ***********************/
const PLOT_SHEET_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vQ4kxCdoeLrM_mn4SxCkoalBkZHYASdwrCUiuKZsBMX5TrUKZePAy5gmZlOuaRAG6-LYFL6SEtJ3HK3/pub?gid=0&single=true&output=csv";

const LOCATION_SHEET_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vQ4kxCdoeLrM_mn4SxCkoalBkZHYASdwrCUiuKZsBMX5TrUKZePAy5gmZlOuaRAG6-LYFL6SEtJ3HK3/pub?gid=34569269&single=true&output=csv"; // ← replace

/***********************
 * TEXTURE HELPERS
 ***********************/
function createCircleTexture(color) {
  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");

  ctx.clearRect(0, 0, size, size);
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size / 2 - 4, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();

  return new THREE.CanvasTexture(canvas);
}

function createLocationMarkerTexture(label, color = "#ff3b3b") {
  const width = 256;
  const height = 256;

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, width, height);

  // =====================
  // LABEL BOX
  // =====================
  const padding = 12;
  ctx.font = "bold 24px Arial";
  const textWidth = ctx.measureText(label).width;

  const boxWidth = textWidth + padding * 2;
  const boxHeight = 40;
  const boxX = (width - boxWidth) / 2;
  const boxY = 10;

  // box
  ctx.fillStyle = "#ffffff";
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.rect(boxX, boxY, boxWidth, boxHeight);
  ctx.fill();
  ctx.stroke();

  // text
  ctx.fillStyle = "#000000";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(label, width / 2, boxY + boxHeight / 2);

  // =====================
  // STEM (2 lines)
  // =====================
  ctx.strokeStyle = color;
  ctx.lineWidth = 6;
  ctx.lineCap = "round";

  ctx.beginPath();
  ctx.moveTo(width / 2, boxY + boxHeight + 10);
  ctx.lineTo(width / 2, height - 60);
  ctx.stroke();

  // =====================
  // DOT (BOTTOM)
  // =====================
  ctx.beginPath();
  ctx.arc(width / 2, height - 40, 12, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();

  return new THREE.CanvasTexture(canvas);
}


/***********************
 * COLOR HELPERS
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
 * ADD PLOT (CIRCLE)
 ***********************/
function addPlot(plot) {
  const colorHex = getColor(plot.status);
  const colorCss = "#" + colorHex.toString(16).padStart(6, "0");

  const material = new THREE.SpriteMaterial({
    map: createCircleTexture(colorCss),
    transparent: true,
    depthTest: false,
    depthWrite: false
  });

  const sprite = new THREE.Sprite(material);
  sprite.position.set(...plot.position);
  sprite.scale.set(CIRCLE_SCREEN_SIZE, CIRCLE_SCREEN_SIZE, 1);




  sprite.plotNo = plot.plot;
  sprite.status = plot.status;
  sprite.userData = plot;

  viewer.scene.add(sprite);
  plotCircles.push(sprite);
}

/***********************
 * ADD LOCATION MARKER (PIN)
 ***********************/

function addLocationMarker(data) {

  const material = new THREE.SpriteMaterial({
    map: createLocationMarkerTexture(data.name, "#ff3b3b"),
    transparent: true,
    depthTest: false,
    depthWrite: false
  });

  const marker = new THREE.Sprite(material);

  marker.position.set(...data.position);

  // LABEL + STEM + DOT visible properly
  marker.scale.set(360, 420, 1);

  marker.isLocationMarker = true;
  marker.userData = data;

  viewer.scene.add(marker);
  locationMarkers.push(marker);
}


/***********************
 * FETCH PLOTS
 ***********************/
fetch(PLOT_SHEET_URL)
  .then(res => res.text())
  .then(csv => {
    const rows = csv.split("\n").slice(1);
    rows.forEach(row => {
      if (!row.trim()) return;
      const [plot, status, size, remarks, x, y, z] = row.split(",");
      addPlot({
        plot: plot.trim(),
        status: status.trim(),
        size: size.trim(),
        remarks: remarks.trim(),
        position: [parseFloat(x), parseFloat(y), parseFloat(z)]
      });
    });
  });

/***********************
 * FETCH LOCATIONS (INDEPENDENT)
 ***********************/
fetch(LOCATION_SHEET_URL)
  .then(res => res.text())
  .then(csv => {
    const rows = csv.split("\n").slice(1);
    rows.forEach(row => {
      if (!row.trim()) return;
      const [name, remarks, x, y, z] = row.split(",");
      addLocationMarker({
        name: name.trim(),
        remarks: remarks.trim(),
        position: [parseFloat(x), parseFloat(y), parseFloat(z)]
      });
    });
  });

/***********************
 * SEARCH (PLOTS ONLY)
 ***********************/
document.getElementById("searchBox").addEventListener("input", e => {
  const value = e.target.value.toLowerCase();
  plotCircles.forEach(p => {
    p.visible = p.plotNo.toLowerCase().includes(value);
  });
});

/***********************
 * FILTER (PLOTS ONLY)
 ***********************/
document.querySelectorAll(".filter input").forEach(box => {
  box.addEventListener("change", () => {
    const active = Array.from(
      document.querySelectorAll(".filter input:checked")
    ).map(i => i.dataset.status);

    plotCircles.forEach(p => {
      p.visible = active.includes(p.status);
    });
  });
});

/***********************
 * HOVER & CLICK (BOTH)
 ***********************/
const mouse = new THREE.Vector2();

container.addEventListener("mousemove", e => {
  const rect = container.getBoundingClientRect();
  mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

  viewer.raycaster.setFromCamera(mouse, viewer.camera);
  const hits = viewer.raycaster.intersectObjects(
    [...plotCircles, ...locationMarkers],
    true
  );

  container.style.cursor = hits.length ? "pointer" : "move";
});

container.addEventListener("click", e => {
  const rect = container.getBoundingClientRect();
  mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

  viewer.raycaster.setFromCamera(mouse, viewer.camera);
  const hits = viewer.raycaster.intersectObjects(
    [...plotCircles, ...locationMarkers],
    true
  );

  if (!hits.length) return;

  const obj = hits[0].object;

  if (obj.isLocationMarker) {
    alert(obj.userData.name + " - " + obj.userData.remarks);
    return;
  }

  showPlotCard(obj.userData);
});

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

closeCard.addEventListener("click", e => {
  e.stopPropagation();
  plotCard.classList.add("hidden");
});


// 

const IS_MOBILE = window.innerWidth < 768 || 'ontouchstart' in window;

if (IS_MOBILE) {
  plotCircles.forEach(p => {
    p.scale.set(80, 80, 1); // bigger for finger
  });
}

if (IS_MOBILE) {
  locationMarkers.forEach(m => {
    m.scale.set(180, 260, 1);
  });
}

let touchStartX = 0;
let touchStartY = 0;

container.addEventListener("touchstart", e => {
  const t = e.touches[0];
  touchStartX = t.clientX;
  touchStartY = t.clientY;
}, { passive: true });

container.addEventListener("touchend", e => {
  const t = e.changedTouches[0];
  const dx = Math.abs(t.clientX - touchStartX);
  const dy = Math.abs(t.clientY - touchStartY);

  // 👆 small movement = TAP
  if (dx < 10 && dy < 10) {
    handleMobileTap(t.clientX, t.clientY);
  }
});

function handleMobileTap(clientX, clientY) {
  const rect = container.getBoundingClientRect();
  mouse.x = ((clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((clientY - rect.top) / rect.height) * 2 + 1;

  viewer.raycaster.setFromCamera(mouse, viewer.camera);

  const hits = viewer.raycaster.intersectObjects(
    [...plotCircles, ...locationMarkers],
    true
  );

  if (!hits.length) return;

  const obj = hits[0].object;

  if (obj.isLocationMarker) {
    alert(obj.userData.name);
    return;
  }

  showPlotCard(obj.userData);
}

if (IS_MOBILE) {
  container.style.cursor = "default";
}

if (IS_MOBILE) {
  viewer.renderer.setPixelRatio(
    Math.min(window.devicePixelRatio, 1.5)
  );
}

window.addEventListener("orientationchange", () => {
  setTimeout(() => {
    viewer.onWindowResize();
  }, 300);
});

function disableLocationClicks() {
  locationMarkers.forEach(m => {
    m.ignoreClick = true; // custom flag
  });
}

setTimeout(disableLocationClicks, 500);

function getFirstClickableObject(hits) {
  for (let i = 0; i < hits.length; i++) {
    const obj = hits[i].object;
    if (obj.ignoreClick) continue; // 🚫 skip location
    return obj;
  }
  return null;
}

function handleMobileTap(clientX, clientY) {
  const rect = container.getBoundingClientRect();
  mouse.x = ((clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((clientY - rect.top) / rect.height) * 2 + 1;

  viewer.raycaster.setFromCamera(mouse, viewer.camera);

  const hits = viewer.raycaster.intersectObjects(
    [...plotCircles, ...locationMarkers],
    true
  );

  const obj = getFirstClickableObject(hits);
  if (!obj) return;

  showPlotCard(obj.userData);
}

container.addEventListener("click", e => {
  const rect = container.getBoundingClientRect();
  mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

  viewer.raycaster.setFromCamera(mouse, viewer.camera);

  const hits = viewer.raycaster.intersectObjects(
    [...plotCircles, ...locationMarkers],
    true
  );

  const obj = getFirstClickableObject(hits);
  if (!obj) return;

  showPlotCard(obj.userData);
});
