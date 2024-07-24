document.addEventListener("DOMContentLoaded", function () {
  document.getElementById("iconBtn").addEventListener("click", function () {
    const iconsContainer = document.getElementById("iconsContainer");
    if (iconsContainer) {
      console.log("Icons container found");
      iconsContainer.style.display =
        iconsContainer.style.display === "none" ? "flex" : "none";
      console.log(
        `Icons container display is now ${iconsContainer.style.display}`
      );
    } else {
      console.log("Icons container not found");
    }
  });
});
