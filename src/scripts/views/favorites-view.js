import dbService from "../db.js";

class FavoritesView {
  constructor() {
    this.container = document.getElementById("page-container");
    this.favoriteStories = [];
  }

  async render() {
    this.container.innerHTML = `
      <section class="favorites-section">
        <h2>Your Favorite Stories</h2>
        <p>Stories you've marked as favorites.</p>
        <div class="favorites-container" id="favorites-container">
          <div class="loading-indicator">Loading favorites...</div>
        </div>
      </section>
    `;

    await this.loadFavorites();
  }

  async loadFavorites() {
    try {
      const favoritesContainer = document.getElementById("favorites-container");
      this.favoriteStories = await dbService.getAllFavorites();

      if (this.favoriteStories.length === 0) {
        favoritesContainer.innerHTML = `
          <div class="empty-state">
            <p>You haven't added any stories to your favorites yet.</p>
            <p>Browse stories and click the heart icon to add them to your favorites.</p>
          </div>
        `;
        return;
      }

      // Sort favorites by date added (newest first)
      this.favoriteStories.sort((a, b) => {
        return new Date(b.favoritedAt) - new Date(a.favoritedAt);
      });

      // Render favorites
      favoritesContainer.innerHTML = this.favoriteStories
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
                <span class="story-date">Added to favorites: ${this.formatDate(
                  story.favoritedAt
                )}</span>
              </div>
              <div class="story-actions">
                <button class="btn btn-danger remove-favorite-btn" data-id="${
                  story.id
                }">
                  Remove from Favorites
                </button>
              </div>
            </div>
          </div>
        `
        )
        .join("");

      // Add event listeners to remove buttons
      this.addRemoveButtonListeners();
    } catch (error) {
      console.error("Error loading favorites:", error);
      const favoritesContainer = document.getElementById("favorites-container");
      favoritesContainer.innerHTML = `
        <div class="error-state">
          <p>Failed to load your favorite stories.</p>
          <p>Error: ${error.message}</p>
        </div>
      `;
    }
  }

  addRemoveButtonListeners() {
    const removeButtons = document.querySelectorAll(".remove-favorite-btn");
    removeButtons.forEach((button) => {
      button.addEventListener("click", async (event) => {
        const storyId = event.target.dataset.id;
        try {
          await dbService.removeFromFavorites(storyId);

          // Refresh the list
          await this.loadFavorites();

          // Show success message
          this.showNotification("Story removed from favorites");
        } catch (error) {
          console.error("Error removing from favorites:", error);
          this.showNotification("Failed to remove from favorites", "error");
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
    const removeButtons = document.querySelectorAll(".remove-favorite-btn");
    removeButtons.forEach((button) => {
      button.removeEventListener("click", () => {});
    });
  }
}

export { FavoritesView };
