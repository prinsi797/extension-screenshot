document.addEventListener("DOMContentLoaded", () => {
  const canvas = document.getElementById("imageCanvas");
  const ctx = canvas.getContext("2d");
  const downloadBtn = document.getElementById("downloadBtn");
  const pencilBtn = document.getElementById("pencilBtn");
  const circleBtn = document.getElementById("circleBtn");

  chrome.storage.local.get("selectedAreaImageData", (data) => {
    const imageUrl = data.selectedAreaImageData;

    if (imageUrl) {
      const image = new Image();
      image.src = imageUrl;
      image.onload = () => {
        canvas.width = image.width;
        canvas.height = image.height;
        ctx.drawImage(image, 0, 0);
      };
    } else {
      console.error("No image data found.");
    }
  });

  let drawing = false;
  let currentTool = "pencil";

  pencilBtn.addEventListener("click", () => {
    currentTool = "pencil";
    updateSelectedTool();
  });

  circleBtn.addEventListener("click", () => {
    currentTool = "circle";
    updateSelectedTool();
  });

  function updateSelectedTool() {
    pencilBtn.classList.toggle("selected", currentTool === "pencil");
    circleBtn.classList.toggle("selected", currentTool === "circle");
  }

  canvas.addEventListener("mousedown", (e) => {
    drawing = true;
    ctx.beginPath();
    ctx.moveTo(e.offsetX, e.offsetY);
  });

  canvas.addEventListener("mousemove", (e) => {
    if (drawing) {
      if (currentTool === "pencil") {
        ctx.lineTo(e.offsetX, e.offsetY);
        ctx.stroke();
      } else if (currentTool === "circle") {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const radius = Math.sqrt(
          Math.pow(e.offsetX - canvas.width / 2, 2) +
            Math.pow(e.offsetY - canvas.height / 2, 2)
        );
        ctx.beginPath();
        ctx.arc(canvas.width / 2, canvas.height / 2, radius, 0, 2 * Math.PI);
        ctx.stroke();
        ctx.drawImage(image, 0, 0);
      }
    }
  });

  canvas.addEventListener("mouseup", () => {
    drawing = false;
  });

  downloadBtn.addEventListener("click", () => {
    const link = document.createElement("a");
    link.href = canvas.toDataURL("image/png");
    link.download = "edited_screenshot.png";
    link.click();
  });
});
