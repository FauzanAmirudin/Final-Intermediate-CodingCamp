import { MapComponent } from "../components/map.js";
import { HomePresenter } from "../presenters/home-presenter.js";
import { AuthUtil } from "../utils/auth.js";

class HomeView {
  constructor() {
    this.presenter = new HomePresenter(this);
  }

  async render() {
    const container = document.getElementById("page-container");
    if (!container) {
      console.error("Page container not found");
      return;
    }

    const isLoggedIn = AuthUtil.isAuthenticated();

    container.innerHTML = `
      <div class="page">
        <section class="hero">
          <h1>Welcome to Strory App</h1>
          <p>Discover amazing Strory Appes from around the world</p>
        </section>
        <section class="stories-section">
          <div class="stories-header">
            <h2>Latest Storyes</h2>
            ${
              isLoggedIn
                ? `<a href="#/add" class="btn btn-primary">Add New Story</a>`
                : `<a href="#/login" class="btn btn-primary">Login to Add Story</a>`
            }
          </div>
          <div class="loading" id="loading-indicator">
            <div class="loading-spinner"></div>
            <p>Loading Storyes...</p>
          </div>
          <div id="stories-container"></div>
        </section>
      </div>
    `;

    // Pastikan container sudah ada sebelum memanggil loadStories
    const storiesContainer = document.getElementById("stories-container");
    if (!storiesContainer) {
      console.error("Stories container not found");
      return;
    }

    await this.presenter.loadStories();
  }

  renderStories(stories) {
    const storiesContainer = document.getElementById("stories-container");

    if (!stories || stories.length === 0) {
      storiesContainer.innerHTML = `
        <div class="no-stories">
          <h3>No stories available yet</h3>
          <p>Be the first to share your story!</p>
          <a href="#/add" class="btn btn-primary">Add Your Story</a>
        </div>
      `;
      return;
    }

    storiesContainer.innerHTML = `
      <div class="story-list">
        ${stories.map((story) => this.createStoryCard(story)).join("")}
      </div>
    `;
  }

  createStoryCard(story) {
    if (!story) return "";

    // Berdasarkan API response: story memiliki id, name, description, photoUrl, createdAt, lat, lon
    const storyId = story.id || "";
    const name = story.name || "Anonymous";
    const description = story.description || "No description available";
    const photoUrl = story.photoUrl || "";

    let createdDate = "Unknown date";
    if (story.createdAt) {
      try {
        createdDate = new Date(story.createdAt).toLocaleDateString("id-ID", {
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });
      } catch (e) {
        console.warn("Invalid date format:", story.createdAt);
        createdDate = story.createdAt;
      }
    }

    return `
      <article class="story-card" data-story-id="${storyId}">
        <img src="${photoUrl}" 
             alt="Story photo by ${this.escapeHtml(name)}" 
             class="story-image" 
             loading="lazy"
             onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkltYWdlIG5vdCBhdmFpbGFibGU8L3RleHQ+PC9zdmc+'">
        <div class="story-content">
          <h3 class="story-title">${this.escapeHtml(name)}</h3>
          <p class="story-description">${this.escapeHtml(
            description.length > 150
              ? description.substring(0, 150) + "..."
              : description
          )}</p>
          <div class="story-meta">
            <p class="story-author">By: ${this.escapeHtml(name)}</p>
            <p class="story-date">📅 ${createdDate}</p>
            ${
              story.lat && story.lon
                ? `<p class="story-location">📍 ${parseFloat(story.lat).toFixed(
                    4
                  )}, ${parseFloat(story.lon).toFixed(4)}</p>`
                : ""
            }
          </div>
        </div>
      </article>
    `;
  }

  renderStoriesMap(stories) {
    const storiesContainer = document.getElementById("stories-container");

    if (document.getElementById("stories-map")) {
      return;
    }

    const mapSection = document.createElement("section");
    mapSection.className = "map-section";
    mapSection.innerHTML = `
      <h2>Stories Around the World</h2>
      <div id="stories-map" class="map-container"></div>
    `;
    storiesContainer.appendChild(mapSection);

    setTimeout(() => {
      try {
        const mapComponent = new MapComponent("stories-map", {
          clickable: false,
          showPopup: true,
          zoom: 5,
        });
        mapComponent.init();

        const storyLocations = stories
          .filter((story) => {
            // Pastikan lat dan lon ada dan valid
            return (
              story &&
              story.lat !== null &&
              story.lat !== undefined &&
              story.lon !== null &&
              story.lon !== undefined &&
              !isNaN(parseFloat(story.lat)) &&
              !isNaN(parseFloat(story.lon)) &&
              parseFloat(story.lat) !== 0 &&
              parseFloat(story.lon) !== 0
            );
          })
          .map((story) => ({
            lat: parseFloat(story.lat),
            lng: parseFloat(story.lon),
            popup: `
              <div class="map-popup">
                <h4>${this.escapeHtml(story.name || "Anonymous")}</h4>
                <p>${this.escapeHtml(
                  (story.description || "").substring(0, 100)
                )}${(story.description || "").length > 100 ? "..." : ""}</p>
                <small>📅 ${
                  story.createdAt
                    ? new Date(story.createdAt).toLocaleDateString("id-ID")
                    : "Unknown date"
                }</small>
                <br>
                <small>📍 ${parseFloat(story.lat).toFixed(4)}, ${parseFloat(
              story.lon
            ).toFixed(4)}</small>
              </div>
            `,
          }));

        console.log("Story locations for map:", storyLocations);

        if (storyLocations.length > 0) {
          mapComponent.addMultipleMarkers(storyLocations);
        } else {
          console.warn("No valid story locations found for map");
          // Add info message to map
          const mapContainer = document.getElementById("stories-map");
          mapContainer.innerHTML = `
            <div class="map-no-data">
              <p>No location data available for stories</p>
              <small>Stories need to have valid coordinates to appear on the map</small>
            </div>
          `;
        }
      } catch (error) {
        console.error("Error initializing map:", error);
        const mapSection = document.querySelector(".map-section");
        if (mapSection) {
          mapSection.innerHTML = `
            <h2>Stories Around the World</h2>
            <div class="map-error">
              <p>Unable to load map</p>
              <small>Error: ${error.message}</small>
            </div>
          `;
        }
      }
    }, 100);
  }

  hideLoading() {
    const loading = document.getElementById("loading-indicator");
    if (loading) {
      loading.style.display = "none";
    }
  }

  showNoStories() {
    const storiesContainer = document.getElementById("stories-container");
    const isLoggedIn = AuthUtil.isAuthenticated();

    storiesContainer.innerHTML = `
      <div class="no-stories">
        <h3>No stories available yet</h3>
        <p>Be the first to share your story!</p>
        ${
          isLoggedIn
            ? `<a href="#/add" class="btn btn-primary">Add Your Story</a>`
            : `<a href="#/login" class="btn btn-primary">Login to Add Story</a>`
        }
      </div>
    `;
  }

  showError(message, type = "general") {
    const storiesContainer = document.getElementById("stories-container");
    if (!storiesContainer) {
      console.error("Stories container not found when showing error");
      return;
    }

    const isAuthError = type === "auth" || type === 401;
    const isNetworkError = type === "network";

    storiesContainer.innerHTML = `
      <div class="error">
        <h3>Oops! Something went wrong</h3>
        <p>${message}</p>
        <div class="error-actions">
          ${
            isAuthError
              ? '<a href="#/login" class="btn btn-primary">Login</a>'
              : '<button onclick="location.reload()" class="btn btn-primary">Try Again</button>'
          }
          ${
            !isAuthError && !isNetworkError
              ? '<a href="#/add" class="btn btn-secondary">Add New Story</a>'
              : ""
          }
        </div>
      </div>
    `;
  }

  escapeHtml(text) {
    if (!text) return "";
    const div = document.createElement("div");
    div.textContent = text.toString();
    return div.innerHTML;
  }
}

export { HomeView };
