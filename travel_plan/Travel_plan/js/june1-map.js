/**
 * June 1 itinerary map — Leaflet + OSRM walking routes.
 * Expects global L (Leaflet) and a div#itinerary-map.
 */
(function () {
    const el = document.getElementById("itinerary-map");
    if (!el || typeof L === "undefined") return;

    const stops = {
        kingsCross: { lat: 51.5322, lng: -0.1233, label: "King’s Cross" },
        bigBen: { lat: 51.5008, lng: -0.1246, label: "Big Ben" },
        londonEye: { lat: 51.5033, lng: -0.1195, label: "London Eye" },
        taoTaoJu: { lat: 51.5112, lng: -0.1308, label: "Tao Tao Ju (Chinatown)" },
    };

    const map = L.map("itinerary-map").setView([51.508, -0.125], 13);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

    function dotIcon(color) {
        return L.divIcon({
            className: "itinerary-marker",
            html:
                '<div style="width:14px;height:14px;border-radius:50%;background:' +
                color +
                ';border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.4);"></div>',
            iconSize: [14, 14],
            iconAnchor: [7, 7],
        });
    }

    L.marker([stops.kingsCross.lat, stops.kingsCross.lng], { icon: dotIcon("#339af0") })
        .bindPopup("<b>" + stops.kingsCross.label + "</b><br>Start / finish")
        .addTo(map);
    L.marker([stops.bigBen.lat, stops.bigBen.lng], { icon: dotIcon("#ff6b6b") })
        .bindPopup("<b>" + stops.bigBen.label + "</b>")
        .addTo(map);
    L.marker([stops.londonEye.lat, stops.londonEye.lng], { icon: dotIcon("#9775fa") })
        .bindPopup("<b>" + stops.londonEye.label + "</b>")
        .addTo(map);
    L.marker([stops.taoTaoJu.lat, stops.taoTaoJu.lng], { icon: dotIcon("#51cf66") })
        .bindPopup("<b>" + stops.taoTaoJu.label + "</b>")
        .addTo(map);

    const transitLine = L.polyline(
        [
            [stops.kingsCross.lat, stops.kingsCross.lng],
            [stops.bigBen.lat, stops.bigBen.lng],
        ],
        { color: "#fd7e14", weight: 5, opacity: 0.9, dashArray: "10, 8" }
    ).addTo(map);

    function osrmWalk(a, b) {
        const coords = a.lng + "," + a.lat + ";" + b.lng + "," + b.lat;
        return fetch(
            "https://router.project-osrm.org/route/v1/walking/" +
                coords +
                "?overview=full&geometries=geojson"
        )
            .then(function (r) {
                return r.json();
            })
            .then(function (data) {
                if (data.code !== "Ok" || !data.routes || !data.routes[0]) return null;
                return data.routes[0].geometry.coordinates.map(function (c) {
                    return [c[1], c[0]];
                });
            });
    }

    Promise.all([
        osrmWalk(stops.bigBen, stops.londonEye),
        osrmWalk(stops.londonEye, stops.taoTaoJu),
        osrmWalk(stops.taoTaoJu, stops.kingsCross),
    ])
        .then(function (segments) {
            segments.forEach(function (latlngs) {
                if (latlngs && latlngs.length) {
                    L.polyline(latlngs, { color: "#51cf66", weight: 5, opacity: 0.92 }).addTo(map);
                }
            });
            const bounds = L.latLngBounds([
                [stops.kingsCross.lat, stops.kingsCross.lng],
                [stops.bigBen.lat, stops.bigBen.lng],
                [stops.londonEye.lat, stops.londonEye.lng],
                [stops.taoTaoJu.lat, stops.taoTaoJu.lng],
            ]);
            map.fitBounds(bounds, { padding: [36, 36] });
        })
        .catch(function () {
            map.fitBounds(transitLine.getBounds(), { padding: [40, 40] });
        });

    window.addEventListener("load", function () {
        map.invalidateSize();
    });
})();
