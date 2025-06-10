class ApiError extends Error {
  constructor(message, status = null, isNetworkError = false) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.isNetworkError = isNetworkError;
  }

  static handle(error) {
    if (error instanceof ApiError) {
      switch (error.status) {
        case 401:
          return "Session expired. Please login again.";
        case 403:
          return "You don't have permission to perform this action.";
        case 404:
          return "The requested resource was not found.";
        case 413:
          return "The file you're trying to upload is too large.";
        case 429:
          return "Too many requests. Please try again later.";
        case 500:
          return "Server error. Please try again later.";
        default:
          if (error.isNetworkError) {
            return "Network error: Please check your internet connection.";
          }
          return error.message || "An unexpected error occurred.";
      }
    }
    return error.message || "An unexpected error occurred.";
  }

  static isNetworkError(error) {
    return (
      error.name === "TypeError" &&
      (error.message.includes("fetch") ||
        error.message.includes("network") ||
        error.message.includes("Failed to fetch"))
    );
  }
}

export { ApiError };
