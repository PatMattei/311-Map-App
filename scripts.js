//Data: https://nycopendata.socrata.com/Social-Services/311-Service-Requests-from-2010-to-Present/erm2-nwe9
//API docs: http://dev.socrata.com/foundry/#/data.cityofnewyork.us/erm2-nwe9


//TODOS
//Alphabetize dropdowns
//Complaint type filters
//Convert times
function zipLookup() {
	$("#zip").keyup(function() {
		var zipLength = $('#zip').val().length;
		if (zipLength == 5) {
			geoLookup("streetName");
		}
		else {
			clearDropdowns();
		}
	});
}

function clearDropdowns() {
	$('#streetNames').empty();
	$('#streetNames').prepend("<option value=''>Street</option>");
	$('#addresses').empty();
	$('#addresses').prepend("<option value=''>Address</option>");
	$('#complaintTypes').empty();
	$('#complaintTypes').prepend("<option value=''>Complaint Types</option>");
}

function geoLookup(lookup) {
	var zip = $('#zip').val();
	
	var data = {};
	data['$$app_token'] = 'sKRqN6YI4Yd3g612t1P8PhqLt';
	data['incident_zip'] = zip;

	if (lookup == "address") {
		var streetName = $('#streetNames option:selected').text();
		data['street_name'] = streetName;		
	}
	ajaxCall(data, lookup);
}

function ajaxCall(data, lookup) {
	$.ajax({
		type: 'GET',
		url: "https://data.cityofnewyork.us/resource/erm2-nwe9.json?$where=(created_date>'2011-01-01')",
		data: data,
		success: function(jsonData) {
			if (lookup == "streetName") {
				streetNameLookup(jsonData);
			} else if (lookup == "address") {
				addressLookup(jsonData);
			}
		},
		error: function() {
			alert('Error loading');
		}
	});
}

function streetNameLookup(jsonData) {
	$.each(jsonData, function(x) {
		var incident = jsonData[x];
		if (incident['address_type'] == 'ADDRESS') {
				$("#streetNames").append("<option value='" + incident['street_name'] + "'>" + incident['street_name'] + "</option>");
			}
			else {
				$("#streetNames").append("<option>" + incident['address_type'] + "</option>");
			}
		});
	removeDuplicates('streetNames');
	sortDropdown('streetNames', 'Street');
}

function addressLookup(jsonData) {
	$('#addresses').empty();
	$('#addresses').prepend("<option value=''>Address</option>");
	$.each(jsonData, function(x) {
		var incident = jsonData[x];
		$("#addresses").append("<option value='" + incident['incident_address'] + "'>" + incident['incident_address'] + "</option>");
	});
	removeDuplicates('addresses');
	sortDropdown('addresses', 'Address');
}



function incidentLookup() {
	$('#map').empty();
	$('#details').empty();
	var zip = $('#zip').val();
	var streetName = $('#streetNames').val();
	var address = $('#addresses option:selected').text();

	$.ajax({
		type: 'GET',
		//Refrence: https://data.cityofnewyork.us/resource/erm2-nwe9.json?%24%24app_token=sKRqN6YI4Yd3g612t1P8PhqLt&incident_zip=11105&incident_address=21-67+33+STREET
		url: 'https://data.cityofnewyork.us/resource/erm2-nwe9.json',
		data: {
			'$$app_token': 'sKRqN6YI4Yd3g612t1P8PhqLt',
			'incident_zip': zip,
			'street_name': streetName,
			'incident_address': address
	    },
		success: function(jsonData) {
			var latLookup = jsonData[0]['location']['latitude'];
			var lngLookup = jsonData[0]['location']['longitude'];
			displayMap();
			initMap(latLookup, lngLookup);

			var sortedKeys = sortData(jsonData);
			displayDetails(sortedKeys, jsonData);
		},
		error: function() {
			alert('Error loading');
		}
	});
}


function displayDetails(sortedKeys, jsonData) {
	$.each(sortedKeys, function(i) {
		var sortedKey = sortedKeys[i]['id'];
		$.each(jsonData, function(x) {
			if (jsonData[x]['unique_key'] == sortedKey) {
				var incident = jsonData[x];
				populateResults(incident['incident_address'], incident['agency_name'], new Date(incident['created_date']), new Date(incident['closed_date']), incident['complaint_type'], incident['descriptor'], incident['unique_key'], incident['resolution_description']);
				populateComplaintTypes(incident['complaint_type']);
			}
		});
	});
}


function populateResults(incident_address, agency_name, created_date, closed_date, complaint_type, descriptor, unique_key, resolution_description) {
	$("#details").append("incident_address: " + incident_address + ",<br>");
	$("#details").append("agency_name: " + agency_name + ",<br>");
	$("#details").append("created_date: " + created_date + ",<br>");
	$("#details").append("descriptor: " + descriptor + "<br>");
	$("#details").append("closed_date: " + closed_date + ",<br>");
	$("#details").append("resolution_description: " + resolution_description + ",<br>");
	$("#details").append("complaint_type: " + complaint_type + ",<br>");
	$("#details").append("unique_key: " + unique_key + "<hr>");
}

function populateComplaintTypes(complaint_type){
	$("#complaintTypes").show();
	$("#complaintTypes").append("<option value='" + complaint_type + "'>" + complaint_type + "</option>");
}



function sortData(jsonData) {
	unsortedData = [];
	$.each(jsonData, function(i) {
		var sortedKey = jsonData[i];
   		unsortedData.push({"id": sortedKey['unique_key'], "date": new Date(sortedKey['created_date'])});
	});
	var sortedData = unsortedData.sort(compareDates);
	//Return newest create_date data first
	return sortedData.reverse();
}

function compareDates(a, b) {
    return new Date(a.date).getTime() - new Date(b.date).getTime();
}

function removeDuplicates(field) {
	var dropdown = "#" + field;
	var usedNames = {};

	$(dropdown + " > option").each(function () {
	    if (usedNames[this.text]) {
	        $(this).remove();
	    } else {
	        usedNames[this.text] = this.value;
	    }
	});
}

function sortDropdown(field, display) {
	var dropdown = "#" + field;

	//Eliminate dashes from the option values
	$(dropdown + '  option').each(function() {
		var newValue = $(this).val().replace('-', '');
		$(this).val(newValue);
	});

	$(dropdown).html($(dropdown + " > option").sort(function (a, b) {
		return a.value == b.value ? 0 : a.value < b.value ? -1 : 1
	}));
	$(dropdown + " > option[value=''").remove();
	$(dropdown).prepend("<option value=''>" + display + "</option>");
	$(dropdown)[0].options[0].selected = true;
}


function initMap(latLookup, lngLookup) { 
	var myLatLng = new google.maps.LatLng(latLookup, lngLookup);

	var mapOptions = {
		zoom: 18,
		center: myLatLng
	}

	var styleArray = [
		{
		    featureType: "all",
		    elementType: "labels",
		    stylers: [
		      { visibility: "off" }
		    ]
		},
		{
		    featureType: "road",
		    elementType: "labels",
		    stylers: [
		      { visibility: "on" }
		    ]
		}
	]
	var map = new google.maps.Map(document.getElementById("map"), mapOptions);

	map.setOptions({styles: styleArray});

	var marker = new google.maps.Marker({
    	position: myLatLng,
    	title:"Hello World!",
    	icon: ""
	});

	// To add the marker to the map, call setMap();
	marker.setMap(map);
 }

function displayMap() {
	$('#map').css('height', '500px');
	$('#map').show();
}

$(document).ready(function(){
	zipLookup();

	$('#streetNames').change(function(){
		geoLookup("address");
	});
});

$('#geoLookup').on('click', incidentLookup);