var map;
var crd;
var markers = [];
var myLoc;
function initMap() {
    map = new google.maps.Map(document.getElementById("map"), {
        center: { lat: 42.401251, lng: -71.110237 },
        zoom: 14
    });
}

function success(pos) {
    crd = pos.coords;
    var marker = new google.maps.Marker({
        position: {lat: crd.latitude, lng: crd.longitude},
        map: map,
        title: 'me'
    });
    for (var i = 0; i < markers.length; i++) {
        markers[i].setMap(null);
    }
    markers = [];
    fireRequest(crd,marker);
    myLoc = marker;
}


function fireRequest(location,marker){
    var params = `_id=a1&username=Me&lat=${location.latitude}&lng=${location.longitude}`;
    var req = new XMLHttpRequest();
    req.open('POST','https://serene-caverns-36515.herokuapp.com/rides',true);
    req.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
    req.onload = function () {
        var nearest = calDist(this.responseText,location);
        windowInit(marker,nearest);
        drawLine(nearest,location);
    };
    req.send(params);
}

function calDist(text,me){
    var json = JSON.parse(text);
    var dists = [];
    json.forEach(function (item) {
        var meloc = new google.maps.LatLng(me.latitude, me.longitude);
        var carloc = new google.maps.LatLng(Number(item.lat),Number(item.lng));
        var dist = google.maps.geometry.spherical.computeDistanceBetween(meloc,carloc);
        dists.push([item.username,dist/1609,Number(item.lat),Number(item.lng)]);
        markers.push(markCar(item,dist/1609));
    });
    if(dists.length === 0) {
        alert("No car around you!");
        return null;
    }
    dists.sort(function (a,b) {
        return a[1] - b[1];
    });
    return dists[0];
}

function markCar(item,dist) {
    var image = {
        url : "style/car.png",
        scaledSize: new google.maps.Size(15,35)
    };
    var marker = new google.maps.Marker({
        position: {lat: Number(item.lat), lng: Number(item.lng)},
        map: map,
        icon: image,
        title: item.username
    });
    var content = `This vehicle is ${dist} miles away from you. `;
    var infowindow = new google.maps.InfoWindow({
        content: content
    })
    marker.addListener("click", function () {
        infowindow.open(map,marker);
    });
    return marker;
}

function windowInit(marker,car){
    if(car == null) { return; }
    var content = `The closest vehicle belongs to ${car[0]}. It is ${car[1]} miles away from you.`;
    var infowindow = new google.maps.InfoWindow({
        content: content
    });
    marker.addListener("click", function () {
        infowindow.open(map,marker);
    });
}

function drawLine(car,me){
    if(car == null) { return; }
    var coordinates = [
        {lat: car[2], lng: car[3]},
        {lat: me.latitude, lng: me.longitude}
    ];
    var polyline = new google.maps.Polyline({
        path: coordinates,
        geodesic: true,
        strokeColor: "#324aa8",
        strokeOpacity: 0.7,
        strokeWeight: 3
    });
    polyline.setMap(map);
}

const driverSub = (ev)=>{
    ev.preventDefault();
    var username = document.getElementById('dusername').value;
    var lat = document.getElementById('dlat').value;
    var lng = document.getElementById('dlng').value;
    var param = `username=${username}&lat=${lat}&lng=${lng}`;
    var req = new XMLHttpRequest();
    req.open('PUT','https://serene-caverns-36515.herokuapp.com/vehicle',true);
    req.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
    req.onload = function () {
        navigator.geolocation.getCurrentPosition(success);
    };
    req.send(param);
};

const passengerSub = (ev)=>{
    ev.preventDefault();
    var username = document.getElementById('pusername').value;
    var lat = document.getElementById('plat').value;
    var lng = document.getElementById('plng').value;
    var param = `username=${username}&lat=${lat}&lng=${lng}`;
    var req = new XMLHttpRequest();
    req.open('PUT','https://serene-caverns-36515.herokuapp.com/passenger',true);
    req.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
    req.onload = function () {
        var marker = new google.maps.Marker({
            position: {lat: Number(lat), lng: Number(lng)},
            map: map,
            title: username
        });
    };
    req.send(param);
};

window.addEventListener("load",initMap,false);
navigator.geolocation.getCurrentPosition(success);
document.getElementById('dbtn').addEventListener('click', driverSub);
document.getElementById('pbtn').addEventListener('click', passengerSub);
window.addEventListener('beforeunload', function (e) {
    e.preventDefault();
    myLoc.setMap(null);
});