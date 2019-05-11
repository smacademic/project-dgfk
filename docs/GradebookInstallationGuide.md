# Gradebook Installation Guide  

This guide is intended for anyone who is looking to install a version of Gradebook that has been published by *Team GEEKS(Bruno DaSilva, Elly Griffin, Cris Fitzgerald and Kenneth Kozlowski for CS298-01 @ WCSU)*  
This guide should provide all of the information that is needed to perform the initial installation and setup of both the Database and Web Server that Gradebook is hosted on.
***
## Database Management System (DBMS) Installation
The only officially Supported Database that Gradebook is compatible with is [PostgreSQL](https://www.postgresql.org/). Please click on one of the links below to be directed to the PostgreSQL download page for the following Operating Systems:  
- [BSD or Linux](https://www.postgresql.org/download/)
    - ***Note***: Please follow the links on this page to find the correct Unix based Operating System that you are using to download.
- [MacOS](https://www.postgresql.org/download/macosx/)
- [Solaris](https://www.postgresql.org/download/solaris/)
- [Windows](https://www.postgresql.org/download/windows/)

The only platform <!--As of Project GEEKS Testing--> that is supported is Version 11.  
<br>
Follow the download instructions to download the program to your system then begin to install the Database. When installing the Database, you may configure the port that the Database is running on to be a port other than the default, which is (*5432*) to any port that you would like to use. (***NOTE***: Remember the port used when setting up the DB because it will be important when configuring the Web Server to run.)  
<br>
Once you have completed the installation of the DB and have finished the installation wizard, continue to the next section of this document.
***
## Downloading Gradebook
After installing the DBMS, navigate to the [Team GEEKS GitHub Repository Releases](https://github.com/smacademic/project-GEEKS/releases) and choose the version of the product that you would like to install. (The most recent, non-prerelease, release is always the recommended version that should be downloaded because it has all of the most current patches and features implemented).  
<br>
To download the selected version, either download the `Source code (zip)` or `Source code (tar.gz)` depending on the operating system that you are using. Finally, place the unzipped file in the location where you want the server to run.
***
## Database Setup  
1. Once the DB is setup, connect to the DB Server using `psql` and press enter to allow the default values to be used unless you changed the port being used.
    - If the port was changed, when the prompt appears for port, enter in the port number that you are running on (example: *54311*).
2. Enter in the superuser (*Postgres*) password that you were prompted to create when installing the DBMS.
3. Using the `\i` meta command in **psql**, run the following command:
    - `\i '<path_to_folder_where_Gradebook_Directory_is>/src/db/PrepareServer.sql'`
4. Run the following command:
    ```sql
        CREATE DATABASE <name_of_database> WITH OWNER gradebook;
    ```
    - Please note the name of the Database, because it will be needed again when accessing the DB along with it needs to be set as the default option on the web-app.
5. You will now need to disconnect from the psql session that is running and restart the program with the database field containing the name of the Database that was created for Gradebook (also using the same port number that was used the first time you connected, if the port is different than the default).
6. Once reconnected to the DB, you will want to run the following command to prepare the DB to be used with the Gradebook WebApp.
    - `\i <path_to_folder_where_Gradebook_Directory_is>/src/db/prepareDB.psql`
    - This command will run the rest of the scripts that are located in the DB directory to make it so that the DB is ready for use with the server.
7. You will then want to run the following commands to populate information into the various tables in the DB:
    ```sql
        INSERT INTO <DB_Name>.Season VALUES(<numberSequentalGreaterEqualTo0>, <name>, <OneLetterCode>);
        INSERT INTO <DB_Name>.Term VALUES(1, <year>, <season>, <startDate>, <endDate>);
        INSERT INTO <DB_Name>.Instructor VALUES(ID, firstName, middleName, lastName, Department, emailAddress);
        INSERT INTO <DB_Name>.Student VALUES(ID, firstName, middleName, lastName, schoolIDNumber, emailAddress, major, year);
    ```
    - These commands can be run as many times as they are needed to add in all of the information needed to get the DB up and running.

***
## WebServer Setup
1. [Node JS](https://nodejs.org/en/) is required to run the Gradebook Server. Please follow the link in this step to download and install Node JS.
2. Once Node JS is setup, navigate to the directory /src/webapp/client and open the index.html document.
3. On Line 117 make the following change to the code:
    ```html
        	<input id="port" type="text" value="5432"/>
    ```
    - Change the `value` field to the number of the port being used for Postgres
4. On Line 121 make the following change to the code:
    ```html
        <input id="database" type="text" value="gradebook"/>
    ```
    - Change the `value` field to the name of the Database that you created.
5. Save your changes to the document and close the document.
6. Open a command window in the /src/webapp directory
7. Run the command `npm install`
    - This will install any Node JS modules that are needed to run Gradebook.
8. Once the installation has completed, run one of the following commands to start the server:
    - Without logging to a text document: `npm start`
    - With logging output to a text document: `npm start *>> GradebookLog.txt`
***
## Connecting to the Client
There are a few different ways that a user could connect to the Gradebook client:
1. If they are on the local machine where the server is running, entering `127.0.0.1` in a browser will load the system.
2. If they are connecting from a machine within your network:
    - Enter in the IP address of the machine running Gradebook: example:`10.2.3.40`
    - Enter in the DNS Hostname for the server: example: `gradebook.institution.edu`
3. If the User is connecting remotely from off premise:
    - ***NOTE***: This will only work if the port is forwarded through any firewalls that are being used and the machine is allowed to be accessed remotely.
    - Entering the external IP address of the Server: example: `1.2.3.46`
    - Entering the DNS Hostname of the Server: example: `Gradebook.institution.edu`
        - This method is highly recommended because it is much more secure and easier to enter than the IP Address every time.
