-- addEnrolleeMgmt.sql

-- Team GEEKS, CS298 Spring 2019


-- Function to enroll a student to a section
-- parameters: student's school ID, and section ID
CREATE OR REPLACE FUNCTION enrollStudent(schoolID VARCHAR(50), secID INT)
RETURNS VOID AS
$$
DECLARE 
   studentID INT; -- hold student ID (PK for student)
   studentMajor VARCHAR;
   studentYear VARCHAR;
BEGIN
 -- test if Section exists
   IF NOT EXISTS 
   (
      SELECT * FROM Gradebook.Section WHERE Section.ID = secID
   )
   THEN
      RAISE EXCEPTION 'Section does not exist';
   END IF;

-- test if Student exists
   IF NOT EXISTS 
   (
      SELECT * FROM Gradebook.Student
      WHERE Student.SchoolIssuedID = schoolID
   )
   THEN
      RAISE EXCEPTION 'Student with that ID does not exist';
   END IF;

-- get studentID (PK) for the student instance
   SELECT ID
   INTO studentID
   FROM Gradebook.Student
   WHERE Student.SchoolIssuedID = schoolID;

-- get student's major
   SELECT Major
   INTO studentMajor
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
   SELECT Year
   INTO studentYear
   FROM Gradebook.Student
   WHERE Student.SchoolIssuedID = schoolID;

-- create enrollee
   INSERT INTO Gradebook.Enrollee VALUES
   (
      studentID,
      secID,
      NULL,
      studentYear,
      studentMajor,
      NULL,
      NULL,
      NULL,
      NULL,
      NULL,
      NULL
   );

END
$$
LANGUAGE plpgsql;

--Function to remove a student from a section / delete enrollee
-- parameters: student's school ID, and the section ID
CREATE OR REPLACE FUNCTION removeEnrollee(schoolID VARCHAR(50), secID INT)
RETURNS VOID AS
$$
DECLARE 
   studentID INT; -- hold student ID (PK for student)
BEGIN
 -- test if Section exists
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

-- test if Enrollee exists
   IF NOT EXISTS 
   (
      SELECT * FROM Gradebook.Enrollee
      WHERE Enrollee.Student = studentID AND
            Enrollee.Section = secID
   )
   THEN
      RAISE EXCEPTION 'Student with that ID does not exist';
   END IF;

-- remove enrollee from section
   DELETE FROM Gradebook.Enrollee 
   WHERE Enrollee.Section = secID AND
         Enrollee.Student = studentID;
END
$$
LANGUAGE plpgsql;
