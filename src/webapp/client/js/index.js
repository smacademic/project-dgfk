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
					getCourses(dbInfo);
					getTerms(dbInfo);
					$('#coursesTable').show();
					popYears(dbInfo);
					popInstructors(dbInfo);

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
		setInstructors(null);
		setTerms(null);

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
		sleep(150).then(() => {
		defaultCourse_mgmt(dbInfo);})
	});

	//On click of the AddSection button, execute
	$('#btnAddSection').click(function(){
		var course = $('#courseNameSelect').val();
		var term = $('#TermSelect').val();
		var num = $('#addSectionNumber').val();
		var CRN = $('#addSectionCRN').val();
		var schedule = $('#addSectionSchedule').val();
		var capacity = $('#addSectionCapacity').val();
		var location = $('#addSectionLocation').val();
		var start_date = $('#addSectionStartDate').val();
		var end_date = $('#addSectionEndDate').val();
		var midterm_date = $('#addSectionMidtermDate').val();
		var instructor1 = $('#primaryInstructorSelect').val();
		var instructor2 = $('#secondaryInstructorSelect').val();
		var instructor3 = $('#tertiaryInstructorSelect').val();

		addSection(dbInfo, term, course, capacity, num, CRN, schedule, location, start_date, end_date, midterm_date, instructor1, instructor2, instructor3);
		//sleep(150).then(() => {
		//defaultCourse_mgmt(dbInfo);})
	});

	//On click of the RemoveSection button, execute
	$('#btnRemoveSection').click(function(){
		var sectionNumber = $('#removeSectionNumber').val();

		removeSection(dbInfo, sectionNumber);
		//sleep(150).then(() => {
		//defaultCourse_mgmt(dbInfo, sectionID);})
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
		var number = rowId.substring(0,rowId.indexOf("-"));//May have the - character in the title, this prevents the title from being split.
		var title = rowId.substring(rowId.indexOf("-")+1).replace(/_/g," "); //Reintroduces spaces into the title
		var newnumber = $('#newnumber' + rowId).val();
		var newtitle = $('#newtitle' + rowId).val();
		var newcredits = $('#newcredits' + rowId).val();
		updateCourses(dbInfo,number,title,newnumber,newtitle,newcredits);
		sleep(150).then(() => {
		defaultCourse_mgmt(dbInfo);})
	});

	/* When a user wishes to remove a course,
	they click the remove button next to the row. */
	$('#coursesTable').on('click', '.remove', function() {
		if(confirm("Are you sure?")){
		var rowId = this.id.replace('remove','');
		var number = rowId.substring(0,rowId.indexOf("-"));//May have the - character in the title, this prevents the title from being split.
		var title = rowId.substring(rowId.indexOf("-")+1).replace(/_/g," "); //Reintroduces spaces into the title
		removeCourse(dbInfo, number, title);
		sleep(150).then(() => {
		defaultCourse_mgmt(dbInfo);})
		}
	});

	/* When a user wishes to cancel a course edit,
	they click the cancel button next to the row. */
	$('#coursesTable').on('click', '.cancel', function() {
		var rowId = this.id.replace('cancel','');
		$('#' + rowId).show();
		$('#remove' + rowId).show();
		$('#submit' + rowId).hide();
		$('#cancel' + rowId).hide();
		$('#number' + rowId).show();
		
		$('#newnumber' + rowId).hide();
		$('#title' + rowId).show();
		$('#newtitle' + rowId).hide();
		$('#credits' + rowId).show();
		$('#newcredits' + rowId).hide();
	});

	//On click of the RemoveCourse button, execute
	$('#btnRemoveCourse').click(function(){
		var num = $('#removeCourseName').val();
		var title = $('#removeCourseTitle').val();

		removeCourse(dbInfo, num, title);
		sleep(150).then(() => {
		defaultCourse_mgmt(dbInfo);})

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

function popInstructors(connInfo) {
	$.ajax('instructors', {
		dataType: 'json',
		data: connInfo,
		success: function(result) {
			var instructors = '';
			for (var i = 0; i < result.instructors.length; i++) {
				instructors += '<option value="' + result.instructors[i] + '">' +
				 result.instructors[i] + '</option>';
			}
			console.log(result);
			setInstructors(instructors);
		},
		error: function(result) {
			showAlert('<p>Error while retrieving instructors</p>');
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

function setInstructors(htmlText) {
	var content = '<option value="" disabled="true" selected="true">' +
	 'Choose instructor</option>' + htmlText;

	$('#assignInstructorOne').html(content);
	$('#assignInstructorTwo').html(content);
	$('#assignInstructorThree').html(content);
	$('#primaryInstructorSelect').html(content);
	$('#secondaryInstructorSelect').html(content);
	$('#tertiaryInstructorSelect').html(content);


	$('#assignInstructorOne').prop('disabled', htmlText == null);
	$('#assignInstructorTwo').prop('disabled', htmlText == null);
	$('#assignInstructorThree').prop('disabled', htmlText == null);
	$('#primaryInstructorSelect').prop('disabled', htmlText == null);
	$('#secondaryInstructorSelect').prop('disabled', htmlText == null);
	$('#tertiaryInstructorSelect').prop('disabled', htmlText == null);

	$('#assignInstructorOne').material_select(); //reload dropdown
	$('#assignInstructorTwo').material_select(); //reload dropdown
	$('#assignInstructorThree').material_select(); //reload dropdown
	$('#primaryInstructorSelect').material_select(); //reload dropdown
	$('#secondaryInstructorSelect').material_select(); //reload dropdown
	$('#tertiaryInstructorSelect').material_select(); //reload dropdown

};

function setTerms(htmlText) {
	var content = '<option value="" disabled="true" selected="true">' +
	'Choose term</option>' + htmlText;

	$('#TermSelect').html(content);

	$('#TermSelect').prop('disabled', htmlText == null);

	$('#TermSelect').material_select(); //reload dropdown
}


function populateCourses(htmlText) {
	var content = '<option value="" disabled="true" selected="true">' +
	 'Choose course</option>' + htmlText;

	$('#courseNameSelect').html(content);
	$('#removeSectionCourseSelect').html(content);
	$('#enrollChooseCourse').html(content);

	$('#courseNameSelect').prop('disabled', htmlText == null);
	$('#removeSectionCourseSelect').prop('disabled', htmlText == null);
	$('#enrollChooseCourse').prop('disabled', htmlText == null);

	$('#courseNameSelect').material_select(); //reload dropdown
	$('#removeSectionCourseSelect').material_select(); //reload dropdown
	$('#enrollChooseCourse').material_select(); //reload dropdown

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

// Calls gradebookServer.js API to add a section
function addSection(connInfo, term, course, capacity, num, CRN, schedule, location, start_date, end_date, midterm_date, instructor1, instructor2 = null, instructor3 = null) {
	var urlParams = $.extend({}, connInfo, {term:term, course:course, capacity:capacity, num:num, CRN:CRN, schedule:schedule, location:location, 
																					start_date:start_date, end_date:end_date, midterm_date:midterm_date, 
																					instructor1, instructor2, instructor3});
	$.ajax('addSection', {
		data: urlParams,
		success: function(result) {
			console.log(result);
	},
	error: function(result) {
			showAlert('<p>Error while adding section: This section is already represented.</p>');
				console.log(result);
		}
	});
}
	
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

// Calls gradebookServer.js API to remove a section
function removeSection(connInfo, removeSectionNumber) {
	var urlParams = $.extend({}, connInfo, {removeSectionNumber:removeSectionNumber});
	$.ajax('removeSection', {
		data: urlParams,
		success: function(result) {
			console.log(result);
	},
	error: function(result) {
			showAlert('<p>Error while removing section: This section does not exist.</p>');
				console.log(result);
		}
	});
}

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
		courses += '<th style=\"border: 1px solid black\">' + 'Title' + '</th>';
		courses += '<th style=\"border: 1px solid black\">' + 'Credits' + '</th>';
		courses += '</tr>';
		for ( var i =0; i < result.courses.length; i++){
			var id = result.courses[i].Number+"-"+ (result.courses[i].Title.replace(/ /g,"_")); //Replaces spaces withing the title with underscores
			courses += '<tr>';
			courses += '<td> <a id=\"' + id + '\" class=\"waves-effect waves-light btn edit\">Edit</a>';
			courses += '<a id=\"remove' + id + '\" class=\"waves-effect waves-light btn remove\">Remove</a>';
			courses += '<a id=\"cancel' + id + '\" class=\"waves-effect waves-light btn cancel\" style=\"display:none\">Cancel</a>';
			courses += '<a id=\"submit' + id + '\" type=\"submit\" class=\"waves-effect waves-light btn submit\" style=\"display:none\">Submit</a></td>';

			courses += '<td style=\"border: 1px solid black\"><span id=\"number' + id + '\">' + result.courses[i].Number + '</span>';
			courses += '<input id=\"newnumber' + id + '\" class = \"validate\" type=\"text\" maxlength=\"11\" style=\"display:none\" value=\"' + result.courses[i].Number + '\">';
			courses += '<label class="active" for=\"newnumber' + id + '\"></label>' + '<span class="helper-text" data-error="wrong" data-success="right"> </span> </td>';

			courses += '<td style=\"border: 1px solid black\"><span id=\"title' + id + '\">' + result.courses[i].Title + '</span>';
			courses += '<input id=\"newtitle' + id + '\" class = \"validate\" type=\"text\" maxlength=\"100\" style=\"display:none\" value=\"' + result.courses[i].Title + '\">';
			courses += '<label class="active" for=\"newtitle' + id + '\"></label>' + '<span class="helper-text" data-error="wrong" data-success="right"> </span> </td>';

			courses += '<td style=\"border: 1px solid black\"><span id=\"credits' + id + '\">' + result.courses[i].Credits + '</span>';
			courses += '<input id=\"newcredits' + id + '\" class = \"validate\" type=\"number\" style=\"display:none\" value=\"' + result.courses[i].Credits + '\">';
			courses += '<label class="active" for=\"newcredits' + id + '\"></label>' + '<span class="helper-text" data-error="wrong" data-success="right"> </span> </td>';
			courses += '</tr>';
		}
		setCoursesTable(courses);

		var popCourses = '';
		for (var i = 0; i < result.courses.length; i++) {
			popCourses += '<option value="' + result.courses[i].Title + '">' +
			 result.courses[i].Title + '</option>';
		}
		populateCourses(popCourses);

    console.log(result);
	},

	error: function(result) {
		showAlert('<p>Error while retrieving courses.</p>');
	console.log(result);
	}
	});
};


function getTerms(connInfo) {
	$.ajax('getTerms', {
		dataType: 'json',
		data: connInfo,
		success: function(result) {
			var terms = '';
			for (var i = 0; i < result.terms.length; i++) {
				terms += '<option value="' + result.terms[i] + '">' +
				result.terms[i] + '</option>';
			}
			console.log(result);
			setTerms(terms);
		},
		error: function(result) {
			showAlert('<p>Error while retrieving terms</p>');
			console.log(result);
		}
	});
}

//dynamically populates the coursesTable element
function setCoursesTable(htmlText){
	$('#coursesTable').html(htmlText);
};
