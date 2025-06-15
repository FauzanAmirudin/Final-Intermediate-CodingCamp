class DatabaseService {
  constructor() {
    this.dbName = "StoryAppDB";
    this.dbVersion = 1;
    this.storeName = "stories";
    this.favoriteStoreName = "favoriteStories";
    this.db = null;
  }

  // Initialize database
  async init() {
    return new Promise((resolve, reject) => {
      if (this.db) {
        return resolve(this.db);
      }

      console.log("Opening IndexedDB...");
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = (event) => {
        console.error("IndexedDB error:", event.target.error);
        reject("Error opening database");
      };

      request.onsuccess = (event) => {
        this.db = event.target.result;
        console.log("IndexedDB opened successfully");
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        console.log("Creating object stores...");

        // Create stories object store if it doesn't exist
        if (!db.objectStoreNames.contains(this.storeName)) {
          const storyStore = db.createObjectStore(this.storeName, {
            keyPath: "id",
          });

          // Create indexes
          storyStore.createIndex("name", "name", { unique: false });
          storyStore.createIndex("createdAt", "createdAt", { unique: false });
        }

        // Create favorite stories object store if it doesn't exist
        if (!db.objectStoreNames.contains(this.favoriteStoreName)) {
          const favoriteStore = db.createObjectStore(this.favoriteStoreName, {
            keyPath: "id",
          });

          // Create indexes
          favoriteStore.createIndex("name", "name", { unique: false });
          favoriteStore.createIndex("createdAt", "createdAt", {
            unique: false,
          });
        }
      };
    });
  }

  // Add a story to IndexedDB
  async addStory(story) {
    try {
      await this.init();
      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction([this.storeName], "readwrite");
        const store = transaction.objectStore(this.storeName);

        // Add timestamp if not present
        if (!story.savedAt) {
          story.savedAt = new Date().toISOString();
        }

        const request = store.put(story);

        request.onsuccess = () => {
          console.log("Story added to IndexedDB:", story.id);
          resolve(request.result);
        };

        request.onerror = (event) => {
          console.error("Error adding story to IndexedDB:", event.target.error);
          reject(event.target.error);
        };

        transaction.oncomplete = () => {
          console.log("Transaction completed");
        };
      });
    } catch (error) {
      console.error("Failed to add story to IndexedDB:", error);
      throw error;
    }
  }

  // Get all stories from IndexedDB
  async getAllStories() {
    try {
      await this.init();
      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction([this.storeName], "readonly");
        const store = transaction.objectStore(this.storeName);
        const request = store.getAll();

        request.onsuccess = () => {
          console.log(
            "Retrieved all stories from IndexedDB:",
            request.result.length
          );
          resolve(request.result);
        };

        request.onerror = (event) => {
          console.error(
            "Error getting stories from IndexedDB:",
            event.target.error
          );
          reject(event.target.error);
        };
      });
    } catch (error) {
      console.error("Failed to get stories from IndexedDB:", error);
      throw error;
    }
  }

  // Get a story by ID from IndexedDB
  async getStory(id) {
    try {
      await this.init();
      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction([this.storeName], "readonly");
        const store = transaction.objectStore(this.storeName);
        const request = store.get(id);

        request.onsuccess = () => {
          if (request.result) {
            console.log("Retrieved story from IndexedDB:", id);
            resolve(request.result);
          } else {
            console.log("Story not found in IndexedDB:", id);
            resolve(null);
          }
        };

        request.onerror = (event) => {
          console.error(
            "Error getting story from IndexedDB:",
            event.target.error
          );
          reject(event.target.error);
        };
      });
    } catch (error) {
      console.error("Failed to get story from IndexedDB:", error);
      throw error;
    }
  }

  // Delete a story by ID from IndexedDB
  async deleteStory(id) {
    try {
      await this.init();
      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction([this.storeName], "readwrite");
        const store = transaction.objectStore(this.storeName);
        const request = store.delete(id);

        request.onsuccess = () => {
          console.log("Deleted story from IndexedDB:", id);
          resolve(true);
        };

        request.onerror = (event) => {
          console.error(
            "Error deleting story from IndexedDB:",
            event.target.error
          );
          reject(event.target.error);
        };
      });
    } catch (error) {
      console.error("Failed to delete story from IndexedDB:", error);
      throw error;
    }
  }

  // Add a story to favorites
  async addToFavorites(story) {
    try {
      await this.init();
      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction(
          [this.favoriteStoreName],
          "readwrite"
        );
        const store = transaction.objectStore(this.favoriteStoreName);

        // Add favorite flag and timestamp
        story.isFavorite = true;
        story.favoritedAt = new Date().toISOString();

        const request = store.put(story);

        request.onsuccess = () => {
          console.log("Story added to favorites:", story.id);
          resolve(request.result);
        };

        request.onerror = (event) => {
          console.error("Error adding story to favorites:", event.target.error);
          reject(event.target.error);
        };
      });
    } catch (error) {
      console.error("Failed to add story to favorites:", error);
      throw error;
    }
  }

  // Remove a story from favorites
  async removeFromFavorites(id) {
    try {
      await this.init();
      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction(
          [this.favoriteStoreName],
          "readwrite"
        );
        const store = transaction.objectStore(this.favoriteStoreName);
        const request = store.delete(id);

        request.onsuccess = () => {
          console.log("Story removed from favorites:", id);
          resolve(true);
        };

        request.onerror = (event) => {
          console.error(
            "Error removing story from favorites:",
            event.target.error
          );
          reject(event.target.error);
        };
      });
    } catch (error) {
      console.error("Failed to remove story from favorites:", error);
      throw error;
    }
  }

  // Get all favorite stories
  async getAllFavorites() {
    try {
      await this.init();
      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction(
          [this.favoriteStoreName],
          "readonly"
        );
        const store = transaction.objectStore(this.favoriteStoreName);
        const request = store.getAll();

        request.onsuccess = () => {
          console.log("Retrieved all favorite stories:", request.result.length);
          resolve(request.result);
        };

        request.onerror = (event) => {
          console.error("Error getting favorite stories:", event.target.error);
          reject(event.target.error);
        };
      });
    } catch (error) {
      console.error("Failed to get favorite stories:", error);
      throw error;
    }
  }

  // Check if a story is in favorites
  async isFavorite(id) {
    try {
      await this.init();
      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction(
          [this.favoriteStoreName],
          "readonly"
        );
        const store = transaction.objectStore(this.favoriteStoreName);
        const request = store.get(id);

        request.onsuccess = () => {
          resolve(!!request.result);
        };

        request.onerror = (event) => {
          console.error(
            "Error checking if story is favorite:",
            event.target.error
          );
          reject(event.target.error);
        };
      });
    } catch (error) {
      console.error("Failed to check if story is favorite:", error);
      throw error;
    }
  }

  // Clear all data from IndexedDB
  async clearAllData() {
    try {
      await this.init();
      return Promise.all([
        new Promise((resolve, reject) => {
          const transaction = this.db.transaction(
            [this.storeName],
            "readwrite"
          );
          const store = transaction.objectStore(this.storeName);
          const request = store.clear();

          request.onsuccess = () => {
            console.log("Cleared all stories from IndexedDB");
            resolve(true);
          };

          request.onerror = (event) => {
            console.error("Error clearing stories:", event.target.error);
            reject(event.target.error);
          };
        }),
        new Promise((resolve, reject) => {
          const transaction = this.db.transaction(
            [this.favoriteStoreName],
            "readwrite"
          );
          const store = transaction.objectStore(this.favoriteStoreName);
          const request = store.clear();

          request.onsuccess = () => {
            console.log("Cleared all favorite stories from IndexedDB");
            resolve(true);
          };

          request.onerror = (event) => {
            console.error(
              "Error clearing favorite stories:",
              event.target.error
            );
            reject(event.target.error);
          };
        }),
      ]);
    } catch (error) {
      console.error("Failed to clear all data from IndexedDB:", error);
      throw error;
    }
  }
}

// Export database service instance
const dbService = new DatabaseService();
export default dbService;
