function takeFullPageScreenshot() {
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    const tab = tabs[0];

    chrome.scripting.executeScript(
      {
        target: { tabId: tab.id },
        func: getFullPageScreenshot,
      },
      (result) => {
        if (chrome.runtime.lastError || !result || !result[0]) {
          console.error(
            "Error executing script:",
            chrome.runtime.lastError || "No result returned"
          );
          return;
        }

        const { images, totalWidth, totalHeight } = result[0].result;

        if (!images || images.length === 0) {
          console.error("No images captured");
          return;
        }

        const canvas = document.createElement("canvas");
        canvas.width = totalWidth;
        canvas.height = totalHeight;
        const context = canvas.getContext("2d");

        let yOffset = 0;

        images.forEach((imageData, index) => {
          const image = new Image();
          image.src = imageData;
          image.onload = () => {
            context.drawImage(image, 0, yOffset);
            yOffset += image.height;

            if (index === images.length - 1) {
              setTimeout(() => {
                const link = document.createElement("a");
                link.href = canvas.toDataURL("image/png");
                link.download = "full_screenshot.png";
                link.click();
              }, 1000);
            }
          };
          image.onerror = () => {
            console.error("Image failed to load:", imageData);
          };
        });
      }
    );
  });
}

function getFullPageScreenshot() {
  const getScrollHeight = () => document.documentElement.scrollHeight;
  const getViewportHeight = () => window.innerHeight;

  const totalHeight = getScrollHeight();
  const viewportHeight = getViewportHeight();
  const totalWidth = document.documentElement.scrollWidth;

  const images = [];
  let currentYOffset = 0;

  function captureAndScroll() {
    window.scrollTo(0, currentYOffset);

    return new Promise((resolve) => {
      setTimeout(() => {
        chrome.runtime.sendMessage(
          { action: "captureVisibleTab" },
          (response) => {
            if (!response || !response.imageData) {
              console.error("Failed to capture visible tab.");
              resolve(null);
              return;
            }

            images.push(response.imageData);

            currentYOffset += viewportHeight;

            if (currentYOffset < totalHeight) {
              resolve(captureAndScroll());
            } else {
              window.scrollTo(0, 0);
              resolve({ images, totalWidth, totalHeight });
            }
          }
        );
      }, 500);
    });
  }
  return captureAndScroll();
}

function takeSelectedAreaScreenshot() {
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    const tab = tabs[0];

    chrome.scripting.executeScript(
      {
        target: { tabId: tab.id },
        func: selectAreaAndCapture,
      },
      (result) => {
        if (chrome.runtime.lastError || !result || !result[0]) {
          console.error(
            "Error executing script:",
            chrome.runtime.lastError || "No result returned"
          );
          return;
        }

        const { imageData } = result[0].result;
        // const editUrl = chrome.runtime.getURL("edit.html");
        // console.log(editUrl);

        if (imageData) {
          console.log("Captured Image Data:", imageData);

          // Store the image data in chrome.storage
          chrome.storage.local.set({ selectedAreaImageData: imageData }, () => {
            // Open edit.html in a new tab
            const editUrl = chrome.runtime.getURL("edit.html");
            console.log("Opening URL:", editUrl);
            chrome.tabs.create({ url: editUrl });
            // chrome.tabs.create({ url: chrome.runtime.getURL("edit.html") });
          });
        } else {
          console.error("No image data returned.");
        }
      }
    );
  });
}

function selectAreaAndCapture() {
  return new Promise((resolve) => {
    const existingOverlay = document.querySelector(".screenshot-overlay");
    if (existingOverlay) {
      existingOverlay.remove();
    }
    const overlay = document.createElement("div");
    overlay.style.position = "fixed";
    overlay.style.top = "0";
    overlay.style.left = "0";
    overlay.style.width = "100%";
    overlay.style.height = "100%";
    overlay.style.backgroundColor = "rgba(0, 0, 0, 0.5)";
    overlay.style.cursor = "crosshair";
    overlay.style.zIndex = "10000";
    document.body.appendChild(overlay);

    let startX,
      startY,
      endX,
      endY,
      selectionDiv,
      resizeDiv,
      captureBtn,
      cancelBtn;

    function onMouseDown(e) {
      startX = e.clientX;
      startY = e.clientY;

      selectionDiv = document.createElement("div");
      selectionDiv.style.position = "fixed";
      selectionDiv.style.border = "2px dashed #ffffff";
      selectionDiv.style.zIndex = "10001";
      document.body.appendChild(selectionDiv);

      overlay.addEventListener("mousemove", onMouseMove);
      overlay.addEventListener("mouseup", onMouseUp);
    }

    function onMouseMove(e) {
      endX = e.clientX;
      endY = e.clientY;

      const width = Math.abs(endX - startX);
      const height = Math.abs(endY - startY);
      const left = Math.min(startX, endX);
      const top = Math.min(startY, endY);

      selectionDiv.style.width = width + "px";
      selectionDiv.style.height = height + "px";
      selectionDiv.style.left = left + "px";
      selectionDiv.style.top = top + "px";

      if (!captureBtn) {
        // Create buttons after area is selected
        captureBtn = document.createElement("button");
        captureBtn.textContent = "Capture";
        captureBtn.style.position = "fixed";
        captureBtn.style.bottom = "10px";
        captureBtn.style.right = "70px";
        captureBtn.style.zIndex = "10001";
        captureBtn.style.backgroundColor = "#4CAF50";
        captureBtn.style.color = "white";
        captureBtn.style.border = "none";
        captureBtn.style.padding = "10px";
        captureBtn.style.cursor = "pointer";
        document.body.appendChild(captureBtn);

        cancelBtn = document.createElement("button");
        cancelBtn.textContent = "Cancel";
        cancelBtn.style.position = "fixed";
        cancelBtn.style.bottom = "10px";
        cancelBtn.style.right = "10px";
        cancelBtn.style.zIndex = "10001";
        cancelBtn.style.backgroundColor = "#f44336";
        cancelBtn.style.color = "white";
        cancelBtn.style.border = "none";
        cancelBtn.style.padding = "10px";
        cancelBtn.style.cursor = "pointer";
        document.body.appendChild(cancelBtn);

        captureBtn.addEventListener("click", onCaptureClick);
        cancelBtn.addEventListener("click", onCancelClick);
      }
    }

    function onMouseUp() {
      overlay.removeEventListener("mousemove", onMouseMove);
      overlay.removeEventListener("mouseup", onMouseUp);
    }

    function onCaptureClick() {
      const canvas = document.createElement("canvas");
      const width = parseInt(selectionDiv.style.width);
      const height = parseInt(selectionDiv.style.height);
      const left = parseInt(selectionDiv.style.left);
      const top = parseInt(selectionDiv.style.top);

      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext("2d");

      chrome.runtime.sendMessage(
        { action: "captureVisibleTab" },
        (response) => {
          if (!response || !response.imageData) {
            console.error("Failed to capture visible tab.");
            resolve(null);
            return;
          }

          const image = new Image();
          image.src = response.imageData;
          image.onload = () => {
            context.drawImage(
              image,
              left,
              top,
              width,
              height,
              0,
              0,
              width,
              height
            );
            const link = document.createElement("a");
            link.href = canvas.toDataURL("image/png");
            link.download = "selected_area_screenshot.png";
            link.click();
            resolve({ imageData: link.href });
          };
          image.onerror = () => {
            console.error("Image failed to load:", response.imageData);
            resolve(null);
          };
        }
      );

      document.body.removeChild(overlay);
      document.body.removeChild(selectionDiv);
      document.body.removeChild(captureBtn);
      document.body.removeChild(cancelBtn);
    }

    function onCancelClick() {
      document.body.removeChild(overlay);
      document.body.removeChild(selectionDiv);
      if (captureBtn) document.body.removeChild(captureBtn);
      if (cancelBtn) document.body.removeChild(cancelBtn);
    }

    overlay.addEventListener("mousedown", onMouseDown);
  });
}

document.addEventListener("DOMContentLoaded", function () {
  const screenshotBtn = document.getElementById("screenshotBtn");
  const selectAreaBtn = document.getElementById("selectAreaBtn");

  if (screenshotBtn) {
    screenshotBtn.addEventListener("click", takeFullPageScreenshot);
  } else {
    console.error("Screenshot button not found.");
  }

  if (selectAreaBtn) {
    selectAreaBtn.addEventListener("click", takeSelectedAreaScreenshot);
  } else {
    console.error("Select area button not found.");
  }
});
