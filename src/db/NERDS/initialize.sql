--Team NERDS: Cristian Fitzgerald, Shelby Simpson; CS305-71: Fall 2018

--initialize.SQL version 1

--To initialize the DB for testing

--Based on: I dont wanna type everything in

--spool results
\o spoolInitialize.txt

--Suppress notices when running scripts
SET client_min_messages TO WARNING;

--Diagnostics:
\qecho -n 'Script run on '
\qecho -n `date /t`
\qecho -n 'at '
\qecho `time /t`
\qecho -n 'Script run by ' :USER ' on server ' :HOST ' with db ' :DBNAME
\qecho ' '
\qecho --------------

SET SCHEMA 'nerds';

\i 'E:/CS_305/NERDS/V1.0/src/SQL/createTables.sql'
\i 'E:/CS_305/NERDS/V1.0/src/SQL/seedGradeTable.sql'
\i 'E:/CS_305/NERDS/V1.0/src/SQL/gradeTierMgmt.sql'
\i 'E:/CS_305/NERDS/V1.0/src/SQL/assessmentKindMgmt.sql'
\i 'E:/CS_305/NERDS/V1.0/src/SQL/assessmentItemMgmt.sql'
\i 'E:/CS_305/NERDS/V1.0/src/SQL/submissionMgmt.sql'
\i 'E:/CS_305/NERDS/V1.0/src/SQL/instructorMgmt.sql'
\i 'E:/CS_305/NERDS/V1.0/src/SQL/userRoleMgmt.sql'
\i 'E:/CS_305/NERDS/V1.0/src/SQL/populate.sql'

\qecho Please work

--end spooling
\o