/*
NERDS

index.js - Gradebook

This script contains the JQuery code that allows the user to interact with the Node.js API

Based off of Gradebook: https://github.com/DASSL/Gradebook


Credit:

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
	 "userid":null
};
var instInfo = { "fname":null, "mname":null, "lname": null, "dept":null };

/*
Each instance of connInfo as a parameter in a function definition refers to an
 object with the following keys, which are used as part of the REST API calls to
 the Gradebook server:
	"host":String, "port":Number, "database":String, "user":String,
	 "password":String, "instructorid":Number
*/

//Function to introduce delays in the execution
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

	//Already present from Gradebook https://github.com/DASSL/Gradebook
	$('#attnOptionsBox').collapsible({
		onOpen: function() {
			$('#optionsArrow').html('keyboard_arrow_up');
		},
		onClose: function() {
			$('#optionsArrow').html('keyboard_arrow_down');
		}
	});

	$('#btnLogin').click(function() {
		dbInfo = getDBFields();
		var email = $('#email').val().trim();
		if (dbInfo != null && email != '') {
			serverLogin(dbInfo, email, function() {
				//clear login fields and close DB Info box
				$('#email').val('');
				$('#passwordBox').val('');
				$('#dbInfoBox').collapsible('close', 0);
			    $('#dbInfoArrow').html('keyboard_arrow_down');
			});
		}
		else {
			showAlert('<h5>Missing field(s)</h5><p>One or more fields are ' +
			 'not filled in.</p><p>All fields are required, including those in ' +
			 'DB Info.</p>');
		}
	});

	$('#logout').click(function() {
		dbInfo = null;
		instInfo = null;

		//hide and reset profile
		$('#profile').css('display', 'none');
		$('#instName').html('');

		//show Login tab, hide Roster, Attendance, Grades, and Reports tabs
		$('#loginTab').css('display', 'inline');
		$('#rosterTab, #attnTab, #gradesTab, #reportsTab').css('display', 'none');
		$('ul.tabs').tabs('select_tab', 'login');
	});

	//Already present from Gradebook https://github.com/DASSL/Gradebook
	$('#opt-showPresent, #opt-compactTab').change(function() {
		//reload attendance table since options were modified
		var sectionID = $('#sectionSelectGrades').val();
		popAttendance(dbInfo, sectionID);
	});

	//When nav bar is clicked, the Grades tab goes back to default.
	$('.nav-content').click(function() {
		var sectionID = $('#sectionSelectGrades').val();
		if (dbInfo != null){
	    defaultGrades(dbInfo,null);
		}
		else{}
	});

	//Already present from Gradebook https://github.com/DASSL/Gradebook
	//Not included in our scope.
	$('#yearSelect').change(function() {
		var year = $('#yearSelect').val();
		popSeasons(dbInfo, year);
	});

	//Already present from Gradebook https://github.com/DASSL/Gradebook
	//Not included in our scope.
	$('#seasonSelect').change(function() {
		var year = $('#yearSelect').val();
		var season = $('#seasonSelect').val();
		popCourses(dbInfo, year, season);
	});

	//Already present from Gradebook https://github.com/DASSL/Gradebook
	//Not included in our scope.
	$('#courseSelect').change(function() {
		var year = $('#yearSelect').val();
		var season = $('#seasonSelect').val();
		var course = $('#courseSelect').val();
		popSections(dbInfo, year, season, course);
	});

	/*When a user selects a section from a dropdown,
	The assessment kinds from that section are loaded
	into the assessment kind dropdown for user selection.*/
	$('#sectionSelectGrades').change(function() {
		var sectionID = $('#sectionSelectGrades').val();
		defaultSection(dbInfo,sectionID);
	});

	/*An instructor selects which section they want to
	copy an assessment kind via a dropdown.*/
	$('#sectionSelectCopyToAK').change(function() {
		var sectionID = $('#sectionSelectCopyToAK').val();
	});

	/*An instructor select which section they want to
	copy a grade tier via a drop.*/
	$('#sectionSelectCopyToGT').change(function() {
		var sectionID = $('#sectionSelectCopyToGT').val();
	});

	/*When an instructor wants to edit an assessment kind,
	they click an edit button next to the assessment kind row.*/
	$('#sectionOverview').on('click', '.edit', function() {
		$(document.getElementById(this.id)).hide();
		$(document.getElementById('remove' + this.id)).hide();
		$(document.getElementById('submit' + this.id)).show();
		$(document.getElementById('cancel' + this.id)).show();
		$(document.getElementById('name' + this.id)).hide();
		$(document.getElementById('newname' + this.id)).show();
		$(document.getElementById('description' + this.id)).hide();
		$(document.getElementById('newdescription' + this.id)).show();
		$(document.getElementById('weightage' + this.id)).hide();
		$(document.getElementById('newweightage' + this.id)).show();
    });

	/*When an instructor wants to submit an edited assessment kind,
	they click the submit button next to the row.*/
    $('#sectionOverview').on('click', '.submit', function() {
		var rowId = this.id.replace('submit','');
		var sectionID = $('#sectionSelectGrades').val();
		var name = rowId;
		var description = $(document.getElementById('newdescription' + rowId)).val();
		var weightage = $(document.getElementById('newweightage' + rowId)).val();
		var newname = $(document.getElementById('newname' + rowId)).val();

	    updateAssessmentKind(dbInfo, sectionID, name, description, weightage, newname);
	    sleep(150).then(() => {
	    defaultSection(dbInfo,sectionID);})
	});

	/*When an instructor wants to cancel the editing of an assessment kind,
	they click the cancel button next to the row.*/
	$('#sectionOverview').on('click', '.cancel', function() {
	    sectionID = $('#sectionSelectGrades').val();
		sleep(150).then(() => {
		defaultSection(dbInfo,sectionID);})
	});

	/*When an instructor wants to remove an assessment kind,
	they click the remove button next to the row.*/
	$('#sectionOverview').on('click', '.remove', function() {
		if (confirm("Are you sure?")) {
		var sectionID = $('#sectionSelectGrades').val();
		var name = this.id.replace('remove','');
		deleteAssessmentKind(dbInfo, sectionID, name);
		sleep(150).then(() => {
	    defaultSection(dbInfo, sectionID);})
	    }
	});

	/*When a student wants to view their scores for a section,
	they click the view scores button at the top of the page.*/
	$('#btnViewScores').click(function(){
		$('#classSection').hide();
		$('#scores').show();
	});

	/*When a student wants to go back to the section overview from view grade tiers,
	they click the back button at the top of the page.*/
	$('#btnBackFromScores').click(function(){
		var sectionID = $('#sectionSelectGrades').val();
		defaultSection(dbInfo,sectionID);
	});

	/*When a student wants to view their scores for an assessment kind,
	they click the kind from the dropdown.*/
	$('#assessmentKindSelectScores').change(function(){
		var sectionID = $('#sectionSelectGrades').val();
		var assessmentKind = $('#assessmentKindSelectScores').val();
		popStudentScores(dbInfo,sectionID,assessmentKind);
	});

	/*When a user wants to view the grade tiers of a section,
	they click the view grade tiers button at the top of the page.*/
	$('#btnViewGradeTiers').click(function() {
		$('#classSection').hide();
		$('#gradeTier').show();
		var sectionID = $('#sectionSelectGrades').val();
		popGradeTiers(dbInfo,sectionID);
	});

	/*When a user wants to go back to the section overview from view grade tiers,
	they click the back button at the top of the page.*/
	$('#btnBackFromGradeTiers').click(function(){
		var sectionID = $('#sectionSelectGrades').val();
		defaultSection(dbInfo,sectionID);
	});

	/*When an instructor wants to add a grade tier to a section,
	they click the add grade tier button at the top of the page.*/
	$('#btnAddGradeTier').click(function(){
		$('#gradeTier').hide();
		$('#addGradeTier').show();
	});

	/*When an instructor wants to submit a grade tier to a section,
	they click the submit grade tier button.*/
	$('#submitAddGradeTier').click(function() {
		//If the grade tier range is invalid, don't leave the page.
		if (!($('#addGradeTierLow').hasClass('invalid') || $('#addGradeTierHigh').hasClass('invalid'))){
		var sectionID = $('#sectionSelectGrades').val();
		var letter = $('#gradeTierLetterSelect').val();
		var low = $('#addGradeTierLow').val();
		var high = $('#addGradeTierHigh').val();

		addGradeTier(dbInfo, sectionID, letter, low, high);
		sleep(150).then(() => {
		defaultGradeTier(dbInfo, sectionID);})
		}
		else{}
	});

	/*When an instructor wants to edit a grade tier,
	they click the edit button next to the row.*/
	$('#gradeTierView').on('click', '.edit', function() {
		var rowId = "";
		$(document.getElementById(this.id)).hide();
		$(document.getElementById('remove' + this.id)).hide();
		$(document.getElementById('submit' + this.id)).show();
		$(document.getElementById('cancel' + this.id)).show();
		$(document.getElementById('letter' + this.id)).hide();
		$(document.getElementById('newletter' + this.id)).show();
		$(document.getElementById('range' + this.id)).hide();
		$(document.getElementById('newlowpercentage' + this.id)).show();
		$(document.getElementById('rangehyphen' + this.id)).show();
		$(document.getElementById('newhighpercentage' + this.id)).show();
	});

	/*When an instructor wants to submit a grade tier,
	they click the submit button next to the row.*/
	$('#gradeTierView').on('click', '.submit', function() {
	    var rowId = this.id.replace('submit','');
		var sectionID = $('#sectionSelectGrades').val();
		var letter = rowId;
		var lowpercentage = $(document.getElementById('newlowpercentage' + rowId)).val();
		var highpercentage = $(document.getElementById('newhighpercentage' + rowId)).val();
		var newletter = $(document.getElementById('newletter' + rowId)).val();

		updateGradeTier(dbInfo, sectionID, letter, lowpercentage, highpercentage, newletter);
		sleep(150).then(() => {
        defaultGradeTier(dbInfo,sectionID);})
	});

	/*When an instructor wants to cancel a grade tier edit,
	they click the cancel button next to the row.*/
	$('#gradeTierView').on('click', '.cancel', function() {
	    sectionID = $('#sectionSelectGrades').val();
		sleep(150).then(() => {
		defaultGradeTier(dbInfo,sectionID);})
	});

	/*When an instructor wants to remove a grade tier,
	they click the remove button next to the row.*/
	$('#gradeTierView').on('click', '.remove', function() {
	    if (confirm("Are you sure?")) {
		var rowId = this.id.replace('remove','');
		if (rowId.length > 1){
			rowId = rowId.substring(0,1) + "\\" + rowId.substring(1,rowId.length);
		}
		var sectionID = $('#sectionSelectGrades').val();
		var letter = rowId.substring(0,1) + rowId.substring(2,rowId.length);
		deleteGradeTier(dbInfo, sectionID, letter);
		sleep(150).then(() => {
		defaultGradeTier(dbInfo, sectionID);})
		}
	});

	/*When an instructor wants to copy a grade tier,
	they click the copy grade tier button at the top of the page.*/
	$('#btnCopyGradeTier').click(function(){
		$('#gradeTier').hide();
		$('#copyGradeTier').show();
		var sectionID = $('#sectionSelectGrades').val();
		popSectionsForCopy(dbInfo,2018,0);
		popGradeTierDropdown(dbInfo, sectionID);
	});

	/*When an instructor wants to submit a grade tier copy,
	they click the submit button.*/
	$('#submitCopyGradeTier').click(function(){
		var sectionID = $('#sectionSelectGrades').val();
		var letter = $('#selectGradeTierToCopy').val();
		var sectionIDTo = $('#sectionSelectCopyToGT').val();
		copyGradeTier(dbInfo, sectionID, letter, sectionIDTo);
		sleep(150).then(() => {
		defaultGradeTier(dbInfo, sectionID);})

	});

	/*When a user wants to view an assessment kind,
	they click the assessment kind from the dropdown.*/
	$('#assessmentKindSelect').change(function()	{
		$('#classSection').hide();
		var sectionID = $('#sectionSelectGrades').val();
		var assessmentKind = $('#assessmentKindSelect').val();
		popAssessmentKindOverview(dbInfo, sectionID, assessmentKind);
		popAssessmentItems(dbInfo, sectionID, assessmentKind);
		$('#kind').show();
	});

	/*When an instructor wants to edit an assessment item,
	they click the edit button next to the row.*/
	$('#assessmentKindOverview').on('click', '.edit', function() {
	    $('#' + this.id).hide();
		$('#remove' + this.id).hide();
		$('#submit' + this.id).show();
		$('#cancel' + this.id).show();
		$('#number' + this.id).hide();
		$('#newnumber' + this.id).show();
		$('#description' + this.id).hide();
		$('#newdescription' + this.id).show();
		$('#basepointspossible' + this.id).hide();
		$('#newbasepointspossible' + this.id).show();
		$('#assigneddate' + this.id).hide();
		$('#newassigneddate' + this.id).show();
		$('#duedate' + this.id).hide();
		$('#newduedate' + this.id).show();
		$('#revealdate' + this.id).hide();
		$('#newrevealdate' + this.id).show();
		$('#curve' + this.id).hide();
		$('#newcurve' + this.id).show();
	});

	/*When an instructor wants to submit an assessment item edit,
	they click the submit button next to the row.*/
	$('#assessmentKindOverview').on('click', '.submit', function() {
	    var rowId = this.id.replace('submit','');
		var sectionID = $('#sectionSelectGrades').val();
		var kind = $('#assessmentKindSelect').val();
		var number = rowId;
		var description = $('#newdescription' + rowId).val();
		var basepoints = $('#newbasepointspossible' + rowId).val();
		var dateassigned = $('#newassigneddate' + rowId).val();
		var duedate = $('#newduedate' + rowId).val();
		var revealdate = $('#newrevealdate' + rowId).val();
		var curve = $('#newcurve' + rowId).val();
		if (curve == "") {
			curve = 1.00;
		}
		var newnumber = $('#newnumber' + rowId).val();

		updateAssessmentItem(dbInfo, sectionID, kind, number, description, basepoints, dateassigned, duedate, revealdate, curve, newnumber);
		sleep(150).then(() => {
        defaultKind(dbInfo,sectionID,kind);})
	});

	/*When an instructor wants to cancel an assessment item edit,
	they click the cancel button next to the row.*/
	$('#assessmentKindOverview').on('click', '.cancel', function() {
		var sectionID = $('#sectionSelectGrades').val();
		var kind = $('#assessmentKindSelect').val();
		sleep(150).then(() => {
		defaultKind(dbInfo,sectionID,kind);})
	});

	/*When an instructor wants to remove an assessment item,
	they click the remove button next to the row.*/
	$('#assessmentKindOverview').on('click', '.remove', function() {
		if (confirm("Are you sure?")) {
		var sectionID = $('#sectionSelectGrades').val();
		var kind = $('#assessmentKindSelect').val();
		var number = this.id.replace('remove','');
		deleteAssessmentItem(dbInfo, sectionID, kind, number);
		sleep(150).then(() => {
	    defaultKind(dbInfo,sectionID,kind);})
	    }
	});

	/*When an instructor wants to add an assessment kind,
	they click the add assessment kind button at the top of the page.*/
	$('#btnAddKind').click(function() {
	    $('#classSection').hide();
	    $('#addAssessmentKind').show();
	});

	/*When an instructor wants to submit an assessment kind add,
	they click the submit button.*/
	$('#submitAddKind').click(function() {
	    if (!($('#addKindName').hasClass('invalid') || $('#addKindDescription').hasClass('invalid') || $('#addKindWeightage').hasClass('invalid'))){
	    var sectionID = $('#sectionSelectGrades').val();
	    var name = $('#addKindName').val();
	    var description = $('#addKindDescription').val();
	    var weightage = parseFloat($('#addKindWeightage').val());

	    addAssessmentKind(dbInfo, sectionID, name, description, weightage);
		sleep(150).then(() => {
	    defaultSection(dbInfo, sectionID);})
		}
	else{}
	});

	/*When an instructor wants to copy an assessment kind to another section,
	they click the copy assessment kind button at the top of the page.*/
	$('#btnCopyKind').click(function(){
		$('#classSection').hide();
		$('#sectionOverview').show();
		$('#copyAssessmentKind').show();
		popSectionsForCopy(dbInfo,2018,0);
	});

	/*When an instructor wants to submit an assessment kind copy,
	they click the submit button.*/
	$('#submitCopyAssessmentKind').click(function(){
		var sectionID = $('#sectionSelectGrades').val();
		var name = $('#selectAssessmentKindToCopy').val();
		var sectionIDTo = $('#sectionSelectCopyToAK').val();
		copyAssessmentKind(dbInfo, sectionID, name, sectionIDTo);
		defaultSection(dbInfo, sectionID);
	});

	/*When an instructor wants to view submissions for an assessment item,
	they click the assessment item from the dropdown.*/
	$('#assessmentItemSelect').change(function()	{
		var sectionID = $('#sectionSelectGrades').val();
		var assessmentKind = $('#assessmentKindSelect').val();
		var assessmentItem = $('#assessmentItemSelect').val();
		$('#item').show();
		$('.kindBtn').show();
		$('#assessmentKindAvg').hide();
		defaultItem(dbInfo, sectionID, assessmentKind, assessmentItem);
	});

	/*When an instructor wants to go back to section overview from the assessment items view,
	they click the back button at the top of the page.*/
    $('#btnBackFromAssessmentItem').click(function(){
		var sectionID = $('#sectionSelectGrades').val();
		defaultSection(dbInfo,sectionID);
    });

	/*When an instructor wants to go back to the assessment kind overview from the submissions view,
	they click the back button at the top of the page.*/
	$('#item').on('click', '.back', function() {
	    var sectionID = $('#sectionSelectGrades').val();
		var assessmentKind = $('#assessmentKindSelect').val();
		defaultKind(dbInfo,sectionID,assessmentKind);
	});

	/*When an instructor wants to add an assessment item,
	they click the add assessment item button at the top of the page.*/
    $('#btnAddItem').click(function() {
	    $('#kind').hide();
	    $('#addAssessmentItem').show();
	});

	/*When an instructor wants to submit an assessment item add,
	they click the submit button next to the row.*/
	$('#submitAddItem').click(function() {
	    if (!($('#addItemNum').hasClass('invalid') || $('#addItemDescription').hasClass('invalid') || $('#addItemPoints').hasClass('invalid') || $('#addItemDueDate').hasClass('invalid') || $('#addItemRevealDate').hasClass('invalid') || $('#addItemCurve').hasClass('invalid'))){
	    	var sectionID = $('#sectionSelectGrades').val();
			var assessmentKind = $('#assessmentKindSelect').val();
        	var number = $('#addItemNum').val();
			var description = $('#addItemDescription').val();
			var points = $('#addItemPoints').val();
			var assign = new Date().toString().substring(0,15);
        	var due = $('#addItemDueDate').val();
			due.toString().substring(0,15);
			var reveal = $('#addItemRevealDate').val();
			if(reveal == ""){
				reveal = assign;
			}
			else{
			reveal.toString().substring(0,15);
			}
			var curve = $('#addItemCurve').val();
			if (curve == "") {
			    curve = 1.00;
			}
        	addAssessmentItem(dbInfo, sectionID, assessmentKind, number, description, points, assign, due, reveal, curve);
	    	sleep(150).then(() => {
			defaultKind(dbInfo, sectionID,assessmentKind);})
		}
	else{}
	});

	/*When an instructor wants to add a submission,
	they click the add submission button at the top of the page.*/
	$('#btnAddSubmission').click(function() {
			$('#item').hide();
			$('#addSubmission').show();
		});

	/*When an instructor wants to submit a submission add,
	they click the submit button.*/
	$('#submitAddSubmission').click(function() {
	    if (!($('#submissionAddStudent').hasClass('invalid') || $('#submissionAddBasePointsEarned').hasClass('invalid') || $('#submissionAddExtraCreditEarned').hasClass('invalid') || $('#submissionAddPenalty').hasClass('invalid') || $('#submissionAddSubmissionDate').hasClass('invalid') || $('#submissionAddNotes').hasClass('invalid'))){
	    	var studentID = $('#submissionAddStudent').val();
	    	var sectionID = $('#sectionSelectGrades').val();
	    	var assessmentKind = $('#assessmentKindSelect').val();
	    	var number = $('#assessmentItemSelect').val();
	    	var basepointsearned = $('#submissionAddBasePointsEarned').val();
	    	var extracreditearned = $('#submissionAddExtraCreditEarned').val();
	    	var penalty = $('#submissionAddPenalty').val();
	    	var submissiondate = $('#submissionAddSubmissionDate').val();
	    	var notes = $('#submissionAddNotes').val();
	    	submissiondate.toString().substring(0,15);

	    	addSubmission(dbInfo, studentID, sectionID, assessmentKind, number, basepointsearned, extracreditearned, penalty, submissiondate, notes);
	    	sleep(150).then(() => {
			defaultItem(dbInfo, sectionID, assessmentKind, number);})
		}
	else{}
	});

	/*When an instructor wants to edit a submission,
	they click the edit button next to the row.*/
	$('#submissionData').on('click', '.edit', function() {
		$('#' + this.id).hide();
		$('#remove' + this.id).hide();
		$('#submit' + this.id).show();
		$('#cancel' + this.id).show();
		$('#basepointsearned' + this.id).hide();
		$('#newbasepointsearned' + this.id).show();
		$('#extracreditearned' + this.id).hide();
		$('#newextracreditearned' + this.id).show();
		$('#penalty' + this.id).hide();
		$('#newpenalty' + this.id).show();
		$('#submissiondate' + this.id).hide();
		$('#newsubmissiondate' + this.id).show();
		$('#notes' + this.id).hide();
		$('#newnotes' + this.id).show();
	});

	/*When an instructor wants to submit a submission edit,
	they click the submit button next to the row.*/
	$('#submissionData').on('click', '.submit', function() {
		var rowId = this.id.replace('submit','');
		if (!($('#newbasepointsearned' + rowId).hasClass('invalid') || $('#newextracreditearned' + rowId).hasClass('invalid') || $('#newpenalty' + rowId).hasClass('invalid') || $('#newsubmissiondate' + rowId).hasClass('invalid') || $('#newnotes' + rowId).hasClass('invalid'))){
			var studentID = rowId;
			var sectionID = $('#sectionSelectGrades').val();
			var kind = $('#assessmentKindSelect').val();
			var number = $('#assessmentItemSelect').val();
			var basepoints = $('#newbasepointsearned' + rowId).val();
			var extracredit = $('#newextracreditearned' + rowId).val();
			var penalty = $('#newpenalty' + rowId).val();
			var submissiondate = $('#newsubmissiondate' + rowId).val();
			var notes = $('#newnotes' + rowId).val();

			updateSubmission(dbInfo, studentID, sectionID, kind, number, basepoints, extracredit, penalty, submissiondate, notes);
			sleep(150).then(() => {
	    	defaultItem(dbInfo,sectionID,kind,number);})
		}
		else {}
	});

	/*When an instructor wants to cancel a submission edit,
	they click the cancel button next to the row.*/
	$('#submissionData').on('click', '.cancel', function() {
	    var sectionID = $('#sectionSelectGrades').val();
		var kind = $('#assessmentKindSelect').val();
		var number = $('#assessmentItemSelect').val();
		sleep(150).then(() => {
		defaultItem(dbInfo,sectionID,kind,number);})
	});

	/*When an instructor wants to cancel a section operation such as adding and copying assessment kinds,
	they click the cancel button.*/
	$('.sectionOptions').on('click', '.cancel',function(){
		var sectionID = $('#sectionSelectGrades').val();
		defaultSection(dbInfo,sectionID);
	});

	/*When an instructor wants to cancel a kind operation such as adding assessment items,
	they click the cancel button.*/
	$('.kindOptions').on('click', '.cancel',function(){
		var sectionID = $('#sectionSelectGrades').val();
		var kind = $('#assessmentKindSelect').val();
		defaultKind(dbInfo,sectionID,kind);
	});

	/*When an instructor wants to cancel a grade tier operation such as adding and copying grade tiers,
	they click the cancel button.*/
	$('.gradeTierOptions').on('click', '.cancel',function(){
		var sectionID = $('#sectionSelectGrades').val();
		defaultGradeTier(dbInfo,sectionID);
	});

	/*When an instructor wants to cancel an item operation such as adding submissions,
	they click the cancel button.*/
	$('.itemOptions').on('click', '.cancel', function(){
	    var sectionID = $('#sectionSelectGrades').val();
	    var kind = $('#assessmentKindSelect').val();
	    var number = $('#assessmentItemSelect').val();
	    defaultItem(dbInfo,sectionID,kind,number);
	});

});

//Checks whether the user is an instructor or a student.
function checkRole(dbInfo){
	if(dbInfo.role!="instructor"){
		$('.instructorView').hide();
	}
	else {
		$('.instructorView').show();
		$('.studentView').hide();
	}
}

//The Grades tab goes back to default.
function defaultGrades(dbInfo,sectionID) {
	popSections(dbInfo, 2018, 0);
	$('.sectionOptions').hide();
    $('#gradeTier').hide();
	$('#scores').hide();
	$('.gradeTierOptions').hide();
	$('.kindOptions').hide();
	$('.sectionBtn').hide();
	$('.field').val('');
	$('#kind').hide();
	$('#item').hide();
	$('#classSection').show();
	$('.sectionBtn').hide();
	$('#addKindBtn').hide();
	if (sectionID!=null){
		checkRole(dbInfo);
	}
	else{}
};

//Grade Tier view goes back to default
function defaultGradeTier(dbInfo,sectionID) {
	$('#scores').hide();
	popGradeTiers(dbInfo, sectionID);
	$('.field').val('');
	$('#gradeTierView').show();
	$('#gradeTier').show();
	$('.gradeTierOptions').hide();
	checkRole(dbInfo);
};

//The Section view goes back to default
function defaultSection(dbInfo, sectionID) {
	$('.sectionBtn').show();
	popAssessmentKinds(dbInfo,sectionID);
	popSectionOverview(dbInfo,sectionID);
	$('.sectionOptions').hide();
	$('#gradeTier').hide();
	$('#scores').hide();
	$('.gradeTierOptions').hide();
	$('.kindOptions').hide();
	$('.field').val('');
	$('#kind').hide();
	$('#item').hide();
	$('#classSection').show();
	checkRole(dbInfo);
};

//The Kind view goes back to default
function defaultKind(dbInfo, sectionID, assessmentKind) {
	$('.kindBtn').show();
	popAssessmentKindOverview(dbInfo, sectionID, assessmentKind);
	popAssessmentItems(dbInfo, sectionID, assessmentKind);
	$('.sectionOptions').hide();
	$('.gradeTierOptions').hide();
	$('.kindOptions').hide();
	$('#gradeTier').hide();
	$('#scores').hide();
	$('.field').val('');
	$('#item').hide();
	$('#classSection').hide();
	$('#kind').show();
	$('#assessmentKindOverview').show();
	checkRole(dbInfo);
};

//The Item view goes back to default values
function defaultItem(dbInfo, sectionID, assessmentKind, itemNumber) {
	$('#scores').hide();
	$('#addSubmission').hide();
	$('.itemBtn').show();
	$('#item').show();
	popSubmissions(dbInfo, sectionID, assessmentKind, itemNumber);
	$('#kind').hide();
	$('.itemOptions').hide();
	checkRole(dbInfo);
};

//Already present from Gradebook https://github.com/DASSL/Gradebook
function showAlert(htmlContent) {
	$('#genericAlertBody').html(htmlContent);
	$('#msg-genericAlert').modal('open');
};

//Already present from Gradebook https://github.com/DASSL/Gradebook
function getDBFields() {
	var host = $('#host').val().trim();
	var port = $('#port').val().trim();
	var db = $('#database').val().trim();
	var uname = $('#user').val().trim();
	var pw =  $('#passwordBox').val().trim();

	if (host === "" || port === "" || db === "" || uname === "" || pw === "") {
		return null;
	}

	var connInfo = { 'host':host, 'port':parseInt(port, 10), 'database':db,
	 'user':uname, 'password':pw };
	return connInfo;

};
//Already present from Gradebook https://github.com/DASSL/Gradebook
function serverLogin(connInfo, email, callback) {
	//"create a copy" of connInfo with instructoremail and set to urlParams
	var urlParams = $.extend({}, connInfo, {instructoremail:email});
	$.ajax('login', {
		dataType: 'json',
		data: urlParams ,
		success: function(result) {
			//populate dbInfo and instInfo with info from response
			if(result.instructor){
			dbInfo.role="instructor";
			dbInfo.userid = result.instructor.id;
			instInfo = { fname:result.instructor.fname,
			mname:result.instructor.mname, lname:result.instructor.lname,
			dept:result.instructor.department };
			}
			else{
			dbInfo.role="student";
			dbInfo.userid = result.student.id;
			instInfo = { fname:result.student.fname,
			mname:result.student.mname, lname:result.student.lname,
			dept:result.student.major };
			}
			//hide Login tab, show Roster, Attendance, Grades, and Reports tabs
			$('#loginTab').css('display', 'none');
			$('#rosterTab, #attnTab, #gradesTab, #reportsTab').css('display', 'inline');
			$('ul.tabs').tabs('select_tab', 'grades');

			//populate instructor name and display profile (including logout menu)
			//Array.prototype.join is used because in JS: '' + null = 'null'
			var instName = [instInfo.fname, instInfo.mname, instInfo.lname].join(' ');
			$('#instName').html(instName);
			$('#profile').css('display', 'inline');

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

//Calls gradebookServer.js API to add a grade tier.
function addGradeTier(connInfo, sectionid, letter, low, high) {
        var urlParams = $.extend({}, connInfo, {sectionid:sectionid, lettergrade:letter, lowpercentage:low, highpercentage:high});
        $.ajax('gradeTiersAdd', {
                data: urlParams,
				success: function(result) {},
				error: function(result) {
					showAlert('<p>Error while adding grade tier: This grade tier is already represented.</p>');
				console.log(result);
				}
        });
};

//Calls gradebookServer.js API to delete a grade tier.
function deleteGradeTier(connInfo, sectionid, letter) {
        var urlParams = $.extend({}, connInfo, {sectionid:sectionid, lettergrade:letter});
        $.ajax('gradeTiersDelete', {
                data: urlParams,
				success: function(result) {},
				error: function(result) {
					showAlert('<p>Error while removing grade tier</p>');
				console.log(result);
				}
        });
};

//Calls gradebookServer.js API to update a grade tier.
function updateGradeTier(connInfo, sectionid, letter, lowpercentage, highpercentage, modifiedlettergrade){
        var urlParams = $.extend({}, connInfo, {sectionid:sectionid, letter:letter, lowpercentage:lowpercentage, highpercentage:highpercentage, modifiedlettergrade:modifiedlettergrade});
        $.ajax('gradeTiersMod', {
		        data: urlParams,
				success: function(result) {},
				error: function(result) {
					showAlert('<p>Error while updating grade tier</p>');
				console.log(result);
				}
		});
};

//Calls gradebookServer.js API to copy a grade tier.
function copyGradeTier(connInfo, sectionid, letter, sectionidto){
	    var urlParams = $.extend({}, connInfo, {sectionid:sectionid, lettergrade:letter, newsection:sectionidto});
        $.ajax('gradeTiersCopy', {
                data: urlParams,
				success: function(result) {},
				error: function(result) {
					showAlert('<p>Error while copying grade tier: This grade tier is already represented in the destination section.</p>');
				console.log(result);
				}
        });
};

//Calls gradebookServer.js API to add an assessment kind.
function addAssessmentKind(connInfo, sectionid, kindname, kinddescription, weightage) {
        var urlParams = $.extend({}, connInfo, {sectionid:sectionid, kindname:kindname, kinddescription:kinddescription, weightage:weightage});
        $.ajax('assessmentKindsAdd', {
                data: urlParams,
				success: function(result) {},
				error: function(result) {
					showAlert('<p>Error while adding assessment kind: An assessment kind with this name already exists.</p>');
				console.log(result);
				}
        });
};

//Calls gradebookServer.js API to delete an assessment kind.
function deleteAssessmentKind(connInfo, sectionid, kindname) {
        var urlParams = $.extend({}, connInfo, {sectionid:sectionid, kindname:kindname});
        $.ajax('assessmentKindsDelete', {
                data: urlParams,
				success: function(result) {},
				error: function(result) {
					showAlert('<p>Error while removing assessment kind: There are assessment items of this assessment kind.</p>');
				console.log(result);
				}
        });
};

//Calls gradebookServer.js API to update an assessment kind.
function updateAssessmentKind(connInfo, sectionid, kindname, kinddescription, weightage, newkindname) {
		var urlParams = $.extend({}, connInfo, {sectionid:sectionid, kindname:kindname, kinddescription:kinddescription, weightage:weightage, newkindname:newkindname});
		$.ajax('assessmentKindsMod', {
				data: urlParams,
				success: function(result) {},
				error: function(result) {
					showAlert('<p>Error while updating assessment kind</p>');
				console.log(result);
				}
		});
};

//Calls gradebookServer.js API to copy an assessment kind.
function copyAssessmentKind(connInfo, sectionid, name, sectionidto){
		var urlParams = $.extend({}, connInfo, {sectionid:sectionid, kindname:name, newsection:sectionidto});
		$.ajax('assessmentKindsCopy', {
				data: urlParams,
				success: function(result) {},
				error: function(result) {
					showAlert('<p>Error while copying assessment kind: An assessment kind with this name is already present in the destination section.</p>');
				console.log(result);
				}
		});
};

//Calls gradebookServer.js API to add an assessment item.
function addAssessmentItem(connInfo, sectionid, assessmentKind, number, description, points, assign, due, reveal, curve) {
        var urlParams = $.extend({}, connInfo, {sectionid:sectionid, kind:assessmentKind, itemnumber:number, itemdescription:description, basepointspossible:points, assigneddate:assign, duedate:due, revealdate:reveal, curve:curve});
        $.ajax('assessmentItemsAdd', {
                data: urlParams,
				success: function(result) {},
				error: function(result) {
					showAlert('<p>Error while adding assessment item: An assessment item with the number ' + number + ' already exists. </p>');
				console.log(result);
				}
        });
};

//Calls gradebookServer.js API to delete an assessment item.
function deleteAssessmentItem(connInfo, sectionid, assessmentKind, number) {
        var urlParams = $.extend({}, connInfo, {sectionid:sectionid, kind:assessmentKind, itemnumber:number});
        $.ajax('assessmentItemsDelete', {
                data: urlParams,
				success: function(result) {},
				error: function(result) {
					showAlert('<p>Error while removing assessment item: There are student submissions for this assessment item. </p>');
				console.log(result);
				}
        });
};

//Calls gradebookServer.js API to update an assessment item.
function updateAssessmentItem(connInfo, sectionid, kind, itemnumber, itemdescription, basepointspossible, assigneddate, duedate, revealdate, curve, newnumber) {
        var urlParams = $.extend({}, connInfo, {sectionid:sectionid, kind:kind, itemnumber:itemnumber, itemdescription:itemdescription, basepointspossible:basepointspossible, assigneddate:assigneddate, duedate:duedate, revealdate:revealdate, curve:curve, newnumber:newnumber});
        $.ajax('assessmentItemsMod', {
		        data: urlParams,
				success: function(result) {},
				error: function(result) {
					showAlert('<p>Error while updating assessment kind</p>');
				console.log(result);
				}
		});
};

//Calls gradebookServer.js API to add a submission.
function addSubmission(connInfo, studentid, sectionid, kind, itemnumber, basepointsearned, extracreditearned, penalty, submissiondate, notes) {
        var urlParams = $.extend({}, connInfo, {studentid:studentid, sectionid:sectionid, kind:kind, itemnumber:itemnumber, basepointsearned:basepointsearned, extracreditearned:extracreditearned, penalty:penalty, submissiondate:submissiondate, notes:notes});
        $.ajax('submissionsAdd', {
		        data: urlParams,
		        success: function(result) {},
		        error: function(result) {
				    showAlert('<p>Error while adding submission</p>');
				console.log(result);
				}
		});
};

//Calls gradebookServer.js API to update a submission
function updateSubmission(connInfo, studentid, sectionid, kind, itemnumber, basepointsearned, extracreditearned, penalty, submissiondate, notes) {
        var urlParams = $.extend({}, connInfo, {studentid:studentid, sectionid:sectionid, kind:kind, itemnumber:itemnumber, basepointsearned:basepointsearned, extracreditearned:extracreditearned, penalty:penalty, submissiondate:submissiondate, notes:notes});
        $.ajax('submissionsMod', {
		        data: urlParams,
				success: function(result) {},
				error: function(result) {
					showAlert('<p>Error while updating submission</p>');
				console.log(result);
				}
		});
};

//Populates grade tiers
function popGradeTiers(connInfo, sectionid){
		var urlParams = $.extend({}, connInfo, {sectionid:sectionid});
		$.ajax('gradeTiersGet', {
		dataType: 'json',
        data: urlParams,
		success: function(result) {
			var gradeTiers = '<h3 align=\"center\"> Grade Tiers </h3><br\>';
			gradeTiers += '<table style=\"font-family: Georgia, serif\">';
			gradeTiers += '<tr style=\"font-weight:bold\">';
			if(dbInfo.role=="instructor"){
			gradeTiers += '<th></th>';}
			else{}
			gradeTiers += '<th style=\"border: 1px solid black\">' + 'Letter Grade' + '</td>';
			gradeTiers += '<th style=\"border: 1px solid black\">' + 'Range' + '</td>';
			gradeTiers += '</tr>';
			var letterArray = ['A+','A','A-','B+','B','B-','C+','C','C-','D+','D','D-','F','W'];
			for (var i = 0; i < result.gradeTiers.length; i++) {
				for (var j = 0; j < letterArray.length; j++) {
				    if (result.gradeTiers[i].letter == letterArray[j]){
						letterArray.splice(letterArray.indexOf(letterArray[j]), 1);
					}
					else{}
				}
				gradeTiers += '<tr>';
				if(dbInfo.role=="instructor"){
				gradeTiers += '<td width=\"280\"><a id=\"' + result.gradeTiers[i].letter + '\" class=\"waves-effect waves-light btn edit\">Edit</a>';
				gradeTiers += '<a id=\"remove' + result.gradeTiers[i].letter + '\" class=\"waves-effect waves-light btn remove\">Remove</a>';
				gradeTiers += '<a id=\"cancel' + result.gradeTiers[i].letter + '\" class=\"waves-effect waves-light btn cancel ' + result.gradeTiers[i].letter + '\" style=\"display:none\">Cancel</a>';
				gradeTiers += '<a id=\"submit' + result.gradeTiers[i].letter + '\" class=\"waves-effect waves-light btn submit ' + result.gradeTiers[i].letter + '\" style=\"display:none\">Submit</a></td>';}
				else{}
				gradeTiers += '<td style=\"border: 1px solid black\"><span id=\"letter' + result.gradeTiers[i].letter + '\">' + result.gradeTiers[i].letter + '</span>';
				gradeTiers += '<div class=\"input-field col s12 m6 13\">';
				gradeTiers += '<select id=\"newletter' + result.gradeTiers[i].letter + '\" style=\"display:none\">';//</select></td>';
				gradeTiers += '<option value=\"' + result.gradeTiers[i].letter + '\" disabled=\"true\" selected=\"true\"></option>';
				gradeTiers += '<td style=\"border: 1px solid black\"><span id=\"range' + result.gradeTiers[i].letter + '\">' + result.gradeTiers[i].lowpercentage + ' - ' + result.gradeTiers[i].highpercentage + '</span>';
				gradeTiers += '<div class=\"input-field inline\">';
				gradeTiers += '<input id=\"newlowpercentage' + result.gradeTiers[i].letter + '\" type=\"number\" step=\"0.01\" max=\"999.99\" data-length=\"6\" style=\"display:none;width:100px;text-align:center\" value=\"' + result.gradeTiers[i].lowpercentage + '\">';
				gradeTiers += '<label class="active" for=\"newlowpercentage' + result.gradeTiers[i].letter + '\"></label>' + '<span class="helper-text" data-error="wrong" data-success="right"> </span>';
				gradeTiers += '<span id=\"rangehyphen' + result.gradeTiers[i].letter + '\" style=\"display:none\">' + ' - ' + '</span>';
				gradeTiers += '<div class=\"input-field inline\">';
				gradeTiers += '<input id=\"newhighpercentage' + result.gradeTiers[i].letter + '\" type=\"number\" step=\"0.01\" max=\"999.99\" data-length=\"6\" style=\"display:none;width:100px;text-align:center\" value=\"' + result.gradeTiers[i].highpercentage + '\">';
				gradeTiers += '<label class="active" for=\"newhighpercentage' + result.gradeTiers[i].letter + '\"></label>' + '<span class="helper-text" data-error="wrong" data-success="right"> </span> </td>';
				gradeTiers += '</tr>';
			}
			gradeTiers += '</table>';
			setGradeTiers(gradeTiers);

			var gradeTierDropdown = '';
			for (var k = 0; k < letterArray.length; k++){
				gradeTierDropdown += '<option value=\"' + letterArray[k] + '\">' + letterArray[k] + '</option>';
			}
			setRowGradeTierDropdown(gradeTierDropdown, result);

			setGradeTierDropdown(gradeTierDropdown);
		},
		error: function(result) {
			showAlert('<p>Error while retrieving grade tiers</p>');
			console.log(result);
		}
	});
}

//Populates grade tier dropdown
function popGradeTierDropdown(connInfo, sectionid){
	var urlParams = $.extend({}, connInfo, {sectionid:sectionid});
	$.ajax('gradeTiersGet',{
		dataType: 'json',
		data: urlParams,
		success: function(result) {
			var gradeTiers = '';
			for (var i = 0; i < result.gradeTiers.length; i++) {
				gradeTiers += '<option value="' + result.gradeTiers[i].letter + '">' +
				 result.gradeTiers[i].letter + '</option>';
			}
			setGradeTierDropdownToCopy(gradeTiers);
		},
		error: function(result) {
			showAlert('<p>Error while retrieving grade tiers</p>');
			console.log(result);
		}
	});
}

//Already present from Gradebook https://github.com/DASSL/Gradebook
//Not included in our scope
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
			setYears(years);
		},
		error: function(result) {
			showAlert('<p>Error while retrieving years</p>');
			console.log(result);
		}
	});
};

//Already present from Gradebook https://github.com/DASSL/Gradebook
//Not included in our scope
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
			setSeasons(seasons);
		},
		error: function(result) {
			showAlert('<p>Error while retrieving seasons</p>');
			console.log(result);
		}
	});
};

//Already present from Gradebook https://github.com/DASSL/Gradebook
//Not included in our scope
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
			setCourses(courses);
		},
		error: function(result) {
			showAlert('<p>Error while retrieving courses</p>');
			console.log(result);
		}
	});
};

//Populates sections dropdown
function popSections(connInfo, year, seasonorder){//, coursenumber) {
	var urlParams = $.extend({}, connInfo, {year:year, seasonorder:seasonorder});//, coursenumber:coursenumber}); //Our implementation scope does not include courses, but we have left these here for integration into the full Gradebook app.
	$.ajax('sections', {
		dataType: 'json',
		data: urlParams,
		success: function(result) {
			var sections = '';
			for (var i = 0; i < result.sections.length; i++) {
				sections += '<option value="' + result.sections[i].sectionid +
				 '">' + result.sections[i].sectionnumber + '</option>';
			}
			setSections(sections);
		},
		error: function(result) {
			showAlert('<p>Error while retrieving sections</p>');
			console.log(result);
		}
	});
};

//Populates sections dropdown for copying assessment kinds
function popSectionsForCopy(connInfo, year, seasonorder){//, coursenumber) {
	var urlParams = $.extend({}, connInfo, {year:year, seasonorder:seasonorder});//, coursenumber:coursenumber}); //Our implementation scope does not include courses, but we have left these here for integration into the full Gradebook app.
	$.ajax('sections', {
		dataType: 'json',
		data: urlParams,
		success: function(result) {
			var sections = '';
			for (var i = 0; i < result.sections.length; i++) {
				if (result.sections[i].sectionid != $('#sectionSelectGrades').val()){
				sections += '<option value="' + result.sections[i].sectionid +
				'">' + result.sections[i].sectionnumber + '</option>';}
				else{}
			}
			setSectionsCopyTo(sections);
		},
		error: function(result) {
			showAlert('<p>Error while retrieving sections</p>');
			console.log(result);
		}
	});
};

//Populates section overview tables
function popSectionOverview(connInfo, sectionid)	{
	var urlParams = $.extend({}, connInfo, {sectionid:sectionid});
	$.ajax('assessmentKindsGet', {
		dataType: 'json',
		data: urlParams,
		success: function(result) {
			var sectionOverview = '<h3 align=\"center\">Assessment Kinds</h3>';
			sectionOverview += '<table style=\"font-family: Georgia, serif>';
			sectionOverview += '<tr style=\"font-weight:bold\">';
			if(dbInfo.role=="instructor"){
				sectionOverview += '<th></th>';
			}
			else{}
			sectionOverview += '<th style=\"border: 1px solid black\">' + 'Name' + '</th>';
			sectionOverview += '<th style=\"border: 1px solid black\">' + 'Description' + '</th>';
			sectionOverview += '<th style=\"border: 1px solid black\">' + 'Weightage' + '</th>';
			sectionOverview += '</tr>';
			for (var i = 0; i < result.assessmentKinds.length; i++) {
				sectionOverview += '<tr>';
				if(dbInfo.role=="instructor"){
				sectionOverview += '<td width=\"270\"><a id=\"' + result.assessmentKinds[i].name + '\" class=\"waves-effect waves-light btn edit\">Edit</a>';
				sectionOverview += '<a id=\"remove' + result.assessmentKinds[i].name + '\" class=\"waves-effect waves-light btn remove ' + result.assessmentKinds[i].name + '\">Remove</a>';
				sectionOverview += '<a id=\"cancel' + result.assessmentKinds[i].name + '\" class=\"waves-effect waves-light btn cancel ' + result.assessmentKinds[i].name + '\" style=\"display:none\">Cancel</a>';
				sectionOverview += '<a id=\"submit' + result.assessmentKinds[i].name + '\" class=\"waves-effect waves-light btn submit ' + result.assessmentKinds[i].name + '\" style=\"display:none\">Submit</a></td>';}
				else{}
				sectionOverview += '<td style=\"border: 1px solid black\"><span id=\"name' + result.assessmentKinds[i].name + '\">' + result.assessmentKinds[i].name + '</span>';
				sectionOverview += '<input id=\"newname' + result.assessmentKinds[i].name + '\" class=\"field validate\" type=\"text\" maxlength=\"20\" style=\"display:none\" value=\"' + result.assessmentKinds[i].name + '\">';
				sectionOverview += '<label class="active" for=\"newname' + result.assessmentKinds[i].name + '\"></label>' + '<span class="helper-text" data-error="wrong" data-success="right"> </span> </td>';
				sectionOverview += '<td style=\"border: 1px solid black\"><span id=\"description' + result.assessmentKinds[i].name + '\">' + result.assessmentKinds[i].description + '</span>';
				sectionOverview += '<input id=\"newdescription' + result.assessmentKinds[i].name + '\" class=\"field validate\" type=\"text\" maxlength=\"100\" style=\"display:none\" value=\"' + result.assessmentKinds[i].description + '\">';
				sectionOverview += '<label class="active" for=\"newdescription' + result.assessmentKinds[i].name + '\"></label>' + '<span class="helper-text" data-error="wrong" data-success="right"> </span> </td>';
				sectionOverview += '<td style=\"border: 1px solid black\"><span id=\"weightage' + result.assessmentKinds[i].name + '\">' + result.assessmentKinds[i].weightage + '</span>';
				sectionOverview += '<input id=\"newweightage' + result.assessmentKinds[i].name + '\" class=\"validate\" type=\"number\" step=\"0.01\" style=\"display:none\" value=\"' + result.assessmentKinds[i].weightage + '\">';
				sectionOverview += '<label class="active" for=\"newweightage' + result.assessmentKinds[i].name + '\"></label>' + '<span class="helper-text" data-error="wrong" data-success="right"> </span> </td>';
				sectionOverview += '</tr>';
			}
		    sectionOverview += '</table>';
			setSectionOverview(sectionOverview);
		},
		error: function(result) {
			showAlert('<p>Error while retrieving section data</p>');

			setSectionOverview(null);
			console.log(result);
		}
	});
};

//Already present from Gradebook https://github.com/DASSL/Gradebook
//Not included in our scope
function popAttendance(connInfo, sectionid) {
	var urlParams = $.extend({}, connInfo, {sectionid:sectionid});
	$.ajax('attendance', {
		dataType: 'html',
		data: urlParams,
		success: function(result) {
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

//Populates assessment kinds dropdown
function popAssessmentKinds(connInfo, sectionid){
		var urlParams = $.extend({}, connInfo, {sectionid:sectionid});
	$.ajax('assessmentKindsGet', {
		dataType: 'json',
		data: urlParams,
		success: function(result) {
			var assessmentKinds = '';
			for (var i = 0; i < result.assessmentKinds.length; i++) {
				assessmentKinds += '<option value="' +
				result.assessmentKinds[i].name +'">' + result.assessmentKinds[i].name + '</option>';
			}
			setAssessmentKinds(assessmentKinds);
		},
		error: function(result) {
			showAlert('<p>Error while retrieving assessment kinds</p>');
		console.log(result);
		}
	});
};

//Populates assessment kind overview tables
function popAssessmentKindOverview(connInfo, sectionid, assessmentKind){
	var urlParams = $.extend({}, connInfo, {sectionid:sectionid}, {kind:assessmentKind});
	$.ajax('assessmentItemsGet', {
		dataType: 'json',
		data: urlParams,
		success: function(result) {
			var assessmentKindOverview = '<h3 align=\"center\">Assessment Items</h3>';
			assessmentKindOverview += '<table style=\"font-family: Georgia, serif\">';
			assessmentKindOverview += '<tr style=\"font-weight:bold\">';
			if(dbInfo.role=="instructor"){
			assessmentKindOverview += '<th></th>';}
			else{}
			assessmentKindOverview += '<th style=\"border: 1px solid black\">' + 'Kind' + '</th>';
			assessmentKindOverview += '<th style=\"border: 1px solid black\">' + 'Number' + '</th>';
			assessmentKindOverview += '<th style=\"border: 1px solid black\">' + 'Description' + '</th>';
			assessmentKindOverview += '<th style=\"border: 1px solid black\">' + 'Base Points' + '</th>';
			assessmentKindOverview += '<th style=\"border: 1px solid black\">' + 'Date Assigned' + '</th>';
			assessmentKindOverview += '<th style=\"border: 1px solid black\">' + 'Due Date' + '</th>';
			assessmentKindOverview += '<th style=\"border: 1px solid black\">' + 'Reveal Date' + '</th>';
			assessmentKindOverview += '<th style=\"border: 1px solid black\">' + 'Curve' + '</th>';
			assessmentKindOverview += '</tr>';
			for (var i = 0; i < result.assessmentItems.length; i++) {
				assessmentKindOverview += '<tr>';
				if(dbInfo.role=="instructor"){
				assessmentKindOverview += '<td><a id=\"' + result.assessmentItems[i].Number + '\" class=\"waves-effect waves-light btn edit\">Edit</a>';
				assessmentKindOverview += '<a id=\"remove' + result.assessmentItems[i].Number + '\" class=\"waves-effect waves-light btn remove ' + result.assessmentItems[i].Number + '\">Remove</a>';
				assessmentKindOverview += '<a id=\"cancel' + result.assessmentItems[i].Number + '\" class=\"waves-effect waves-light btn cancel ' + result.assessmentItems[i].Number + '\" style=\"display:none\">Cancel</a>';
				assessmentKindOverview += '<a id=\"submit' + result.assessmentItems[i].Number + '\" type=\"submit\" class=\"waves-effect waves-light btn submit ' + result.assessmentItems[i].Number + '\" style=\"display:none\">Submit</a></td>';}
				else{}
				assessmentKindOverview += '<td style=\"border: 1px solid black\">' + result.assessmentItems[i].Kind + '</td>';
				assessmentKindOverview += '<td style=\"border: 1px solid black\"><span id=\"number' + result.assessmentItems[i].Number + '\">' + result.assessmentItems[i].Number + '</span>';
				assessmentKindOverview += '<input id=\"newnumber' + result.assessmentItems[i].Number + '\" class = \"validate\" type=\"number\" style=\"display:none\" value=\"' + result.assessmentItems[i].Number + '\">';
				assessmentKindOverview += '<label class="active" for=\"newnumber' + result.assessmentItems[i].Number + '\"></label>' + '<span class="helper-text" data-error="wrong" data-success="right"> </span> </td>';
				assessmentKindOverview += '<td style=\"border: 1px solid black\"><span id=\"description' + result.assessmentItems[i].Number + '\">' + result.assessmentItems[i].Description + '</span>';
				assessmentKindOverview += '<input id=\"newdescription' + result.assessmentItems[i].Number + '\" class = \"validate\" maxlength=\"100\" type=\"text\" style=\"display:none\" value=\"' + result.assessmentItems[i].Description + '\">';
				assessmentKindOverview += '<label class="active" for=\"newdescription' + result.assessmentItems[i].Number + '\"></label>' + '<span class="helper-text" data-error="wrong" data-success="right"> </span> </td>';
				assessmentKindOverview += '<td style=\"border: 1px solid black\"><span id=\"basepointspossible' + result.assessmentItems[i].Number + '\">' + result.assessmentItems[i].BasePointsPossible + '</span>';
				assessmentKindOverview += '<input id=\"newbasepointspossible' + result.assessmentItems[i].Number + '\" class = \"validate\" type=\"number\" step=\"0.01\" style=\"display:none\" value=\"' + result.assessmentItems[i].BasePointsPossible + '\">';
				assessmentKindOverview += '<label class="active" for=\"newbasepointspossible' + result.assessmentItems[i].Number + '\"></label>' + '<span class="helper-text" data-error="wrong" data-success="right"> </span> </td>';
				assessmentKindOverview += '<td style=\"border: 1px solid black\"><span id=\"assigneddate' + result.assessmentItems[i].Number + '\">' + result.assessmentItems[i].AssignedDate.substring(0,10) + '</span>';
				assessmentKindOverview += '<input id=\"newassigneddate' + result.assessmentItems[i].Number + '\" class = \"validate\" type=\"date\" style=\"display:none\" value=\"' + result.assessmentItems[i].AssignedDate.substring(0,10) + '\">';
				assessmentKindOverview += '<label class="active" for=\"newassigneddate' + result.assessmentItems[i].Number + '\"></label>' + '<span class="helper-text" data-error="wrong" data-success="right"> </span> </td>';
				assessmentKindOverview += '<td style=\"border: 1px solid black\"><span id=\"duedate' + result.assessmentItems[i].Number + '\">' + result.assessmentItems[i].DueDate.substring(0,10) + '</span>';
				assessmentKindOverview += '<input id=\"newduedate' + result.assessmentItems[i].Number + '\" class = \"validate\" type=\"date\" style=\"display:none\" value=\"' + result.assessmentItems[i].DueDate.substring(0,10) + '\">';
				assessmentKindOverview += '<label class="active" for=\"newduedate' + result.assessmentItems[i].Number + '\"></label>' + '<span class="helper-text" data-error="wrong" data-success="right"> </span> </td>';
				assessmentKindOverview += '<td style=\"border: 1px solid black\"><span id=\"revealdate' + result.assessmentItems[i].Number + '\">' + result.assessmentItems[i].RevealDate.substring(0,10) + '</span>';
				assessmentKindOverview += '<input id=\"newrevealdate' + result.assessmentItems[i].Number + '\" class = \"validate\" type=\"date\" style=\"display:none\" value=\"' + result.assessmentItems[i].RevealDate.substring(0,10) + '\">';
				assessmentKindOverview += '<label class="active" for=\"newrevealdate' + result.assessmentItems[i].Number + '\"></label>' + '<span class="helper-text" data-error="wrong" data-success="right"> </span> </td>';
				assessmentKindOverview += '<td style=\"border: 1px solid black\"><span id=\"curve' + result.assessmentItems[i].Number + '\">' + result.assessmentItems[i].Curve + '</span>';
				assessmentKindOverview += '<input id=\"newcurve' + result.assessmentItems[i].Number + '\" class = \"validate\" type=\"number\" step=\"0.01\" style=\"display:none\" value=\"' + result.assessmentItems[i].Curve + '\">';
				assessmentKindOverview += '<label class="active" for=\"newcurve' + result.assessmentItems[i].Number + '\"></label>' + '<span class="helper-text" data-error="wrong" data-success="right"> </span> </td>';
				assessmentKindOverview += '</tr>';
			}
		    assessmentKindOverview += '</table>';
			assessmentKindOverview += '<div class="divider"></div>';
			assessmentKindOverview += '<br />';
			setAssessmentKindOverview(assessmentKindOverview);
		},
		error: function(result) {
			showAlert('<p>Error while retrieving assessment Item data</p>');

			setAssessmentKindOverview(null);
			console.log(result);
		}
	});
	//Populates student averages table
	if(dbInfo.role=="instructor"){
	$.ajax('submissionsKindsInstructor', {
	dataType: 'json',
		data: urlParams,
		success: function(result) {
			var assessmentKindAvg = '<h3 align=\"center\">Enrollee Averages</h3>';
			assessmentKindAvg += '<table style=\"font-family: Georgia, serif\">';
			assessmentKindAvg += '<tr style=\"font-weight:bold\">';
			assessmentKindAvg += '<th style=\"border: 1px solid black\">' + 'Enrollee' + '</th>';
			assessmentKindAvg += '<th style=\"border: 1px solid black\">' + 'Average' + '</th>';
			assessmentKindAvg += '</tr>';
			for (var i = 0; i < result.submissions.length; i++) {
				assessmentKindAvg += '<tr>';
				assessmentKindAvg += '<td style=\"border: 1px solid black\">' + result.submissions[i].Enrollee + '</td>';
				assessmentKindAvg += '<td style=\"border: 1px solid black\">' + result.submissions[i].Grade + '</td>';
				assessmentKindAvg += '</tr>';
			}
		    assessmentKindAvg += '</table>';
			setAssessmentKindAvg(assessmentKindAvg);
		},
		error: function(result) {
			showAlert('<p>Error while retrieving student averages data</p>');

			setAssessmentKindAvg(null);
			console.log(result);
		}
	});
	}
	else{
	}
};

//Populates student scores table
function popStudentScores(connInfo,sectionid,assessmentKind){
	var urlParams = $.extend({}, connInfo, {sectionid:sectionid}, {kind:assessmentKind});
	$.ajax('submissionsItemsEnrollee', {
		dataType: 'json',
		data: urlParams,
		success: function(result) {
			var submissions = '<h3 align=\"center\">Submissions</h3>';
			submissions += "<table style=\"font-family: Georgia, serif\">";
			submissions += '<tr style=\"font-weight:bold\">';
			submissions += '<th style=\"border: 1px solid black\">' + 'Assessment' + '</th>';
			submissions += '<th style=\"border: 1px solid black\">' + 'Base Points Earned' + '</th>';
			submissions += '<th style=\"border: 1px solid black\">' + 'Extra Credit Earned' + '</th>';
			submissions += '<th style=\"border: 1px solid black\">' + 'Penalty' + '</th>';
			submissions += '<th style=\"border: 1px solid black\">' + 'Percentage' + '</th>';
			submissions += '<th style=\"border: 1px solid black\">' + 'Letter' + '</th>';
			submissions += '<th style=\"border: 1px solid black\">' + 'Submission Date' + '</th>';
			submissions += '<th style=\"border: 1px solid black\">' + 'Notes' + '</th>';
			submissions += '</tr>';
			for (var i = 0; i < result.submissions.length; i++) {
				submissions += '<td style=\"border: 1px solid black\">' + result.submissions[i].Name + '</td>';
				submissions += '<td style=\"border: 1px solid black\">' + result.submissions[i].BasePointsEarned + '</td>';
				submissions += '<td style=\"border: 1px solid black\">' + result.submissions[i].ExtraCreditEarned + '</td>';
				submissions += '<td style=\"border: 1px solid black\">' + result.submissions[i].Penalty + '</td>';
				submissions += '<td style=\"border: 1px solid black\">' + result.submissions[i].CurvedGradePercent + '</td>';
				submissions += '<td style=\"border: 1px solid black\">' + result.submissions[i].CurvedGradeLetter + '</td>';
				submissions += '<td style=\"border: 1px solid black\">' + result.submissions[i].SubmissionDate.substring(0,10) + '</td>';
				submissions += '<td style=\"border: 1px solid black\">' + result.submissions[i].Notes + '</td>';
				submissions += '</tr>';
			}
		    submissions += '</table>';
			setStudentScores(submissions);
		},
		error: function(result) {
			showAlert('<p>Error while retrieving submission data</p>');

			setSubmissions(null);
			console.log(result);
		}
	});
};

//Populates assessment items dropdown
function popAssessmentItems(connInfo, sectionid, assessmentKind){
	var urlParams = $.extend({}, connInfo, {sectionid:sectionid}, {kind:assessmentKind});
	$.ajax('assessmentItemsGet', {
		dataType: 'json',
		data: urlParams,
		success: function(result) {
			var assessmentItems = '';
			for (var i = 0; i < result.assessmentItems.length; i++) {
				assessmentItems += '<option value="' + result.assessmentItems[i].Number + '">' +
				result.assessmentItems[i].Kind + ' ' + result.assessmentItems[i].Number +'</option>';
			}
			setAssessmentItems(assessmentItems);
		},
		error: function(result) {
			showAlert('<p>Error while retrieving assessment items</p>');
			console.log(result);
		}
	});
};

//Populates submissions table
function popSubmissions(connInfo, sectionid, assessmentKind, assessmentItem) {
	if (dbInfo.role == "instructor") {
		var urlParams = $.extend({}, connInfo, {sectionid:sectionid}, {kind:assessmentKind}, {itemnumber:assessmentItem});
		$.ajax('submissionsItemsInstructor', {
			dataType: 'json',
			data: urlParams,
			success: function(result) {
				var submissions = '<h3 align=\"center\">Submissions</h3>';
				submissions += "<table style=\"font-family: Georgia, serif\">";
				submissions += '<tr style=\"font-weight:bold\">';
				submissions += '<th></th>';
				submissions += '<th style=\"border: 1px solid black\">' + 'ID' + '</th>';
				submissions += '<th style=\"border: 1px solid black\">' + 'Enrollee' + '</th>';
				submissions += '<th style=\"border: 1px solid black\">' + 'Assessment' + '</th>';
				submissions += '<th style=\"border: 1px solid black\">' + 'Base Points Earned' + '</th>';
				submissions += '<th style=\"border: 1px solid black\">' + 'Extra Credit Earned' + '</th>';
				submissions += '<th style=\"border: 1px solid black\">' + 'Penalty' + '</th>';
				submissions += '<th style=\"border: 1px solid black\">' + 'Grade' + '</th>';
				submissions += '<th style=\"border: 1px solid black\">' + 'Submission Date' + '</th>';
				submissions += '<th style=\"border: 1px solid black\">' + 'Notes' + '</th>';
				submissions += '</tr>';
				for (var i = 0; i < result.submissions.length; i++) {
					submissions += '<td> <a id=\"student' + result.submissions[i].Student + '\" class=\"waves-effect waves-light btn edit\">Edit</a>';
					submissions += '<a id=\"cancelstudent' + result.submissions[i].Student + '\" class=\"waves-effect waves-light btn cancel\" style=\"display:none\">Cancel</a>';
					submissions += '<a id=\"submitstudent' + result.submissions[i].Student + '\" type=\"submit\" class=\"waves-effect waves-light btn submit\" style=\"display:none\">Submit</a></td>';
					submissions += '<td style=\"border: 1px solid black\">' + result.submissions[i].Student + '</td>';
					submissions += '<td style=\"border: 1px solid black\">' + result.submissions[i].Enrollee + '</td>';
					submissions += '<td style=\"border: 1px solid black\">' + result.submissions[i].Kind + ' ' + result.submissions[i].Number + '</td>';
					submissions += '<td style=\"border: 1px solid black\"><span id=\"basepointsearnedstudent' + result.submissions[i].Student + '\">' + result.submissions[i].BasePointsEarned + '</span>';
					submissions += '<input id=\"newbasepointsearnedstudent' + result.submissions[i].Student + '\" class=\"validate\" type=\"number\" step=\"0.01\" style=\"display:none\" value=\"' + result.submissions[i].BasePointsEarned + '\"></td>';
					submissions += '<td style=\"border: 1px solid black\"><span id=\"extracreditearnedstudent' + result.submissions[i].Student + '\">' + result.submissions[i].ExtraCreditEarned + '</span>';
					submissions += '<input id=\"newextracreditearnedstudent' + result.submissions[i].Student + '\" class=\"validate\" type=\"number\" step=\"0.01\" style=\"display:none\" value=\"' + result.submissions[i].ExtraCreditEarned + '\"></td>';
					submissions += '<td style=\"border: 1px solid black\"><span id=\"penaltystudent' + result.submissions[i].Student + '\">' + result.submissions[i].Penalty + '</span>';
					submissions += '<input id=\"newpenaltystudent' + result.submissions[i].Student + '\" class=\"validate\" type=\"number\" step=\"0.01\" style=\"display:none\" value=\"' + result.submissions[i].Penalty + '\"></td>';
					submissions += '<td style=\"border: 1px solid black\">' + result.submissions[i].Grade + '</td>';
					submissions += '<td style=\"border: 1px solid black\"><span id=\"submissiondatestudent' + result.submissions[i].Student + '\">' + result.submissions[i].SubmissionDate.substring(0,10) + '</span>';
					submissions += '<input id=\"newsubmissiondatestudent' + result.submissions[i].Student + '\" class=\"validate\" type=\"date\" style=\"display:none\" value=\"' + result.submissions[i].SubmissionDate.substring(0,10) + '\"></td>';
					submissions += '<td style=\"border: 1px solid black\"><span id=\"notesstudent' + result.submissions[i].Student + '\">' + result.submissions[i].Notes + '</span>';
					submissions += '<input id=\"newnotesstudent' + result.submissions[i].Student + '\" class=\"validate\" type=\"text\" style=\"display:none\" value=\"' + result.submissions[i].Notes + '\"></td>';
					submissions += '</tr>';
				}
			    submissions += '</table>';
				setSubmissions(submissions);
			},
			error: function(result) {
				showAlert('<p>Error while retrieving submission data</p>');

				setSubmissions(null);
				console.log(result);
			}
		});
		//Populates enrollees table
		$.ajax('getEnrollees', {
			dataType: 'json',
			data: urlParams,
			success: function(result) {
				var enrollees = '<h3 align=\"center\">Enrollees</h3>';
			    enrollees += '<table style=\"font-family: Georgia, serif\">';
				enrollees += '<tr style=\"font-weight:bold\">';
				enrollees += '<th style=\"border: 1px solid black\">' + 'ID' + '</th>';
				enrollees += '<th style=\"border: 1px solid black\">' + 'Enrollee' + '</th>';
				enrollees += '</tr>';
				for (var j = 0; j < result.enrollees.length; j++) {
					enrollees += '<tr>';
				    enrollees += '<td style=\"border: 1px solid black\">' + result.enrollees[j].Id + '</td>';
					enrollees += '<td style=\"border: 1px solid black\">' + result.enrollees[j].Enrollee + '</td>';
					enrollees += '</tr>';
				}
				enrollees += '</table>';
				setEnrollees(enrollees);
			},
			error: function(result) {
			    showAlert('<p>Error while retrieving enrollee data</p>');

			    setEnrollees(null);
			    console.log(result);
			}
		});
	}
	else {}
};


//Already present from Gradebook https://github.com/DASSL/Gradebook
//Not included in our scope
function setYears(htmlText) {
	var content = '<option value="" disabled="true" selected="true">' +
	 'Choose year</option>' + htmlText;
	$('#yearSelect').html(content);
	$('#yearSelect').prop('disabled', htmlText == null);
	$('#yearSelect').material_select(); //reload dropdown

	setSeasons(null); //reset dependent fields
};
//Already present from Gradebook https://github.com/DASSL/Gradebook
//Not included in our scope
function setSeasons(htmlText) {
	var content = '<option value="" disabled="true" selected="true">' +
	 'Choose season</option>' + htmlText;
	$('#seasonSelect').html(content);
	$('#seasonSelect').prop('disabled', htmlText == null);
	$('#seasonSelect').material_select(); //reload dropdown

	setCourses(null); //reset dependent fields
};
//Already present from Gradebook https://github.com/DASSL/Gradebook
//Not included in our scope
function setCourses(htmlText) {
	var content = '<option value="" disabled="true" selected="true">' +
	 'Choose course</option>' + htmlText;
	$('#courseSelect').html(content);
	$('#courseSelect').prop('disabled', htmlText == null);
	$('#courseSelect').material_select(); //reload dropdown

	setSections(null); //reset dependent fields
};

//Sets sections dropdown
function setSections(htmlText) {
	var content = '<option value="" disabled="true" selected="true">' +
	 'Choose section</option>' + htmlText;
	$('#sectionSelectGrades').html(content);
	$('#sectionSelectGrades').prop('disabled', htmlText == null);
	$('#sectionSelectGrades').material_select(); //reload dropdown
	//setAttendance(null);												// Our implementation does not include the setting of attendance, but for purposes of reintegration with the Gradebook app this has been left in.
	setSectionOverview(null); //reset dependent fields
	setAssessmentKinds(null); //reset dependent fields
};

//Sets section select dropdowns for the copy functions
function setSectionsCopyTo(htmlText){
	var content = '<option value="" disabled="true" selected="true">' +
	 'Choose destination section</option>' + htmlText;
	$('#sectionSelectCopyToAK').html(content);
	$('#sectionSelectCopyToAK').prop('disabled', htmlText == null);
	$('#sectionSelectCopyToAK').material_select(); //reload dropdown
	$('#sectionSelectCopyToGT').html(content);
	$('#sectionSelectCopyToGT').prop('disabled', htmlText == null);
	$('#sectionSelectCopyToGT').material_select(); //reload dropdown
};

//Sets assessment kind dropdowns
function setAssessmentKinds(htmlText) {
	var content = '<option value="" disabled="true" selected="true">' +
	 'Choose assessment kind</option>' + htmlText;
	$('#assessmentKindSelect').html(content);
	$('#assessmentKindSelect').prop('disabled', htmlText == null);
	$('#assessmentKindSelect').material_select(); //reload dropdown

	$('#assessmentKindSelectScores').html(content);
	$('#assessmentKindSelectScores').prop('disabled', htmlText == null);
	$('#assessmentKindSelectScores').material_select(); //reload dropdown

	$('#selectAssessmentKindToCopy').html(content);
	$('#selectAssessmentKindToCopy').prop('disabled', htmlText == null);
	$('#selectAssessmentKindToCopy').material_select(); //reload dropdown

	setAssessmentItems(null); //reset dependent fields
	setAssessmentKindOverview(null); //reset dependent fields
};


//Sets assessment item dropdown
function setAssessmentItems(htmlText) {
	var content = '<option value="" disabled="true" selected="true">' +
	 'Choose assessment item</option>' + htmlText;
	$('#assessmentItemSelect').html(content);
	$('#assessmentItemSelect').prop('disabled', htmlText == null);
	$('#assessmentItemSelect').material_select(); //reload dropdown
	setSubmissions(null);  //reset dependent fields
};


//Already present from Gradebook https://github.com/DASSL/Gradebook
//Not included in our scope
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


//Dynamically populates the submissionData div in index.html
function setSubmissions(htmlText) {
	$('#submissionData').html(htmlText);
};

//Dynamically populates the enrolleeData div in index.html
function setEnrollees(htmlText) {
    $('#enrolleeData').html(htmlText);
};

//Dynamically populates the sectionOverview div in index.html
function setSectionOverview(htmlText){
	$('#sectionOverview').html(htmlText);
};

//Dynamically populates the assessmentKindOverview div in index.html
function setAssessmentKindOverview(htmlText){
	$('#assessmentKindOverview').html(htmlText);
};

//Dynamically populates the assessmentKindAvg div in index.html
function setAssessmentKindAvg(htmlText){
	$('#assessmentKindAvg').html(htmlText);
};

//Dynamically populates the gradeTiersView div in index.html
function setGradeTiers(htmlText)	{
	$('#gradeTierView').html(htmlText);
};

//Dynamically populates the scoresView div in index.html
function setStudentScores(htmlText){
	$('#scoresView').html(htmlText);
};

//Dynamically populates the gradeTierLetterSelect div in index.html
function setGradeTierDropdown(htmlText) {
	var content = '<option value="" disabled="true" selected="true">' +
	 'Choose Letter</option>' + htmlText;
	$('#gradeTierLetterSelect').html(content);
	$('#gradeTierLetterSelect').prop('disabled', htmlText == null);
	$('#gradeTierLetterSelect').material_select(); //reload dropdown
};

//Dynamically populates the selectGradeTierToCopy div in index.html
function setGradeTierDropdownToCopy(htmlText){
	var content = '<option value="" disabled="true" selected="true">' +
	 'Choose Letter</option>' + htmlText;
	$('#selectGradeTierToCopy').html(content);
	$('#selectGradeTierToCopy').prop('disabled', htmlText == null);
	$('#selectGradeTierToCopy').material_select(); //reload dropdown
};

//Dyanmically populates the grade tier dropdown in each grade tier row in the gradeTierView div in index.html
function setRowGradeTierDropdown(htmlText, result){
    var content = '';
    for (var i = 0; i < result.gradeTiers.length; i++) {
		content = '<option value=\"' + result.gradeTiers[i].letter + '\" selected=\"true\">' + result.gradeTiers[i].letter + '</option>' + htmlText;
		$(document.getElementById('newletter' + result.gradeTiers[i].letter)).html(content);
		$(document.getElementById('newletter' + result.gradeTiers[i].letter)).prop('disabled', htmlText == null);
	}
};