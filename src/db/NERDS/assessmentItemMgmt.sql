--Team NERDS: Cristian Fitzgerald, Shelby Simpson; CS305-71: Fall 2018

--assessmentItemMgmt.SQL version 1

--This script contains all functions necessary for the API to facilitate interaction between the end user and the db concerning assessment item management.

--spool results
\o spoolassessmentItemMgmt.txt

--Diagnostics:
\qecho -n 'Script run on '
\qecho -n `date /t`
\qecho -n 'at '
\qecho `time /t`
\qecho -n 'Script run by ' :USER ' on server ' :HOST ' with db ' :DBNAME
\qecho ' '
\qecho --------------

--addSectionAssessmentItem gets called when an instructor wants to add an assessment item to their section
DROP FUNCTION IF EXISTS nerds.addSectionAssessmentItem(INTEGER, VARCHAR(20), INTEGER, VARCHAR(100), NUMERIC(5,2), DATE, DATE, DATE, NUMERIC(3,2));

CREATE OR REPLACE FUNCTION nerds.addSectionAssessmentItem
(sectionId INTEGER, 
kind VARCHAR(20), 
number INTEGER, 
description VARCHAR(100), 
basePoints NUMERIC(5,2),
assignedDate DATE,
dueDate DATE,
revealDate DATE,
curve NUMERIC(3,2) DEFAULT NULL)
RETURNS VOID AS
$$
    INSERT INTO nerds.Assessment_Item VALUES
    ((SELECT ID FROM nerds.Section WHERE nerds.Section.ID = $1),
    (SELECT Name FROM nerds.Assessment_Kind WHERE nerds.Assessment_Kind.Section = $1 AND nerds.Assessment_Kind.Name = $2),
    $3,
    $4,
    $5,
    $6,
    $7,
    $8,
    $9);
$$ LANGUAGE SQL;


--dropSectionAssessmentItem gets called when an instructor wants to remove an assessment item from their section
DROP FUNCTION IF EXISTS nerds.dropSectionAssessmentItem(INTEGER, VARCHAR(20), INTEGER);

CREATE OR REPLACE FUNCTION nerds.dropSectionAssessmentItem
(sectionId INTEGER, 
kind VARCHAR(20), 
number INTEGER)
RETURNS VOID AS
$$
    DELETE FROM nerds.Assessment_Item
    WHERE nerds.Assessment_Item.Section = $1
      AND nerds.Assessment_Item.Kind = $2
      AND nerds.Assessment_Item.AssessmentNumber = $3;
$$ LANGUAGE SQL;


--getSectionAssessmentItems gets called when a user wants to view the assessment items of a specific kind in their section
DROP FUNCTION IF EXISTS nerds.getSectionAssessmentItems(IN INTEGER, INOUT VARCHAR(20), OUT INTEGER, OUT VARCHAR(100), OUT NUMERIC(5,2), OUT DATE, OUT DATE, OUT DATE, OUT NUMERIC(3,2));

CREATE OR REPLACE FUNCTION nerds.getSectionAssessmentItems
(IN sectionId INTEGER, 
INOUT Kind VARCHAR(20),
--OUT Name VARCHAR(26),
OUT AssessmentNumber INTEGER,
OUT Description VARCHAR(100),
OUT BasePointsPossible NUMERIC(5,2),
OUT AssignedDate DATE,
OUT DueDate DATE,
OUT RevealDate DATE,
OUT Curve NUMERIC(3,2))
RETURNS SETOF RECORD AS
$$
    --SELECT CAST((nerds.Assessment_Item.Kind||' '||nerds.Assessment_Item.AssessmentNumber) AS VARCHAR(26)), 
	SELECT nerds.Assessment_Item.Kind, nerds.Assessment_Item.AssessmentNumber, nerds.Assessment_Item.Description, nerds.Assessment_Item.BasePointsPossible, nerds.Assessment_Item.AssignedDate, nerds.Assessment_Item.DueDate, nerds.Assessment_Item.RevealDate, nerds.Assessment_Item.Curve
    FROM nerds.Assessment_Item
    WHERE nerds.Assessment_Item.Section = $1
      AND nerds.Assessment_Item.Kind = $2
    ORDER BY nerds.Assessment_Item.AssessmentNumber ASC;
$$ LANGUAGE SQL;


--modifySectionAssessmentItem gets called when an instructor wants to modify an assessment item in their section
DROP FUNCTION IF EXISTS nerds.modifySectionAssessmentItem(INTEGER, VARCHAR(20), INTEGER, VARCHAR(100), NUMERIC(5,2), DATE, DATE, DATE, NUMERIC(3,2), INTEGER);

CREATE OR REPLACE FUNCTION nerds.modifySectionAssessmentItem
(sectionId INTEGER,
kind VARCHAR(20),
number INTEGER,
description VARCHAR(100) DEFAULT NULL,
basePoints NUMERIC(5,2) DEFAULT NULL,
assignedDate DATE DEFAULT NULL,
dueDate DATE DEFAULT NULL,
revealDate DATE DEFAULT NULL,
curve NUMERIC(3,2) DEFAULT NULL,
newNumber INTEGER DEFAULT NULL)
RETURNS VOID AS
$$
  BEGIN
    IF ((SELECT Count(*) 
         FROM nerds.Submission 
         WHERE nerds.Submission.Section = $1 
         AND nerds.Submission.Kind = $2
         AND nerds.Submission.AssessmentNumber = $3) > 0)
    THEN
     UPDATE nerds.Assessment_Item
         SET Section = (SELECT ID FROM nerds.Section WHERE nerds.Section.ID = $1),
             Kind = (SELECT Name FROM nerds.Assessment_Kind WHERE nerds.Assessment_Kind.Section = $1 AND nerds.Assessment_Kind.Name = $2),
             AssessmentNumber = nerds.Assessment_Item.AssessmentNumber,
             Description = COALESCE($4, nerds.Assessment_Item.Description),
             BasePointsPossible = nerds.Assessment_Item.BasePointsPossible,
             AssignedDate = nerds.Assessment_Item.AssignedDate,
             DueDate = COALESCE($7, nerds.Assessment_Item.DueDate),
             RevealDate = nerds.Assessment_Item.RevealDate,
             Curve = COALESCE($9, nerds.Assessment_Item.Curve)
         WHERE nerds.Assessment_Item.Section = $1
           AND nerds.Assessment_Item.Kind = $2
           AND nerds.Assessment_Item.AssessmentNumber = $3;
    ELSE
     UPDATE nerds.Assessment_Item
     SET Section = (SELECT ID FROM nerds.Section WHERE nerds.Section.ID = $1),
         Kind = (SELECT Name FROM nerds.Assessment_Kind WHERE nerds.Assessment_Kind.Section = $1 AND nerds.Assessment_Kind.Name = $2),
         AssessmentNumber = COALESCE($10, nerds.Assessment_Item.AssessmentNumber),
         Description = COALESCE($4, nerds.Assessment_Item.Description),
         BasePointsPossible = COALESCE($5, nerds.Assessment_Item.BasePointsPossible),
         AssignedDate = COALESCE($6, nerds.Assessment_Item.AssignedDate),
         DueDate = COALESCE($7, nerds.Assessment_Item.DueDate),
         RevealDate = COALESCE($8, nerds.Assessment_Item.RevealDate),
         Curve = COALESCE($9, nerds.Assessment_Item.Curve)
     WHERE nerds.Assessment_Item.Section = $1
       AND nerds.Assessment_Item.Kind = $2
       AND nerds.Assessment_Item.AssessmentNumber = $3;
    END IF;
  END;
$$ LANGUAGE plpgsql;

--Creating function to set NULL values for RevealDate to the AssignedDate
CREATE OR REPLACE FUNCTION nerds.CheckRevealDate() RETURNS TRIGGER AS
$$
BEGIN
 IF (NEW.RevealDate IS NULL)
 THEN 
  NEW.RevealDate := NEW.AssignedDate;
  RETURN NEW;
 ELSE
  RETURN NEW;
 END IF;
END;
$$ LANGUAGE plpgsql;

--Creating function to set NULL values for Curve to 1.00
CREATE OR REPLACE FUNCTION nerds.DefaultCurve() RETURNS TRIGGER AS
$$
BEGIN
 IF (New.Curve IS NULL)
 THEN
  New.Curve = 1.00;
  RETURN NEW;
 ELSE
  RETURN NEW;
 END IF;
END;
$$ LANGUAGE plpgsql;

--Creating trigger to fire on each insert into Assessment_Item to replace any NULL RevealDate values with the item's AssignedDate.
CREATE TRIGGER Before_Assessment_Item_Insert_RevealDate
BEFORE INSERT ON nerds.Assessment_Item
FOR EACH ROW
EXECUTE PROCEDURE nerds.CheckRevealDate();

--Creating trigger to fire on each insert into Assessment_Item to replace any NULL Curve values with 1.00 default.
CREATE TRIGGER Before_Assessment_Item_Insert_Curve
BEFORE INSERT ON nerds.Assessment_Item
FOR EACH ROW
EXECUTE PROCEDURE nerds.DefaultCurve();


--end spooling
\o