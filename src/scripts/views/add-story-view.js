import { CameraComponent } from "../components/camera.js";
import { MapComponent } from "../components/map.js";
import { AddStoryPresenter } from "../presenters/add-story-presenter.js";

class AddStoryView {
  constructor(router) {
    this.router = router;
    this.presenter = new AddStoryPresenter(this, router);
    this.camera = null;
    this.map = null;
    this.selectedLocation = null;
  }

  render() {
    const container = document.getElementById("page-container");
    container.innerHTML = `
      <div class="page">
        <h2 tabindex="-1" id="add-story-heading">Add New Story</h2>
        <section class="add-story-section">
          <form id="add-story-form" class="form-container" novalidate>
            <div class="form-group">
              <label for="story-description" class="form-label">Description *</label>
              <textarea id="story-description" 
                name="description" 
                class="form-textarea" 
                required
                placeholder="Tell your story..."
                maxlength="1000"></textarea>
              <small class="form-help">Maximum 1000 characters</small>
              <div class="form-error" id="description-error"></div>
            </div>
            
            <div class="form-group">
              <label class="form-label">Photo *</label>
              <div id="camera-container"></div>
              <div class="form-error" id="photo-error"></div>
            </div>
            
            <div class="form-group">
              <label class="form-label">Location *</label>
              <p class="form-help">Click on the map to select your story location</p>
              <div id="location-map" class="map-container"></div>
              <input type="hidden" id="latitude" name="lat">
              <input type="hidden" id="longitude" name="lon">
              <p id="location-info" class="location-info">No location selected</p>
              <div class="form-error" id="location-error"></div>
            </div>
            
            <div class="form-actions">
              <button type="submit" class="btn btn-primary" id="submit-btn">
                <span class="btn-text">Add Story</span>
                <span class="btn-loading" style="display: none;">
                  <span class="loading-spinner small"></span>
                  Adding...
                </span>
              </button>
              <button type="button" class="btn btn-secondary" onclick="history.back()">Cancel</button>
            </div>
            
            <div id="form-message"></div>
          </form>
        </section>
      </div>
    `;

    setTimeout(() => {
      this.initializeComponents();
      this.initializeForm();
      const heading = document.getElementById("add-story-heading");
      if (heading) {
        heading.focus();
      }
    }, 100);
  }

  initializeComponents() {
    try {
      this.camera = new CameraComponent("camera-container");

      this.map = new MapComponent("location-map", {
        clickable: true,
        showPopup: true,
        onLocationSelect: (lat, lng) => this.onLocationSelect(lat, lng),
      });
      this.map.init();
    } catch (error) {
      console.error("Error initializing components:", error);
      this.showMessage(
        "Error initializing components. Please refresh the page.",
        "error"
      );
    }
  }

  onLocationSelect(lat, lng) {
    this.selectedLocation = { lat, lng };
    document.getElementById("latitude").value = lat;
    document.getElementById("longitude").value = lng;
    document.getElementById(
      "location-info"
    ).textContent = `Selected: ${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    this.clearError("location-error");
  }

  initializeForm() {
    const form = document.getElementById("add-story-form");
    form.addEventListener("submit", (e) => this.handleSubmit(e));
  }

  async handleSubmit(e) {
    e.preventDefault();

    const description = document
      .getElementById("story-description")
      .value.trim();
    const photo = this.camera?.getCapturedPhoto();

    if (
      !this.presenter.validateForm(description, photo, this.selectedLocation)
    ) {
      this.showMessage("Please fill all required fields", "error");
      return;
    }

    const submitBtn = document.getElementById("submit-btn");
    const btnText = submitBtn.querySelector(".btn-text");
    const btnLoading = submitBtn.querySelector(".btn-loading");

    submitBtn.disabled = true;
    btnText.style.display = "none";
    btnLoading.style.display = "inline-flex";

    try {
      const formData = this.prepareFormData();
      await this.presenter.addStory(formData);
    } catch (error) {
      console.error("Error submitting story:", error);
    } finally {
      submitBtn.disabled = false;
      btnText.style.display = "inline";
      btnLoading.style.display = "none";
    }
  }

  prepareFormData() {
    const formData = new FormData();
    const description = document
      .getElementById("story-description")
      .value.trim();
    const photo = this.camera.getCapturedPhoto();
    const { lat, lng } = this.selectedLocation;

    // Validate all required fields
    if (!description || !photo || !lat || !lng) {
      throw new Error("All fields are required");
    }

    // Validate photo
    if (!(photo instanceof Blob)) {
      throw new Error("Invalid photo format");
    }

    // Validate coordinates
    if (isNaN(lat) || isNaN(lng)) {
      throw new Error("Invalid location coordinates");
    }

    // According to API documentation, only these fields are needed:
    formData.append("description", description);
    formData.append("photo", photo, `story-${Date.now()}.jpg`);
    formData.append("lat", parseFloat(lat).toString());
    formData.append("lon", parseFloat(lng).toString());

    return formData;
  }

  showMessage(message, type) {
    const messageDiv = document.getElementById("form-message");
    messageDiv.className = `form-message ${type}`;
    messageDiv.textContent = message;
    messageDiv.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  showError(elementId, message) {
    const errorElement = document.getElementById(elementId);
    if (errorElement) {
      errorElement.textContent = message;
      errorElement.style.display = "block";
    }
  }

  clearError(elementId) {
    const errorElement = document.getElementById(elementId);
    if (errorElement) {
      errorElement.textContent = "";
      errorElement.style.display = "none";
    }
  }

  destroy() {
    try {
      if (this.camera) {
        this.camera.destroy();
      }
      if (this.map) {
        this.map.destroy();
      }
    } catch (error) {
      console.error("Error destroying view:", error);
    }
  }
}

export { AddStoryView };
