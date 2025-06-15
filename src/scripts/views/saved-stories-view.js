import dbService from "../db.js";

class SavedStoriesView {
  constructor() {
    this.container = document.getElementById("page-container");
    this.savedStories = [];
  }

  async render() {
    this.container.innerHTML = `
      <section class="saved-stories-section">
        <h2>Your Saved Stories</h2>
        <p>Stories saved for offline viewing.</p>
        <div class="saved-stories-container" id="saved-stories-container">
          <div class="loading-indicator">Loading saved stories...</div>
        </div>
      </section>
    `;

    await this.loadSavedStories();
  }

  async loadSavedStories() {
    try {
      const savedStoriesContainer = document.getElementById(
        "saved-stories-container"
      );
      this.savedStories = await dbService.getAllStories();

      if (this.savedStories.length === 0) {
        savedStoriesContainer.innerHTML = `
          <div class="empty-state">
            <p>You haven't saved any stories yet.</p>
            <p>Stories you view will be automatically saved for offline viewing.</p>
          </div>
        `;
        return;
      }

      // Sort saved stories by date saved (newest first)
      this.savedStories.sort((a, b) => {
        return new Date(b.savedAt) - new Date(a.savedAt);
      });

      // Render saved stories
      savedStoriesContainer.innerHTML = this.savedStories
        .map(
          (story) => `
          <div class="story-card" data-id="${story.id}">
            <div class="story-image">
              <img src="${story.photoUrl}" alt="${
            story.name
          }'s story" loading="lazy">
            </div>
            <div class="story-content">
              <h3 class="story-title">${story.name}</h3>
              <p class="story-description">${story.description}</p>
              <div class="story-meta">
                <span class="story-date">Saved: ${this.formatDate(
                  story.savedAt
                )}</span>
              </div>
              <div class="story-actions">
                <button class="btn btn-danger delete-story-btn" data-id="${
                  story.id
                }">
                  Delete from Saved Stories
                </button>
                ${
                  !story.isFavorite
                    ? `
                <button class="btn btn-primary add-favorite-btn" data-id="${story.id}">
                  Add to Favorites
                </button>
                `
                    : ""
                }
              </div>
            </div>
          </div>
        `
        )
        .join("");

      // Add event listeners to buttons
      this.addButtonListeners();
    } catch (error) {
      console.error("Error loading saved stories:", error);
      const savedStoriesContainer = document.getElementById(
        "saved-stories-container"
      );
      savedStoriesContainer.innerHTML = `
        <div class="error-state">
          <p>Failed to load your saved stories.</p>
          <p>Error: ${error.message}</p>
        </div>
      `;
    }
  }

  addButtonListeners() {
    // Delete buttons
    const deleteButtons = document.querySelectorAll(".delete-story-btn");
    deleteButtons.forEach((button) => {
      button.addEventListener("click", async (event) => {
        const storyId = event.target.dataset.id;
        try {
          await dbService.deleteStory(storyId);

          // Refresh the list
          await this.loadSavedStories();

          // Show success message
          this.showNotification("Story deleted from saved stories");
        } catch (error) {
          console.error("Error deleting story:", error);
          this.showNotification("Failed to delete story", "error");
        }
      });
    });

    // Add to favorites buttons
    const favoriteButtons = document.querySelectorAll(".add-favorite-btn");
    favoriteButtons.forEach((button) => {
      button.addEventListener("click", async (event) => {
        const storyId = event.target.dataset.id;
        try {
          // Get the story from saved stories
          const story = this.savedStories.find((s) => s.id === storyId);
          if (story) {
            await dbService.addToFavorites(story);

            // Refresh the list
            await this.loadSavedStories();

            // Show success message
            this.showNotification("Story added to favorites");
          }
        } catch (error) {
          console.error("Error adding to favorites:", error);
          this.showNotification("Failed to add to favorites", "error");
        }
      });
    });
  }

  showNotification(message, type = "success") {
    // Create notification element
    const notification = document.createElement("div");
    notification.className = `notification ${type}`;
    notification.textContent = message;

    // Add to document
    document.body.appendChild(notification);

    // Remove after 3 seconds
    setTimeout(() => {
      notification.classList.add("fade-out");
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 500);
    }, 3000);
  }

  formatDate(dateString) {
    const options = {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    };
    return new Date(dateString).toLocaleDateString("en-US", options);
  }

  destroy() {
    // Clean up any event listeners or resources
    const deleteButtons = document.querySelectorAll(".delete-story-btn");
    deleteButtons.forEach((button) => {
      button.removeEventListener("click", () => {});
    });

    const favoriteButtons = document.querySelectorAll(".add-favorite-btn");
    favoriteButtons.forEach((button) => {
      button.removeEventListener("click", () => {});
    });
  }
}

export { SavedStoriesView };
