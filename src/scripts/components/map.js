import { CONFIG } from "../utils/config.js";

class MapComponent {
  constructor(containerId, options = {}) {
    this.containerId = containerId;
    this.options = {
      clickable: false,
      showPopup: true,
      center: [CONFIG.DEFAULT_COORDINATES.lat, CONFIG.DEFAULT_COORDINATES.lng],
      zoom: CONFIG.DEFAULT_COORDINATES.zoom,
      ...options,
    };
    this.map = null;
    this.markers = [];
    this.selectedLocation = null;
    this.selectionMarker = null;
  }

  init() {
    this.createMap();
    if (this.options.clickable) {
      this.enableLocationSelection();
    }
  }

  createMap() {
    this.map = L.map(this.containerId).setView(
      this.options.center,
      this.options.zoom
    );

    L.tileLayer(CONFIG.MAP_TILE_URL, {
      attribution: CONFIG.MAP_ATTRIBUTION,
    }).addTo(this.map);
  }

  enableLocationSelection() {
    this.map.on("click", (e) => {
      this.selectLocation(e.latlng);
    });
  }

  selectLocation(latlng) {
    const { lat, lng } = latlng;

    this.clearSelectionMarker();

    this.selectionMarker = L.marker([lat, lng]).addTo(this.map);

    if (this.options.showPopup) {
      this.selectionMarker.bindPopup("Selected location").openPopup();
    }

    this.selectedLocation = { lat, lng };

    if (this.options.onLocationSelect) {
      this.options.onLocationSelect(lat, lng);
    }
  }

  addMarker(lat, lng, popupContent = "", options = {}) {
    const marker = L.marker([lat, lng], options).addTo(this.map);

    if (popupContent) {
      marker.bindPopup(popupContent);
    }

    this.markers.push(marker);
    return marker;
  }

  addMultipleMarkers(locations) {
    locations.forEach((location) => {
      if (location.lat && location.lng) {
        this.addMarker(
          location.lat,
          location.lng,
          location.popup || "",
          location.options || {}
        );
      }
    });

    if (this.markers.length > 0) {
      const group = new L.featureGroup(this.markers);
      this.map.fitBounds(group.getBounds().pad(0.1));
    }
  }

  clearSelectionMarker() {
    if (this.selectionMarker) {
      this.map.removeLayer(this.selectionMarker);
      this.selectionMarker = null;
    }
  }

  getSelectedLocation() {
    return this.selectedLocation;
  }

  destroy() {
    if (this.map) {
      this.map.remove();
      this.map = null;
    }
  }
}

export { MapComponent };
