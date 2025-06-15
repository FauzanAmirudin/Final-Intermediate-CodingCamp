import { StoryAPI } from "../api/story-api.js";
import { ApiError } from "../utils/api-error.js";
import pushService from "../push.js";
import dbService from "../db.js";

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
        // Save story to IndexedDB
        try {
          const description = formData.get("description");
          const storyData = {
            id: `story-${Date.now()}`, // Generate temporary ID
            name: "My Story",
            description: description,
            createdAt: new Date().toISOString(),
            savedAt: new Date().toISOString(),
          };

          // Try to get photo URL from form data and create object URL
          const photo = formData.get("photo");
          if (photo && photo instanceof Blob) {
            storyData.photoUrl = URL.createObjectURL(photo);
          }

          // Add location if available
          const lat = formData.get("lat");
          const lon = formData.get("lon");
          if (lat && lon) {
            storyData.lat = parseFloat(lat);
            storyData.lon = parseFloat(lon);
          }

          await dbService.addStory(storyData);
          console.log("Story saved to IndexedDB");
        } catch (dbError) {
          console.error("Failed to save story to IndexedDB:", dbError);
        }

        // Check if push notifications are enabled and subscribe if needed
        try {
          const pushSupport = await pushService.checkPushSupport();
          if (pushSupport.supported && pushSupport.permission === "granted") {
            await pushService.subscribeToPushNotifications();
            console.log(
              "Push notification subscription refreshed after adding story"
            );
          }
        } catch (pushError) {
          console.error("Error with push notification:", pushError);
        }

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
