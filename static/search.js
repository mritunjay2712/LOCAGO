document.addEventListener("DOMContentLoaded", function() {
    const searchVehicleId = document.getElementById("searchVehicleId");
    const searchVehicleType = document.getElementById("searchVehicleType");
    const allVehiclesList = document.getElementById("allVehiclesList");
    const outsideVehiclesList = document.getElementById("outsideVehiclesList");

    searchVehicleId.addEventListener("input", filterVehicles);
    searchVehicleType.addEventListener("input", filterVehicles);

    function filterVehicles() {
        const vehicleIdQuery = searchVehicleId.value.toLowerCase();
        const vehicleTypeQuery = searchVehicleType.value.toLowerCase();

        filterList(allVehiclesList, vehicleIdQuery, vehicleTypeQuery);
        filterList(outsideVehiclesList, vehicleIdQuery, vehicleTypeQuery);
    }

    function filterList(list, vehicleIdQuery, vehicleTypeQuery) {
        const items = list.getElementsByTagName("li");
        Array.from(items).forEach(item => {
            const vehicleId = item.querySelector(".vehicle-id").textContent.toLowerCase();
            const vehicleType = item.querySelector(".vehicle-type").textContent.toLowerCase();
            if (vehicleId.includes(vehicleIdQuery) && vehicleType.includes(vehicleTypeQuery)) {
                item.style.display = "";
            } else {
                item.style.display = "none";
            }
        });
    }
});
