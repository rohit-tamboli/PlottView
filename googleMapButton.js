// ===============================
// GOOGLE MAP BUTTON MODULE
// ===============================

function initGoogleMapButton() {

  // button container
  const btn = document.createElement("div");
  btn.id = "googlemap-btn";

  // image
  const img = document.createElement("img");
  img.src = "images/google-map.jpg";   // 👈 Google Map logo
  img.alt = "Google Map";

  btn.appendChild(img);
  document.body.appendChild(btn);

  // click → Google Maps redirect
  btn.addEventListener("click", () => {
    window.open(
      "https://www.google.com/maps?q=23.0272,77.5721", // 👈 apna lat,long
      "_blank"
    );
  });
}
