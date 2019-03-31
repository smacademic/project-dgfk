/*
index.js - Gradebook

Andrew Figueroa
Data Science & Systems Lab (DASSL), Western Connecticut State University

Copyright (c) 2017- DASSL. ALL RIGHTS RESERVED.
Licensed to others under CC 4.0 BY-NC-SA
https://creativecommons.org/licenses/by-nc-sa/4.0/

ALL ARTIFACTS PROVIDED AS IS. NO WARRANTIES EXPRESSED OR IMPLIED. USE AT YOUR OWN RISK.

This JavaScript file provides the client-side JS code that is used by the index.html
page. The functionality provided includes accessing the REST API provided by the web
server component of the Gradebook webapp, along with providing interactivity for the
index.html webpage.
*/

/*
Currently, a globally scoped variable is used to store login information.
 At a later point, it may be stored through a more appropriate manner, such as
 client cookies.
*/
var dbInfo = {
	"host":null, "port":null, "database":null, "user":null, "password":null,
	 "instructorid":null
};
var instInfo = { "fname":null, "mname":null, "lname": null, "dept":null };

/*
Each instance of connInfo as a parameter in a function definition refers to an
 object with the following keys, which are used as part of the REST API calls to
 the Gradebook server:
	"host":String, "port":Number, "database":String, "user":String,
	 "password":String, "instructorid":Number
*/

function sleep (time) {
  return new Promise((resolve) => setTimeout(resolve, time));
}

$(document).ready(function() {
	$('select').material_select(); //load dropdown boxes

	$('#dbInfoBox').collapsible({
		onOpen: function() {
			$('#dbInfoArrow').html('keyboard_arrow_up');
		},
		onClose: function() {
			$('#dbInfoArrow').html('keyboard_arrow_down');
		}
	});

	$('#attnOptionsBox').collapsible({
		onOpen: function() {
			$('#optionsArrow').html('keyboard_arrow_up');
		},
		onClose: function() {
			$('#optionsArrow').html('keyboard_arrow_down');
		}
	});

	$('#btnLogin').click(function()
	{
		dbInfo = getDBFields();
		var email = $('#email').val().trim();

		/*This outer if/else checks to verify the domain name of the email address to verify that the user is logging
		in with the correct email address. This will also help to prevent unauthorized users to log into the system
		if the case would arrive where someone would use an email address like 'something@gmail.com' to spoof the
		username of 'something@example.edu' for example to gain access into the system.

		The 'example.edu' domain name and the 'connect.example.edu' domain name can be changed to match any domain name
		that the end uer needs to make  sure will work.

		The connect.example.edu domain name is there to verify that when a student logs into the application that their
		email address will be verified as correct. A different check is done in the if to make sure that a student
		can log in as well as instructors. This is here to make sure that institutions that use different email
		domains for students and faculty is covered.

		This portion of code comes from team DOSs project.
		*/
		if(email.endsWith('@example.edu') || email.endsWith('@connect.example.edu'))
		{
			var tmpEmail = $('#email').val();
			var username = tmpEmail.substring(0,tmpEmail.indexOf('@'));
			dbInfo.user = username;
	    if (dbInfo != null && email != '')
	    {

				serverLogin(dbInfo, email, function()
				{
					//clear login fields and close DB Info box
					$('#email').val('');
					$('#passwordBox').val('');
					$('#dbInfoBox').collapsible('close', 0);
					$('#dbInfoArrow').html('keyboard_arrow_down');

					popYears(dbInfo);
					getCourses(connInfo);
				});
			}
			 else //else for if username and password are filled in
			 {
		 	 		showAlert('<h5><u>ERROR</u></h5><p>The username or password field is not filled in.' +
				  'Please make sure all fields are filled in</p>');
			 }
		}
		else //Else for email domain name check
		{
			showAlert('<h5><u>Login Incomplete</u></h5><p>The domain name of the email address provided is not recognized' +
	  	'by the server.<br> Please try again or contact support if you believe this is an error.</p>');
		}
	});

	$('#yearSelect').change(function() {
		var year = $('#yearSelect').val();
		popSeasons(dbInfo, year);
	});

	$('#seasonSelect').change(function() {
		var year = $('#yearSelect').val();
		var season = $('#seasonSelect').val();
		popCourses(dbInfo, year, season);
	});

	$('#courseSelect').change(function() {
		var year = $('#yearSelect').val();
		var season = $('#seasonSelect').val();
		var course = $('#courseSelect').val();
		popSections(dbInfo, year, season, course);
	});

	$('#sectionSelect').change(function() {
		var sectionID = $('#sectionSelect').val();
		popAttendance(dbInfo, sectionID);
	});

	$('#opt-showPresent, #opt-compactTab').change(function() {
		//reload attendance table since options were modified
		var sectionID = $('#sectionSelect').val();
		popAttendance(dbInfo, sectionID);
	});

	$('#logout').click(function() {
		dbInfo = null;
		instInfo = null;
		setYears(null); //reset Attendance dropdowns

		//hide and reset profile
		$('#profile').css('display', 'none');
		$('#instName').html('');

		//show Login tab, hide Roster, Attendance, Grades, and Reports tabs
		$('#loginTab').css('display', 'inline');
		$('#rosterTab, #attnTab, #gradesTab, #reportsTab, #courseTab, #sectionTab').css('display', 'none');
		$('ul.tabs').tabs('select_tab', 'login');
	});

	//On click of the AddCourse button, execute
	$('#btnAddCourse').click(function(){
		var num = $('#addCourseName').val();
		var title = $('#addCourseTitle').val();
		var credits = $('#addCourseCredits').val();

		addCourse(dbInfo, num, title, credits);
		//sleep(150).then(() => {
		//defaultCourse(dbInfo, sectionID);})
	});

	/* When a user wishes to edit a course,
	they click the submit button next to the row. */
	$('#coursesTable').on('click', '.edit', function() {
		$('#' + this.id).hide();
		$('#remove' + this.id).hide();
		$('#submit' + this.id).show();
		$('#cancel' + this.id).show();
		$('#number' + this.id).hide();
		$('#newnumber' + this.id).show();
		$('#title' + this.id).hide();
		$('#newtitle' + this.id).show();
		$('#credits' + this.id).hide();
		$('#newcredits' + this.id).show();
	});

	/* When a user wishes to submit a course edit,
	they click the submit button next to the row. */
	$('#coursesTable').on('click', '.submit', function() {
		var rowId = this.id.replace('submit','');
		var idParts = rowId.split("-");
		var number = idParts[0];
		var title = idParts[1];
		var newnumber = $('#newnumber' + rowId).val();
		var newtitle = $('#newtitle' + rowId).val();
		var newcredits = $('#newcredits' + rowId).val();
		updateCourses(dbInfo,number,title,newnumber,newtitle,newcredits);
		//sleep(150).then(() => {
		//defaultCourse(dbInfo);})
	});

	/* When a user wishes to remove a course,
	they click the remove button next to the row. */
	$('#coursesTable').on('click', '.remove', function() {
		if(confirm("Are you sure?")){
		var rowId = this.id.replace('remove','');
		var idParts = rowId.split("-");
		var number = idParts[0];
		var title = idParts[1];
		removeCourse(dbInfo, num, title);
		//sleep(150).then(() => {
		//defaultCourse(dbInfo);})
		}
	});

	/* When a user wishes to cancel a course edit,
	they click the cancel button next to the row. */
	$('#coursesTable').on('click', '.cancel', function() {
		$('#' + this.id).show();
		$('#remove' + this.id).show();
		$('#submit' + this.id).hide();
		$('#cancel' + this.id).hide();
		$('#number' + this.id).show();
		$('#newnumber' + this.id).hide();
		$('#title' + this.id).show();
		$('#newtitle' + this.id).hide();
		$('#credits' + this.id).show();
		$('#newcredits' + this.id).hide();

	});

	//On click of the RemoveCourse button, execute
	$('#btnRemoveCourse').click(function(){
		var num = $('#removeCourseName').val();
		var title = $('#removeCourseTitle').val();

		removeCourse(dbInfo, num, title);
		//sleep(150).then(() => {
		//defaultCourse(dbInfo);})

	});
});

function showAlert(htmlContent) {
	$('#genericAlertBody').html(htmlContent);
	$('#msg-genericAlert').modal('open');
};

function getDBFields() {
	var host = $('#host').val().trim();
	var port = $('#port').val().trim();
	var db = $('#database').val().trim();
	var uname = $('#user').val().trim();
	var pw =  $('#passwordBox').val().trim();

	if (host === "" || port === "" || db === "" || uname === "" || pw === "") {
		return null;
	}

	pw = JSON.stringify(sjcl.encrypt('dassl2017', pw));

	var connInfo = { 'host':host, 'port':parseInt(port, 10), 'database':db,
	 'user':uname, 'password':pw };
	return connInfo;
};

function serverLogin(connInfo, email, callback) {
	//"create a copy" of connInfo with instructoremail and set to urlParams
	var urlParams = $.extend({}, connInfo, {instructoremail:email});
	$.ajax('login', {
		dataType: 'json',
		data: urlParams ,
		success: function(result) {
			//populate dbInfo and instInfo with info from response
			dbInfo.instructorid = result.instructor.id;
			instInfo = { fname:result.instructor.fname,
			mname:result.instructor.mname, lname:result.instructor.lname,
			dept:result.instructor.department };

			//hide Login tab, show Roster, Attendance, Grades, and Reports tabs
			$('#loginTab').css('display', 'none');
			$('#rosterTab, #attnTab, #gradesTab, #reportsTab, #courseTab, #sectionTab').css('display', 'inline');
			$('ul.tabs').tabs('select_tab', 'attendance');

			//populate instructor name and display profile (including logout menu)
			//Array.prototype.join is used because in JS: '' + null = 'null'
			var instName = [instInfo.fname, instInfo.mname, instInfo.lname].join(' ');
			$('#instName').html(instName);
			$('#profile').css('display', 'inline');
			console.log(result);
			callback();
		},
		error: function(result) {
			//currently does not distinguish between credential and connection errors
			showAlert('<h5>Could not login</h5><p>Login failed - ensure ' +
			 'all fields are correct</p>');
			console.log(result);
		}
	});
};

function popYears(connInfo) {
	$.ajax('years', {
		dataType: 'json',
		data: connInfo,
		success: function(result) {
			var years = '';
			for (var i = 0; i < result.years.length; i++) {
				years += '<option value="' + result.years[i] + '">' +
				 result.years[i] + '</option>';
			}
			console.log(result);
			setYears(years);
		},
		error: function(result) {
			showAlert('<p>Error while retrieving years</p>');
			console.log(result);
		}
	});
};

function popSeasons(connInfo, year) {
	var urlParams = $.extend({}, connInfo, {year:year});
	$.ajax('seasons', {
		dataType: 'json',
		data: urlParams,
		success: function(result) {
			var seasons = '';
			for (var i = 0; i < result.seasons.length; i++) {
				seasons += '<option value="' + result.seasons[i].seasonorder +
				 '">' + result.seasons[i].seasonname + '</option>';
			}
			console.log(result);
			setSeasons(seasons);
		},
		error: function(result) {
			showAlert('<p>Error while retrieving seasons</p>');
			console.log(result);
		}
	});
};

function popCourses(connInfo, year, seasonorder) {
	var urlParams = $.extend({}, connInfo, {year:year, seasonorder:seasonorder});
	$.ajax('courses', {
		dataType: 'json',
		data: urlParams,
		success: function(result) {
			var courses = '';
			for (var i = 0; i < result.courses.length; i++) {
				courses += '<option value="' + result.courses[i] + '">' +
				 result.courses[i] + '</option>';
			}
			console.log(result);
			setCourses(courses);
		},
		error: function(result) {
			showAlert('<p>Error while retrieving courses</p>');
			console.log(result);
		}
	});
};

function popSections(connInfo, year, seasonorder, coursenumber) {
	var urlParams = $.extend({}, connInfo, {year:year, seasonorder:seasonorder,
	 coursenumber:coursenumber});
	$.ajax('sections', {
		dataType: 'json',
		data: urlParams,
		success: function(result) {
			var sections = '';
			for (var i = 0; i < result.sections.length; i++) {
				sections += '<option value="' + result.sections[i].sectionid +
				 '">' + result.sections[i].sectionnumber + '</option>';
			}
			console.log(result);
			setSections(sections);
		},
		error: function(result) {
			showAlert('<p>Error while retrieving sections</p>');
			console.log(result);
		}
	});
};

function popAttendance(connInfo, sectionid) {
	var urlParams = $.extend({}, connInfo, {sectionid:sectionid});
	$.ajax('attendance', {
		dataType: 'html',
		data: urlParams,
		success: function(result) {
			console.log(result);
			setAttendance(result);
		},
		error: function(result) {
			if (result.responseText == '500 - No Attenance Records') {
				showAlert('<p>No attendance records exist for this section</p>');
			}
			else {
				showAlert('<p>Error while retrieving attendance data</p>');
			}
			setAttendance(null);
			console.log(result);
		}
	});
};

function setYears(htmlText) {
	var content = '<option value="" disabled="true" selected="true">' +
	 'Choose year</option>' + htmlText;
	$('#yearSelect').html(content);
	$('#yearSelect').prop('disabled', htmlText == null);
	$('#yearSelect').material_select(); //reload dropdown

	setSeasons(null); //reset dependent fields
};

function setSeasons(htmlText) {
	var content = '<option value="" disabled="true" selected="true">' +
	 'Choose season</option>' + htmlText;
	$('#seasonSelect').html(content);
	$('#seasonSelect').prop('disabled', htmlText == null);
	$('#seasonSelect').material_select(); //reload dropdown

	setCourses(null); //reset dependent fields
};

function setCourses(htmlText) {
	var content = '<option value="" disabled="true" selected="true">' +
	 'Choose course</option>' + htmlText;
	$('#courseSelect').html(content);
	$('#courseSelect').prop('disabled', htmlText == null);
	$('#courseSelect').material_select(); //reload dropdown

	setSections(null); //reset dependent fields
};

function setSections(htmlText) {
	var content = '<option value="" disabled="true" selected="true">' +
	 'Choose section</option>' + htmlText;
	$('#sectionSelect').html(content);
	$('#sectionSelect').prop('disabled', htmlText == null);
	$('#sectionSelect').material_select(); //reload dropdown

	setAttendance(null);
};

function setAttendance(htmlText) {
	var showPs = $('#opt-showPresent').is(':checked');
	var isCompact = $('#opt-compactTab').is(':checked');

	if (htmlText == null) {
		$('#attendanceData').html('');
		$('#attnOptionsBox').css('display', 'none');
	}
	else {
		if (htmlText.substring(0, 7) !== '<table>') {
			console.log('WARN: setAttendance(): Unable to style attendance table;' +
			 ' first 7 chars did not match "<table>"');
		}
		else {
			if (!showPs) {
				//replace all 'P' fields with a space
				htmlText = htmlText.replace(/>P<\/td>/g, '> </td>');
			}
			if (isCompact) {
				//add attibutes to <table> tag to use compact framework styling
				htmlText = '<table class="striped" style="line-height:1.1;">' +
				 htmlText.substring(7);

				//give all td tags the "compact" class
				htmlText = htmlText.replace(/<td /g, '<td class="compact" ');
			}
			else {
				//add attibutes to <table> tag to use non-compact framework styling
				htmlText = '<table class="striped">' + htmlText.substring(7);
			}
		}
		$('#attnOptionsBox').css('display', 'block');
		$('#attendanceData').html(htmlText);
	}
};

//The course_mgmt Tab resets.
function defaultCourse_mgmt(connInfo){

	getCourses(connInfo);

};

//Calls gradebookServer.js API to add a course.
function addCourse(connInfo, num, title, credits) {
        var urlParams = $.extend({}, connInfo, {num:num, title:title, credits:credits});
        $.ajax('insertCourse', {
                data: urlParams,
				success: function(result) {
					console.log(result);
				},
				error: function(result) {
					showAlert('<p>Error while adding course: This course is already represented.</p>');
				console.log(result);
				}
        });
};

//Calls gradebookServer.js API to remove a course.
function removeCourse(connInfo, num, title) {
	var urlParams = $.extend({}, connInfo, {num:num, title:title});
	$.ajax('removeCourse', {
					data: urlParams,
	success: function(result) {
		console.log(result);
	},
	error: function(result) {
		showAlert('<p>Error while removing course: This course does not exist.</p>');
	console.log(result);
	}
	});
};

//Calls gradebookServer.js API to modify a course.
function updateCourses(connInfo, num, title, newnum, newtitle, newcredits){
	var urlParams = $.extend({}, connInfo, {num:num, title:title, newnum:newnum, newtitle:newtitle, newcredits:newcredits});
	$.ajax('modCourses',{
            data: urlParams,
			success: function(result) {
				console.log(result);
			},
			error: function(result) {
				showAlert('<p>Error while modifying course.</p>');
			console.log(result);
			}
        });
};


//Calls gradebookServer.js API to view all courses.
function getCourses(connInfo){
	var urlParams = $.extend({}, connInfo);
	$.ajax('getCourses', {
		dataType: 'json',
		data: urlParams,
	success: function(result) {
		var courses = '<tr style=\"font-weight:bold\">';
		courses += '<th></th>';
		courses += '<th style=\"border: 1px solid black\">' + 'Number' + '</th>';
		courses += '<th style=\"border: 1px solid black\">' + 'Title' + '<th>';
		courses += '<th style=\"border: 1px solid black\">' + 'Credits' + '<th>';
		courses += '</tr>';
		for ( var i =0; i < result.courses.length; i++){
			courses += '<tr>';
			courses += '<td> <a id=\"' + result.courses[i].Number + "-" + result.courses[i].Title + '\" class=\"waves-effect waves-light btn edit\">Edit</a>';
			courses += '<td> <a id=\"remove' + result.courses[i].Number + "-" + result.courses[i].Title + '\" class=\"waves-effect waves-light btn remove\">Remove</a>';
			courses += '<td> <a id=\"cancel' + result.courses[i].Number + "-" + result.courses[i].Title + '\" class=\"waves-effect waves-light btn cancel\" style=\"display:none\">Cancel</a>';
			courses += '<td> <a id=\"submit' + result.courses[i].Number + "-" + result.courses[i].Title + '\" type=\"submit\" class=\"waves-effect waves-light btn submit\" style=\"display:none\">Submit</a></td>';

			courses += '<td style=\"border: 1px solid black\"><span id=\"number' + result.courses[i].Number + "-" + result.courses[i].Title + '\">' + result.courses[i].Number + '</span>';
			courses += '<input id=\"newnumber' + result.courses[i].Number + "-" + result.courses[i].Title + '\" class = \"validate\" type=\"text\" maxlength=\"11\" style=\"display:none\" value=\"' + result.courses[i].Number + '\">';
			courses += '<label class="active" for=\"newnumber' + result.courses[i].Number + "-" + result.courses[i].Title + '\"></label>' + '<span class="helper-text" data-error="wrong" data-success="right"> </span> </td>';

			courses += '<td style=\"border: 1px solid black\"><span id=\"title' + result.courses[i].Number + "-" + result.courses[i].Title + '\">' + result.courses[i].Title + '</span>';
			courses += '<input id=\"newtitle' + result.courses[i].Number + "-" + result.courses[i].Title + '\" class = \"validate\" type=\"text\" maxlength=\"100\" style=\"display:none\" value=\"' + result.courses[i].Title + '\">';
			courses += '<label class="active" for=\"newtitle' + result.courses[i].Number + "-" + result.courses[i].Title + '\"></label>' + '<span class="helper-text" data-error="wrong" data-success="right"> </span> </td>';

			courses += '<td style=\"border: 1px solid black\"><span id=\"credits' + result.courses[i].Number + "-" + result.courses[i].Title + '\">' + result.courses[i].Credits + '</span>';
			courses += '<input id=\"newcredits' + result.courses[i].Number + "-" + result.courses[i].Title + '\" class = \"validate\" type=\"number\" style=\"display:none\" value=\"' + result.courses[i].Credits + '\">';
			courses += '<label class="active" for=\"newcredits' + result.courses[i].Number + "-" + result.courses[i].Title + '\"></label>' + '<span class="helper-text" data-error="wrong" data-success="right"> </span> </td>';
			courses += '</tr>';
		}
		setCoursesTable(courses);
    console.log(result);
	},

	error: function(result) {
		showAlert('<p>Error while retrieving courses.</p>');
	console.log(result);
	}
	});
};


//dynamically populates the coursesTable element
function setCoursesTable(htmlText){
	$('#coursesTable').html(htmlText);
};
