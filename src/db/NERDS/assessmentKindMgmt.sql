--Team NERDS: Cristian Fitzgerald, Shelby Simpson; CS305-71: Fall 2018

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
DROP FUNCTION IF EXISTS nerds.addSectionAssessmentKind(INTEGER,VARCHAR(20),VARCHAR(100),NUMERIC(3,2));

CREATE OR REPLACE FUNCTION nerds.addSectionAssessmentKind
(sectionId INTEGER,
name VARCHAR(20),
description VARCHAR(100),
weightage NUMERIC(5,2))
RETURNS VOID AS
$$
    INSERT INTO nerds.Assessment_Kind VALUES
    ((SELECT ID FROM nerds.Section WHERE nerds.Section.ID = $1), 
    $2,
    $3,
    $4);
$$ 
LANGUAGE SQL;

--dropSectionAssessmentKind gets called when an instructor wants to remove an assessment kind from their section
--NOTE: if there is an assessment item that depends on the assessment kind that is being deleted, 
-- an integerity_constraint_violation should occur. ??
DROP FUNCTION IF EXISTS nerds.dropSectionAssessmentKind(INTEGER,VARCHAR(20));

CREATE OR REPLACE FUNCTION nerds.dropSectionAssessmentKind
(sectionId INTEGER,
name VARCHAR(20))
RETURNS VOID AS
$$
  BEGIN
    DELETE FROM nerds.Assessment_Kind 
    WHERE nerds.Assessment_Kind.Section = $1 AND nerds.Assessment_Kind.Name = $2;
  --EXCEPTION	
	--WHEN integrity_constraint_violation THEN
	  RAISE NOTICE 'Cannot delete this assessment kind, there is an assessment item which depends on it.';
	  --RETURN;
  END;
$$ 
LANGUAGE plpgsql;

--getSectionAssessmentKinds gets called when a user wants to view the assessment kinds of a section
DROP FUNCTION IF EXISTS nerds.getSectionAssessmentKinds(IN INTEGER, OUT VARCHAR(20), OUT VARCHAR(100), OUT NUMERIC(5,2));

CREATE OR REPLACE FUNCTION nerds.getSectionAssessmentKinds
(IN sectionId INTEGER,
OUT name VARCHAR(20),
OUT description VARCHAR(100),
OUT weightage NUMERIC(5,2))
RETURNS SETOF RECORD AS
$$
    SELECT Name, Description, Weightage
    FROM nerds.Assessment_Kind 
    WHERE nerds.Assessment_Kind.Section = $1;
$$ LANGUAGE SQL;


--modifySectionAssessmentKind gets called when an instructor wants to modify an assessment_kind in their section
DROP FUNCTION IF EXISTS nerds.modifySectionAssessmentKind(INTEGER,VARCHAR(20),VARCHAR(100),NUMERIC(5,2), VARCHAR(20));

CREATE OR REPLACE FUNCTION nerds.modifySectionAssessmentKind
(sectionId INTEGER,
name VARCHAR(20),
description VARCHAR(100) DEFAULT NULL,
weightage NUMERIC(5,2) DEFAULT NULL,
newName VARCHAR(20) DEFAULT NULL)
RETURNS VOID AS
$$
  BEGIN
    IF ((SELECT Count(*) 
         FROM nerds.Assessment_Item 
         WHERE nerds.Assessment_Item.Section = $1 
         AND nerds.Assessment_Item.Kind = $2) > 0)
    THEN
    UPDATE nerds.Assessment_Kind
    SET Section = (SELECT ID FROM nerds.Section WHERE nerds.Section.ID = nerds.Assessment_Kind.Section),
        Name = $2,
        Description = COALESCE($3, nerds.Assessment_Kind.Description),
        Weightage = COALESCE($4, nerds.Assessment_Kind.Weightage)
    WHERE nerds.Assessment_Kind.Section = $1
      AND nerds.Assessment_Kind.Name = $2;
    ELSE
    UPDATE nerds.Assessment_Kind
    SET Section = (SELECT ID FROM nerds.Section WHERE nerds.Section.ID = nerds.Assessment_Kind.Section),
        Name = COALESCE($5, $2),
        Description = COALESCE($3, nerds.Assessment_Kind.Description),
        Weightage = COALESCE($4, nerds.Assessment_Kind.Weightage)
    WHERE nerds.Assessment_Kind.Section = $1
      AND nerds.Assessment_Kind.Name = $2;
    END IF;
  END;
$$ LANGUAGE plpgsql;


--copySectionAssessmentKind gets called when an instructor wants to copy an assessment kind from one of their sections to another
DROP FUNCTION IF EXISTS nerds.copySectionAssessmentKind(INTEGER,VARCHAR(20),INTEGER);

CREATE OR REPLACE FUNCTION nerds.copySectionAssessmentKind
(sectionId INTEGER,
name VARCHAR(20),
newSection INTEGER)
RETURNS VOID AS
$$
    INSERT INTO nerds.Assessment_Kind VALUES
    ((SELECT ID FROM nerds.Section WHERE nerds.Section.ID = $3), 
    (SELECT Name FROM nerds.Assessment_Kind WHERE nerds.Assessment_Kind.Section = $1 AND nerds.Assessment_Kind.Name = $2),
    (SELECT Description FROM nerds.Assessment_Kind WHERE nerds.Assessment_Kind.Section = $1 AND nerds.Assessment_Kind.Name = $2),
    (SELECT Weightage FROM nerds.Assessment_Kind WHERE nerds.Assessment_Kind.Section = $1 AND nerds.Assessment_Kind.Name = $2));
$$ LANGUAGE SQL;

--end spooling
\o