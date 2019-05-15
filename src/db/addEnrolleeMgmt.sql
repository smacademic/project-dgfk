-- addEnrolleeMgmt.sql

-- Bruno DaSilva, Cristian Fitzgerald, Eliot Griffin, Kenneth Kozlowski
-- CS298-01 Spring 2019, Team GEEKS

----------------------------------------------------------------------------------

-- Function to enroll a student to a section
-- parameters: schoolID (VARCHAR) - i.e "50225892"
--             section ID (INT) - i.e "072"
--
-- This function sets the following attributes of the enrollee to NULL:
--    Date Enrolled, 
--    Midterm (weight aggregate, grade computed, grade awarded)
--    Final (weight aggregate, grade computed, grade awarded)

CREATE OR REPLACE FUNCTION enrollStudent(schoolID VARCHAR(50), secID INT)
RETURNS VOID AS
$$
DECLARE 
   studentID INT; -- hold student DB ID (PK for student table)
   studentMajor VARCHAR; -- student major - i.e. "Nursing"
   studentYear VARCHAR; -- hold student year - i.e "Junior"
BEGIN
 -- Check if Section exists
   IF NOT EXISTS 
   (
      SELECT * FROM Gradebook.Section WHERE Section.ID = secID
   )
   THEN
      RAISE EXCEPTION 'Section does not exist';
   END IF;

-- Check if Student exists
   IF NOT EXISTS 
   (
      SELECT * FROM Gradebook.Student
      WHERE Student.SchoolIssuedID = schoolID
   )
   THEN
      RAISE EXCEPTION 'Student with that ID does not exist';
   END IF;

-- get studentID for the student instance
   SELECT ID INTO studentID
   FROM Gradebook.Student
   WHERE Student.SchoolIssuedID = schoolID;

-- get student's major
   SELECT Major INTO studentMajor
   FROM Gradebook.Student
   WHERE Student.SchoolIssuedID = schoolID;

-- overwrite if NULL
-- current impementation of Student does not guarentee
-- that student major is not null - cannot be null in Enrollee
   IF (studentMajor IS NULL)
   THEN 
      studentMajor := 'Undeclared';
   END IF;

-- get student's year
   SELECT Year INTO studentYear
   FROM Gradebook.Student
   WHERE Student.SchoolIssuedID = schoolID;

-- create enrollee
   INSERT INTO Gradebook.Enrollee VALUES
   (
      studentID,
      secID,
      NULL, -- date enrolled
      studentYear,
      studentMajor,
      NULL, -- midterm weighted aggregate 
      NULL, -- midterm grade computed
      NULL, -- midterm grade awarded
      NULL, -- final weighted aggregate
      NULL, -- final grade computed
      NULL -- final grade awarded
   );

END
$$
LANGUAGE plpgsql;


--Function to remove a student from a section / delete enrollee
-- parameters: schoolID (VARCHAR) - i.e "50225892"
--             section ID (INT) - i.e "072"

CREATE OR REPLACE FUNCTION removeEnrollee(schoolID VARCHAR(50), secID INT)
RETURNS VOID AS
$$
DECLARE 
   studentID INT; -- hold student DB ID (PK for student table)
BEGIN
 -- Check if Section exists
    IF NOT EXISTS 
    (
        SELECT * FROM Gradebook.Section WHERE Section.ID = secID
    )
    THEN
        RAISE EXCEPTION 'Section does not exist';
    END IF;

-- get studentID (PK) for the student instance
   SELECT ID
   INTO studentID
   FROM Gradebook.Student
   WHERE Student.SchoolIssuedID = schoolID;

-- Check if Enrollee exists
   IF NOT EXISTS 
   (
      SELECT * FROM Gradebook.Enrollee
      WHERE Enrollee.Student = studentID AND
            Enrollee.Section = secID
   )
   THEN
      RAISE EXCEPTION 'Enrollee with that ID does not exist';
   END IF;

-- remove enrollee from section
   DELETE FROM Gradebook.Enrollee 
   WHERE Enrollee.Section = secID AND
         Enrollee.Student = studentID;
         
END
$$
LANGUAGE plpgsql;
