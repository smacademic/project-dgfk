\o spoolInstructorMgmt.txt

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

--Function to get details of all known instructors
DROP FUNCTION IF EXISTS nerds.getInstructors();

CREATE FUNCTION nerds.getInstructors()
RETURNS TABLE
(
   ID INT,
   FName VARCHAR(50),
   MName VARCHAR(50),
   LName VARCHAR(50),
   Department VARCHAR(30),
   Email VARCHAR(319)
)
AS
$$

   SELECT ID, FName, MName, LName, Department, Email
   FROM nerds.Instructor;

$$ LANGUAGE sql
   STABLE; --no need for RETURN NULL ON... because the function takes no input


--function to get details of the instructor with the given e-mail address
-- performs a case-insensitive match of email address;
-- returns 0 or 1 row: Instructor.Email is unique;
DROP FUNCTION IF EXISTS nerds.getInstructor(nerds.Instructor.Email%TYPE);

CREATE FUNCTION nerds.getInstructor(Email nerds.Instructor.Email%TYPE)
RETURNS TABLE
(
   ID INT,
   FName VARCHAR(50),
   MName VARCHAR(50),
   LName VARCHAR(50),
   Department VARCHAR(30)
)
AS
$$

   SELECT ID, FName, MName, LName, Department
   FROM nerds.Instructor
   WHERE LOWER(TRIM(Email)) = LOWER(TRIM($1));

$$ LANGUAGE sql
   STABLE
   RETURNS NULL ON NULL INPUT
   ROWS 1; --returns at most one row


--function to get details of the instructor with the given ID
DROP FUNCTION IF EXISTS nerds.getInstructor(INT);

CREATE FUNCTION nerds.getInstructor(instructorID INT)
RETURNS TABLE
(
   FName VARCHAR(50),
   MName VARCHAR(50),
   LName VARCHAR(50),
   Department VARCHAR(30),
   Email VARCHAR(319)
)
AS
$$

   SELECT FName, MName, LName, Department, Email
   FROM nerds.Instructor
   WHERE ID = $1;

$$ LANGUAGE sql
   STABLE
   RETURNS NULL ON NULL INPUT
   ROWS 1;

--end spooling
\o


