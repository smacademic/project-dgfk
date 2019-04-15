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


-- function to check if a course exists
-- parameters: Term, Course, and SectionNumber

CREATE OR REPLACE FUNCTION sectionExists(sTerm INT, sCourse VARCHAR(11),
                                         num VARCHAR (3), sCRN VARCHAR(5))
RETURNS BOOL AS
$$
BEGIN
   -- Test if section exists
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

   -- Section does not exist
   RETURN false;
END
$$
LANGUAGE plpgsql;


-- function to add a section / add a row to the section table
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

    -- check if section exists
    -- and throw exception if exists already
    IF sectionExists(term, course, num, CRN) IS true
    THEN
       RAISE EXCEPTION 'Section already exists';
    END IF;

    -- insert course
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


-- function to remove a section
-- parameters: secID

CREATE OR REPLACE FUNCTION removeSection(secID INT)

RETURNS VOID AS
$$
BEGIN

IF EXISTS 
(
   SELECT * FROM Gradebook.Section WHERE Section.ID = secID
)
THEN
   DELETE FROM Gradebook.Section WHERE Section.ID = secID;
ELSE
   RAISE EXCEPTION 'Section does not exist';
END IF;

END
$$
LANGUAGE plpgsql;


--Function to update a row in the Section table
-- parameters: 
--  Term, Course, CRN, and SectionNumber of section to be modified.
--  Possible new SectionNumber, CRN, Schedule, Capacity, Location, MidtermDate.
--
-- excludes updates to: ID, term, course, instructor(s), startDate, endDate,

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

   -- update
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


--Function to assign (add/remove) an instructor to a section
-- parameters: Section ID and Instructor ID(s)

CREATE OR REPLACE FUNCTION assignInstructor(secID INT, I1 INT, I2 INT, I3 INT)

RETURNS VOID AS
$$
BEGIN
   -- test if Section wanting to add/remove instructor to exists
   IF NOT EXISTS 
   (
      SELECT * FROM Gradebook.Section WHERE Section.ID = secID
   )
   THEN
      RAISE EXCEPTION 'Section does not exist';
   END IF;

      -- test if I1 is NULL
   IF(I1 IS NULL)
   THEN
      RAISE EXCEPTION 'Instructor 1 cannot be NULL';
   END IF;

   -- test if I1 equals I2 or I3 or if I2=I3 if not null
   IF (I1 = I2 OR I1 = I3 OR (I2 IS NOT NULL && I2 = I3))
   THEN 
       RAISE EXCEPTION 'Section cannot have repeat instructor';
   END IF;



   UPDATE Gradebook.Section
      SET Instructor1 = I1,
          Instructor2 = I2,
          Instructor3 = I3
      WHERE Section.ID = secID;
   END
   $$
LANGUAGE plpgsql;

