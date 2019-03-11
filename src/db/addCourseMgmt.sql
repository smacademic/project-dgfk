-- addCourseMgmt.sql

-- Bruno DaSilva, Cristian Fitzgerald, Eliot Griffin, Kenneth Kozlowski
-- CS298-01 Spring 2019, Team GEEKS

-- version 1



-- function to add a course / add a row to the course table
-- parameters: Num (VARCHAR)  -- i.e "CS/MAT165"
--             newTitle (VARCHAR) -- i.e "Discrete Math"
--             Credits (INT) -- i.e "4"
--


DROP FUNCTION IF EXISTS insertCourse(Num VARCHAR,Title VARCHAR,Credits INT);

CREATE OR REPLACE FUNCTION insertCourse(Num VARCHAR, newTitle VARCHAR, Credits INT)

RETURNS VOID AS
$$
BEGIN 

    -- check if course exists
    -- and throw exception if exists already
    IF EXISTS
    (
        SELECT * FROM Course WHERE Course.Number = Num AND Course.Title = newTitle
    )
    THEN
        RAISE EXCEPTION 'Course already exists';
    END IF;

    -- insert course
    INSERT INTO Course VALUES (Num, newTitle, Credits);

END
$$ 
LANGUAGE plpgsql;


-- function to remove a course / remove a row in the course table
-- parameters: Num (VARCHAR) -- i.e "CS/MAT165"
--             oldTitle (VARCHAR) -- i.e "Discrete Math"

DROP FUNCTION IF EXISTS removeCourse(Num VARCHAR, oldTitle VARCHAR);

CREATE OR REPLACE FUNCTION removeCourse(Num VARCHAR, oldTitle VARCHAR)
   RETURNS VOID AS
$$
BEGIN 

   -- Make sure course exists
   -- throw exception otherwise
   IF NOT EXISTS 
   (
      SELECT * FROM Course WHERE Course.Number = Num AND Course.Title = oldTitle
   )
   THEN 
      RAISE EXCEPTION 'Course does not exist';
   END IF;
   
   -- remove course
   DELETE FROM Course WHERE Course.Number = Num AND Course.Title = oldTitle;

END
$$
LANGUAGE plpgsql;






