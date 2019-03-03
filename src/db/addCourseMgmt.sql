-- addCourseMgmt.sql

-- Bruno DaSilva, Cristian Fitzgerald, Eliot Griffin, Kenneth Kozlowski
-- CS298-01 Spring 2019, Team GEEKS

-- version 1



-- function to add a course / add a row to the course table
-- parameters: Num (VARCHAR)  -- i.e "CS/MAT165"
--             Title (VARCHAR) -- i.e "Discrete Math"
--             Credits (INT) -- i.e "4"
--


CREATE OR REPLACE FUNCTION insertCourse(Num VARCHAR, Title VARCHAR, Credits INT)

RETURN VOID AS
$$
BEGIN 

    -- check if course exists
    -- and throw exception if exists already
    IF EXISTS
    (
        SELECT * FROM Course WHERE Course.Number = Num AND Course.Title = Title)
    )
    THEN
        RAISE EXCEPTION 'Course already exists';
    END IF;

    -- insert course
    INSERT INTO Course VALUES (Num, Title, Credits);

END
$$ 
LANGUAGE plpgsql;







