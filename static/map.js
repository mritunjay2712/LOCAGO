// Initialize Leaflet map
var initialLatitude = 30.3753;
var initialLongitude = 78.4744;
var initialZoom = 10;
var map = L.map('map').setView([initialLatitude, initialLongitude], initialZoom);

// Add OpenStreetMap tiles to the map
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
}).addTo(map);

// Layer group for markers
var markersLayer = L.layerGroup().addTo(map);

// Object to store markers and their last update times by vehicle_id
var markers = {};
var lastUpdateTimes = {};
var lastLocations = {};
var stopCounts = {};

// Default vehicle icon
var vehicleIcon = L.icon({
    iconUrl: '/static/vehicle.png', // Adjust path if necessary
    iconSize: [50, 50],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32]
});

// Function to show alert message
function showAlert(message) {
    alert(message); // Display alert message
}

// Function to add a marker
function addMarker(latitude, longitude, title, popupText, icon) {
    var marker = L.marker([latitude, longitude], { icon: icon }).addTo(markersLayer)
        .bindPopup(popupText) // Bind popup without opening it
        .on('click', function() { // Add click event listener to marker
            var vehicleId = title;
            displayVehiclePath(vehicleId); // Display path for the selected vehicle
            marker.openPopup(); // Open the marker's popup
        });
    markers[title] = marker;
}

// Function to check if location is within Tehri district
function isWithinAssignedArea(latitude, longitude) {
    // Define Tehri district boundaries
    var north = 30.5903;
    var south = 30.2112;
    var east = 78.7804;
    var west = 78.1183;

    return (south <= latitude && latitude <= north && west <= longitude && east >= longitude);
}

// Function to update map markers and list of vehicles
function updateMap() {
    fetch('/live_locations')
        .then(response => response.json())
        .then(data => {
            // Clear previous markers
            markersLayer.clearLayers();

            // Arrays to hold vehicles inside and outside Tehri district
            var insideVehicles = [];
            var outsideVehicles = [];
            var bounds = [];
            var currentTime = new Date().getTime();

            data.forEach(location => {
                var vehicleId = location.vehicle_id;
                var popupText = `<b>${vehicleId}</b>`;

                // Check if location is out of Tehri district
                if (!isWithinAssignedArea(location.latitude, location.longitude)) {
                    outsideVehicles.push(location);
                    popupText += '<br><i>(Outside Tehri District)</i>';
                } else {
                    insideVehicles.push(location);
                }

                // Check if the vehicle has stopped
                if (lastLocations[vehicleId] &&
                    lastLocations[vehicleId].latitude === location.latitude &&
                    lastLocations[vehicleId].longitude === location.longitude) {
                    
                    stopCounts[vehicleId] = (stopCounts[vehicleId] || 0) + 1;

                    if (stopCounts[vehicleId] >= 10) { // 5 consecutive fetches
                        popupText += '<br><i>(Stopped)</i>';
                    }
                } else {
                    stopCounts[vehicleId] = 0;
                }

                // Update the last location and time for the vehicle
                lastLocations[vehicleId] = {
                    latitude: location.latitude,
                    longitude: location.longitude
                };
                lastUpdateTimes[vehicleId] = currentTime;

                addMarker(location.latitude, location.longitude, vehicleId, popupText, vehicleIcon);
                
                // Add location to bounds array
                bounds.push([location.latitude, location.longitude]);

                // Send GPS data to Flask backend
                sendGPSData(vehicleId, location.latitude, location.longitude);
            });

            // Update the list of vehicles outside Tehri district in HTML
            var outsideVehiclesList = document.getElementById('outsideVehiclesList');
            outsideVehiclesList.innerHTML = '';
            outsideVehicles.forEach(vehicle => {
                var listItem = document.createElement('li');
                listItem.innerHTML = `
                    <button class="vehicle-btn">
                        ${vehicle.vehicle_id} - ${vehicle.latitude}, ${vehicle.longitude}
                    </button>`;
                listItem.dataset.vehicleId = vehicle.vehicle_id; // Add data attribute
                outsideVehiclesList.appendChild(listItem);
            });

            // Fit map to bounds only if it's the initial load
            var currentBounds = markersLayer.getBounds();
            if (currentBounds.isValid() && map.getZoom() === initialZoom) {
                map.fitBounds(currentBounds);
            }

            // Call updateMap function recursively every 2 seconds
            setTimeout(updateMap, 2000);
        })
        .catch(error => {
            console.error('Error fetching data:', error);
            // Retry after 2 seconds on error
            setTimeout(updateMap, 2000);
        });
}

// Function to send GPS data to Flask backend
function sendGPSData(vehicle_id, latitude, longitude) {
    fetch('/gps_data', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `vehicle_id=${vehicle_id}&latitude=${latitude}&longitude=${longitude}`
    })
    .then(response => {
        if (response.ok) {
            console.log('GPS data sent successfully');
        } else {
            console.error('Failed to send GPS data:', response.status);
        }
    })
    .catch(error => {
        console.error('Error sending GPS data:', error);
    });
}

// Function to add hospital markers
function addHospitals() {
    var hospitals = [
        { name: 'District Hospital, Tehri', latitude: 30.3877, longitude: 78.4911 },
        { name: 'CHC New Tehri', latitude: 30.3835, longitude: 78.4950 },
        { name: 'CHC Ghansali', latitude: 30.7357, longitude: 78.5766 },
        { name: 'CHC Pratapnagar', latitude: 30.3836, longitude: 78.3382 },
        { name: 'CHC Narendra Nagar', latitude: 30.1395, longitude: 78.4301 },
        { name: 'CHC Chamba', latitude: 30.3785, longitude: 78.4865 },
        { name: 'CHC Devprayag', latitude: 30.1458, longitude: 78.6513 },
        { name: 'CHC Baurari', latitude: 30.3088, longitude: 78.4723 }
    ];

    var hospitalIcon = L.icon({
        iconUrl: '/static/hospital.png', // Path to custom hospital icon
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32]
    });

    hospitals.forEach(hospital => {
        var popupText = `<b>${hospital.name}</b>`;
        L.marker([hospital.latitude, hospital.longitude], { icon: hospitalIcon })
            .bindPopup(popupText)
            .addTo(map);
    });
}

// Function to add police station markers
function addPoliceStations() {
    var policeStations = [
        { name: 'Kampti Police Station', latitude: 30.49361039504872, longitude: 78.03809002354662 },
        { name: 'Thatyur Police Station', latitude: 30.493017368093515, longitude: 78.16649979644664 },
        { name: 'Ghansali Police Station', latitude: 30.439384052730997, longitude: 78.657028042618 },
        { name: 'Chamba Police Station', latitude: 30.346006398262368, longitude: 78.39552128685774 },
        { name: 'New Tehri Police Station', latitude: 30.37856826704953, longitude: 78.43457468720366 },
        { name: 'Hindolakhal Police Station', latitude: 30.3833, longitude: 78.6167 },
        { name: 'Kirtinagar Police Station', latitude: 30.215530168081997, longitude: 78.74732858810094 },
        { name: 'Narendranagar Police Station', latitude: 30.16864603767247, longitude: 78.2833089415394 },
        { name: 'Muni Ki Reti Police Station', latitude: 30.145355889091377, longitude: 78.32868150619983 },
        { name: 'Devprayag Police Station', latitude: 30.15325828217646, longitude: 78.59628826230167 }
    ];

    var policeIcon = L.icon({
        iconUrl: '/static/ps.png', // Path to custom police station icon
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32]
    });

    policeStations.forEach(station => {
        var popupText = `<b>${station.name}</b>`;
        L.marker([station.latitude, station.longitude], { icon: policeIcon })
            .bindPopup(popupText)
            .addTo(map);
    });
}

// Function to add fire brigade station markers
function addFireStations() {
    var fireStations = [
        { name: 'Chamba Fire Station', latitude: 30.325503945958564, longitude: 78.80810789232052 },
        { name: 'Tehri Fire Station', latitude: 30.37975174899669, longitude: 78.44556447104012 },
        { name: 'Rishikesh Fire Station', latitude: 30.10201051564916, longitude: 78.294923236032 },
        { name: 'Muniki Reti Fire Station', latitude: 30.11164969462596, longitude: 78.30906154285272 }
    ];

    var fireIcon = L.icon({
        iconUrl: '/static/fire_brigade.png', // Path to custom fire brigade station icon
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32]
    });

    fireStations.forEach(station => {
        var popupText = `<b>${station.name}</b>`;
        L.marker([station.latitude, station.longitude], { icon: fireIcon })
            .bindPopup(popupText)
            .addTo(map);
    });
}

// Function to fetch and display vehicle path
function displayVehiclePath(vehicle_id) {
    fetch(`/vehicle_path/${vehicle_id}`)
        .then(response => response.json())
        .then(data => {
            // Clear previous path if any
            if (window.currentPath) {
                map.removeLayer(window.currentPath);
            }

            // Prepare coordinates for polyline
            var polylineCoords = data.map(point => [point.latitude, point.longitude]);

            // Create and add polyline to map
            window.currentPath = L.polyline(polylineCoords, { color: 'blue' }).addTo(map);

            // Fit map to bounds of the polyline
            map.fitBounds(window.currentPath.getBounds());
        })
        .catch(error => {
            console.error('Error fetching vehicle path:', error);
            showAlert('Failed to fetch vehicle path data');
        });
}

// Call updateMap function to start updating markers and lists
updateMap();

// Add hospital, police station, and fire brigade station markers (called once initially)
addHospitals();
addPoliceStations();
addFireStations();

// Persist map zoom level on zoom events
map.on('zoomend', function() {
    zoomLevel = map.getZoom();
});

// Modal functionality
var modal = document.getElementById('addVehicleModal');
var btn = document.getElementById('addVehicleBtn');
var span = document.getElementsByClassName('close')[0];

// Open the modal
btn.onclick = function() {
    modal.style.display = 'block';
}

// Close the modal
span.onclick = function() {
    modal.style.display = 'none';
}

// Close the modal if the user clicks outside of it
window.onclick = function(event) {
    if (event.target == modal) {
        modal.style.display = 'none';
    }
}

// Event delegation for vehicle list clicks
document.getElementById('allVehiclesList').addEventListener('click', function(event) {
    var listItem = event.target.closest('li');
    if (listItem) {
        var vehicleId = listItem.dataset.vehicleId;
        if (markers[vehicleId]) {
            map.setView(markers[vehicleId].getLatLng(), zoomLevel);
            markers[vehicleId].openPopup();
        }
    }
});

document.addEventListener('DOMContentLoaded', function() {
    // Event delegation for vehicle list clicks in Vehicles Outside Tehri District section
    document.getElementById('outsideVehiclesList').addEventListener('click', function(event) {
        var listItem = event.target.closest('li');
        if (listItem) {
            var vehicleId = listItem.dataset.vehicleId;
            if (markers[vehicleId]) {
                map.setView(markers[vehicleId].getLatLng(), zoomLevel);
                markers[vehicleId].openPopup();
            }
        }
    });
});

// Function to fetch and display emergency service locations
function fetchEmergencyService(serviceType) {
    // Fetch user's geolocation
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            function(position) {
                const userLatitude = position.coords.latitude;
                const userLongitude = position.coords.longitude;

                // Call backend API with user's geolocation
                fetch(`/emergency_service/${serviceType}?user_latitude=${userLatitude}&user_longitude=${userLongitude}`)
                    .then(response => {
                        if (!response.ok) {
                            throw new Error(`HTTP error! Status: ${response.status}`);
                        }
                        return response.json();
                    })
                    .then(data => {
                        if (data.length > 0) {
                            showEmergencyServiceLocations(data);
                        } else {
                            alert(`No ${serviceType} vehicles found.`);
                        }
                    })
                    .catch(error => {
                        console.error('Error fetching emergency service data:', error);
                        alert('Failed to fetch emergency service data. Please try again.');
                    });
            },
            function(error) {
                console.error('Error fetching user location:', error);
                alert('Failed to fetch your location. Please enable location services and try again.');
            }
        );
    } else {
        alert('Geolocation is not supported by this browser.');
    }
}

// Function to display emergency service locations on the map
function showEmergencyServiceLocations(locations) {
    locations.forEach(location => {
        var popupText = `<b>${location.vehicle_id}</b>`;
        var marker = L.marker([location.latitude, location.longitude], { icon: vehicleIcon })
            .bindPopup(popupText)
            .addTo(markersLayer);
        markers[location.vehicle_id] = marker;
    });
}

// Add event listener to clear vehicle path when clicking outside the map
document.addEventListener('click', function(event) {
    if (!map.getContainer().contains(event.target)) {
        if (window.currentPath) {
            map.removeLayer(window.currentPath);
            window.currentPath = null;
        }
        // Reset map to initial position and zoom
        map.setView([initialLatitude, initialLongitude], initialZoom);
    }
});
