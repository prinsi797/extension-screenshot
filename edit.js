document.addEventListener("DOMContentLoaded", () => {
  const canvas = document.getElementById("imageCanvas");
  const ctx = canvas.getContext("2d");
  const downloadBtn = document.getElementById("downloadBtn");
  const pencilBtn = document.getElementById("pencilBtn");
  const circleBtn = document.getElementById("circleBtn");
  const iconBtn = document.getElementById("iconBtn");
  const iconsContainer = document.getElementById("iconsContainer");
  const colorPickerContainer = document.getElementById("colorPickerContainer");
  const colorPicker = document.getElementById("colorPicker");

  let image = new Image();
  let imageLoaded = false;
  let currentTool = "pencil";
  let drawing = false;
  let startX, startY;
  let icons = [];
  let draggingIcon = null;
  let pencilColor = "#0000FF"; // Default pencil color

  // Load the image from chrome storage
  chrome.storage.local.get("selectedAreaImageData", (data) => {
    const imageUrl = data.selectedAreaImageData;

    if (imageUrl) {
      image.src = imageUrl;
      image.onload = () => {
        canvas.width = image.width;
        canvas.height = image.height;
        ctx.drawImage(image, 0, 0);
        imageLoaded = true;
      };
    } else {
      console.error("No image data found.");
    }
  });

  function updateSelectedTool() {
    pencilBtn.classList.toggle("selected", currentTool === "pencil");
    circleBtn.classList.toggle("selected", currentTool === "circle");
    
    // Show/hide color picker based on current tool
    colorPickerContainer.style.display = currentTool === "pencil" ? "block" : "none";
    
    // Ensure no icon buttons are marked as selected
    document.querySelectorAll(".icon-btn").forEach(btn => btn.classList.remove("selected"));
  }

  pencilBtn.addEventListener("click", () => {
    currentTool = "pencil";
    updateSelectedTool();
  });

  circleBtn.addEventListener("click", () => {
    currentTool = "circle";
    updateSelectedTool();
  });

  iconBtn.addEventListener("click", () => {
    iconsContainer.style.display = iconsContainer.style.display === "none" ? "flex" : "none";
  });

  canvas.addEventListener("mousedown", (e) => {
    if (!imageLoaded) return;

    drawing = true;
    startX = e.offsetX;
    startY = e.offsetY;

    if (currentTool === "pencil") {
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.strokeStyle = pencilColor; // Use the selected pencil color
      ctx.lineWidth = 2; // You can adjust the line width if needed
    } else if (currentTool === "circle") {
      redrawCanvas();
      ctx.beginPath();
      ctx.arc(startX, startY, 1, 0, 2 * Math.PI);
      ctx.stroke();
    } else {
      // Check if an icon is being clicked
      draggingIcon = icons.find(icon => {
        const dx = e.offsetX - icon.x;
        const dy = e.offsetY - icon.y;
        return Math.sqrt(dx * dx + dy * dy) < 20; // Adjust radius for hit detection
      });
    }
  });

  canvas.addEventListener("mousemove", (e) => {
    if (!imageLoaded || !drawing) return;

    if (currentTool === "pencil") {
      ctx.lineTo(e.offsetX, e.offsetY);
      ctx.stroke();
    } else if (currentTool === "circle" && !draggingIcon) {
      const radius = Math.sqrt(Math.pow(e.offsetX - startX, 2) + Math.pow(e.offsetY - startY, 2));
      redrawCanvas();
      ctx.beginPath();
      ctx.arc(startX, startY, radius, 0, 2 * Math.PI);
      ctx.stroke();
    } else if (draggingIcon) {
      draggingIcon.x = e.offsetX;
      draggingIcon.y = e.offsetY;
      redrawCanvas();
    }
  });

  canvas.addEventListener("mouseup", () => {
    drawing = false;
    draggingIcon = null;
  });

  function redrawCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(image, 0, 0);
    drawIcons();
  }

  function drawIcons() {
    icons.forEach(icon => {
      const iconText = icon.text;
      ctx.font = '24px Arial';
      ctx.fillText(iconText, icon.x, icon.y);
    });
  }

  downloadBtn.addEventListener("click", () => {
    const link = document.createElement("a");
    link.href = canvas.toDataURL("image/png");
    link.download = "edited_screenshot.png";
    link.click();
  });

  // Add event listeners for icon buttons
  const iconButtons = document.querySelectorAll(".icon-btn");
  iconButtons.forEach(btn => {
    btn.addEventListener("click", (e) => {
      // Add selected class to the clicked icon button
      iconButtons.forEach(button => button.classList.remove("selected"));
      e.currentTarget.classList.add("selected");

      const iconText = e.currentTarget.dataset.icon;
      addIconToCanvas(iconText);
    });
  });

  function addIconToCanvas(iconText) {
    const x = canvas.width / 2; // Initial x position (center of canvas)
    const y = canvas.height / 2; // Initial y position (center of canvas)

    icons.push({ text: iconText, x: x, y: y });
    redrawCanvas();
  }

  // Handle color picker change
  colorPicker.addEventListener("input", (e) => {
    pencilColor = e.target.value;
  });
});
