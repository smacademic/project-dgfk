/*
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
//Super secret password - Used for a temporary password encryption scheme
const superSecret = 'dassl2017';

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

var pg = require('pg'); //Postgres client module   | https://github.com/brianc/node-postgres
var sjcl = require('sjcl'); //Encryption module    | https://github.com/bitwiseshiftleft/sjcl
var express = require('express'); //Express module | https://github.com/expressjs/express

var app = express();

/*
This function creates and returns a config object for the pg module based on some
supplied parameters.
*/
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
function executeQuery(response, config, queryText, queryParams, queryCallback) {
   var client = new pg.Client(config); //Connect to pg instance
   client.connect(function(err) {
      if(err) { //If a connection error happens, 500
         client.end(); //Close the connection
         response.status(500).send('500 - Database connection error');
         console.log(err);
      }
      else { //Try and execute the query
         client.query(queryText, queryParams, function (err, result) {
            if(err) { //If the query returns an error, 500
               client.end(); //Close the connection
               response.status(500).send('500 - Query execution error');
               console.log(err);
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
app.get('/', function(request, response) {
   response.sendFile('client/index.html', {root: __dirname});
});

//Serve our homepage when a user goes to the root
app.get('/index.html', function(request, response) {
   response.sendFile('client/index.html', {root: __dirname});
});

//Serve css and js dependencies
app.get('/css/materialize.min.css', function(request, response) {
	response.sendFile('client/css/materialize.min.css', {root: __dirname});
});

app.get('/js/materialize.min.js', function(request, response) {
	response.sendFile('client/js/materialize.min.js', {root: __dirname});
});

app.get('/js/index.js', function(request, response) {
	response.sendFile('client/js/index.js', {root: __dirname});
});

//Returns instructor id and name from a provided email.
app.get('/login', function(request, response) {
   //Decrypt the password recieved from the client.  This is a temporary development
   //feature, since we don't have ssl set up yet
   var passwordText = sjcl.decrypt(superSecret, JSON.parse(request.query.password));

   //Connnection parameters for the Postgres client recieved in the request
   var config = createConnectionParams(request.query.user, request.query.database,
      passwordText, request.query.host, request.query.port);

   //Get the params from the url
   var instructorEmail = request.query.instructoremail.trim();

   //Set the query text
   var queryText = 'SELECT ID, FName, MName, LName, Department FROM gradebook.getInstructor($1);';
   var queryParams = [instructorEmail];

   //Execute the query
   executeQuery(response, config, queryText, queryParams, function(result) {
      //Check if any rows are returned.  No rows implies that the provided
      //email does not match an existing instructor
      if(result.rows.length == 0) {
         response.status(401).send('401 - Login failed');
      }
      else {
         var jsonReturn = {
            "instructor": result.rows[0] //getInstructors should return at most one row
         };
         response.send(JSON.stringify(jsonReturn));
      }
   });
});

//Return a list of years a certain instructor has taught sections
app.get('/years', function(request, response) {
   //Decrypt the password recieved from the client.  This is a temporary development
   //feature, since we don't have ssl set up yet
   var passwordText = sjcl.decrypt(superSecret, JSON.parse(request.query.password));

   //Connnection parameters for the Postgres client recieved in the request
   var config = createConnectionParams(request.query.user, request.query.database,
      passwordText, request.query.host, request.query.port);

   //Get the params from the url
   var instructorID = request.query.instructorid;

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

//Return a list of instructors
app.get('/instructors', function(request, response) {
   //Decrypt the password recieved from the client.  This is a temporary development
   //feature, since we don't have ssl set up yet
   var passwordText = sjcl.decrypt(superSecret, JSON.parse(request.query.password));

   //Connnection parameters for the Postgres client recieved in the request
   var config = createConnectionParams(request.query.user, request.query.database,
      passwordText, request.query.host, request.query.port);

   //Set the query text
   var queryText = 'SELECT FName FROM gradebook.getInstructors();';
   var queryParams = [];

   //Execute the query
   executeQuery(response, config, queryText, queryParams, function(result) {
      var instructors = []; //Put the rows from the query into json format
      for(row in result.rows) {
         instructors.push(result.rows[row].fname);
      }
      var jsonReturn = {
         "instructors": instructors
      } //Send the json to the client
      response.send(JSON.stringify(jsonReturn));
   });
});

//Return a list of seasons an instructor taught in during a certain year
app.get('/seasons', function(request, response) {
   //Decrypt the password recieved from the client.  This is a temporary development
   //feature, since we don't have ssl set up yet
   var passwordText = sjcl.decrypt(superSecret, JSON.parse(request.query.password));

   //Connnection parameters for the Postgres client recieved in the request
   var config = createConnectionParams(request.query.user, request.query.database,
      passwordText, request.query.host, request.query.port);

   //Get the params from the url
   var instructorID = request.query.instructorid;
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
app.get('/courses', function(request, response) {
   //Decrypt the password recieved from the client.  This is a temporary development
   //feature, since we don't have ssl set up yet
   var passwordText = sjcl.decrypt(superSecret, JSON.parse(request.query.password));

   //Connnection parameters for the Postgres client recieved in the request
   var config = createConnectionParams(request.query.user, request.query.database,
      passwordText, request.query.host, request.query.port);

   var instructorID = request.query.instructorid;
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

//Returns a list of sesctions an instructor taught in a certain term
app.get('/sections', function(request, response) {
   //Decrypt the password recieved from the client.  This is a temporary development
   //feature, since we don't have ssl set up yet
   var passwordText = sjcl.decrypt(superSecret, JSON.parse(request.query.password));

   //Connnection parameters for the Postgres client recieved in the request
   var config = createConnectionParams(request.query.user, request.query.database,
      passwordText, request.query.host, request.query.port);

   var instructorID = request.query.instructorid;
   var year = request.query.year;
   var seasonOrder = request.query.seasonorder;
   var courseNumber = request.query.coursenumber;
   var queryText = 'SELECT SectionID, SectionNumber FROM gradebook.getInstructorSections($1, $2, $3, $4);';
   var queryParams = [instructorID, year, seasonOrder, courseNumber];

   executeQuery(response, config, queryText, queryParams, function(result) {
      var sections = [];
      for(row in result.rows) {
         sections.push(
            {
               "sectionid": result.rows[row].sectionid,
               "sectionnumber": result.rows[row].sectionnumber
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
app.get('/attendance', function(request, response) {
   //Decrypt the password recieved from the client.  This is a temporary development
   //feature, since we don't have ssl set up yet
   var passwordText = sjcl.decrypt(superSecret, JSON.parse(request.query.password));

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

app.get('/getCourseSections', function(request, response) {
   //Decrypt the password received from the client.
   //NOTE: We need to substitute superSecret with what we're actually implementing
   var passwordText = sjcl.decrypt(superSecret, JSON.parse(request.query.password));

   //Connection parameters for the Postgres client received in the request
   var config = createConnectionParams(request.query.user, request.query.database,
       passwordText, request.query.host, request.query.port);

   //Get the params from the url
   var title = request.query.num;

   //Set the query text
   var queryText = 'SELECT getCourseSections($1);';
   var queryParams = [title];

   //Execute the query
   executeQuery(response, config, queryText, queryParams, function(result) {
       response.send(JSON.stringify({}));
   });
});

app.get('/insertCourse', function(request, response) {
    //Decrypt the password received from the client.
    //NOTE: We need to substitute superSecret with what we're actually implementing
    var passwordText = sjcl.decrypt(superSecret, JSON.parse(request.query.password));

    //Connection parameters for the Postgres client received in the request
    var config = createConnectionParams(request.query.user, request.query.database,
        passwordText, request.query.host, request.query.port);

    //Get the params from the url
    var num = request.query.num;
    var title = request.query.title;
    var credits = request.query.credits;

    //Set the query text
    var queryText = 'SELECT insertCourse($1, $2, $3);';
    var queryParams = [num, title, credits];

    //Execute the query
    executeQuery(response, config, queryText, queryParams, function(result) {
        response.send(JSON.stringify({}));
    });
});

app.get('/enrollStudent', function(request, response) {
   //Decrypt the password received from the client.
   //NOTE: We need to substitute superSecret with what we're actually implementing
   var passwordText = sjcl.decrypt(superSecret, JSON.parse(request.query.password));

   //Connection parameters for the Postgres client received in the request
   var config = createConnectionParams(request.query.user, request.query.database,
       passwordText, request.query.host, request.query.port);

   //Get the params from the url
   var couseTitle = request.query.course;
   var sectionid = request.query.sectionNum;
   console.log('sectionid: ' + sectionid);
   var studentid = request.query.studentid;

   //Set the query text
   var queryText = 'SELECT enrollStudent($1, $2);';
   var queryParams = [studentid, sectionid];

   //Execute the query
   executeQuery(response, config, queryText, queryParams, function(result) {
       response.send(JSON.stringify({}));
   });
});

app.get('/removeCourse', function(request, response) {
   //Decrypt the password received from the client.
   //NOTE: We need to substitute superSecret with what we're actually implementing
   var passwordText = sjcl.decrypt(superSecret, JSON.parse(request.query.password));

   //Connection parameters for the Postgres client received in the request
   var config = createConnectionParams(request.query.user, request.query.database,
       passwordText, request.query.host, request.query.port);

   //Get the params from the url
   var num = request.query.num;
   var title = request.query.title;

   //Set the query text
   var queryText = 'SELECT removeCourse($1, $2);';
   var queryParams = [num, title];

   //Execute the query
   executeQuery(response, config, queryText, queryParams, function(result) {
       response.send(JSON.stringify({}));
   });
});

app.get('/getCourses', function(request, response){
   //Decrypt the password received from the client.
   //NOTE: We need to substitute superSecret with what we're actually implementing
   var passwordText = sjcl.decrypt(superSecret, JSON.parse(request.query.password));

   //Connection parameters for the Postgres client received in the request
   var config = createConnectionParams(request.query.user, request.query.database,
       passwordText, request.query.host, request.query.port);

   //Set the query text
   var queryText = 'SELECT * FROM gradebook.getCourses();';
   var queryParams;

   //Execute the query
   executeQuery(response, config, queryText, queryParams, function(result) {
      var courses = []; //Put the rows from the query into json format
         for (row in result.rows) {
               courses.push(
                  {
                     "Number": result.rows[row].outnumber,
                     "Title": result.rows[row].outtitle,
                     "Credits": result.rows[row].outcredits
                  }
               );
         }
         var jsonReturn = {
               "courses": courses
         } //Send the json to the client
       response.send(JSON.stringify({courses}));
   });
});

app.get('/modCourses', function(request, response){
   //Decrypt the password received from the client.
   //NOTE: We need to substitute superSecret with what we're actually implementing
   var passwordText = sjcl.decrypt(superSecret, JSON.parse(request.query.password));

   //Connection parameters for the Postgres client received in the request
   var config = createConnectionParams(request.query.user, request.query.database,
       passwordText, request.query.host, request.query.port);

   //Get the params from the url
   var num = request.query.num;
   var title = request.query.title;
   var newnum = request.query.newnum;
   var newtitle = request.query.newtitle;
   var newcredits = request.query.newcredits;

   //Set the query text
   var queryText = 'SELECT modifyCourse($1, $2, $3, $4, $5)';
   var queryParams = [num, title, newnum, newtitle, newcredits];

   //execute the query
   executeQuery(response, config, queryText, queryParams, function(result) {
      response.send(JSON.stringify({}));
   });
});

app.get('/addSection', function(request, response) {
   //Decrypt the password received from the client.
   //NOTE: We need to substitute superSecret with what we're actually implementing
   var passwordText = sjcl.decrypt(superSecret, JSON.parse(request.query.password));

   //Connection parameters for the Postgres client received in the request
   var config = createConnectionParams(request.query.user, request.query.database,
       passwordText, request.query.host, request.query.port);

   //Get the params from the url
   var term = request.query.term;
   console.log("term: " + term);

   if(term == 'Spring') {
      term = 0;
   }
   else if(term == 'Fall') {
      term = 1;
   }
   else if(term == 'Summer') {
      term = 2;
   }
   else {
      term = 3;
   }

   var course = request.query.course;
   var capacity = request.query.capacity;
   var num = request.query.num;
   var CRN = request.query.CRN;
   var schedule = request.query.schedule;
   var location = request.query.location;
   var start_date = request.query.start_date;
   var end_date = request.query.end_date;
   var midterm_date = request.query.midterm_date;
   var instructor1 = request.query.instructor1;
   instructor1 = 2;


   var instructor2 = request.query.instructor2;
   instructor2 = 3;

   if(instructor2 == null) {
      instructor2 = 0;
   }

   var instructor3 = request.query.instructor3;
   instructor3 = 4;

   if(instructor3 == null) {
      instructor3 = 0;
   }

   //Set the query text
   var queryText = 'SELECT addSection($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13);';
   var queryParams = [term, course, capacity, num, CRN, schedule, location, start_date, end_date, midterm_date, instructor1, instructor2, instructor3];

   //Execute the query
   executeQuery(response, config, queryText, queryParams, function(result) {
       response.send(JSON.stringify({}));
   });
});

app.get('/removeSection', function(request, response) {
   //Decrypt the password received from the client.
   //NOTE: We need to substitute superSecret with what we're actually implementing
   var passwordText = sjcl.decrypt(superSecret, JSON.parse(request.query.password));
 
   //Connection parameters for the Postgres client received in the request
   var config = createConnectionParams(request.query.user, request.query.database,
       passwordText, request.query.host, request.query.port);
 
   //Get the params from the url
   var removeSectionNumber = request.query.removeSectionNumber;
 
   //Set the query text
   var queryText = 'SELECT removeSection($1);';
   var queryParams = [removeSectionNumber];
 
   //Execute the query
   executeQuery(response, config, queryText, queryParams, function(result) {
       response.send(JSON.stringify({}));
   });
 });

app.get('/populateSections', function(request, response) {
  //Decrypt the password received from the client.
  //NOTE: We need to substitute superSecret with what we're actually implementing
  var passwordText = sjcl.decrypt(superSecret, JSON.parse(request.query.password));

  //Connection parameters for the Postgres client received in the request
  var config = createConnectionParams(request.query.user, request.query.database,
      passwordText, request.query.host, request.query.port);

  //Get the params from the url
  var coursetitle = request.query.coursetitle;

  //Set the query text
  var queryText = 'SELECT * from getCourseSections($1);';
  var queryParams = [coursetitle];

  //Execute the query
  executeQuery(response, config, queryText, queryParams, function(result) {
      var sections = []; //Put the rows from the query into json format

      for (row in result.rows) {
            sections.push(
               {
                  "sections": result.rows[row].outid
               }
            );
      }
      var jsonReturn = {
            "sections": sections
      } //Send the json to the client
      response.send(JSON.stringify({sections}));
  });
});

app.get('/getTerms', function(request, response){
   //Decrypt the password received from the client.
   //NOTE: We need to substitute superSecret with what we're actually implementing
   var passwordText = sjcl.decrypt(superSecret, JSON.parse(request.query.password));

   //Connection parameters for the Postgres client received in the request
   var config = createConnectionParams(request.query.user, request.query.database,
       passwordText, request.query.host, request.query.port);

   //Set the query text
   var queryText = 'SELECT * from gradebook.getTerms();';
   var queryParams;

   //Execute the query
   executeQuery(response, config, queryText, queryParams, function(result) {
      var terms = []; //Put the rows from the query into json format
         for (row in result.rows) {
               terms.push(
                  {
                     "terms": result.rows[row].outseason
                  }
               );
         }
         var jsonReturn = {
               "terms": terms
         } //Send the json to the client
       response.send(JSON.stringify({terms}));
   });
});

//Add a grade tier to a section
app.get('/gradeTiersAdd', function(request, response) {
    //Decrypt the password received from the client.
    //NOTE: We need to substitute superSecret with what we're actually implementing
       var passwordText = sjcl.decrypt(superSecret, JSON.parse(request.query.password));

    //Connection parameters for the Postgres client received in the request
    var config = createConnectionParams(request.query.user, request.query.database,
        passwordText, request.query.host, request.query.port);

    //Get the params from the url
    var sectionId = request.query.sectionid;
    var letterGrade = request.query.lettergrade;
    var lowPercentage = request.query.lowpercentage;
    var highPercentage = request.query.highpercentage;

    //Set the query text
    var queryText = 'SELECT Gradebook.addSectionGradeTier($1, $2, $3, $4);';
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
       var passwordText = sjcl.decrypt(superSecret, JSON.parse(request.query.password));

    //Connection parameters for the Postgres client received in the request
    var config = createConnectionParams(request.query.user, request.query.database,
        passwordText, request.query.host, request.query.port);

    //Get the params from the url
    var sectionId = request.query.sectionid;
    var letterGrade = request.query.lettergrade;

    //Set the query text
    var queryText = 'SELECT Gradebook.dropSectionGradeTier($1, $2);';
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
       var passwordText = sjcl.decrypt(superSecret, JSON.parse(request.query.password));

    //Connection parameters for the Postgres client received in the request
    var config = createConnectionParams(request.query.user, request.query.database,
        passwordText, request.query.host, request.query.port);

    //Get the params from the url
    var sectionId = request.query.sectionid;

    //Set the query text
    var queryText = 'SELECT * FROM Gradebook.getSectionGradeTiers($1);';
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
       var passwordText = sjcl.decrypt(superSecret, JSON.parse(request.query.password));

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
    var queryText = 'SELECT Gradebook.modifySectionGradeTier($1, $2, $3, $4, $5);';
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
       var passwordText = sjcl.decrypt(superSecret, JSON.parse(request.query.password));

    //Connection parameters for the Postgres client received in the request
    var config = createConnectionParams(request.query.user, request.query.database,
        passwordText, request.query.host, request.query.port);

    //Get the query params from the url
    var sectionId = request.query.sectionid;
    var letterGrade = request.query.lettergrade;
    var newSection = request.query.newsection;

    //Set the query text
    var queryText = 'SELECT Gradebook.copySectionGradeTier($1, $2, $3);';
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
	   var passwordText = sjcl.decrypt(superSecret, JSON.parse(request.query.password));
	//Connection parameters for the Postgres client received in the request
	var config = createConnectionParams(request.query.user, request.query.database,
        passwordText, request.query.host, request.query.port);

    //Get the query params from the url
    var sectionId = request.query.sectionid;
    var name = request.query.kindname;
    var description = request.query.kinddescription;
    var weightage = request.query.weightage;

    //Set the query text
    var queryText = 'SELECT Gradebook.addSectionAssessmentKind($1, $2, $3, $4);';
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
       var passwordText = sjcl.decrypt(superSecret, JSON.parse(request.query.password));
	//Connection parameters for the Postgres client received in the request
	var config = createConnectionParams(request.query.user, request.query.database,
        passwordText, request.query.host, request.query.port);

    //Get the query params from the url
    var sectionId = request.query.sectionid;
    var name = request.query.kindname;

    //Set the query text
    var queryText = 'SELECT Gradebook.dropSectionAssessmentKind($1, $2);';
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
	   var passwordText = sjcl.decrypt(superSecret, JSON.parse(request.query.password));
	//Connection parameters for the Postgres client received in the request
	var config = createConnectionParams(request.query.user, request.query.database,
        passwordText, request.query.host, request.query.port);

    //Get the query params from the url
    var sectionId = request.query.sectionid;

    //Set the query text
    var queryText = 'SELECT * FROM Gradebook.getSectionAssessmentKinds($1);';
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
	   var passwordText = sjcl.decrypt(superSecret, JSON.parse(request.query.password));

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
    var queryText = 'SELECT Gradebook.modifySectionAssessmentKind($1, $2, $3, $4, $5);';
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
       var passwordText = sjcl.decrypt(superSecret, JSON.parse(request.query.password));

	//Connection parameters for the Postgres client received in the request
	var config = createConnectionParams(request.query.user, request.query.database,
        passwordText, request.query.host, request.query.port);

    //Get the query params from the url
    var sectionId = request.query.sectionid;
    var name = request.query.kindname;
    var newSection = request.query.newsection;

    //Set the query text
    var queryText = 'SELECT Gradebook.copySectionAssessmentKind($1, $2, $3);';
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
	   var passwordText = sjcl.decrypt(superSecret, JSON.parse(request.query.password));
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
    var queryText = 'SELECT Gradebook.addSectionAssessmentItem($1, $2, $3, $4, $5, $6, $7, $8, $9);';
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
	   var passwordText = sjcl.decrypt(superSecret, JSON.parse(request.query.password));

	//Connection parameters for the Postgres client received in the request
	var config = createConnectionParams(request.query.user, request.query.database,
        passwordText, request.query.host, request.query.port);

    //Get the query params from the url
    var sectionId = request.query.sectionid;
    var kind = request.query.kind;
    var number = request.query.itemnumber;

    //Set the query text
    var queryText = 'SELECT Gradebook.dropSectionAssessmentItem($1, $2, $3);';
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
	   var passwordText = sjcl.decrypt(superSecret, JSON.parse(request.query.password));

	//Connection parameters for the Postgres client received in the request
	var config = createConnectionParams(request.query.user, request.query.database,
        passwordText, request.query.host, request.query.port);

    //Get the query params from the url
    var sectionId = request.query.sectionid;
    var kind = request.query.kind;

    //Set the query text
    var queryText = 'SELECT * FROM Gradebook.getSectionAssessmentItems($1, $2);';
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
	   var passwordText = sjcl.decrypt(superSecret, JSON.parse(request.query.password));

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
    var queryText = 'SELECT Gradebook.modifySectionAssessmentItem($1, $2, $3, $4, $5, $6, $7, $8, $9, $10);';
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
	   var passwordText = sjcl.decrypt(superSecret, JSON.parse(request.query.password));

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
    var queryText = 'SELECT Gradebook.addSubmission($1, $2, $3, $4, $5, $6, $7, $8, $9);';
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
	   var passwordText = sjcl.decrypt(superSecret, JSON.parse(request.query.password));

	//Connection parameters for the Postgres client received in the request
	var config = createConnectionParams(request.query.user, request.query.database,
        passwordText, request.query.host, request.query.port);

    //Get the query params from the url
    var studentId = request.query.userid;
    var sectionId = request.query.sectionid;
    var kind = request.query.kind;

    //Set the query text
    var queryText = 'SELECT * FROM Gradebook.getAssessmentItemScoresEnrollee($1, $2, $3);';
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
	   var passwordText = sjcl.decrypt(superSecret, JSON.parse(request.query.password));
	//Connection parameters for the Postgres client received in the request
	var config = createConnectionParams(request.query.user, request.query.database,
        passwordText, request.query.host, request.query.port);

    //Get the query params from the url
    var sectionId = request.query.sectionid;
    var kind = request.query.kind;
    var number = request.query.itemnumber;

    //Set the query text
    var queryText = 'SELECT * FROM Gradebook.getAssessmentItemScoresInstructor($1, $2, $3);';
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
	   var passwordText = sjcl.decrypt(superSecret, JSON.parse(request.query.password));
	//Connection parameters for the Postgres client received in the request
	var config = createConnectionParams(request.query.user, request.query.database,
        passwordText, request.query.host, request.query.port);

    //Get the query params from the url
    var studentId = request.query.userid;
    var sectionId = request.query.sectionid;
    var kind = request.query.kind;

    //Set the query text
    var queryText = 'SELECT * FROM Gradebook.getAssessmentKindAvgEnrollee($1, $2, $3);';
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
	   var passwordText = sjcl.decrypt(superSecret, JSON.parse(request.query.password));
	//Connection parameters for the Postgres client received in the request
	var config = createConnectionParams(request.query.user, request.query.database,
        passwordText, request.query.host, request.query.port);

    //Get the query params from the url
    var sectionId = request.query.sectionid;
    var kind = request.query.kind;

    //Set the query text
    var queryText = 'SELECT * FROM Gradebook.getAssessmentKindAvgInstructor($1, $2);';
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
	   var passwordText = sjcl.decrypt(superSecret, JSON.parse(request.query.password));

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
    var queryText = 'SELECT * FROM Gradebook.modifySubmission($1, $2, $3, $4, $5, $6, $7, $8, $9);';
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
	   var passwordText = sjcl.decrypt(superSecret, JSON.parse(request.query.password));

	//Connection parameters for the Postgres client received in the request
	var config = createConnectionParams(request.query.user, request.query.database,
        passwordText, request.query.host, request.query.port);

    //Get the query params from the url
    var sectionId = request.query.sectionid;

    //Set the query text
    var queryText = 'SELECT * FROM Gradebook.getEnrollees($1);';
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

app.use(function(err, req, res, next){
  console.error(err);
  res.status(500).send('Internal Server Error');
});

server = app.listen(80);
