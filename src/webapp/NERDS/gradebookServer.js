/*
NERDS

index.js - Gradebook

This script contains all the Node.js API functions that call the gradeTierMgmt.SQL functions

Based off of Gradebook: https://github.com/DASSL/Gradebook


Credit:

Zach Boylan, Zaid Bhujwala, Andrew Figueroa, Steven Rollo

Data Science & Systems Lab (DASSL), Western Connecticut State University

Copyright (c) 2017- DASSL. ALL RIGHTS RESERVED.
Licensed to others under CC 4.0 BY-NC-SA
https://creativecommons.org/licenses/by-nc-sa/4.0/

ALL ARTIFACTS PROVIDED AS IS. NO WARRANTIES EXPRESSED OR IMPLIED. USE AT YOUR OWN RISK.

Gradebook node.js web server
This program serves a Gradebook home page that allows an instructor to
view attendance based on a year, season, course, and section provided
Currently, database connection parameters must also be provided - these must
point to a database with Gradebook installed.  Additionally, the server expects
all Gradebook objects to exist in a schema called "gradebook".

A static page is served at '/', along with some js and css dependencies
Additionally, five REST calls are implemented that this pages uses to
get data from the Gradebook db
*/

//Importing necessary modules
var pg = require('pg'); //Postgres client module   | https://github.com/brianc/node-postgres
var sjcl = require('sjcl'); //Encryption module    | https://github.com/bitwiseshiftleft/sjcl
var express = require('express'); //Express module | https://github.com/expressjs/express

//Creating an app object
var app = express();

//Gradebook code:
//List of month names used when generating the attendance table
const monthNames = [
   'Jan.',
   'Feb.',
   'Mar.',
   'Apr.',
   'May',
   'Jun.',
   'Jul.',
   'Aug.',
   'Sep.',
   'Oct.',
   'Nov.',
   'Dec.'
];



/*
This function creates and returns a config object for the pg module based on some
supplied parameters.
*/
//Already present from Gradebook https://github.com/DASSL/Gradebook
function createConnectionParams(user, database, password, host, port) {
   var config = {
      user: user.trim(),
      database: database.trim(),
      password: password.trim(),
      host: host.trim(),
      port: port.trim()
   };
   return config;
}

/*
This function creates a new connection to a Postgres instance using the
supplied connection params (var config), and executes queryText with queryParams.
Then, it calls queryCallback with the response recieved from the database.
This should help cut down on repeated code between the url handlers.
*/
//Already present from Gradebook https://github.com/DASSL/Gradebook
function executeQuery(response, config, queryText, queryParams, queryCallback) {
   var client = new pg.Client(config); //Connect to pg instance
   client.connect(function(err) {
      if(err) { //If a connection error happens, 500
         response.status(500).send('500 - Database connection error');
         console.log(err);
		 client.end(); //Close the connection
      }
      else { //Try and execute the query
         client.query(queryText, queryParams, function (err, result) {
            if(err) { //If the query returns an error, 500
               response.status(500).send('500 - Query execution error');
               console.log(err);
			   client.end(); //Close the connection
            }
            else { //Execute the query callback
               queryCallback(result);
               client.end(); //Close the connection
            }
         });
      }
   });
}

//Tell the browser we don't have a favicon
app.get('/favicon.ico', function (request, response) {
   response.sendFile('GBFavicon.ico', {root: __dirname});
});

//Serve our homepage when a user goes to the root
//Already present from Gradebook https://github.com/DASSL/Gradebook
app.get('/', function(request, response) {
   response.sendFile('client/index.html', {root: __dirname});
});

//Serve our homepage when a user goes to the root
//Already present from Gradebook https://github.com/DASSL/Gradebook
app.get('/index.html', function(request, response) {
   response.sendFile('client/index.html', {root: __dirname});
});

//Serve css and js dependencies
//Already present from Gradebook https://github.com/DASSL/Gradebook
app.get('/css/materialize.min.css', function(request, response) {
	response.sendFile('client/css/materialize.min.css', {root: __dirname});
});

//Already present from Gradebook https://github.com/DASSL/Gradebook
app.get('/js/materialize.min.js', function(request, response) {
	response.sendFile('client/js/materialize.min.js', {root: __dirname});
});

//Already present from Gradebook https://github.com/DASSL/Gradebook
app.get('/js/index.js', function(request, response) {
	response.sendFile('client/js/index.js', {root: __dirname});
});

//Returns instructor id and name from a provided email.
//Already present from Gradebook https://github.com/DASSL/Gradebook
app.get('/login', function(request, response) {
   //Decrypt the password recieved from the client.  This is a temporary development
   //feature, since we don't have ssl set up yet
   //var passwordText=request.query.password;
	var passwordText = request.query.password;

   //Connnection parameters for the Postgres client recieved in the request
   var config = createConnectionParams(request.query.user, request.query.database,
      passwordText, request.query.host, request.query.port);

   //Get the params from the url
   var instructorEmail = request.query.instructoremail.trim();
   //console.log("INST EMAIL:");
	//console.log(request.query.instructorEmail);
   //Set the query text
   var queryText = 'SELECT ID, FName, MName, LName, Department FROM nerds.instructor WHERE nerds.instructor.email LIKE($1);';
   var queryParams = [instructorEmail];
	var jsonReturn='';
   //Execute the query
   executeQuery(response, config, queryText, queryParams, function(result) {
      //Check if any rows are returned.  No rows implies that the provided
      //email does not match an existing instructor
      if(result.rows.length == 0) {
         //response.status(401).send('401 - Login failed');

		 var queryText='SELECT ID, FName, MName, LName, major FROM nerds.student WHERE nerds.student.email LIKE($1);'
		 var queryParams = [instructorEmail];

		 executeQuery(response, config, queryText, queryParams, function(result) {
			 if(result.rows.length == 0) {
			 response.status(401).send('401 - Login failed');
			 }
			 else{
				 jsonReturn = {
					"student": result.rows[0]

				};//console.log(result.rows[0]);
			response.send(JSON.stringify(jsonReturn));

		 }
		});
	  }
      else {
         jsonReturn = {
            "instructor": result.rows[0] //getInstructors should return at most one row
         };//console.log(result.rows[0]);
         response.send(JSON.stringify(jsonReturn));
      }
   });
});

//Return a list of years a certain instructor has taught sections
//Already present from Gradebook https://github.com/DASSL/Gradebook
//Not included in our scope
app.get('/years', function(request, response) {


   //Decrypt the password recieved from the client.  This is a temporary development
   //feature, since we don't have ssl set up yet
   //var passwordText=request.query.password;
   var passwordText = request.query.password;

   //Connnection parameters for the Postgres client recieved in the request
   var config = createConnectionParams(request.query.user, request.query.database,
      passwordText, request.query.host, request.query.port);

   //Get the params from the url
   var instructorID = request.query.userid;

   //Set the query text
   var queryText = 'SELECT Year FROM gradebook.getInstructorYears($1);';
   var queryParams = [instructorID];

   //Execute the query
   executeQuery(response, config, queryText, queryParams, function(result) {
      var years = []; //Put the rows from the query into json format
      for(row in result.rows) {
         years.push(result.rows[row].year);
      }
      var jsonReturn = {
         "years": years
      } //Send the json to the client
      response.send(JSON.stringify(jsonReturn));
   });

});

//Return a list of seasons an instructor taught in during a certain year
//Already present from Gradebook https://github.com/DASSL/Gradebook
//Not included in our scope
app.get('/seasonsGrades', function(request, response) {
   //Decrypt the password recieved from the client.  This is a temporary development
   //feature, since we don't have ssl set up yet
   var passwordText=request.query.password;

   //Connnection parameters for the Postgres client recieved in the request
   var config = createConnectionParams(request.query.user, request.query.database,
      passwordText, request.query.host, request.query.port);

   //Get the params from the url
   var instructorID = request.query.userid;
   var year = request.query.year;

   //Set the query text
   var queryText = 'SELECT SeasonOrder, SeasonName FROM gradebook.getInstructorSeasons($1, $2);';
   var queryParams = [instructorID, year];

   //Execute the query
   executeQuery(response, config, queryText, queryParams, function(result) {
      var seasons = []; //Put the rows from the query into json format
      for(row in result.rows) {
         seasons.push(
            {
               "seasonorder": result.rows[row].seasonorder,
               "seasonname": result.rows[row].seasonname
            }
         );
      }
      var jsonReturn = {
         "seasons": seasons
      } //Send the json to the client
      response.send(JSON.stringify(jsonReturn));
   });
});

//Returns a list of courses an instructor has taugh in a certain year
//Already present from Gradebook https://github.com/DASSL/Gradebook
//Not included in our scope
app.get('/courses', function(request, response) {
   //Decrypt the password recieved from the client.  This is a temporary development
   //feature, since we don't have ssl set up yet
   var passwordText=request.query.password;

   //Connnection parameters for the Postgres client recieved in the request
   var config = createConnectionParams(request.query.user, request.query.database,
      passwordText, request.query.host, request.query.port);

   var instructorID = request.query.userid;
   var year = request.query.year;
   var seasonOrder = request.query.seasonorder;

   var queryText = 'SELECT Course FROM gradebook.getInstructorCourses($1, $2, $3);';
   var queryParams = [instructorID, year, seasonOrder];

   executeQuery(response, config, queryText, queryParams, function(result) {
      var courses = [];
      for(row in result.rows) {
         courses.push(result.rows[row].course);
      }
      var jsonReturn = {
         "courses": courses
      };
      response.send(JSON.stringify(jsonReturn));
   });

});

app.get('/sections', function(request, response) {
   //Decrypt the password recieved from the client.  This is a temporary development
   //feature, since we don't have ssl set up yet
   //var passwordText=request.query.password;
	var passwordText=request.query.password;
   //Connnection parameters for the Postgres client recieved in the request
   var config = createConnectionParams(request.query.user, request.query.database,
      passwordText, request.query.host, request.query.port);

   var instructorID = request.query.userid;
   var year = request.query.year;
   var seasonOrder = request.query.seasonorder;
   //var courseNumber = request.query.coursenumber;

   var queryText = 'SELECT nerds.section.id, nerds.section.course FROM nerds.section WHERE nerds.section.instructor1=$1 OR nerds.section.instructor2=$1 OR nerds.section.instructor3=$1;'; // AND nerds.section.year=$2 AND nerds.section.season=$3 AND nerds.section=$4';
   var queryParams = [instructorID];//, year, seasonOrder, courseNumber];

   executeQuery(response, config, queryText, queryParams, function(result) {
	   //console.log("please?");
      var sections = [];
      for(row in result.rows) {
		  //console.log(result);
         sections.push(
            {
               "sectionid": result.rows[row].id,
               "sectionnumber": result.rows[row].course
            }
         );
      }
      var jsonReturn = {
         "sections": sections
      };
      response.send(JSON.stringify(jsonReturn));
   });
});

//Return a table containing the attendance for a single section
//Already present from Gradebook https://github.com/DASSL/Gradebook
//Not included in our scope
app.get('/attendance', function(request, response) {
   //Decrypt the password recieved from the client.  This is a temporary development
   //feature, since we don't have ssl set up yet
   var passwordText=request.query.password;

   //Connnection parameters for the Postgres client recieved in the request
   var config = createConnectionParams(request.query.user, request.query.database,
      passwordText, request.query.host, request.query.port);

   //Get attendance param
   var sectionID = request.query.sectionid;

   //Set the query text and package the parameters in an array
   var queryText = 'SELECT AttendanceCSVWithHeader FROM gradebook.getAttendance($1);';
   var queryParams = [sectionID];

   //Setup the second query, to get the attendance code description table
   var queryTextAttnDesc = 'SELECT Status, Description FROM gradebook.AttendanceStatus';

   //Execute the attendance description query first
   //attnStatusRes will hold the table containg the code descriptions
   executeQuery(response, config, queryTextAttnDesc, null, function(attnStatusRes) {
      //Then execute the query to get attendance data
      executeQuery(response, config, queryText, queryParams, function(result) {
         //Check if any attendance data was returned from the DB.  One header row is
         //always returned, so if the result contains only one row, then
         //no attendance data was returned
         if(result.rows.length == 1) {
            response.status(500).send('500 - No Attenance Records');
            return;
         }

         var table = '<table>';
         //Extract months from the top row of dates
         //First, split csv of dates
         var dateRow = result.rows[0].attendancecsvwithheader.split(',');
         var rowLen = dateRow.length;

         var maxMonth = 0; //Stores the lastest month found
         var months = ''; //Stores a csv of months
         var days = [dateRow[0], dateRow[1], dateRow[2]]; //Stores a csv of days

         var monthSpanWidths =[]; //Stores the span associated with each month
         var currentSpanWidth = 1; //Width of the current span

         for(i = 3; i < rowLen; i++) { //For each date in the date row
            splitDate = dateRow[i].split('-');
            if(splitDate[0] > maxMonth) { //If the month part is a new month
               maxMonth = splitDate[0];
               months += ',' + monthNames[splitDate[0] - 1]; //Add it to the csv
               if(currentSpanWidth > 0) { //Set the span width of the current month cell
                  //Also include the col. number with the span width
                  monthSpanWidths.push({'col': i, 'width': currentSpanWidth});
                  currentSpanWidth = 1;
               }
            }
            else { //If it's not a new month
               currentSpanWidth++;
            }
            days += ',' + splitDate[1]; //Add day to the day row
         }
         if(currentSpanWidth > 0) { //Add the last month span
            monthSpanWidths.push({'col': i, 'width': currentSpanWidth});
         }
         //Add the month and day rows to the csv rows
         var resultSplitDates = result.rows.slice(1);
         resultSplitDates.unshift({attendancecsvwithheader: days});
         resultSplitDates.unshift({attendancecsvwithheader: months});

         //Execute for each row in the result
         resultSplitDates.forEach(function(row) {
            //Add table row for each result row
            table += '<tr>';
            var splitRow = row.attendancecsvwithheader.split(','); //Split the csv field
            var rowLen = splitRow.length;
            var spanIndex = 0;

            for(cell = 0; cell < rowLen; cell++) { //For each cell in the current row
               var title = '';
               var style = '';
               var spanWidth = 1;
               //Correctly format student names (lname, fnmame mname)
               var cellContents = splitRow[cell];
               if(splitRow[0] == '') {
                  spanWidth = monthSpanWidths[spanIndex].width;
                  spanIndex++;
               }
               if(splitRow[0] != '' && cell == 0) {
                  cellContents = splitRow[cell] + ', ' + splitRow[cell + 1] + ' ' + splitRow[cell + 2];
                  cell += 2;
               }
               if(splitRow[0] != '' && cell > 2) {
                  //Find the matching code description
                  //the some() method allows break-like behavior using return true
                  attnStatusRes.rows.some(function(row) {
                     if(row.status == cellContents) {
                        title = row.description;
                        return true;
                     }
                  });
                  //Check if this column is the first in the month, and add a left border
                  monthSpanWidths.some(function(row) {
                     if(row.col == cell) {
                        style = 'border-left: 2px solid #e0e0e0;';
                        return true;
                     }
                  });
               }
               //Generate table row based on non-empty properties
               table += '<td' + ' colspan=' + spanWidth;
               //Only add title/style properties if they are not empty
               if(title != '') {
                  table += ' title="' + title + '"';
               }
               if(style != '') {
                  table += ' style="' + style + '"';
               }
               table +=  ' >' + cellContents + '</td>';
            }
            table += '</tr>';
         });
         table += '</table>'
         //Set the response type to html since we are sending the striaght html taable
         response.header("Content-Type", "text/html");
         response.send(table);
      });
   });
});

//Add a grade tier to a section
app.get('/gradeTiersAdd', function(request, response) {
    //Decrypt the password received from the client.
    //NOTE: We need to substitute superSecret with what we're actually implementing
    var passwordText=request.query.password;

    //Connection parameters for the Postgres client received in the request
    var config = createConnectionParams(request.query.user, request.query.database,
        passwordText, request.query.host, request.query.port);

    //Get the params from the url
    var sectionId = request.query.sectionid;
    var letterGrade = request.query.lettergrade;
    var lowPercentage = request.query.lowpercentage;
    var highPercentage = request.query.highpercentage;

    //Set the query text
    var queryText = 'SELECT nerds.addSectionGradeTier($1, $2, $3, $4);';
    var queryParams = [sectionId, letterGrade, lowPercentage, highPercentage];

    //Execute the query
    executeQuery(response, config, queryText, queryParams, function(result) {
        response.send(JSON.stringify({}));
    });
});


//Delete a grade tier from a section
app.get('/gradeTiersDelete', function(request, response) {
    //Decrypt the password received from the client.
    //NOTE: We need to substitute superSecret with what we're actually implementing
    var passwordText=request.query.password;

    //Connection parameters for the Postgres client received in the request
    var config = createConnectionParams(request.query.user, request.query.database,
        passwordText, request.query.host, request.query.port);

    //Get the params from the url
    var sectionId = request.query.sectionid;
    var letterGrade = request.query.lettergrade;

    //Set the query text
    var queryText = 'SELECT nerds.dropSectionGradeTier($1, $2);';
    var queryParams = [sectionId, letterGrade];

    //Execute the query
    executeQuery(response, config, queryText, queryParams, function(result) {
        response.send(JSON.stringify({}));
    });
});

//Return the list of grade tiers for a section
app.get('/gradeTiersGet', function(request, response) {
    //Decrypt the password received from the client.
    //NOTE: We need to substitute superSecret with what we're actually implementing
    var passwordText=request.query.password;

    //Connection parameters for the Postgres client received in the request
    var config = createConnectionParams(request.query.user, request.query.database,
        passwordText, request.query.host, request.query.port);

    //Get the params from the url
    var sectionId = request.query.sectionid;

    //Set the query text
    var queryText = 'SELECT * FROM nerds.getSectionGradeTiers($1);';
    var queryParams = [sectionId];

    //Execute the query
    executeQuery(response, config, queryText, queryParams, function(result) {
        var gradeTiers = []; //Put the rows from the query into json format
        for (row in result.rows) {
            gradeTiers.push(
                {
                    "letter": result.rows[row].letter,
                    "lowpercentage": result.rows[row].lowpercentage,
                    "highpercentage": result.rows[row].highpercentage
                }
            );
        }
        var jsonReturn = {
            "gradeTiers": gradeTiers
        } //Send the json to the client
        response.send(JSON.stringify(jsonReturn));
    });
});

//Modify a grade tier in a section
app.get('/gradeTiersMod', function(request, response) {
    //Decrypt the password received from the client.
    //NOTE: We need to substitute superSecret with what we're actually implementing
    var passwordText=request.query.password;

    //Connection parameters for the Postgres client received in the request
    var config = createConnectionParams(request.query.user, request.query.database,
        passwordText, request.query.host, request.query.port);

    //Get the query params from the url
    var sectionId = request.query.sectionid;
    var letterGrade = request.query.letter;
    var lowPercentage = request.query.lowpercentage;
    var highPercentage = request.query.highpercentage;
    var modifiedLetterGrade = request.query.modifiedlettergrade;

    //Set the query text
    var queryText = 'SELECT nerds.modifySectionGradeTier($1, $2, $3, $4, $5);';
    var queryParams = [sectionId, letterGrade, lowPercentage, highPercentage, modifiedLetterGrade];

    //Execute the query
    executeQuery(response, config, queryText, queryParams, function(result) {
        response.send(JSON.stringify({}));
    });
});

//Copy a grade tier from one section to another
app.get('/gradeTiersCopy', function(request, response) {
    //Decrypt the password received from the client.
    //NOTE: We need to substitute superSecret with what we're actually implementing
    var passwordText=request.query.password;

    //Connection parameters for the Postgres client received in the request
    var config = createConnectionParams(request.query.user, request.query.database,
        passwordText, request.query.host, request.query.port);

    //Get the query params from the url
    var sectionId = request.query.sectionid;
    var letterGrade = request.query.lettergrade;
    var newSection = request.query.newsection;

    //Set the query text
    var queryText = 'SELECT nerds.copySectionGradeTier($1, $2, $3);';
    var queryParams = [sectionId, letterGrade, newSection];

    //Execute the query
    executeQuery(response, config, queryText, queryParams, function(result) {
        response.send(JSON.stringify({}));
    });
});

//assessmentKindMgmt.SQL function calls

//Add an assessment kind to a section
app.get('/assessmentKindsAdd', function(request, response) {
	//Decrypt the password received from the client.
	//NOTE: We need to substitute superSecret with what we're actually implementing
	//var passwordText=request.query.password;
	var passwordText=request.query.password;
	//Connection parameters for the Postgres client received in the request
	var config = createConnectionParams(request.query.user, request.query.database,
        passwordText, request.query.host, request.query.port);

    //Get the query params from the url
    var sectionId = request.query.sectionid;
    var name = request.query.kindname;
    var description = request.query.kinddescription;
    var weightage = request.query.weightage;

    //Set the query text
    var queryText = 'SELECT nerds.addSectionAssessmentKind($1, $2, $3, $4);';
    var queryParams = [sectionId, name, description, weightage];

    //Execute the query
    executeQuery(response, config, queryText, queryParams, function(result) {
	    response.send(JSON.stringify({}));
	});
});

//Drop an assessment kind from a section
app.get('/assessmentKindsDelete', function(request, response) {
	//Decrypt the password received from the client.
    //NOTE: We need to substitute superSecret with what we're actually implementing
	//var passwordText=request.query.password;
        var passwordText = request.query.password;
	//Connection parameters for the Postgres client received in the request
	var config = createConnectionParams(request.query.user, request.query.database,
        passwordText, request.query.host, request.query.port);

    //Get the query params from the url
    var sectionId = request.query.sectionid;
    var name = request.query.kindname;

    //Set the query text
    var queryText = 'SELECT nerds.dropSectionAssessmentKind($1, $2);';
    var queryParams = [sectionId, name];

    //Execute the query
    executeQuery(response, config, queryText, queryParams, function(result) {
		response.send(JSON.stringify({}));
});
});

//Return all assessmentKinds in a section
app.get('/assessmentKindsGet', function(request, response) {
	//Decrypt the password received from the client.
	//NOTE: We need to substitute superSecret with what we're actually implementing
	//var passwordText=request.query.password;
	var passwordText = request.query.password;
	//Connection parameters for the Postgres client received in the request
	var config = createConnectionParams(request.query.user, request.query.database,
        passwordText, request.query.host, request.query.port);

    //Get the query params from the url
    var sectionId = request.query.sectionid;

    //Set the query text
    var queryText = 'SELECT * FROM nerds.getSectionAssessmentKinds($1);';
    var queryParams = [sectionId];

    //Execute the query
    executeQuery(response, config, queryText, queryParams, function(result) {
		var assessmentKinds = []; //Put the rows from the query into json format
		        for (row in result.rows) {
		            assessmentKinds.push(
		                {
		                    "name": result.rows[row].name,
		                    "description": result.rows[row].description,
		                    "weightage": result.rows[row].weightage
		                }
		            );
		        }
		        var jsonReturn = {
		            "assessmentKinds": assessmentKinds
		        } //Send the json to the client
        response.send(JSON.stringify(jsonReturn));
});
});

//modify an assessment kind in a section
app.get('/assessmentKindsMod', function(request, response) {
	//Decrypt the password received from the client.
    //NOTE: We need to substitute superSecret with what we're actually implementing
	var passwordText=request.query.password;

	//Connection parameters for the Postgres client received in the request
	var config = createConnectionParams(request.query.user, request.query.database,
        passwordText, request.query.host, request.query.port);

    //Get the query params from the url
    var sectionId = request.query.sectionid;
    var name = request.query.kindname;
    var description = request.query.kinddescription;
    var weightage = request.query.weightage;
    var newName = request.query.newkindname;

    //Set the query text
    var queryText = 'SELECT nerds.modifySectionAssessmentKind($1, $2, $3, $4, $5);';
    var queryParams = [sectionId, name, description, weightage, newName];

    //Execute the query
    executeQuery(response, config, queryText, queryParams, function(result) {
		response.send(JSON.stringify({}));
});
});

//copy an assessment kind from one section to another
app.get('/assessmentKindsCopy', function(request, response) {
	//Decrypt the password received from the client.
	//NOTE: We need to substitute superSecret with what we're actually implementing
    var passwordText=request.query.password;

	//Connection parameters for the Postgres client received in the request
	var config = createConnectionParams(request.query.user, request.query.database,
        passwordText, request.query.host, request.query.port);

    //Get the query params from the url
    var sectionId = request.query.sectionid;
    var name = request.query.kindname;
    var newSection = request.query.newsection;

    //Set the query text
    var queryText = 'SELECT nerds.copySectionAssessmentKind($1, $2, $3);';
    var queryParams = [sectionId, name, newSection];

    //Execute the query
    executeQuery(response, config, queryText, queryParams, function(result) {
		response.send(JSON.stringify({}));
});
});

//assessmentItemMgmt.SQL function calls

//add an assessment item to a section
app.get('/assessmentItemsAdd', function(request, response) {
	//Decrypt the password received from the client.
	//NOTE: We need to substitute superSecret with what we're actually implementing
	//var passwordText=request.query.password;
	var passwordText=request.query.password;
	//Connection parameters for the Postgres client received in the request
	var config = createConnectionParams(request.query.user, request.query.database,
        passwordText, request.query.host, request.query.port);

    //Get the query params from the url
    var sectionId = request.query.sectionid;
    var kind = request.query.kind;
    var number = request.query.itemnumber;
    var description = request.query.itemdescription;
    var basePoints = request.query.basepointspossible;
    var assignedDate = request.query.assigneddate;
    var dueDate = request.query.duedate;
    var revealDate = request.query.revealdate;
    var curve = request.query.curve;

    //Set the query text
    var queryText = 'SELECT nerds.addSectionAssessmentItem($1, $2, $3, $4, $5, $6, $7, $8, $9);';
    var queryParams = [sectionId, kind, number, description, basePoints, assignedDate, dueDate, revealDate, curve];

    //Execute the query
    executeQuery(response, config, queryText, queryParams, function(result) {
		response.send(JSON.stringify({}));
});
});

//delete an assessment item from a section
app.get('/assessmentItemsDelete', function(request, response) {
	//Decrypt the password received from the client.
	//NOTE: We need to substitute superSecret with what we're actually implementing
	var passwordText=request.query.password;

	//Connection parameters for the Postgres client received in the request
	var config = createConnectionParams(request.query.user, request.query.database,
        passwordText, request.query.host, request.query.port);

    //Get the query params from the url
    var sectionId = request.query.sectionid;
    var kind = request.query.kind;
    var number = request.query.itemnumber;

    //Set the query text
    var queryText = 'SELECT nerds.dropSectionAssessmentItem($1, $2, $3);';
    var queryParams = [sectionId, kind, number];

    //Execute the query
    executeQuery(response, config, queryText, queryParams, function(result) {
		response.send(JSON.stringify({}));
});
});

//get all assessment items of a kind in a section
app.get('/assessmentItemsGet', function(request, response) {
	//Decrypt the password received from the client.
	//NOTE: We need to substitute superSecret with what we're actually implementing
	//var passwordText=request.query.password;
	var passwordText = request.query.password;

	//Connection parameters for the Postgres client received in the request
	var config = createConnectionParams(request.query.user, request.query.database,
        passwordText, request.query.host, request.query.port);

    //Get the query params from the url
    var sectionId = request.query.sectionid;
    var kind = request.query.kind;

    //Set the query text
    var queryText = 'SELECT * FROM nerds.getSectionAssessmentItems($1, $2);';
    var queryParams = [sectionId, kind];

    //Execute the query
    executeQuery(response, config, queryText, queryParams, function(result) {
		var assessmentItems = []; //Put the rows from the query into json format
				        for (row in result.rows) {
							//console.log(result.rows);
				            assessmentItems.push(
				                {
				                    //"Name": result.rows[row].name,
									"Kind": result.rows[row].kind,
									"Number": result.rows[row].assessmentnumber,
				                    "Description": result.rows[row].description,
				                    "BasePointsPossible": result.rows[row].basepointspossible,
				                    "AssignedDate": result.rows[row].assigneddate,
				                    "DueDate": result.rows[row].duedate,
				                    "RevealDate": result.rows[row].revealdate,
				                    "Curve": result.rows[row].curve
				                }
				            );
				        }
				        var jsonReturn = {
				            "assessmentItems": assessmentItems
				        } //Send the json to the client
						//console.log(jsonReturn);
        response.send(JSON.stringify(jsonReturn));
});
});

//modify an assessment item in a section
app.get('/assessmentItemsMod', function(request, response) {
	//Decrypt the password received from the client.
	//NOTE: We need to substitute superSecret with what we're actually implementing
	var passwordText=request.query.password;

	//Connection parameters for the Postgres client received in the request
	var config = createConnectionParams(request.query.user, request.query.database,
        passwordText, request.query.host, request.query.port);

    //Get the query params from the url
    var sectionId = request.query.sectionid;
    var kind = request.query.kind;
    var number = request.query.itemnumber;
    var description = request.query.itemdescription;
    var basePoints = request.query.basepointspossible;
    var assignedDate = request.query.assigneddate;
    var dueDate = request.query.duedate;
    var revealDate = request.query.revealdate;
    var curve = request.query.curve;
    var newNumber = request.query.newnumber;

    //Set the query text
    var queryText = 'SELECT nerds.modifySectionAssessmentItem($1, $2, $3, $4, $5, $6, $7, $8, $9, $10);';
    var queryParams = [sectionId, kind, number, description, basePoints, assignedDate, dueDate, revealDate, curve, newNumber];

    //Execute the query
    executeQuery(response, config, queryText, queryParams, function(result) {
		response.send(JSON.stringify({}));
});
});

//submissionMgmt.SQL function calls

//add a submission to a section
app.get('/submissionsAdd', function(request, response) {
	//Decrypt the password received from the client.
	//NOTE: We need to substitute superSecret with what we're actually implementing
	var passwordText=request.query.password;

	//Connection parameters for the Postgres client received in the request
	var config = createConnectionParams(request.query.user, request.query.database,
        passwordText, request.query.host, request.query.port);

    //Get the query params from the url
    var studentId = request.query.studentid;
    var sectionId = request.query.sectionid;
    var kind = request.query.kind;
    var number = request.query.itemnumber;
    var basePoints = request.query.basepointsearned;
    var extraCredit = request.query.extracreditearned;
    var penalty = request.query.penalty;
    var submissionDate = request.query.submissiondate;
    var notes = request.query.notes;

    //Set the query text
    var queryText = 'SELECT nerds.addSubmission($1, $2, $3, $4, $5, $6, $7, $8, $9);';
    var queryParams = [studentId, sectionId, kind, number, basePoints, extraCredit, penalty, submissionDate, notes];

    //Execute the query
    executeQuery(response, config, queryText, queryParams, function(result) {
		response.send(JSON.stringify({}));
});
});

//get an enrollee's assessment item scores for a kind in a section
app.get('/submissionsItemsEnrollee', function(request, response) {
	//Decrypt the password received from the client.
	//NOTE: We need to substitute superSecret with what we're actually implementing
	var passwordText=request.query.password;

	//Connection parameters for the Postgres client received in the request
	var config = createConnectionParams(request.query.user, request.query.database,
        passwordText, request.query.host, request.query.port);

    //Get the query params from the url
    var studentId = request.query.userid;
    var sectionId = request.query.sectionid;
    var kind = request.query.kind;

    //Set the query text
    var queryText = 'SELECT * FROM nerds.getAssessmentItemScoresEnrollee($1, $2, $3);';
    var queryParams = [studentId, sectionId, kind];

    //Execute the query
    executeQuery(response, config, queryText, queryParams, function(result) {
		var submissions = []; //Put the rows from the query into json format
						        for (row in result.rows) {
						            submissions.push(
						                {
						                    "Name": result.rows[row].name,
						                    //"Description": result.rows[row].description,
											"BasePointsEarned": result.rows[row].basepointsearned,
											"ExtraCreditEarned": result.rows[row].extracreditearned,
											"Penalty": result.rows[row].penalty,
						                    "CurvedGradePercent": result.rows[row].curvedgradepercent,
						                    "CurvedGradeLetter": result.rows[row].curvedgradeletter,
											"SubmissionDate": result.rows[row].submissiondate,
											"Notes": result.rows[row].notes
						                }
						            );
						        }
						        var jsonReturn = {
						            "submissions": submissions
						        } //Send the json to the client
        response.send(JSON.stringify(jsonReturn));
});
});

//get all enrollees' scores for a particular assessment item in a section
app.get('/submissionsItemsInstructor', function(request, response) {
	//Decrypt the password received from the client.
	//NOTE: We need to substitute superSecret with what we're actually implementing
	//var passwordText=request.query.password;
	var passwordText = request.query.password;
	//Connection parameters for the Postgres client received in the request
	var config = createConnectionParams(request.query.user, request.query.database,
        passwordText, request.query.host, request.query.port);

    //Get the query params from the url
    var sectionId = request.query.sectionid;
    var kind = request.query.kind;
    var number = request.query.itemnumber;

    //Set the query text
    var queryText = 'SELECT * FROM nerds.getAssessmentItemScoresInstructor($1, $2, $3);';
    var queryParams = [sectionId, kind, number];

    //Execute the query
    executeQuery(response, config, queryText, queryParams, function(result) {
		var submissions = []; //Put the rows from the query into json format
								        for (row in result.rows) {
								            submissions.push(
								                {
								                    "Enrollee": result.rows[row].enrollee,
													"Student": result.rows[row].student,
													"Kind": result.rows[row].kind,
													"Number": result.rows[row].assessmentnumber,
													"BasePointsEarned": result.rows[row].basepointsearned,
													"ExtraCreditEarned": result.rows[row].extracreditearned,
													"Penalty": result.rows[row].penalty,
													"Grade": result.rows[row].grade,
													"SubmissionDate": result.rows[row].submissiondate,
								                    "Notes": result.rows[row].notes
								                }
								            );
								        }
								        var jsonReturn = {
								            "submissions": submissions
								        } //Send the json to the client
        response.send(JSON.stringify(jsonReturn));
});
});

//get an enrollee's average score for all items of a kind
app.get('/submissionsKindsEnrollee', function(request, response) {
	//Decrypt the password received from the client.
	//NOTE: We need to substitute superSecret with what we're actually implementing
	//var passwordText=request.query.password;
	var passwordText = request.query.password;
	//Connection parameters for the Postgres client received in the request
	var config = createConnectionParams(request.query.user, request.query.database,
        passwordText, request.query.host, request.query.port);

    //Get the query params from the url
    var studentId = request.query.userid;
    var sectionId = request.query.sectionid;
    var kind = request.query.kind;

    //Set the query text
    var queryText = 'SELECT * FROM nerds.getAssessmentKindAvgEnrollee($1, $2, $3);';
    var queryParams = [studentId, sectionId, kind];

    //Execute the query
    executeQuery(response, config, queryText, queryParams, function(result) {
		var submissions = []; //Put the rows from the query into json format
										        for (row in result.rows) {
										            submissions.push(
										                {
										                    "Kind": result.rows[row].kind,
										                    "Grade": result.rows[row].grade
										                }
										            );
										        }
										        var jsonReturn = {
										            "submissions": submissions
										        } //Send the json to the client
        response.send(JSON.stringify(jsonReturn));
});
});

//get all enrollees' averages for a specific kind
app.get('/submissionsKindsInstructor', function(request, response) {
	//Decrypt the password received from the client.
	//NOTE: We need to substitute superSecret with what we're actually implementing
	//var passwordText=request.query.password;
	var passwordText=request.query.password;
	//Connection parameters for the Postgres client received in the request
	var config = createConnectionParams(request.query.user, request.query.database,
        passwordText, request.query.host, request.query.port);

    //Get the query params from the url
    var sectionId = request.query.sectionid;
    var kind = request.query.kind;

    //Set the query text
    var queryText = 'SELECT * FROM nerds.getAssessmentKindAvgInstructor($1, $2);';
    var queryParams = [sectionId, kind];

    //Execute the query
    executeQuery(response, config, queryText, queryParams, function(result) {
		var submissions = []; //Put the rows from the query into json format
												for (row in result.rows) {
												    submissions.push(
												        {
												            "Enrollee": result.rows[row].enrollee,
												            "Grade": result.rows[row].grade
												        }
												    );
												}
												var jsonReturn = {
												    "submissions": submissions
												} //Send the json to the client
        response.send(JSON.stringify(jsonReturn));
});
});

//modify an enrollee's submission
app.get('/submissionsMod', function(request, response) {
	//Decrypt the password received from the client.
	//NOTE: We need to substitute superSecret with what we're actually implementing
	var passwordText=request.query.password;

	//Connection parameters for the Postgres client received in the request
	var config = createConnectionParams(request.query.user, request.query.database,
        passwordText, request.query.host, request.query.port);

    //Get the query params from the url
    var studentId = request.query.userid;
    var sectionId = request.query.sectionid;
    var kind = request.query.kind;
    var number = request.query.itemnumber;
    var basePoints = request.query.basepointsearned;
    var extraCredit = request.query.extracreditearned;
    var penalty = request.query.penalty;
    var submissionDate = request.query.submissiondate;
    var notes = request.query.notes;

    //Set the query text
    var queryText = 'SELECT * FROM nerds.modifySubmission($1, $2, $3, $4, $5, $6, $7, $8, $9);';
    var queryParams = [studentId, sectionId, kind, number, basePoints, extraCredit, penalty, submissionDate, notes];

    //Execute the query
    executeQuery(response, config, queryText, queryParams, function(result) {
		response.send(JSON.stringify({}));
});
});

//get a list of enrollees in a section
app.get('/getEnrollees', function(request, response) {
	//Decrypt the password received from the client.
	//NOTE: We need to substitute superSecret with what we're actually implementing
	var passwordText=request.query.password;

	//Connection parameters for the Postgres client received in the request
	var config = createConnectionParams(request.query.user, request.query.database,
        passwordText, request.query.host, request.query.port);

    //Get the query params from the url
    var sectionId = request.query.sectionid;

    //Set the query text
    var queryText = 'SELECT * FROM nerds.getEnrollees($1);';
    var queryParams = [sectionId];

    //Execute the query
    executeQuery(response, config, queryText, queryParams, function(result) {
		var enrollees = []; //Put the rows from the query into json format
			for (row in result.rows) {
				enrollees.push(
				{
					"Id": result.rows[row].id,
					"Enrollee": result.rows[row].enrollee,
				}
				);
			}
				var jsonReturn = {
				"enrollees": enrollees
				} //Send the json to the client
        response.send(JSON.stringify(jsonReturn));
});
});

//Already present from Gradebook https://github.com/DASSL/Gradebook
app.use(function(err, req, res, next){
  console.error(err);
  res.status(500).send('Internal Server Error');
});

server = app.listen(80);
