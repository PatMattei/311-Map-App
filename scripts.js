//Data: https://nycopendata.socrata.com/Social-Services/311-Service-Requests-from-2010-to-Present/erm2-nwe9
//API docs: http://dev.socrata.com/foundry/#/data.cityofnewyork.us/erm2-nwe9
//Reference URL: https://data.cityofnewyork.us/resource/erm2-nwe9.json?%24%24app_token=sKRqN6YI4Yd3g612t1P8PhqLt&incident_zip=11105&incident_address=21-67+33+STREET


//TODOS
//Add container elements to details
//Convert times
function emptyDropdowns() {
	$('select').empty();
	$('#streetNames').prepend("<option value=''>Street</option>");
	$('#addresses').prepend("<option value=''>Address</option>");
	$('#complaintType').prepend('<option value="All">Show All</option>');
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
		populateResults(incident['incident_address'], incident['agency_name'], new Date(incident['created_date']), new Date(incident['closed_date']), incident['complaint_type'], incident['descriptor'], incident['unique_key'], incident['resolution_description']);
		complaintTypes.push(incident['complaint_type'])
	});

	populateComplaintTypes(complaintTypes);
}

function populateResults(incident_address, agency_name, created_date, closed_date, complaint_type, descriptor, unique_key, resolution_description) {
	$("#details").append("<div class='incident'></div>")
	$('.incident').last().append("incident_address: " + incident_address + ",<br>");
	$('.incident').last().append("agency_name: " + agency_name + ",<br>");
	$('.incident').last().append("created_date: " + created_date + ",<br>");
	$('.incident').last().append("descriptor: " + descriptor + "<br>");
	$('.incident').last().append("closed_date: " + closed_date + ",<br>");
	$('.incident').last().append("resolution_description: " + resolution_description + ",<br>");
	$('.incident').last().append("complaint_type: " + complaint_type + ",<br>");
	$('.incident').last().append("unique_key: " + unique_key + "<hr>");
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
	$('#map').css('height', '500px');
	$('#map').show();
	initMap(latLookup, lngLookup);
}


$(document).ready(emptyDropdowns);


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

$('#geoLookup').on('click', function() {
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
		console.log('deleting')
		delete data.complaint_type;
	}

	fetchData(data).then(function(result) {
		displayDetails(result);
	}, function(error) {
		console.log(error)
	});
});



//TESTING BUTTON
$('#test').on('click', function() {
	$('#zip').val("11105");
	$('#streetNames option:selected').val("19 STREET");
	$('#addresses option:selected').text("20-23 19 STREET");

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
})