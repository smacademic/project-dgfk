--Team NERDS: Cristian Fitzgerald, Shelby Simpson; CS305-71: Fall 2018

--seedGradeTable.SQL version 1

--To be run by the super user during gradeBook setup
--NOTE: Modification of these values after initial setup is not possible if there are dependent tables in the database; I.E. make sure the values are correct before you run create.sql
--ALSO, you must modify the grade table in create.sql to match the values defined here, due to the constraints on the grade table called LetterChoices and GPAChoices.
--ALSO, please note that you must change the computeGPA function based on W and SA

--spool results
\o spoolseedGradeTable.txt

--Diagnostics:
\qecho -n 'Script run on '
\qecho -n `date /t`
\qecho -n 'at '
\qecho `time /t`
\qecho -n 'Script run by ' :USER ' on server ' :HOST ' with db ' :DBNAME
\qecho ' '
\qecho --------------

INSERT INTO nerds.grade(Letter,GPA) VALUES
 ('A+',4.333),
 ('A',4),
 ('A-',3.667),
 ('B+',3.333),
 ('B',3),
 ('B-',2.667),
 ('C+',2.333),
 ('C', 2),
 ('C-', 1.667),
 ('D+',1.333),
 ('D', 1),
 ('D-', 0.667),
 ('F',0),
 ('W',NULL);


--end spooling 
\o