//Variables para funciones de ruteo
var directionsDisplay = null;
var directionsService = null;
var routePath = [];

//Funciones para el ruteo
function obtenerDirecciones() {
	var routeIndex = 0;
	var myroute = null;
	
	if (directionsDisplay != null) {
		directionsDisplay.setMap(null);
		document.getElementById('indicaciones').innerHTML = "";
	}

	directionsDisplay = new google.maps.DirectionsRenderer({
		draggable: true,
		map: map,
		panel: document.getElementById('indicaciones')
	});
	directionsService = new google.maps.DirectionsService();

	google.maps.event.addListener(directionsDisplay, 'routeindex_changed', function() { 
		calcularTconduccion(directionsDisplay.getDirections(),directionsDisplay.getRouteIndex());
		//if (document.getElementById('applygrid').checked == true) {
			//aplicarGrilla(document.getElementById('gridsize').value);
		//}
		//calcularPeaje1(dbPOIimport,directionsDisplay.getDirections(),directionsDisplay.getRouteIndex());
		calcularPeaje2(directionsDisplay.getDirections(),directionsDisplay.getRouteIndex());
		sendRouteStats();
	});
			
	google.maps.event.addListener(directionsDisplay, 'directions_changed', function() {
		//geocodificarId(directionsDisplay.getDirections());
		calcularTconduccion(directionsDisplay.getDirections(),directionsDisplay.getRouteIndex());
		//if (document.getElementById('applygrid').checked == true) {
			//aplicarGrilla(document.getElementById('gridsize').value);
		//}
		//calcularPeaje1(dbPOIimport,directionsDisplay.getDirections(),directionsDisplay.getRouteIndex());
		
		calcularPeaje2(directionsDisplay.getDirections(),directionsDisplay.getRouteIndex());
		sendRouteStats();
	});
	
	

	var origen = tratarDireccionInput(document.getElementById("origen").value);
	var destino = tratarDireccionInput(document.getElementById("destino").value);

	var segRoute;
	var segLength;
	var hitos = [];

	var total = 0;
	var i = 0;

	while (i < counterHitos) {
		i++

		var hitoLoc = tratarDireccionInput(document.getElementById("hito" + i.toString()).value);

		hitos.push({
			location: hitoLoc,
			stopover: true
		});
	}

	var request = {
		origin: origen,
		destination: destino,
		waypoints: hitos,
		travelMode: google.maps.DirectionsTravelMode.DRIVING,
		optimizeWaypoints: document.getElementById('optimizarRuteo').checked,
		provideRouteAlternatives: true,
		//avoidHighways: Boolean,
		//avoidTolls: Boolean
		region: 'ar'
	};

	directionsService.route(request, function(result, status) {
		if (status == google.maps.DirectionsStatus.OK) {
		//alert(result.geocoded_waypoints.length);
			directionsDisplay.setDirections(result);
			//alert(directionsDisplay.geocoded_waypoints[0].status);
		} else {
			alert("Lo sentimos, no se pudo calcular una ruta entre los puntos ingresados.");
		}
	}); 
}

function tratarDireccionInput(dirInput) {
	var dirResult; 
	
	if (dirInput.substring(0, 6) == 'LatLng') {
		z = 6;
		while (dirInput.substring(z, z + 1) != ',') {
			z++;
		}
		dirResult = new google.maps.LatLng(Number(dirInput.substring(7, z)),Number(dirInput.substring(z + 2, dirInput.length - 1)));
	} else {
		dirResult = dirInput;
	}
	
	return dirResult;
}

function computeTotalDistance(result) {
var total = 0;
var myroute = result.routes[0];
for (var i = 0; i < myroute.legs.length; i++) {
total += myroute.legs[i].distance.value;
}
total = total / 1000.
}

function aplicarGrilla(distGrilla) {
//var distGrilla = 10; // km
var boxes = routeBoxer.box(routePath, distGrilla);

if (routePath != null && markers.length > 0) {
for (var a = 0; a < markers.length; a++) {
var boundsTest = false;
for (var i = 0; i < boxes.length; i++) {
var bounds = boxes[i];
if (bounds.contains(markers[a].position)) {
boundsTest = true;
}
}
if (boundsTest != true)
markers[a].setMap(null)
}
}
}

function peajeSelecEjes(fuente) {
alert(fuente.value);
for (var i = 1; i < 8; i++) {
if (i == fuente.value) {
document.getElementById("PeajeCol" + i.toString()).display = 'block';
} else {
document.getElementById("PeajeCol" + i).display = 'none';
}
}
}


var dbTarifasPeajes = [];

//cargar base de datos de POI desde fusion tables
function getDataPeajes(table) {
	var query = "SELECT * FROM " + table;
	var encodedQuery = encodeURIComponent(query);

	// Construct the URL
	var url = ['https://www.googleapis.com/fusiontables/v2/query'];
	url.push('?sql=' + encodedQuery);
	url.push('&key=' + miftah);
	url.push('&callback=?');

	// Send the JSONP request using jQuery
	$.ajax({
		url: url.join(''),
		dataType: 'jsonp',
		success: function (data) {
			var dbTemp = data['rows'];
			for (var i = 0; i < dbTemp.length; i++) {
				//alert(Number(dbTemp[i][4]).toFixed(2));
				var tarifa = {
					ref_ext: dbTemp[i][0],
					horaPico: dbTemp[i][3], 
					ej2: {
						valle: Number(dbTemp[i][4]).toFixed(2), 
						pico: Number(dbTemp[i][5]).toFixed(2)},
					ej3: {
						valle: Number(dbTemp[i][6]).toFixed(2), 
						pico: Number(dbTemp[i][7]).toFixed(2)},
					ej4: {
						valle: Number(dbTemp[i][8]).toFixed(2), 
						pico: Number(dbTemp[i][9]).toFixed(2)},
					ej5: {
						valle: Number(dbTemp[i][10]).toFixed(2), 
						pico: Number(dbTemp[i][11]).toFixed(2)},
					ej6: {
						valle: Number(dbTemp[i][12]).toFixed(2), 
						pico: Number(dbTemp[i][13]).toFixed(2)}
				}
				dbTarifasPeajes.push(tarifa);
			}
		}
	});
}

function cargarTarifas() {
	for (var i = 0; i < dbPOIimport.length; i++) {
		if (dbPOIimport[i][3] == 'PEAJE') { 
			for (var j = 0; j < dbTarifasPeajes.length; j++) {
				if (dbPOIimport[i][19] == dbTarifasPeajes[j].ref_ext) {
					//alert(dbTarifasPeajes[j].ref_ext);
					dbPOIimport[i][15] = dbTarifasPeajes[j];
				}
			}
		} 
	}
	
	
}

function getEjes(fuente) {
	var selectSelected = fuente.value;
	var selectOptions = fuente.options;
	//alert(selectOptions.length);
	for (var i = 0; i < selectOptions.length; i++) {
		var columnas = document.getElementsByClassName(selectOptions[i].value);
		
		if (selectOptions[i].value == selectSelected) {
			columnaDisplay = 'block';
		} else {
			columnaDisplay = 'none';
		}
		//alert(columnaDisplay);
		for (var j = 0; j < columnas.length; j++) {
			columnas.item(j).style.display = columnaDisplay;
		}
	}
	
	

}

function calcularPeaje2(result, indice) {
	var dbPeajes = [];
	var ejesSelect = ['ej2', 'ej3', 'ej4', 'ej5', 'ej6'];
	//var direccionTxtCSS = 'float:right;border: 1px solid Silver;border-radius: 2px;height:21px;width:260px;padding-left:5px;padding-right:5px;';
	var peajesPasados = [];
	var myroute = result.routes[indice];
	var contents = ""; //'<div style="width:302px; height:50px;"><div style="float:left; width:175px; height:100%;"><p style="text-align: right">Seleccionar el tipo de vehículo:</p></div>';
		
		contents += '<div style="float:left; width:101px; padding-right: 5px;"><p>Estación</p></div>';
		contents +=	'<div style="float:left; width:75px;"><p style="text-align: center">Hora Pico</p></div>';
		contents += '<div style="float:left; clear:right;"><select name="ejesSelect" onchange="getEjes(this)" style="float:left;border: 1px solid Silver;border-radius: 2px;height:21px;padding-left:5px;padding-right:5px; width:108px; clear: right;"><option value="ej2">2</option><option value="ej3">3</option><option value="ej4">4</option><option value="ej5" selected="true">5</option><option value="ej6">6</option></select></div>';
		//contents +=	'<div class="ej2" style="float:left; width:100px; display:none;"><p style="text-align: center">2 Ejes</p></div>';
		//contents +=	'<div class="ej3" style="float:left; width:100px; display:none;"><p style="text-align: center">3 Ejes</p></div>';
		//contents +=	'<div class="ej4" style="float:left; width:100px; display:none;"><p style="text-align: center">4 Ejes</p></div>';
		//contents +=	'<div class="ej5" style="float:left; width:100px; display:block;"><p style="text-align: center">5 Ejes</p></div>';
		//contents +=	'<div class="ej6" style="float:left; width:100px; display:none; clear:right;"><p style="text-align: center">6 Ejes</p></div></div>';
	
	for (var i = 0; i < dbPOIimport.length; i++) {
		if (dbPOIimport[i][3] == 'PEAJE') { 
			dbPeajes.push(dbPOIimport[i]);
			//i--;
		} 
	}
	//alert(dbPeajes[0][15]);
	var ejesTotal = {ej2: 0, ej3: 0, ej4: 0, ej5: 0, ej6: 0};
	for (var j = 0; j < (myroute.overview_path.length - 1); j++) {	
		var x = [];
		var y = [];

		x.push(myroute.overview_path[j].lat());
		y.push(myroute.overview_path[j].lng());
		x.push(myroute.overview_path[j + 1].lat());
		y.push(myroute.overview_path[j + 1].lng());
		
		x.push(x[1] - x[0]);
		y.push(y[1] - y[0]);
		
		var d = Math.sqrt(x[2] * x[2] + y[2] * y[2]);
		
		x[2] = 0.0001 * x[2] / d;
		y[2] = 0.0001 * y[2] / d;
		
		x[3] = x[0] - x[2] - y[2];
		y[3] = y[0] + x[2] - y[2];
		x[4] = x[1] + x[2] - y[2];
		y[4] = y[1] + x[2] + y[2];
		x[5] = x[1] + x[2] + y[2];
		y[5] = y[1] - x[2] + y[2];
		x[6] = x[0] - x[2] + y[2];
		y[6] = y[0] - x[2] - y[2];
		
		var rCoords = [
			{lat: x[3], lng: y[3]},
			{lat: x[4], lng: y[4]},
			{lat: x[5], lng: y[5]},
			{lat: x[6], lng: y[6]}
		];

		var r = new google.maps.Polygon({map: null, paths: rCoords});
		
		
		for (var a = 0; a < dbPeajes.length; a++) {
			var point = new google.maps.LatLng(dbPeajes[a][1], dbPeajes[a][0]);
			var result = google.maps.geometry.poly.containsLocation(point, r);
			if (result == true) {
				//contents += '<div style="width:302px; height:50px;">';
				contents += '<div style="float:left; width:101px; height:100%; padding-right: 5px;"><p>' + dbPeajes[a][5] + '</p></div>';
				contents +=	'<div style="float:left; width:75px; height:100%;"><p style="text-align: center">' + dbPeajes[a][15].horaPico + '</p></div>';
				contents +=	'<div class="ej2" style="float:left; width:55px; height:100%; display:none;"><p style="text-align: right">$ ' + dbPeajes[a][15].ej2.valle + '</p></div><div class="ej2" style="float:left; width:55px; height:100%; display:none;"><p style="text-align: right">$ ' + dbPeajes[a][15].ej2.pico + '</p></div>';
				contents +=	'<div class="ej3" style="float:left; width:55px; height:100%; display:none;"><p style="text-align: right">$ ' + dbPeajes[a][15].ej3.valle + '</p></div><div class="ej3" style="float:left; width:55px; height:100%; display:none;"><p style="text-align: right">$ ' + dbPeajes[a][15].ej3.pico + '</p></div>';
				contents +=	'<div class="ej4" style="float:left; width:55px; height:100%; display:none;"><p style="text-align: right">$ ' + dbPeajes[a][15].ej4.valle + '</p></div><div class="ej4" style="float:left; width:55px; height:100%; display:none;"><p style="text-align: right">$ ' + dbPeajes[a][15].ej4.pico + '</p></div>';
				contents +=	'<div class="ej5" style="float:left; width:55px; height:100%; display:block;"><p style="text-align: right">$ ' + dbPeajes[a][15].ej5.valle + '</p></div><div class="ej5" style="float:left; width:55px; height:100%; display:block;"><p style="text-align: right">$ ' + dbPeajes[a][15].ej5.pico + '</p></div>';
				contents +=	'<div class="ej6" style="float:left; width:55px; height:100%; display:none;"><p style="text-align: right">$ ' + dbPeajes[a][15].ej6.valle + '</p></div><div class="ej6" style="float:left; width:55px; height:100%; display:none; clear:right;"><p style="text-align: right">$ ' + dbPeajes[a][15].ej6.pico + '</p></div>';
				//alert(ejesTotal.ej5 + Number(dbPeajes[a][15].ej5.valle));
				ejesTotal.ej2 += Number(dbPeajes[a][15].ej2.valle);
				ejesTotal.ej3 += Number(dbPeajes[a][15].ej3.valle);
				ejesTotal.ej4 += Number(dbPeajes[a][15].ej4.valle);
				ejesTotal.ej5 += Number(dbPeajes[a][15].ej5.valle);
				ejesTotal.ej6 += Number(dbPeajes[a][15].ej6.valle);
				
				peajesPasados.push(dbPeajes[a]);
				dbPeajes.splice(a, 1);
			} 
        } 
		//r.map = none;
	}

	//contents += '<div style="width:302px; height:50px;"><div style="float:left; width:100px; height:100%; padding-right: 5px;">Total Calculado</div>';
	//contents +=	'<div style="float:left; width:75px; height:100%;"></div>';
	//contents +=	'<div class="ej2" style="float:left; width:60px; height:100%; display:none;">$ ' + (ejesTotal.ej2).toFixed(2) + '</div><div class="ej2" style="float:left; width:60px; height:100%; display:none;"></div>';
	//contents +=	'<div class="ej3" style="float:left; width:60px; height:100%; display:none;">$ ' + (ejesTotal.ej3).toFixed(2) + '</div><div class="ej3" style="float:left; width:60px; height:100%; display:none;"></div>';
	//contents +=	'<div class="ej4" style="float:left; width:60px; height:100%; display:none;">$ ' + (ejesTotal.ej4).toFixed(2) + '</div><div class="ej4" style="float:left; width:60px; height:100%; display:none;"></div>';
	//contents +=	'<div class="ej5" style="float:left; width:60px; height:100%; display:block;">$ ' + (ejesTotal.ej5).toFixed(2) + '</div><div class="ej5" style="float:left; width:60px; height:100%; display:block;"></div>';
	//contents +=	'<div class="ej6" style="float:left; width:60px; height:100%; display:none;">$ ' + (ejesTotal.ej6).toFixed(2) + '</div><div class="ej6" style="float:left; height:100%; width:60px; display:none; clear:right;"></div></div>';
		
//alert(peajesPasados[0][5]); 
//contents += '</table>';
document.getElementById('peajes').innerHTML = "";
document.getElementById('peajes').innerHTML = contents;
document.getElementById('peajes').style.display = '';
//document.getElementsByClassName('ej2').style.display = 'none';
}		


function sendRouteStats() {
	var indicacionesHitos = document.getElementById('origen').statsValue + ' | ';
	for (var i = 0; i < counterHitos; i++) {
		indicacionesHitos += document.getElementById('hito' + counterHitos.toString()).statsValue + ' | ';
	}	
	indicacionesHitos += document.getElementById('destino').statsValue;

	dataLayer.push({'obtenerIndicaciones': indicacionesHitos, 'event':'ClicObtenerIndicaciones'});
}