-- addCourseMgmt.sql

-- Bruno DaSilva, Cristian Fitzgerald, Eliot Griffin, Kenneth Kozlowski
-- CS298-01 Spring 2019, Team GEEKS

-- version 1



-- function to add a course / add a row to the course table
-- parameters: Department 1 (VARCHAR)  -- i.e "CS"
--             Department 2 (VARCHAR)  -- i.e "MAT" or NULL
--             Num (VARCHAR)  -- i.e "165"
--             Title (VARCHAR) -- i.e "Discrete Math"
--             Credits (INT) -- i.e "4"
--


CREATE OR REPLACE FUNCTION insertCourse(Dept1 VARCHAR, Dept2 VARCHAR,
                             Num VARCHAR, Title VARCHAR, Credits INT)

RETURN VOID AS
$$
DECLARE fullNum VARCHAR(11); -- i.e. "CS/MAT165"
BEGIN 

    -- test if Dept 2 is NULL
    -- and assign value to fullNum
    If $2 IS NULL
        THEN 
         -- i.e CS || 170  -> "CS170"
            fullNum := $1 || $3;
    ELSE
        -- i.e CS || / || MAT || 165 -> "CS/MAT165"
        Num := $1 || '/' || $2 || $3;
         
    END IF;


    -- check if course exists
    -- and throw exception if exists already
    IF EXISTS
    (
        SELECT * FROM Course WHERE Course.Number = fullNum AND Course.Title = Title)
    )
    THEN
        RAISE EXCEPTION 'Course already exists';
    END IF;

    -- insert course
    INSERT INTO Course VALUES (fullNum, Title, Credits);

END
$$ 
LANGUAGE plpgsql;







