import { StoryAPI } from "../api/story-api.js";
import { ApiError } from "../utils/api-error.js";
import { AuthUtil } from "../utils/auth.js";
import dbService from "../db.js";

class HomePresenter {
  constructor(view) {
    this.view = view;
    this.stories = [];
  }

  async loadStories() {
    try {
      // Try to load stories from API
      const apiResponse = await StoryAPI.getAllStories();

      if (apiResponse.error === false && apiResponse.listStory) {
        this.stories = apiResponse.listStory;

        // Save stories to IndexedDB for offline access
        await this.saveStoriesToIndexedDB(this.stories);

        this.view.hideLoading();
        this.view.renderStories(this.stories);

        // If we have stories with location data, render the map
        const storiesWithLocation = this.stories.filter(
          (story) => story.lat && story.lon
        );

        if (storiesWithLocation.length > 0) {
          this.view.renderStoriesMap(this.stories);
        }
      } else {
        throw new Error("Failed to load stories from API");
      }
    } catch (error) {
      console.error("Error loading stories from API:", error);

      // If API request fails, try to load from IndexedDB
      try {
        console.log("Attempting to load stories from IndexedDB...");
        const offlineStories = await dbService.getAllStories();

        if (offlineStories && offlineStories.length > 0) {
          console.log("Loaded stories from IndexedDB:", offlineStories.length);
          this.stories = offlineStories;
          this.view.hideLoading();
          this.view.renderStories(this.stories);

          // Show offline notification
          this.view.showOfflineNotification();

          // If we have stories with location data, render the map
          const storiesWithLocation = this.stories.filter(
            (story) => story.lat && story.lon
          );

          if (storiesWithLocation.length > 0) {
            this.view.renderStoriesMap(this.stories);
          }
        } else {
          // No stories in IndexedDB either
          this.view.hideLoading();
          this.view.showNoStories();
        }
      } catch (dbError) {
        console.error("Error loading stories from IndexedDB:", dbError);
        this.view.hideLoading();
        this.view.showError(
          "Failed to load stories. Please check your internet connection and try again."
        );
      }
    }
  }

  async saveStoriesToIndexedDB(stories) {
    try {
      // Initialize database if not already initialized
      await dbService.init();

      // Save each story to IndexedDB
      for (const story of stories) {
        // Add timestamp when it was saved
        story.savedAt = new Date().toISOString();

        // Check if this story is already in favorites
        const isFavorite = await dbService.isFavorite(story.id);
        if (isFavorite) {
          story.isFavorite = true;
        }

        await dbService.addStory(story);
      }

      console.log(`Successfully saved ${stories.length} stories to IndexedDB`);
    } catch (error) {
      console.error("Error saving stories to IndexedDB:", error);
    }
  }

  async addStoryToFavorites(storyId) {
    try {
      const story = this.stories.find((s) => s.id === storyId);
      if (!story) {
        throw new Error("Story not found");
      }

      await dbService.addToFavorites(story);
      return true;
    } catch (error) {
      console.error("Error adding story to favorites:", error);
      return false;
    }
  }

  async removeStoryFromFavorites(storyId) {
    try {
      await dbService.removeFromFavorites(storyId);
      return true;
    } catch (error) {
      console.error("Error removing story from favorites:", error);
      return false;
    }
  }
}

export { HomePresenter };
