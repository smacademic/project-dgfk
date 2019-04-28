<!--
GradebookSystemTesting.md

This file will contain all of the system testing documentation for all of the functionality that was added
by Team GEEKS (CS298-01 Spring 2019). When this document is ready to be part of a release it will be
converted to a PDF format and the name of both the pdf and a copy of the markdown file will be named
like this: "GradebookSystemTesting_version_0.5.1.md" in a subdirectory of the current one with the name of
the directory being the same as the release tag name. The markdown file will be kept as a copy of the PDF
incase changes need to be made to that version of the document so that new versions do not have to have
items removed to make a new copy for an older release.

Team GEEKS:
Bruno DaSilva
Cristain Fitzgerald
Elly Griffen
Kenneth Kozlowski


Version of Gradebook that this Documentation is current for: 0.5.0

Directory Location of Final Version of Md and PDF Documents: Not available yet

Version of this Document: 1.0

-->
# <u>Gradebook System Testing</u>  
###### For Gradebook Version 0.5.0
<!--Change version number for every new version of Gradebook that this document supports-->
<br>
### <u>Purpose of This Document</u>  
The purpose of this document is to give the ability to the End User, System Administrator, Server Administrator or anyone who installs the **Gradebook** software to be able to verify that the entire program is running as intended. This document will serve as a guide to verifying that all of the functionality of **Gradebook** is correctly working and that inputs that are *valid* return a positive response from the program and that *invalid* input to the program will return an error to the end user and the server console.  
This document will also serve the purpose of guiding the person or team that is setting up **Gradebook** to be able to make the needed setup to personalize their installed version of **Gradebook** or to set up features that are not fully implemented yet that require hard coding certain fields.  

***
### <u>Needed Extra Setup for Gradebook to Function as Intended</u>
<!--This section will need more work done to it.-->
1. **User Accounts** need to be created.
    - At the current vesion of **Gradebook** *(0.4.0)*, there is no automatic way to add user accounts to the Database where an Administrator adds new instructors or other staff to the database.
    - All new users created need to be members of `GB_Webapp` so that they have the ability to log into the system.
    - ***NOTE***: All **User Accounts need** to *at the current version* have an instructor in the table `Gradebook.Instructor` so that they will be able to use the system.
2. PostgreSQL Database name
    - The PostgreSQL Database name created for the installation of **Gradebook v0.4.0** needs to be called `gradebook`.
        - As of this version, all of the tables in the product are called to using schema qualification so the database would need to be specific
3. To have a *DBMS* that is located on a different system other than the one that is running `GradebookServer.js`
    - Within the file `index.js` the following modification(s) would need to be made.
        - On line 25 of the file, the portion of code that has `"host":null` would need to be changed so that `null` has either the *IP Address* or *DNS Hostname* of the server where PostgreSQL is running
        - If a different port other than `5432` is being used, then `"port":null,` would need to be changed to have the correct port that the DBMS is running on
    - Within the file `index.html` on lines 111-123 the following changes would need to be made:
        - on line 113, the value would need to be changed from `localhost` to either the same IP Address of DNS Name of the Server running the DBMS
        - If there is a different port being used other than `5432` then that number should be on the value section of line 117.

  <!--Add in the instructions to change the email domain here in next version-->
***
### <u>Logging into Gradebook</u>
After navigating to the correct URL for **Gradebook**, you should be greeted with a login page. Using the username, (*which would need to be for a person that is in the `Instructor` table*) using the domain `@example.edu`. If needed, change the DB Info box as needed to log in.  
The **Correct and Expected Action** for this would be that the login would be *successful* and you would be redirected to the attendance tab.  
If **invalid** input is entered, then an error should show on the screen that the login was not successful.  
<br>
Once you have competed testing the login functionality please continue to follow this document.
***
### <u>Testing Course Management</u>
Navigate to the tab `Course Management` at the top of the page.  
If the tab is **NOT** showing then there is an issue with the document `index.js`.
Click on all of the menu boxes on the page, if they **all** open and close when clicking on them, then they are all working as intended. If there is at least one that is not, then there is an issue with the code in one of the menus.  
On the `Add A Course` box, try adding a course with the same number and title more than once. On the first attempt, the course should add without any issues as long as the course did not already exist in the DB. After that, then the webpage should return an error stating that the course is already in the DB.  
On the `Remove A Course` box, try to remove a course that is not currently in the DB, an error should display stating that the course is not represented in the DB.  
Then try to remove the course that was just added to the DB, the course should be removed from the DB without any errors.  
On the `Search for Courses` box, clicking on `search` should return the courses table and if it does not, then there is an issue with getting the table from the DB.  
***
<!--Add in section management here-->
