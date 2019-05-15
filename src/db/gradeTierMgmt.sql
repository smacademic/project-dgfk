--Team Gradebook: Cristian Fitzgerald, Shelby Simpson; CS305-71: Fall 2018

--gradeTierMgmt.SQL version 1

--This script contains all functions necessary for the API to facilitate interaction between the end user and the db concerning grade tier operations

--spool results
\o spoolgradeTierMgmt.txt

--Diagnostics:
\qecho -n 'Script run on '
\qecho -n `date /t`
\qecho -n 'at '
\qecho `time /t`
\qecho -n 'Script run by ' :USER ' on server ' :HOST ' with db ' :DBNAME
\qecho ' '
\qecho --------------

--addSectionGradeTier gets called when an instructor wants to add a grade tier to their section
DROP FUNCTION IF EXISTS Gradebook.addSectionGradeTier(INTEGER, VARCHAR(2), NUMERIC(5,2), NUMERIC(5,2));

CREATE OR REPLACE FUNCTION Gradebook.addSectionGradeTier
(IN sectionId INTEGER, 
IN letterGrade VARCHAR(2), 
IN lowPercentage NUMERIC(5,2), 
IN highPercentage NUMERIC(5,2))
RETURNS VOID AS
$$
    INSERT INTO Gradebook.Section_GradeTier (Section,LetterGrade,LowPercentage,HighPercentage) 
    VALUES
    ((SELECT ID FROM Gradebook.Section WHERE Gradebook.Section.ID = $1), 
    (SELECT Letter FROM Gradebook.Grade WHERE Gradebook.Grade.Letter = $2),
    $3,
    $4);
$$
LANGUAGE SQL;


--dropSectionGradeTier gets called when an instructor wants to remove a grade tier from their section
DROP FUNCTION IF EXISTS Gradebook.dropSectionGradeTier(INTEGER, VARCHAR(2));

CREATE OR REPLACE FUNCTION Gradebook.dropSectionGradeTier
(sectionId INTEGER, 
letterGrade VARCHAR(2))
RETURNS VOID AS
$$
    DELETE FROM Gradebook.Section_GradeTier 
    WHERE Section = $1 AND LetterGrade = $2;
$$ 
LANGUAGE SQL;


--getSectionGradeTiers gets called when a user wants to view the grade tiers from a section
DROP FUNCTION IF EXISTS Gradebook.getSectionGradeTiers(IN INTEGER, OUT VARCHAR(2), OUT NUMERIC(5,2), OUT NUMERIC(5,2));

CREATE OR REPLACE FUNCTION Gradebook.getSectionGradeTiers
(IN sectionId INTEGER, 
OUT letter VARCHAR(2), 
OUT lowpercentage NUMERIC(5,2),
OUT highpercentage NUMERIC(5,2))
RETURNS SETOF RECORD AS
$$
    SELECT LetterGrade, LowPercentage, HighPercentage
    FROM Gradebook.Section_GradeTier 
    WHERE Gradebook.Section_GradeTier.Section = $1
    ORDER BY HighPercentage DESC;
$$
LANGUAGE SQL;


--modifySectionGradeTier gets called when an instructor wants to modify a grade tier in their section
DROP FUNCTION IF EXISTS Gradebook.modifySectionGradeTier(INTEGER, VARCHAR(2), NUMERIC(5,2), NUMERIC(5,2), VARCHAR(2));

CREATE FUNCTION Gradebook.modifySectionGradeTier
(sectionId INTEGER, 
letterGrade VARCHAR(2), 
lowPercentage NUMERIC(5,2) DEFAULT NULL, 
highPercentage NUMERIC(5,2) DEFAULT NULL,
modifiedLetterGrade VARCHAR(2) DEFAULT NULL)
RETURNS VOID AS
$$
    UPDATE Gradebook.Section_GradeTier
    SET Section = (SELECT ID FROM Gradebook.Section WHERE Gradebook.Section.ID = $1),
        LetterGrade = COALESCE((SELECT Letter FROM Gradebook.Grade WHERE Gradebook.Grade.Letter = $5), (SELECT Letter FROM Gradebook.Grade WHERE Gradebook.Grade.Letter = $2)),
        LowPercentage = COALESCE($3, Gradebook.Section_GradeTier.LowPercentage),
        HighPercentage = COALESCE($4, Gradebook.Section_GradeTier.HighPercentage)
    WHERE Gradebook.Section_GradeTier.Section = $1
      AND Gradebook.Section_GradeTier.LetterGrade = $2;
$$ LANGUAGE SQL;


--copySectionGradeTier gets called when an instructor wants to copy a grade_tier from one of their sections to another
DROP FUNCTION IF EXISTS Gradebook.copySectionGradeTier(INTEGER, VARCHAR(2), INTEGER);

CREATE FUNCTION Gradebook.copySectionGradeTier
(sectionId INTEGER, 
letterGrade VARCHAR(2), 
newSection INTEGER)
RETURNS VOID AS
$$
    INSERT INTO Gradebook.Section_GradeTier VALUES
    ((SELECT ID FROM Gradebook.Section WHERE Gradebook.Section.ID = $3),
    (SELECT Letter FROM Gradebook.Grade WHERE Gradebook.Grade.Letter = $2),
    (SELECT LowPercentage FROM Gradebook.Section_GradeTier WHERE Gradebook.Section_GradeTier.Section = $1 AND Gradebook.Section_GradeTier.LetterGrade = $2),
    (SELECT HighPercentage FROM Gradebook.Section_GradeTier WHERE Gradebook.Section_GradeTier.Section = $1 AND Gradebook.Section_GradeTier.LetterGrade = $2));
$$ LANGUAGE SQL;

--Creating function to check that the range of a grade tier being inserted does not overlap with the range of any existing grade tiers.
DROP FUNCTION IF EXISTS Gradebook.CheckRange();

CREATE OR REPLACE FUNCTION Gradebook.CheckRange() RETURNS TRIGGER AS
$$
DECLARE
 NewLowPercentage NUMERIC(5,2);
 NewHighPercentage NUMERIC(5,2);
BEGIN
 NewLowPercentage = CAST(New.LowPercentage AS NUMERIC(5,2));
 NewHighPercentage = CAST(New.HighPercentage AS NUMERIC(5,2));
 IF ((SELECT COUNT(*) FROM Gradebook.Section_GradeTier WHERE (NewLowPercentage BETWEEN LowPercentage AND HighPercentage AND (Section=New.Section AND LetterGrade<>New.LetterGrade) OR NewHighPercentage BETWEEN LowPercentage AND HighPercentage AND (Section=New.Section AND LetterGrade<>New.LetterGrade))) > 0)
 THEN
  RAISE EXCEPTION
   'Error: Attempting to create a grade tier with a range that is already represented';
  ELSE
   RETURN NEW;
 END IF;
END;
$$ LANGUAGE plpgsql;

--Creating trigger to fire on each insert into the Section_GradeTier table and check if the range associated with the grade tier does not overlap with the range of any existing grade tiers.
CREATE TRIGGER Before_Section_GradeTier_Insert_Range
BEFORE INSERT ON Gradebook.Section_GradeTier
FOR EACH ROW
EXECUTE PROCEDURE Gradebook.CheckRange();

--Creating trigger to fire on each update of a row in the Section_GradeTier table and check if the range associated with the updated grade tier does not overlap with the range of any other grade tier.
CREATE TRIGGER After_Section_GradeTier_Update_Range
AFTER UPDATE ON Gradebook.Section_GradeTier
FOR EACH ROW
EXECUTE PROCEDURE Gradebook.CheckRange();

--end spooling
\o

