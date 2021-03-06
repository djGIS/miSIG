// script para Mapa Interactivo buscador de centros de RUTA
//
// Dept. de Asuntos Técnicos y Infraestructura - FADEEAC
// Fecha de Actualización : 29/12/2016

var vinculo_dbPOI = '1KKWAfz1a-1Zt2P0E5UoJLTIL7GmsRLA62tWn91EQ';
var miftah = 'AIzaSyC6xfeGzdTZhK8VB0M4-AwUXWMzsx1JFrM';

// Variables de incialización de mapa
var coordsBsAs = new google.maps.LatLng(-34.610016, -58.414543);
var coordsArg = new google.maps.LatLng(-32, -63);
var zoomCiudad = 12;
var zoomPais = 6;

var geocoder;
var RUTAmap;
var mapProp;

var infowindow = null;
var RUTAuserLocationMarker = null;
var RUTAmarkers = [];
var RUTAlistaPOI = [];
var layers = [];
//var markerCluster;
var dbPOIimport = [];
var dbRestriccionesImport = [];
//Variables para funciones de ruteo
var rendererOptions = {
draggable: true
};
var directionsDisplay;
var directionsService;
var routePath = [];
var routeBoxer = null;
//var closestPoint = centrosRuta.length + 1;

// Funciones de Carga de Datos desde las tablas externas

function getData(table) {
var query = "SELECT LONGITUD, LATITUD, TIPO, BANDERA, NOMBRE, DIRECCION, DIRECCION_ADD, LOCALIDAD, PROVINCIA, TELEFONO, HORARIOS, DIR_EMAIL, DIR_WEB, PRESTACIONES, NOTA, FOTO, FECHA_ACT, ESTADO_POI FROM " + table;
var encodedQuery = encodeURIComponent(query);

// Construct the URL
var url = ['https://www.googleapis.com/fusiontables/v1/query'];
url.push('?sql=' + encodedQuery);
url.push('&key=' + miftah);
url.push('&callback=?');

// Send the JSONP request using jQuery
$.ajax({
url: url.join(''),
dataType: 'jsonp',
success: function (data) {
dbPOIimport = data['rows'];
}
});
}

// Funciones de Carga de Capas Informativas
function infoCallback(infowindow, marker) { 
return function() {
infowindow.open(RUTAmap, marker);
};
} 

function marcador(tipo, latlngset, icono, content, infowindow, bandera, localidad, provincia) { 
var marker = new google.maps.Marker({ 
map: RUTAmap, 
title: tipo, 
position: latlngset, 
icon: {
url: icono,
//size: new google.maps.Size(32, 32),
origin : new google.maps.Point(0, 0),
anchor: new google.maps.Point(16, 32),
//scaledSize: new google.maps.Size(32, 32)
},
infowindowContent: content,
bandera: bandera,
localidad: localidad,
provincia: provincia
});
RUTAmarkers.push(marker);

google.maps.event.addListener(marker, 'click', (function(marker, content) {
return function() {
infowindow.setContent(content);
infowindow.open(RUTAmap, marker);
}
})(marker, content));
}

function setMarkers(dbPOI, tipoPOI) { 
var infowindow = new google.maps.InfoWindow();
var icono = 'http://maps.google.com/mapfiles/ms/icons/lightblue.png'
var content;
var informarMail = '<div style="width:300px;"><span style="font-family: arial,helvetica,sans-serif;font-size: 9pt;"><form action="MAILTO:sig.fadeeac@gmail.com"; method="post" enctype="text/plain">E-mail:<br><input type="text" name="mail" value="your email"><br>Comment:<br><input type="text" name="comment" value="your comment" size="50"><br><br><input type="submit" value="Send"><input type="reset" value="Reset"></form></span></div>';
var z = 0;

// Unset all markers
if (RUTAmarkers.length != 0) {
for(var i = 0; i < RUTAmarkers.length; i++) {
RUTAmarkers[i].setMap(null);
}
RUTAmarkers = [];
}

for (x = 0; x < tipoPOI.length; x++) { 
for (var i = 0; i < dbPOI.length; i++) { 
var lng = dbPOI[i][0];
var lat = dbPOI[i][1];
var tipo = dbPOI[i][2];
var bandera = dbPOI[i][3];
var nombre = dbPOI[i][4];
var direccion = dbPOI[i][5];
var dir_add = dbPOI[i][6];
var localidad = dbPOI[i][7];
var provincia = dbPOI[i][8];
var telefono = dbPOI[i][9];
var horarios = dbPOI[i][10];
var dir_email = dbPOI[i][11];
var dir_web = dbPOI[i][12]; 
var prestacion = dbPOI[i][13];
var nota = dbPOI[i][14];
var fecha_act = dbPOI[i][16];
var estado = dbPOI[i][17];
var latlngset;

if (tipo == tipoPOI[x] && estado == 1) {
//cargar lista de POI para panel de lista
RUTAlistaPOI[z] = dbPOI[i];
z++;

//switch para asignar formato a los marcadores y burbujas de información
switch(tipoPOI[x]) {
case 'RUTA':
icono = 'http://maps.google.com/mapfiles/ms/icons/lightblue.png';
content = '<div style="width:300px;padding-bottom: 5px"><span style="font-family: arial,helvetica,sans-serif;font-size: 9pt;"><strong>RUTA - CENTRO DE RECEPCIÓN DE INFORMACIÓN</strong></span></div>'
content += '<div style="width:300px;padding-bottom: 5px"><span style="font-family: arial,helvetica,sans-serif;font-size: 9pt;"><strong>' 
+ bandera + ' - ' + nombre + '</strong></span></div>' 
content += '<div style="width:300px;padding-bottom: 5px"><span style="font-family: arial,helvetica,sans-serif;font-size: 9pt;">' + direccion + '</br>' + localidad + ', ' + provincia + '</span></div>'; 
content += '<div style="width:300px;"><span style="font-family: arial,helvetica,sans-serif;font-size: 9pt;">' + telefono + '</br>' + dir_email + '</br>' + dir_web + '</span></div>'; 
latlngset = new google.maps.LatLng(lat, lng);
marcador(tipo, latlngset, icono, content, infowindow, bandera, localidad, provincia)
break; 
default:
} 
}
}
}
}

// Funciones de Geolocalización y Ruteo

function codeAddress(direccion, busquedaProximidad) {
var address = document.getElementById(direccion).value;
var geocoder = new google.maps.Geocoder();

geocoder.geocode( { 'address': address, 'region': 'ar'}, function(results, status) {
if (status == google.maps.GeocoderStatus.OK) {
RUTAmap.setZoom(zoomCiudad);
RUTAmap.setCenter(results[0].geometry.location);
//document.getElementById(direccion).value = results[0].formatted_address;

// Place UserPosition marker 
if (RUTAuserLocationMarker != null)
RUTAuserLocationMarker.setMap(null);

if (direccion == 'direccion') { 
var image = {
url: 'http://maps.google.com/mapfiles/kml/paddle/ylw-stars.png',
size: new google.maps.Size(64, 64),
origin: new google.maps.Point(0, 0),
anchor: new google.maps.Point(16, 32),
scaledSize: new google.maps.Size(32, 32)
};

RUTAuserLocationMarker = new google.maps.Marker({
map: RUTAmap,
position: results[0].geometry.location,
title: results[0].formatted_address,
icon: image
}); 
var positionUsuario = new google.maps.LatLng(results[0].geometry.location.lat(),results[0].geometry.location.lng());
if (busquedaProximidad == true) {
findClosest(positionUsuario);
}
}
} else {
alert("Lo sentimos, no se pudo resolver la dirección que ingresó.");
}
});
}

function findClosest(latLngA) {
var distAnt = 1000000;
var distAct = 1000001;

if (RUTAmarkers.length != 0) {
for(var i = 0; i < RUTAmarkers.length; i++) {
var latLngB = RUTAmarkers[i].position;

distAct = sphericalDistanceBetween(latLngA, latLngB);

if (distAct < distAnt) {
distAnt = distAct;
closestPoint = i;
} 
}
}

var latlngbounds = new google.maps.LatLngBounds();
latlngbounds.extend(latLngA);
latlngbounds.extend(RUTAmarkers[closestPoint].position);
RUTAmap.fitBounds(latlngbounds);
}

function sphericalDistanceBetween (latLngA, latLngB) {
var R = 6378; // Radio promedio de la tierra

var xA = R * Math.cos(latLngA.lat() / Math.PI) * Math.cos(latLngA.lng() / Math.PI);
var yA = R * Math.cos(latLngA.lat() / Math.PI) * Math.sin(latLngA.lng() / Math.PI);
var zA = R * Math.sin(latLngA.lat() / Math.PI);

var xB = R * Math.cos(latLngB.lat() / Math.PI) * Math.cos(latLngB.lng() / Math.PI);
var yB = R * Math.cos(latLngB.lat() / Math.PI) * Math.sin(latLngB.lng() / Math.PI);
var zB = R * Math.sin(latLngB.lat() / Math.PI);

var dEuclid = Math.sqrt(Math.pow((xA - xB),2) + Math.pow((yA - yB),2) + Math.pow((zA - zB),2));
var dArco = R * Math.asin((dEuclid / (2 * Math.pow(R,2))) * Math.sqrt(4 * Math.pow(R,2) - Math.pow(dEuclid,2)));

return dArco;
}

function writeAddressName(latLng) {
var geocoder = new google.maps.Geocoder();
geocoder.geocode({
"location": latLng
},

function(results, status) {
if (status == google.maps.GeocoderStatus.OK)
document.getElementById("address").value = results[0].formatted_address;
else
alert('Unable to retrieve your address');
});
}

function geolocationSuccess(position) {
var userLatLng = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);

writeAddressName(userLatLng);

// Place UserPosition marker
var marker = new google.maps.Marker({
map: RUTAmap,
icon: 'http://maps.google.com/mapfiles/kml/pal3/icon52.png',
position: userLatLng
}); 
//RUTAuserLocationMarker.push(marker);
findClosest(userLatLng);
}

function geolocationError(positionError) {
document.getElementById("error").innerHTML += "Error: " + positionError.message + "<br />";
}

function geolocateUser() {
// If the browser supports the Geolocation API
if (navigator.geolocation) {
var positionOptions = {
enableHighAccuracy: true,
timeout: 10 * 1000 // 10 seconds
};
navigator.geolocation.getCurrentPosition(geolocationSuccess, geolocationError, positionOptions);
}
else
alert('La función de ubicación automaticano está soportada por su browser.');
}

// Funciones de control de formularios y formularios dinamicos
function buscadorControls() {
var buscadorContainerDiv = document.createElement('div');
buscadorContainerDiv.id = 'buscadorPanel';
buscadorContainerDiv.style.cssText = 'width:350px;padding:5px';

// Div sombreado para controles
var buscadorControlDiv = document.createElement('div');
buscadorControlDiv.style.cssText = 'background:rgba(0,51,102,0.75);padding-left:2px;padding-right:2px';

var controles = document.createElement('input');
controles.type = 'button';
controles.id = 'busqueda';
controles.value = 'Buscar Lugar';
controles.style.cssText = 'font-family:arial,helvetica,sans-serif;font-size:10pt;width:49.5%';
controles.onclick = function(){formControls('busqueda');};
buscadorControlDiv.appendChild(controles);

controles = document.createElement('input');
controles.type = 'button';
controles.id = 'ruteo';
controles.value = 'Cómo Llegar';
controles.style.cssText = 'font-family:arial,helvetica,sans-serif;font-size:10pt;width:49.5%;float:right';
controles.onclick = function(){formControls('ruteo');};
buscadorControlDiv.appendChild(controles);

// Bottones de control de tipo de busqueda
var outerContainer = document.createElement('div');
outerContainer.id = 'Buscador';
buscadorControlDiv.appendChild(outerContainer);

// Inputs de usuario para busqueda de dirección
var container = document.createElement('div');
container.id = 'busquedaInputs';

controles = document.createElement('input');
controles.type = 'text';
controles.id = 'direccion';
controles.style.cssText = 'font-family:arial,helvetica,sans-serif;font-size:10pt;width:82.5%';
container.appendChild(controles);
var autocomplete = new google.maps.places.Autocomplete((controles), { types: ['geocode'] });

controles = document.createElement('input');
controles.type = 'button';
controles.id = 'buscar';
controles.value = 'Buscar';
controles.onclick = function(){codeAddress('direccion');};
controles.style.cssText = 'font-family:arial,helvetica,sans-serif;font-size:10pt;width:15%;float:right';
container.appendChild(controles);

container.style.display = 'none';
outerContainer.appendChild(container);

// Inputs de usuario para busqueda de dirección
container = document.createElement('div');
container.id = 'ruteoInputs';

controles = document.createElement('input');
controles.type = 'text';
controles.id = 'origen';
controles.placeholder = 'Origen : Introduce una ubicación';
controles.style.cssText = 'font-family:arial,helvetica,sans-serif;font-size:10pt;width:82.5%';
container.appendChild(controles);
var autocomplete = new google.maps.places.Autocomplete((controles), { types: ['geocode'] });

controles = document.createElement('input');
controles.type = 'button';
controles.id = 'AddHito0';
controles.value = '+';
controles.style.cssText = 'font-family:arial,helvetica,sans-serif;font-size:10pt;width:7.5%;float:right';
controles.onclick = function(){addHito();};
container.appendChild(controles);

controles = document.createElement('span');
controles.id = 'Hitos';
container.appendChild(controles);

controles = document.createElement('input');
controles.type = 'text';
controles.id = 'destino';
controles.placeholder = 'Destino : Introduce una ubicación';
controles.style.cssText = 'font-family:arial,helvetica,sans-serif;font-size:10pt;width:82.5%';
container.appendChild(controles);
autocomplete = new google.maps.places.Autocomplete((controles), { types: ['geocode'] });

var opciones = document.createElement('div');
opciones.id = 'OpcionesRuteo';
opciones.style.display = 'none';
container.appendChild(opciones);

controles = document.createElement('div');
var texto = document.createTextNode('Opciones de Ruteo');
controles.appendChild(texto);
controles.style.cssText = 'font-weight:bold;font-family:arial,helvetica,sans-serif;font-size:10pt;color:Gainsboro;padding-top:5px';
opciones.appendChild(controles);

var c, r, t;
t = document.createElement('table');
r = t.insertRow(0); 

c = r.insertCell(0);
var controles = document.createElement('input');
controles.type = 'checkbox';
controles.id = 'applygrid';
controles.onclick = function(){setMarkers(dbPOIimport);};
c.appendChild(controles);

c = r.insertCell(1);
controles = document.createElement('span');
var texto = document.createTextNode('Mostrar solamente servicios alrededor del itinerario (hasta ');
controles.appendChild(texto);
controles.style.cssText = 'font-family:arial,helvetica,sans-serif;font-size:10pt;color:Gainsboro';
c.appendChild(controles);

controles = document.createElement('input');
controles.type = 'number';
controles.id = 'gridsize';
controles.min = '1';
controles.max = '100';
controles.step = '5';
controles.value = '4'; 
controles.style.cssText = 'font-family:arial,helvetica,sans-serif;font-size:10pt;width:35px'
c.appendChild(controles);

controles = document.createElement('span');
var texto = document.createTextNode(' km).');
controles.appendChild(texto);
controles.style.cssText = 'font-family:arial,helvetica,sans-serif;font-size:10pt;color:Gainsboro';
c.appendChild(controles);

r = t.insertRow(1); 

c = r.insertCell(0);
var controles = document.createElement('input');
controles.type = 'checkbox';
controles.id = 'optimizarRuteo';
c.appendChild(controles);

c = r.insertCell(1);
controles = document.createElement('span');
var texto = document.createTextNode('Optimizar el ruteo a través de las paradas indicadas.');
controles.appendChild(texto);
controles.style.cssText = 'font-family:arial,helvetica,sans-serif;font-size:10pt;color:Gainsboro';
c.appendChild(controles);

opciones.appendChild(t);

controles = document.createElement('input');
controles.type = 'button';
controles.id = 'mostrarOpciones';
controles.value = 'Mostrar Opciones de Busqueda';
controles.onclick = function(){opcionesControls();};
controles.style.cssText = 'font-family:arial,helvetica,sans-serif;font-size:10pt;width:100%';
container.appendChild(controles);

controles = document.createElement('input');
controles.type = 'button';
controles.id = 'rutear';
controles.value = 'Obtener Indicaciones';
controles.onclick = function(){calcRoute();};
controles.style.cssText = 'font-family:arial,helvetica,sans-serif;font-size:10pt;width:100%';
container.appendChild(controles);

container.style.display = 'none';
outerContainer.appendChild(container);
buscadorContainerDiv.appendChild(buscadorControlDiv);

RUTAmap.controls[google.maps.ControlPosition.TOP_LEFT].push(buscadorContainerDiv);

google.maps.event.addDomListener(buscadorContainerDiv, 'mouseover', function() {
document.getElementById('Buscador').style.display = 'block';
});

google.maps.event.addDomListener(buscadorContainerDiv, 'mouseout', function() {
if (event.clientX < 0 || event.clientX > 350)
document.getElementById('Buscador').style.display = 'none';
});

//google.maps.event.addDomListener(document.getElementById('applygrid'), 'onclick', function() {
// 
//});
}

function showHelpBuscador() {
if (document.getElementById("HelpBuscador").style.display == 'none') {
document.getElementById("HelpBuscador").style.display = 'block';
} else {
document.getElementById("HelpBuscador").style.display = 'none';
}
}


// Funciones de Inicialización

function inicializarRUTA() {
var mapProp = {
center : coordsArg,
zoom : zoomPais,
panControl : true,
panControlOptions: {
position: google.maps.ControlPosition.RIGHT_BOTTOM
},
zoomControl : true,
zoomControlOptions: {
style: google.maps.ZoomControlStyle.SMALL,
position: google.maps.ControlPosition.RIGHT_BOTTOM
},
mapTypeControl : true,
mapTypeControlOptions: {
style: google.maps.MapTypeControlStyle.HORIZONTAL_BAR,
position: google.maps.ControlPosition.LEFT_BOTTOM
},
scaleControl : true,
streetViewControl : false,
overviewMapControl : false,
mapTypeId : google.maps.MapTypeId.ROADMAP
};

RUTAmap = new google.maps.Map(document.getElementById('MapaRUTA'),mapProp);

// Controles de usuario
buscadorControls;

var tipoPOI = ['RUTA'];
setMarkers(dbPOIimport, tipoPOI); 
cargarListPanelRUTA(RUTAlistaPOI); 
}

function cargarListPanelRUTA(listaPOIordenar) {
var ordenPOI = [];
var rangoProv = '';

for (var i = 0; i < listaPOIordenar.length; i++) {
ordenPOI[i] = i;
}

ordenPOI = ordenarListaAlfabet(listaPOIordenar, 7, ordenPOI);
ordenPOI = ordenarListaAlfabet(listaPOIordenar, 8, ordenPOI);

//var puntoRef = new google.maps.LatLng(-34.610016, -58.414543);
//ordenPOI = ordenarListaProxGeo(centrosRuta, puntoRef, ordenPOI);

var textTemp = '<br><table width="100%" cellpadding="5px"><tr><th scope="col" width="10%" align="center" align="bottom"><b>CRI</b></th><th scope="col" width="30%" align="center" align="bottom"><b>DIRECCION</b></th><th scope="col" width="35%" align="center" align="bottom"><b>INFORMACION DE CONTACTO</b></th><th scope="col" width="25%" align="center" align="bottom"><b>HORARIOS DE ATENCION</b></th></tr>';

for (var i = 0; i < ordenPOI.length; i++) {
var a = ordenPOI[i];
if (rangoProv != listaPOIordenar[a][8]) {
textTemp = textTemp + '<tr><td colspan="4" bgcolor=#003366><span style="color:white;"><b>' + listaPOIordenar[a][8] + '</b></span></td></tr>';
rangoProv = listaPOIordenar[a][8];
}
textTemp = textTemp + '<tr><td style="border-bottom: thin solid;border-color: #003366;">' + listaPOIordenar[a][3] + '</td><td style="border-bottom: thin solid;border-color: #003366;">' + listaPOIordenar[a][5] + ' ' + listaPOIordenar[a][6] + '<br>' + listaPOIordenar[a][7] + ', ' + listaPOIordenar[a][8] + '</td><td style="border-bottom: thin solid;border-color: #003366;">' + listaPOIordenar[a][9] + '<br>' + listaPOIordenar[a][11] + '<br>' + listaPOIordenar[a][12] + '</td><td style="border-bottom: thin solid;border-color: #003366;">' + listaPOIordenar[a][10] + '</td></tr>';
}
textTemp = textTemp + '</table>';

document.getElementById('listaPOI').innerHTML = textTemp;
}

function ordenarListaAlfabet(listaPOI, ordenarPor, ordenInicial) {
var ordenFinal = [];
ordenFinal[0] = ordenInicial[0];

for (var i = 1; i < ordenInicial.length; i++) {
var posI = ordenInicial[i];

for (var j = 0; j < ordenFinal.length; j++) {
var posJ = ordenFinal[j];

if (listaPOI[posI][ordenarPor].toLowerCase() < listaPOI[posJ][ordenarPor].toLowerCase()) {
for (var k = ordenFinal.length; k > j; k--) {
ordenFinal[k] = ordenFinal[k - 1];
}
ordenFinal[j] = posI;
j = ordenFinal.length;
} else if (j == ordenFinal.length - 1) {
ordenFinal[j + 1] = posI;
j = ordenFinal.length;
}
} 
}

return ordenFinal;
}

// Funciones a ejecutar al incializar
google.maps.event.addDomListener(window, 'load', getData(vinculo_dbPOI));
google.maps.event.addDomListener(window, 'load', inicializarRUTA);
