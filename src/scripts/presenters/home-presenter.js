import { StoryAPI } from "../api/story-api.js";
import { ApiError } from "../utils/api-error.js";
import { AuthUtil } from "../utils/auth.js";

class HomePresenter {
  constructor(view) {
    this.view = view;
  }

  async loadStories() {
    try {
      if (!this.view) {
        console.error("View is not initialized");
        return;
      }

      console.log("Loading matches...");
      // Gunakan location=1 untuk mendapatkan matches dengan data lokasi
      const result = await StoryAPI.getAllStories(1, 20, 1);

      if (!this.view.hideLoading) {
        console.error("View method hideLoading not found");
        return;
      }

      this.view.hideLoading();

      // Berdasarkan dokumentasi API: response memiliki error, message, dan listStory
      if (result.error === false && result.listStory) {
        const stories = result.listStory;
        console.log("Matches count:", stories.length);

        if (!this.view.renderStories || !this.view.showNoStories) {
          console.error("Required view methods not found");
          return;
        }

        if (stories.length === 0) {
          this.view.showNoStories();
        } else {
          this.view.renderStories(stories);

          // Render map after a short delay to ensure DOM is ready
          if (this.view.renderStoriesMap) {
            setTimeout(() => {
              this.view.renderStoriesMap(stories);
            }, 500);
          }
        }
      } else {
        throw new ApiError(result.message || "Failed to load matches", null);
      }
    } catch (error) {
      console.error("Error loading matches:", error);

      if (this.view.hideLoading) {
        this.view.hideLoading();
      }

      const errorMessage =
        error instanceof ApiError
          ? ApiError.handle(error)
          : "Failed to load matches. Please try again later.";

      if (this.view.showError) {
        this.view.showError(
          errorMessage,
          error instanceof ApiError ? error.status : "network"
        );
      }

      if (error instanceof ApiError && error.status === 401) {
        AuthUtil.logout();
        setTimeout(() => {
          window.location.hash = "#/login";
        }, 2000);
      }
    }
  }
}

export { HomePresenter };
