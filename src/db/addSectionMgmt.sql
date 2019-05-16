--addSectionMgmt.sql - Gradebook

--Sean Murthy
--Data Science & Systems Lab (DASSL), Western Connecticut State University (WCSU)

--(C) 2017- DASSL. ALL RIGHTS RESERVED.
--Licensed to others under CC 4.0 BY-SA-NC
--https://creativecommons.org/licenses/by-nc-sa/4.0/

--PROVIDED AS IS. NO WARRANTIES EXPRESSED OR IMPLIED. USE AT YOUR OWN RISK.

--This script creates functions related to sections
-- the script should be run as part of application installation


-----------------------------------------------------------------------------------
-- Changes were made to the original script by Team GEEKS, CS298 Spring 2019


--Suppress messages below WARNING level for the duration of this script
SET LOCAL client_min_messages TO WARNING;


-- Function to check if a Section exists
-- parameters: sTerm (INT) - i.e "1" 
--             sCourse (VARCHAR) - i.e "CS170"
--             num (VARCHAR) - i.e "071"
--             sCRN (VARCHAR) - i.e "20334"

CREATE OR REPLACE FUNCTION sectionExists(sTerm INT, sCourse VARCHAR(11),
                                         num VARCHAR (3), sCRN VARCHAR(5))
RETURNS BOOL AS
$$
BEGIN
   -- Check if section exists - return true
   IF EXISTS
   (
      SELECT * FROM Gradebook.Section WHERE Section.Term = sTerm AND
                                            Section.Course = sCourse AND
                                            Section.SectionNumber = num AND
                                            Section.CRN = sCRN
   )
   THEN  
      RETURN true;
   END IF;

   -- Section does not exist - return false
   RETURN false;
END
$$
LANGUAGE plpgsql;


-- Function to add a section / add a row to the section table
-- parameters: all attributes of Section table excluding ID

CREATE OR REPLACE FUNCTION addSection(term INT, course VARCHAR(11),
                                      capacity INT, num VARCHAR(3),
                                      CRN VARCHAR(5),schedule VARCHAR(7), 
                                      Loc VARCHAR(25),sDate DATE, 
                                      eDate DATE, mDate DATE,
                                      I1 INT, I2 INT, I3 INT)

RETURNS VOID AS
$$
BEGIN
    -- Check if section exists
    -- and throw exception if exists already
    IF sectionExists(term, course, num, CRN) IS true
    THEN
       RAISE EXCEPTION 'Section already exists';
    END IF;

    -- Insert Section
    INSERT INTO Gradebook.Section VALUES
    (
       DEFAULT, -- ID
       term,
       course,
       num, -- section number
       CRN,
       schedule,
       capacity,
       Loc, -- location
       sDate, -- startDate
       eDate, -- endDate
       mDate, -- MidtermDate
       I1, -- Instructor 1
       I2,
       I3
    );

END
$$
LANGUAGE plpgsql;


-- Function to remove a section
-- parameters: secID (INT) -- i.e "1" -- DB PK

CREATE OR REPLACE FUNCTION removeSection(secID INT)
RETURNS VOID AS
$$
BEGIN

-- Check if Section w/given ID exists
-- Delete if exists
IF EXISTS 
(
   SELECT * FROM Gradebook.Section WHERE Section.ID = secID
)
THEN
   DELETE FROM Gradebook.Section WHERE Section.ID = secID;
ELSE
   -- Section does not exist
   RAISE EXCEPTION 'Section does not exist';
END IF;

END
$$
LANGUAGE plpgsql;


--Function to update a row in the Section table
-- parameters: 
--  ID of the Section (DB PK)
--  Term, Course, CRN, and SectionNumber of section to be modified (curr__).
--  Possible new SectionNumber, CRN, Schedule, Capacity, Location, MidtermDate.
--
-- excludes updates to: ID, Term, Course, Instructor(s), startDate, endDate,

CREATE OR REPLACE FUNCTION modifySection(secID INT, currTerm INT, 
                                         currCourse VARCHAR(11), 
                                         currSecNum VARCHAR(3),
                                         currCRN VARCHAR(5),
                                         modTerm INT,
                                         modCourse VARCHAR(11),
                                         modSecNum VARCHAR(3),
                                         modCRN VARCHAR(5),
                                         modSchedule VARCHAR(7),
                                         modCapacity INT,
                                         modLocation VARCHAR(25),
                                         modMidtermDate DATE)
RETURNS VOID AS
$$
BEGIN
   -- check if section attempting to modify exists
    IF sectionExists(currTerm, currCourse, currSecNum, currCRN ) IS false
    THEN
       RAISE EXCEPTION 'Section does not exist';
    END IF;

   -- test if requested modifications conflict with an existing section
   IF sectionExists(modTerm, modCourse, modSecNum, modCRN) IS true
    THEN
       RAISE EXCEPTION 'Modifications conflict with an already existing Section';
    END IF;

   -- update section to have mod___ values
   UPDATE Gradebook.Section
      SET Term = modTerm,
          Course = modCourse,
          SectionNumber = modSecNum,
          CRN = modCRN,
          Schedule = modSchedule,
          Capacity = modCapacity,
          Location = modLocation,
          MidtermDate = modMidtermDate
      WHERE Section.ID = secID;

END
$$
LANGUAGE plpgsql;


-- Function to get a course's sections 
-- parameters: cTitle (VARCHAR) -- i.e "Intro to Programming"
-- returns: sections' ID (DB PK) and SecNum

CREATE OR REPLACE FUNCTION getCourseSections(cNumber VARCHAR(100))
RETURNS 
Table( 
   outID INT,
   outSecNum VARCHAR)
AS
$$
BEGIN
RETURN QUERY
	SELECT S.ID, S.SectionNumber
	FROM Gradebook.Section S INNER JOIN Gradebook.Course C
   ON C.Number = cNumber AND C.Number = S.Course;
END
$$
LANGUAGE plpgsql;


--Function to get ID of section matching a year-season-course-section# combo
-- season is "season identification"
DROP FUNCTION IF EXISTS Gradebook.getSectionID(NUMERIC(4,0), VARCHAR(20),
                                               VARCHAR(8), VARCHAR(3)
                                              );

CREATE OR REPLACE FUNCTION Gradebook.getSectionID(year NUMERIC(4,0),
                                       seasonIdentification VARCHAR(20),
                                       course VARCHAR(11),
                                       sectionNumber VARCHAR(3)
                                      )
RETURNS INT
AS
$$

   SELECT N.ID
   FROM Gradebook.Section N JOIN Gradebook.Term T ON N.Term  = T.ID
   WHERE T.Year = $1
         AND T.Season = Gradebook.getSeasonOrder($2)
         AND LOWER(N.Course) = LOWER($3)
         AND LOWER(N.SectionNumber) = LOWER($4);

$$ LANGUAGE sql
   STABLE
   RETURNS NULL ON NULL INPUT;


--Function to get ID of section matching a year-season-course-section# combo
-- season is "season order"
-- reuses the season-identification version
-- this function exists to support clients that pass season order as a number
DROP FUNCTION IF EXISTS Gradebook.getSectionID(NUMERIC(4,0), NUMERIC(1,0),
                                               VARCHAR(8), VARCHAR(3)
                                              );

CREATE OR REPLACE FUNCTION Gradebook.getSectionID(year NUMERIC(4,0),
                                       seasonOrder NUMERIC(1,0),
                                       course VARCHAR(11),
                                       sectionNumber VARCHAR(3)
                                      )
RETURNS INT
AS
$$

    SELECT Gradebook.getSectionID($1, $2::VARCHAR, $3, $4);

$$ LANGUAGE sql
 STABLE
 RETURNS NULL ON NULL INPUT;


--Function to get details of section matching a year-season-course-section# combo
-- input season is "season identification"
-- StartDate column contains term start date if section does not have start date;
-- likewise with EndDate column
DROP FUNCTION IF EXISTS Gradebook.getSection(NUMERIC(4,0), VARCHAR(20),
                                             VARCHAR(8), VARCHAR(3)
                                            );

CREATE OR REPLACE FUNCTION Gradebook.getSection(year NUMERIC(4,0),
                                     seasonIdentification VARCHAR(20),
                                     course VARCHAR(11), sectionNumber VARCHAR(3)
                                    )
RETURNS TABLE
(
   ID INT,
   Term INT,
   Course VARCHAR(11),
   SectionNumber VARCHAR(3),
   CRN VARCHAR(5),
   Schedule VARCHAR(7),
   Capacity INT,
   Location VARCHAR(25),
   StartDate DATE,
   EndDate DATE,
   MidtermDate DATE,
   Instructor1 INT,
   Instructor2 INT,
   Instructor3 INT
)
AS
$$

   SELECT N.ID, N.Term, N.Course, N.SectionNumber, N.CRN, 
          N.Schedule, N.Capacity, N.Location,
          COALESCE(N.StartDate, T.StartDate), COALESCE(N.EndDate, T.EndDate),
          N.MidtermDate, N.Instructor1, N.Instructor2, N.Instructor3
   FROM Gradebook.Section N JOIN Gradebook.Term T ON N.Term  = T.ID
   WHERE T.Year = $1
         AND T.Season = Gradebook.getSeasonOrder($2)
         AND LOWER(N.Course) = LOWER($3)
         AND LOWER(N.SectionNumber) = LOWER($4);

$$ LANGUAGE sql
   STABLE
   RETURNS NULL ON NULL INPUT
   ROWS 1;


--Function to get details of section matching a year-season-course-section# combo
-- input season is "season order"
-- reuses the season-identification version
-- this function exists to support clients that pass season order as a number
DROP FUNCTION IF EXISTS Gradebook.getSection(NUMERIC(4,0), NUMERIC(1,0),
                                             VARCHAR(8), VARCHAR(3)
                                            );

CREATE OR REPLACE FUNCTION Gradebook.getSection(year NUMERIC(4,0),
                                                seasonOrder NUMERIC(1,0),
                                                course VARCHAR(11), 
                                                sectionNumber VARCHAR(3)
                                               )
RETURNS TABLE
(
  ID INT,
  Term INT,
  Course VARCHAR(11),
  SectionNumber VARCHAR(3),
  CRN VARCHAR(5),
  Schedule VARCHAR(7),
  Capacity INT,
  Location VARCHAR(25),
  StartDate DATE,
  EndDate DATE,
  MidtermDate DATE,
  Instructor1 INT,
  Instructor2 INT,
  Instructor3 INT
)
AS
$$

   SELECT ID, Term, Course, SectionNumber, CRN, Schedule, Capacity, Location,
          StartDate, EndDate,
          MidtermDate, Instructor1, Instructor2, Instructor3
   FROM Gradebook.getSection($1, $2::VARCHAR, $3, $4);

$$ LANGUAGE sql
  STABLE
  RETURNS NULL ON NULL INPUT
  ROWS 1;



-- Function to return all sections 
-- returns sections ordered by Course

CREATE OR REPLACE FUNCTION getSections()
RETURNS Table(outID INT, outTerm INT, outCourse VARCHAR, outSecNum VARCHAR,
              outCRN VARCHAR, outSchedule VARCHAR, outCap INT, outLoc VARCHAR,
              outSDate DATE, outEDate DATE, outMDate DATE, 
              outI1 INT, outI2 INT, outI3 INT) AS
$$
BEGIN

RETURN QUERY 
	SELECT ID, Term, Course, SectionNumber, CRN, Schedule, Capacity, Location,
          StartDate, EndDate, MidtermDate, Instructor1, Instructor2, Instructor3
   FROM Gradebook.Section
   ORDER BY Course;

END
$$
LANGUAGE plpgsql;


-- Function to return all sections of a Course given its title
-- parameters: ctitle (VARCHAR) - i.e. "Intro to Programming"

CREATE OR REPLACE FUNCTION getSections(cTitle VARCHAR)
RETURNS Table(outID INT, outTerm INT, outCourse VARCHAR, outSecNum VARCHAR,
              outCRN VARCHAR, outSchedule VARCHAR, outCap INT, outLoc VARCHAR,
              outSDate DATE, outEDate DATE, outMDate DATE, 
              outI1 INT, outI2 INT, outI3 INT) AS
$$
BEGIN

RETURN QUERY 
	SELECT S.ID, S.Term, S.Course, S.SectionNumber, S.CRN, S.Schedule, S.Capacity, 
          S.Location, S.StartDate, S.EndDate, S.MidtermDate, 
          S.Instructor1, S.Instructor2, S.Instructor3 
   FROM Gradebook.Section S INNER JOIN Gradebook.Course C
   ON C.Title = cTitle AND C.Number = S.Course
   ORDER BY SectionNumber;

END
$$
LANGUAGE plpgsql;


-- Function to assign (add/remove) an instructor to a section
-- parameters: secID (INT) - i.e. "1" - DB PK
--             I1, I2, I3 (INT) - i.e  "2" - DB PK for Instructor
-- if value of '-1' is sent in for an instructor value,
-- then it is assumed that no change is wanted for that instructor value
-- currently all code is in 1 function
-- did not have enough time to split into multiple functions

CREATE OR REPLACE FUNCTION assignInstructor(secID INT, I1 INT, I2 INT, I3 INT)
RETURNS VOID AS
$$
BEGIN
   -- Check if Section wanting to add/remove instructor to exists
   IF NOT EXISTS 
   (
      SELECT * FROM Gradebook.Section WHERE Section.ID = secID
   )
   THEN
      RAISE EXCEPTION 'Section does not exist';
   END IF;

      -- Check if I1 is NULL
   IF(I1 IS NULL)
   THEN
      RAISE EXCEPTION 'Instructor 1 cannot be NULL';
   END IF;

   -- Check if I1 equals I2 or I3 or if I2=I3 if not null
   IF ((I1 > -1 AND (I1 = I2 OR I1 = I3 )) OR (I2 IS NOT NULL AND I2 > 0 AND I2 = I3))
   THEN 
       RAISE EXCEPTION 'Section cannot have repeat instructor';
   END IF;
   
   IF(I1 > -1)
   THEN
      -- Check if ID values exist in instructor table
      IF (SELECT instructorExists(I1)) is false
         THEN
            RAISE EXCEPTION 'ID for Instructor 1 does not exist';
      END IF;
   END IF;

   IF(I2 IS NOT NULL AND I2 > -1)
   THEN
      IF (SELECT instructorExists(I2)) is false
      THEN
         RAISE EXCEPTION 'ID for Instructor 2 does not exist';
      END IF;
   END IF;

   IF(I3 IS NOT NULL AND I3 > -1)
   THEN
      IF(SELECT instructorExists(I3)) IS false
      THEN
         RAISE EXCEPTION 'ID for Instructor 3 does not exist';
      END IF;
   END IF;


   -- Check which instructors need changing

   -- At least I1 and I2 and/or I3
   IF(I1 > -1 AND (I2 > -1 OR I3 > -1 OR I2 IS NULL OR I3 IS NULL))
   THEN

         -- Check if I2 needs changing
         IF(I2 > -1 OR I2 IS NULL)
         THEN

            -- Check if I3 needs changing,
            -- if so, update all instructors
            IF(I3 > -1 OR I3 IS NULL)
            THEN
               UPDATE Gradebook.Section
                  SET Instructor1 = I1,
                     Instructor2 = I2,
                     Instructor3 = I3
                  WHERE Section.ID = secID;
            ELSE
            -- update I1 and I2. I3 is confirmed not changed
               UPDATE Gradebook.Section
               SET Instructor1 = I1,
                   Instructor2 = I2
               WHERE Section.ID = secID;
            END IF;
         ELSE
         -- update I1 and I3. I2 is confirmed not changed
            UPDATE Gradebook.Section
            SET Instructor1 = I1,
                Instructor3 = I3
            WHERE Section.ID = secID;
         END IF;

   -- update I1. I2 and I3 are confirmed not changed
   ELSIF(I1 > -1)
   THEN
      UPDATE Gradebook.Section
      SET Instructor1 = I1
      WHERE Section.ID = secID;

   
   ELSIF(I2 > -1 OR I3 > -1 OR I2 IS NULL OR I3 IS NULL)
   THEN

      -- Check if I2 needs changing
      IF(I2 > -1 OR I2 IS NULL)
      THEN
         -- Check if I3 needs changing,
         -- if so, update I2 and I3 instructors
         IF(I3 > -1 OR I3 IS NULL)
         THEN
            UPDATE Gradebook.Section
               SET Instructor2 = I2,
                   Instructor3 = I3
               WHERE Section.ID = secID;
         ELSE
         -- update I2. I1 and I3 is confirmed not changed
            UPDATE Gradebook.Section
            SET Instructor2 = I2
            WHERE Section.ID = secID;
         END IF;
      ELSE
      -- update I3. I1 and I2 are confirmed not changed
         UPDATE Gradebook.Section
         SET Instructor3 = I3
         WHERE Section.ID = secID;
      END IF;
   END IF;
      

END
$$
LANGUAGE plpgsql;