// ===============================
// WHATSAPP BUTTON MODULE
// ===============================

// call this AFTER panorama & viewer are ready
function initWhatsAppButton(panorama, viewer, container) {

  // -------- texture --------
  const texture = new THREE.TextureLoader().load("images/whatsapp.jpg");
  

  // -------- material --------
  const material = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthTest: false
  });

  // -------- sprite --------
  const whatsappSprite = new THREE.Sprite(material);

  // 📍 position (adjust freely)
  whatsappSprite.position.set(0, -1500, -3000);

  // 📐 size
  whatsappSprite.scale.set(300, 300, 1);

  // custom flag
  whatsappSprite.isWhatsApp = true;

  // 🔄 attach to panorama → rotates with screen
  panorama.add(whatsappSprite);

  // ===============================
  // CLICK HANDLING
  // ===============================
  const mouse = new THREE.Vector2();

  container.addEventListener("click", (e) => {
    const rect = container.getBoundingClientRect();
    mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    viewer.raycaster.setFromCamera(mouse, viewer.camera);
    const hits = viewer.raycaster.intersectObjects([whatsappSprite], true);

    if (hits.length) {
      window.open(
        "https://wa.me/919999999999", // 👈 apna number
        "_blank"
      );
    }
  });

  // ===============================
  // CURSOR CHANGE
  // ===============================
  container.addEventListener("mousemove", (e) => {
    const rect = container.getBoundingClientRect();
    mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    viewer.raycaster.setFromCamera(mouse, viewer.camera);
    const hits = viewer.raycaster.intersectObjects([whatsappSprite], true);

    if (hits.length) {
      container.style.cursor = "pointer";
    }
  });

}


function initWhatsAppButton() {
  // button
  const btn = document.createElement("div");
  btn.id = "whatsapp-btn";

  // image
  const img = document.createElement("img");
  img.src = "images/whatsapp.jpg"; // ✅ correct path
  img.alt = "WhatsApp";

  btn.appendChild(img);
  document.body.appendChild(btn);

  // click → WhatsApp redirect
  btn.addEventListener("click", () => {
    window.open(
      "https://wa.me/917974824817   ", // 🔁 apna number
      "_blank"
    );
  });
}
