class CameraComponent {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.stream = null;
    this.capturedBlob = null;
    this.init();
  }

  init() {
    this.createCameraElements();
    this.bindEvents();
  }

  createCameraElements() {
    this.container.innerHTML = `
            <div class="camera-container">
                <video id="camera-video" class="camera-video" autoplay style="display: none;"></video>
                <canvas id="camera-canvas" style="display: none;"></canvas>
                <img id="camera-preview" class="camera-preview" style="display: none;" alt="Captured photo preview">
                <div class="camera-controls">
                    <button type="button" id="start-camera" class="btn btn-primary">Start Camera</button>
                    <button type="button" id="capture-photo" class="btn btn-success" style="display: none;">Capture Photo</button>
                    <button type="button" id="retake-photo" class="btn btn-secondary" style="display: none;">Retake</button>
                </div>
            </div>
        `;

    this.video = document.getElementById("camera-video");
    this.canvas = document.getElementById("camera-canvas");
    this.preview = document.getElementById("camera-preview");
    this.startBtn = document.getElementById("start-camera");
    this.captureBtn = document.getElementById("capture-photo");
    this.retakeBtn = document.getElementById("retake-photo");
  }

  bindEvents() {
    this.startBtn.addEventListener("click", () => this.startCamera());
    this.captureBtn.addEventListener("click", () => this.capturePhoto());
    this.retakeBtn.addEventListener("click", () => this.retakePhoto());
  }

  async startCamera() {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
      });

      this.video.srcObject = this.stream;
      this.showElement(this.video);
      this.hideElement(this.startBtn);
      this.showElement(this.captureBtn);
    } catch (error) {
      console.error("Error accessing camera:", error);
      this.showError("Error accessing camera: " + error.message);
    }
  }

  capturePhoto() {
    const context = this.canvas.getContext("2d");
    this.canvas.width = this.video.videoWidth;
    this.canvas.height = this.video.videoHeight;
    context.drawImage(this.video, 0, 0);

    this.canvas.toBlob(
      (blob) => {
        this.capturedBlob = blob;
        const url = URL.createObjectURL(blob);
        this.preview.src = url;

        this.showElement(this.preview);
        this.hideElement(this.video);
        this.hideElement(this.captureBtn);
        this.showElement(this.retakeBtn);

        this.stopCamera();
      },
      "image/jpeg",
      0.8
    );
  }

  retakePhoto() {
    this.hideElement(this.preview);
    this.hideElement(this.retakeBtn);
    this.showElement(this.startBtn);
    this.capturedBlob = null;

    if (this.preview.src) {
      URL.revokeObjectURL(this.preview.src);
    }
  }

  stopCamera() {
    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
      this.stream = null;
    }
  }

  getCapturedPhoto() {
    return this.capturedBlob;
  }

  showElement(element) {
    element.style.display = "block";
  }

  hideElement(element) {
    element.style.display = "none";
  }

  showError(message) {
    const errorDiv = document.createElement("div");
    errorDiv.className = "error";
    errorDiv.textContent = message;
    this.container.appendChild(errorDiv);

    setTimeout(() => {
      errorDiv.remove();
    }, 5000);
  }

  destroy() {
    this.stopCamera();
    if (this.preview && this.preview.src) {
      URL.revokeObjectURL(this.preview.src);
    }
  }
}

export { CameraComponent };
