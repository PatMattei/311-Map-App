//Data: https://nycopendata.socrata.com/Social-Services/311-Service-Requests-from-2010-to-Present/erm2-nwe9
//API docs: http://dev.socrata.com/foundry/#/data.cityofnewyork.us/erm2-nwe9
//Reference URL: https://data.cityofnewyork.us/resource/erm2-nwe9.json?%24%24app_token=sKRqN6YI4Yd3g612t1P8PhqLt&incident_zip=11105&incident_address=21-67+33+STREET


//TODOS
//Add loading notification
//Add disabled states
//Convert times
//Add look-up by clicking on map?



function emptyDropdowns() {
	$('select').empty();
	$('#streetNames').prepend("<option value=''>Street</option>");
	$('#addresses').prepend("<option value=''>Address</option>");
	$('#complaintType').prepend('<option value="All">Show All</option>');
	disableEnableDropdowns();
}

function geoLookup(lookup) {
	var zip = $('#zip').val();
	
	var data = {};
	data['$$app_token'] = 'sKRqN6YI4Yd3g612t1P8PhqLt';
	data['incident_zip'] = zip;

	if (lookup == "address") {
		data['street_name'] = $('#streetNames option:selected').text();
	}

	fetchData(data).then(function(result) {
		if (lookup == "streetName") {
			streetNameLookup(result);
		} else if (lookup == "address") {
			addressLookup(result);
		}
	}, function(error) {
		console.log(error)
	});
}

function fetchData(data) {
	return $.ajax({
		type: 'GET',
		url: "https://data.cityofnewyork.us/resource/erm2-nwe9.json?$where=(created_date>'2011-01-01')",
		data: data
	});
}

function streetNameLookup(jsonData) {
	$.each(jsonData, function(i) {
		var incident = jsonData[i];
		if (incident['address_type'] == 'ADDRESS') {
			$("#streetNames").append("<option value='" + incident['street_name'] + "'>" + incident['street_name'] + "</option>");
		}
		else {
			$("#streetNames").append("<option>" + incident['address_type'] + "</option>");
		}
	});
	removeDropdownDuplicates($('#streetNames'));
	sortDropdown('streetNames', 'Street');
}

function addressLookup(jsonData) {
	$('#addresses').empty();
	$('#addresses').prepend("<option value=''>Address</option>");
	$.each(jsonData, function(i) {
		var incident = jsonData[i];
		$("#addresses").append("<option value='" + incident['incident_address'] + "'>" + incident['incident_address'] + "</option>");
	});
	removeDropdownDuplicates($('#addresses'));
	sortDropdown('addresses', 'Address');
}

function displayDetails(jsonData) {
	var complaintTypes = [];

	$('#details').empty();

	$.each(jsonData, function(i) {
		var incident = jsonData[i];
		var details = {
			incident_address: incident['incident_address'],
			agency_name: incident['agency_name'],
			created_date: new Date(incident['created_date']),
			closed_date: new Date(incident['closed_date']),
			complaint_type: incident['complaint_type'],
			descriptor: incident['descriptor'],
			unique_key: incident['unique_key'],
			resolution_description: incident['resolution_description']
		}

		populateResults(details);
		complaintTypes.push(incident['complaint_type'])
	});

	populateComplaintTypes(complaintTypes);
}

function populateResults(details) {
	var incident = $("<div />", {
		"class": "incident",
	});
	$("#details").append(incident);
	var element = incident;
	var arr = [];

	$.each(details, function(key, value) {
		arr.push(key);
		arr.push(": ");
		arr.push(value);
		arr.push("<br>");
	});
	incident.append(arr.join(''));
}

function populateComplaintTypes(complaintTypes) {
	$.each(complaintTypes, function(i) {
		$("#complaintType").append("<option value='" + complaintTypes[i] + "'>" + complaintTypes[i] + "</option>");
	});

	$('#complaintType').prepend('<option value="All">Show All</option>');
	removeDropdownDuplicates($('#complaintType'));
	
	$("#complaintType").show();
}

function sortDataByDate(jsonData) {
	var sortedData = jsonData.sort(compareDates);
	return sortedData.reverse();
}

function compareDates(a, b) {
	return new Date(a.created_date).getTime() - new Date(b.created_date).getTime();
}

function removeDropdownDuplicates(field) {
	var usedNames = {};

	field.children("option").each(function () {
		if (usedNames[this.text]) {
			$(this).remove();
		} else {
			usedNames[this.text] = this.value;
		}
	});

	disableEnableDropdowns();
}

function sortDropdown(field, display) {
	var dropdown = "#" + field;

	//Eliminate dashes from the option values
	$(dropdown + '  option').each(function() {
		var newValue = $(this).val().replace('-', '');
		$(this).val(newValue);
	});

	$(dropdown).html($(dropdown + " > option").sort(function (a, b) { //alphabetize list
		return a.value == b.value ? 0 : a.value < b.value ? -1 : 1 
	}));
	$(dropdown).html($(dropdown + " > option").sort(function (a, b) { //sort list numerically
		var keyA = parseInt($(a).text(), 10);
		var keyB = parseInt($(b).text(), 10);
		return keyA - keyB;
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

	var styleArray = [{
		featureType: "all",
		elementType: "labels",
		stylers: [
		{ visibility: "off" }
		]
	}, {
		featureType: "road",
		elementType: "labels",
		stylers: [
		{ visibility: "on" }
		]
	}];
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

function displayMap(latLookup, lngLookup) {
	$('#map, #details').empty();
	$('#map').addClass('active');
	initMap(latLookup, lngLookup);
}

function disableEnableDropdowns() {
	$("select").each(function() {
		var length = $(this).children('option').length;

		if ( length < 2 ) {
			$(this).prop('disabled',true);
		} else {
			$(this).prop('disabled',false);
		}
	});
}


$(document).ready(function() {
	$('#zip').val("");
	emptyDropdowns();
});


$("#zip").on('keyup', function() {
	if ($('#zip').val().length == 5) {
		geoLookup("streetName");
	}
	else {
		emptyDropdowns();
	}
});

$('#streetNames').on('change', function(){
	geoLookup("address");
});

$('#addresses').on('change', function() {
	var data = {
		$$app_token: 'sKRqN6YI4Yd3g612t1P8PhqLt',
		incident_zip: $('#zip').val(),
		street_name: $('#streetNames').val(),
		incident_address: $('#addresses option:selected').text()
	};

	fetchData(data).then(function(result) {
		displayMap(result[0]['location']['latitude'], result[0]['location']['longitude']);
		$('#complaintType').empty();
		$('#complaintType').prepend('<option value="All">Show All</option>');
		displayDetails(result);
	}, function(error) {
		console.log(error)
	});
});

$('#complaintType').on('change', function() {
	var data = {
		$$app_token: 'sKRqN6YI4Yd3g612t1P8PhqLt',
		incident_zip: $('#zip').val(),
		street_name: $('#streetNames').val(),
		incident_address: $('#addresses option:selected').text(),
		complaint_type: $('#complaintType').val()
	};

	if ($("#complaintType option:selected").val() == 'All') {
		delete data.complaint_type;
	}

	fetchData(data).then(function(result) {
		displayDetails(result);
	}, function(error) {
		console.log(error)
	});
});