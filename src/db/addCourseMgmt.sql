-- addCourseMgmt.sql

-- Bruno DaSilva, Cristian Fitzgerald, Eliot Griffin, Kenneth Kozlowski
-- CS298-01 Spring 2019, Team GEEKS



-- function to add a course / add a row to the course table
-- parameters: Num (VARCHAR)  -- i.e "CS/MAT165"
--             newTitle (VARCHAR) -- i.e "Discrete Math"
--             Credits (INT) -- i.e "4"


CREATE OR REPLACE FUNCTION insertCourse(Num VARCHAR, newTitle VARCHAR, Credits INT)


RETURNS VOID AS
$$
BEGIN

    -- check if course exists
    -- and throw exception if exists already

    IF courseExists(Num,newTitle,NULL) IS true

    THEN
        RAISE EXCEPTION 'Course already exists';
    END IF;

    -- insert course
    INSERT INTO Gradebook.Course VALUES (Num, newTitle, Credits);

END
$$
LANGUAGE plpgsql;


-- function to remove a course / remove a row in the course table
-- parameters: Num (VARCHAR) -- i.e "CS/MAT165"
--             oldTitle (VARCHAR) -- i.e "Discrete Math"


CREATE OR REPLACE FUNCTION removeCourse(Num VARCHAR, oldTitle VARCHAR)
RETURNS VOID AS

$$
BEGIN

   -- Make sure course exists
   -- throw exception otherwise
   IF courseExists(Num, oldTitle, NULL) IS false
   THEN 
      RAISE EXCEPTION 'Course does not exist';
   END IF;

   -- remove course
   DELETE FROM Gradebook.Course WHERE Course.Number = Num 
                                AND Course.Title = oldTitle;


END
$$
LANGUAGE plpgsql;



-- function to modify a course / update a row in the course table
-- parameters: currentNum (VARCHAR) -- Num of row to update
--             currentTitle (VARCHAR) -- Title of row to update
--             modNum (VARCHAR) -- possible new Num for that row
--             modTitle (VARCHAR) -- possiuble new Title for that row
--             modCredits (INT) -- possible new Title for that row

CREATE OR REPLACE FUNCTION modifyCourse(currentNum VARCHAR, currentTitle VARCHAR,
                           modNum VARCHAR, modTitle VARCHAR, modCredits INT)
RETURNS VOID AS
$$
BEGIN
   -- Make sure course wanting to be modified exists
   -- throw exception otherwise
   IF courseExists(currentNum, currentTitle,NULL) IS false
   THEN 
      RAISE EXCEPTION 'Course does not exist';
   END IF;

   -- Make sure that wanted modifications do not conflict with current Courses
   -- throw exception otherwise
   IF courseExists(modNum,modTitle,modCredits) IS true
   THEN
      RAISE EXCEPTION 'Modifications conflict with an already existing Course';
   END IF;
   
   -- update the row
   UPDATE Gradebook.Course 
      SET Number = modNum, 
          Title = modTitle, 
          Credits = modCredits
      WHERE Course.Title = currentTitle 
            AND Course.Number = currentNum;

END
$$
LANGUAGE plpgsql;


-- function to test if a course exists
-- parameters: cNumber(VARCHAR) 
--             cTitle (VARCHAR)
--             cCredits (INT)
--
-- this function is called by:
--    insertCourse(), removeCourse(), modifyCourse()

CREATE OR REPLACE FUNCTION courseExists(cNumber VARCHAR, cTitle VARCHAR, cCredits INT)
RETURNS BOOL AS
$$
BEGIN

   -- evaluate if no credits are given
   IF cCredits IS NULL
   THEN 
      IF EXISTS 
      (
         SELECT * FROM Gradebook.Course WHERE Course.Number = cNumber
                              AND Course.Title = cTitle
      )
      THEN
         RETURN true;
      END IF;
   END IF;
   
   -- evaluate if credits are given
   IF EXISTS
   (
      SELECT * FROM Gradebook.Course WHERE Course.Number = cNumber
                              AND Course.Title = cTitle
                              AND Course.Credits = cCredits
   )
   THEN 
      RETURN true;
   END IF;
   
   -- return false because course does not exist
   RETURN FALSE;

END

$$
LANGUAGE plpgsql;

-- function to return a list of all current courses
-- parameters: currently none, but if a search functionality is to be implemented, can be added

CREATE OR REPLACE FUNCTION getCourses()
RETURNS SETOF RECORD AS
$$
BEGIN
	SELECT Number,Title,Credits
	FROM Gradebook.Course;
END

$$
LANGUAGE plpgsql;


