import { StoryAPI } from "../api/story-api.js";
import { ApiError } from "../utils/api-error.js";

class AddStoryPresenter {
  constructor(view, router) {
    this.view = view;
    this.router = router;
  }

  async addStory(formData) {
    try {
      console.log("Submitting story...");
      const result = await StoryAPI.addStory(formData);

      if (result.error === false) {
        this.view.showMessage(
          "Story added successfully! Redirecting...",
          "success"
        );
        setTimeout(() => {
          this.router.navigate("/home");
        }, 2000);
      } else {
        this.view.showMessage(result.message || "Failed to add story", "error");
      }
      return result;
    } catch (error) {
      console.error("Error adding story:", error);

      const errorMessage =
        error instanceof ApiError
          ? ApiError.handle(error)
          : error.message || "Failed to add story. Please try again.";

      this.view.showMessage(errorMessage, "error");
      throw error;
    }
  }

  validateForm(description, photo, selectedLocation) {
    let isValid = true;

    if (!description) {
      this.view.showError("description-error", "Description is required");
      isValid = false;
    } else if (description.length < 10) {
      this.view.showError(
        "description-error",
        "Description must be at least 10 characters"
      );
      isValid = false;
    } else if (description.length > 1000) {
      this.view.showError(
        "description-error",
        "Description must not exceed 1000 characters"
      );
      isValid = false;
    } else {
      this.view.clearError("description-error");
    }

    if (!photo) {
      this.view.showError("photo-error", "Please capture a photo");
      isValid = false;
    } else if (photo.size > 5 * 1024 * 1024) {
      // 5MB limit
      this.view.showError("photo-error", "Photo size must be less than 5MB");
      isValid = false;
    } else {
      this.view.clearError("photo-error");
    }

    if (!selectedLocation) {
      this.view.showError("location-error", "Please select a location");
      isValid = false;
    } else {
      this.view.clearError("location-error");
    }

    return isValid;
  }
}

export { AddStoryPresenter };
