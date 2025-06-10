import { CONFIG } from "../utils/config.js";
import { AuthUtil } from "../utils/auth.js";
import { ApiError } from "../utils/api-error.js";

class StoryAPI {
  static getAuthHeaders() {
    const token = AuthUtil.getToken();
    if (!token) {
      return {
        Accept: "application/json",
      };
    }
    return {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    };
  }

  static async getAllStories(page = 1, size = 20, location = 1) {
    try {
      // Construct URL with parameters
      const params = new URLSearchParams({
        page: page.toString(),
        size: size.toString(),
        location: location.toString(),
      });

      const url = `${CONFIG.API_BASE_URL}/stories?${params}`;
      console.log("Fetching stories from:", url);

      const response = await fetch(url, {
        method: "GET",
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new ApiError("Failed to fetch stories", response.status);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error in getAllStories:", error);

      if (ApiError.isNetworkError(error)) {
        throw new ApiError("Failed to connect to the server", null, true);
      }

      if (error instanceof ApiError) {
        throw error;
      }

      throw new ApiError(error.message);
    }
  }

  static async getStoryDetail(storyId) {
    try {
      console.log("Fetching story detail for ID:", storyId);

      const response = await fetch(
        `${CONFIG.API_BASE_URL}/stories/${storyId}`,
        {
          method: "GET",
          headers: this.getAuthHeaders(),
        }
      );

      console.log("Story detail response status:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Error response:", errorText);

        if (response.status === 401) {
          throw new Error("Authentication failed. Please login again.");
        }

        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      console.log("Story detail received:", data);

      return data;
    } catch (error) {
      console.error("Error in getStoryDetail:", error);

      if (error.name === "TypeError" && error.message.includes("fetch")) {
        throw new Error("Network error: Please check your internet connection");
      }

      throw error;
    }
  }

  static async addStory(formData) {
    try {
      console.log("Adding story...");

      // Log FormData contents for debugging
      console.log("FormData contents:");
      for (let [key, value] of formData.entries()) {
        if (key === "photo") {
          console.log(key, "- File size:", value.size, "bytes");
        } else {
          console.log(key, ":", value);
        }
      }

      const response = await fetch(`${CONFIG.API_BASE_URL}/stories`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${AuthUtil.getToken()}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new ApiError(
          errorData.message || "Failed to add story",
          response.status
        );
      }

      const data = await response.json();
      console.log("Story added successfully:", data);

      return data;
    } catch (error) {
      console.error("Error in addStory:", error);

      if (ApiError.isNetworkError(error)) {
        throw new ApiError("Failed to connect to the server", null, true);
      }

      if (error instanceof ApiError) {
        throw error;
      }

      throw new ApiError(error.message);
    }
  }

  static async register(userData) {
    try {
      console.log("Registering user:", userData.email);

      const response = await fetch(`${CONFIG.API_BASE_URL}/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
      });

      const data = await response.json();
      console.log("Register response:", data);

      if (!response.ok) {
        throw new ApiError(
          data.message || "Registration failed",
          response.status
        );
      }

      return data;
    } catch (error) {
      console.error("Error in register:", error);

      if (ApiError.isNetworkError(error)) {
        throw new ApiError("Failed to connect to the server", null, true);
      }

      if (error instanceof ApiError) {
        throw error;
      }

      throw new ApiError(error.message);
    }
  }

  static async login(credentials) {
    try {
      console.log("Logging in user:", credentials.email);

      const response = await fetch(`${CONFIG.API_BASE_URL}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(credentials),
      });

      const data = await response.json();
      console.log("Login response:", data);

      if (!response.ok) {
        throw new ApiError(data.message || "Login failed", response.status);
      }

      if (data.error === false && data.loginResult && data.loginResult.token) {
        AuthUtil.setToken(data.loginResult.token);
        AuthUtil.setUserInfo({
          userId: data.loginResult.userId,
          name: data.loginResult.name,
          email: credentials.email,
        });
      }

      return data;
    } catch (error) {
      console.error("Error in login:", error);

      if (ApiError.isNetworkError(error)) {
        throw new ApiError("Failed to connect to the server", null, true);
      }

      if (error instanceof ApiError) {
        throw error;
      }

      throw new ApiError(error.message);
    }
  }
}

export { StoryAPI };
