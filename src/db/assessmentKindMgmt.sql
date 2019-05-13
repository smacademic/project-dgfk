--Team Gradebook: Cristian Fitzgerald, Shelby Simpson; CS305-71: Fall 2018

--assessmentKindMgmt.SQL version 1

--This script contains all functions necessary for the API to facilitate interaction between the end user and the db concerning assessment kind operations

--spool results
\o spoolassessmentKindMgmt.txt

--Diagnostics:
\qecho -n 'Script run on '
\qecho -n `date /t`
\qecho -n 'at '
\qecho `time /t`
\qecho -n 'Script run by ' :USER ' on server ' :HOST ' with db ' :DBNAME
\qecho ' '
\qecho --------------

--addSectionAssessmentKind gets called when an instructor wants to add an assessment kind to their section
DROP FUNCTION IF EXISTS Gradebook.addSectionAssessmentKind(INTEGER,VARCHAR(20),VARCHAR(100),NUMERIC(3,2));

CREATE OR REPLACE FUNCTION Gradebook.addSectionAssessmentKind
(sectionId INTEGER,
name VARCHAR(20),
description VARCHAR(100),
weightage NUMERIC(5,2))
RETURNS VOID AS
$$
    INSERT INTO Gradebook.Section_AssessmentKind VALUES
    ((SELECT ID FROM Gradebook.Section WHERE Gradebook.Section.ID = $1), 
    $2,
    $3,
    $4);
$$ 
LANGUAGE SQL;

--dropSectionAssessmentKind gets called when an instructor wants to remove an assessment kind from their section
--NOTE: if there is an assessment item that depends on the assessment kind that is being deleted, 
-- an integerity_constraint_violation should occur. ??
DROP FUNCTION IF EXISTS Gradebook.dropSectionAssessmentKind(INTEGER,VARCHAR(20));

CREATE OR REPLACE FUNCTION Gradebook.dropSectionAssessmentKind
(sectionId INTEGER,
name VARCHAR(20))
RETURNS VOID AS
$$
  BEGIN
    DELETE FROM Gradebook.Section_AssessmentKind 
    WHERE Gradebook.Section_AssessmentKind.Section = $1 AND Gradebook.Section_AssessmentKind.Name = $2;
  --EXCEPTION	
	--WHEN integrity_constraint_violation THEN
	  RAISE NOTICE 'Cannot delete this assessment kind, there is an assessment item which depends on it.';
	  --RETURN;
  END;
$$ 
LANGUAGE plpgsql;

--getSectionAssessmentKinds gets called when a user wants to view the assessment kinds of a section
DROP FUNCTION IF EXISTS Gradebook.getSectionAssessmentKinds(IN INTEGER, OUT VARCHAR(20), OUT VARCHAR(100), OUT NUMERIC(5,2));

CREATE OR REPLACE FUNCTION Gradebook.getSectionAssessmentKinds
(IN sectionId INTEGER,
OUT name VARCHAR(20),
OUT description VARCHAR(100),
OUT weightage NUMERIC(5,2))
RETURNS SETOF RECORD AS
$$
    SELECT Name, Description, Weightage
    FROM Gradebook.Section_AssessmentKind 
    WHERE Gradebook.Section_AssessmentKind.Section = $1;
$$ LANGUAGE SQL;


--modifySectionAssessmentKind gets called when an instructor wants to modify an Section_AssessmentKind in their section
DROP FUNCTION IF EXISTS Gradebook.modifySectionAssessmentKind(INTEGER,VARCHAR(20),VARCHAR(100),NUMERIC(5,2), VARCHAR(20));

CREATE OR REPLACE FUNCTION Gradebook.modifySectionAssessmentKind
(sectionId INTEGER,
name VARCHAR(20),
description VARCHAR(100) DEFAULT NULL,
weightage NUMERIC(5,2) DEFAULT NULL,
newName VARCHAR(20) DEFAULT NULL)
RETURNS VOID AS
$$
  BEGIN
    IF ((SELECT Count(*) 
         FROM Gradebook.Section_AssessmentItem 
         WHERE Gradebook.Section_AssessmentItem.Section = $1 
         AND Gradebook.Section_AssessmentItem.Kind = $2) > 0)
    THEN
    UPDATE Gradebook.Section_AssessmentKind
    SET Section = (SELECT ID FROM Gradebook.Section WHERE Gradebook.Section.ID = Gradebook.Section_AssessmentKind.Section),
        Name = $2,
        Description = COALESCE($3, Gradebook.Section_AssessmentKind.Description),
        Weightage = COALESCE($4, Gradebook.Section_AssessmentKind.Weightage)
    WHERE Gradebook.Section_AssessmentKind.Section = $1
      AND Gradebook.Section_AssessmentKind.Name = $2;
    ELSE
    UPDATE Gradebook.Section_AssessmentKind
    SET Section = (SELECT ID FROM Gradebook.Section WHERE Gradebook.Section.ID = Gradebook.Section_AssessmentKind.Section),
        Name = COALESCE($5, $2),
        Description = COALESCE($3, Gradebook.Section_AssessmentKind.Description),
        Weightage = COALESCE($4, Gradebook.Section_AssessmentKind.Weightage)
    WHERE Gradebook.Section_AssessmentKind.Section = $1
      AND Gradebook.Section_AssessmentKind.Name = $2;
    END IF;
  END;
$$ LANGUAGE plpgsql;


--copySectionAssessmentKind gets called when an instructor wants to copy an assessment kind from one of their sections to another
DROP FUNCTION IF EXISTS Gradebook.copySectionAssessmentKind(INTEGER,VARCHAR(20),INTEGER);

CREATE OR REPLACE FUNCTION Gradebook.copySectionAssessmentKind
(sectionId INTEGER,
name VARCHAR(20),
newSection INTEGER)
RETURNS VOID AS
$$
    INSERT INTO Gradebook.Section_AssessmentKind VALUES
    ((SELECT ID FROM Gradebook.Section WHERE Gradebook.Section.ID = $3), 
    (SELECT Name FROM Gradebook.Section_AssessmentKind WHERE Gradebook.Section_AssessmentKind.Section = $1 AND Gradebook.Section_AssessmentKind.Name = $2),
    (SELECT Description FROM Gradebook.Section_AssessmentKind WHERE Gradebook.Section_AssessmentKind.Section = $1 AND Gradebook.Section_AssessmentKind.Name = $2),
    (SELECT Weightage FROM Gradebook.Section_AssessmentKind WHERE Gradebook.Section_AssessmentKind.Section = $1 AND Gradebook.Section_AssessmentKind.Name = $2));
$$ LANGUAGE SQL;

--end spooling
\o