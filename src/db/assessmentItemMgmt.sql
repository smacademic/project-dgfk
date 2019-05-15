--Team Gradebook: Cristian Fitzgerald, Shelby Simpson; CS305-71: Fall 2018

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
DROP FUNCTION IF EXISTS Gradebook.addSectionAssessmentItem(INTEGER, VARCHAR(20), INTEGER, VARCHAR(100), NUMERIC(5,2), DATE, DATE, DATE, NUMERIC(3,2));

CREATE OR REPLACE FUNCTION Gradebook.addSectionAssessmentItem
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
    INSERT INTO Gradebook.Section_AssessmentItem VALUES
    ((SELECT ID FROM Gradebook.Section WHERE Gradebook.Section.ID = $1),
    (SELECT Name FROM Gradebook.Section_AssessmentKind WHERE Gradebook.Section_AssessmentKind.Section = $1 AND Gradebook.Section_AssessmentKind.Name = $2),
    $3,
    $4,
    $5,
    $6,
    $7,
    $8,
    $9);
$$ LANGUAGE SQL;


--dropSectionAssessmentItem gets called when an instructor wants to remove an assessment item from their section
DROP FUNCTION IF EXISTS Gradebook.dropSectionAssessmentItem(INTEGER, VARCHAR(20), INTEGER);

CREATE OR REPLACE FUNCTION Gradebook.dropSectionAssessmentItem
(sectionId INTEGER, 
kind VARCHAR(20), 
number INTEGER)
RETURNS VOID AS
$$
    DELETE FROM Gradebook.Section_AssessmentItem
    WHERE Gradebook.Section_AssessmentItem.Section = $1
      AND Gradebook.Section_AssessmentItem.Kind = $2
      AND Gradebook.Section_AssessmentItem.AssessmentNumber = $3;
$$ LANGUAGE SQL;


--getSectionAssessmentItems gets called when a user wants to view the assessment items of a specific kind in their section
DROP FUNCTION IF EXISTS Gradebook.getSectionAssessmentItems(IN INTEGER, INOUT VARCHAR(20), OUT INTEGER, OUT VARCHAR(100), OUT NUMERIC(5,2), OUT DATE, OUT DATE, OUT DATE, OUT NUMERIC(3,2));

CREATE OR REPLACE FUNCTION Gradebook.getSectionAssessmentItems
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
    --SELECT CAST((Gradebook.Section_AssessmentItem.Kind||' '||Gradebook.Section_AssessmentItem.AssessmentNumber) AS VARCHAR(26)), 
	SELECT Gradebook.Section_AssessmentItem.Kind, Gradebook.Section_AssessmentItem.AssessmentNumber, Gradebook.Section_AssessmentItem.Description, Gradebook.Section_AssessmentItem.BasePointsPossible, Gradebook.Section_AssessmentItem.AssignedDate, Gradebook.Section_AssessmentItem.DueDate, Gradebook.Section_AssessmentItem.RevealDate, Gradebook.Section_AssessmentItem.Curve
    FROM Gradebook.Section_AssessmentItem
    WHERE Gradebook.Section_AssessmentItem.Section = $1
      AND Gradebook.Section_AssessmentItem.Kind = $2
    ORDER BY Gradebook.Section_AssessmentItem.AssessmentNumber ASC;
$$ LANGUAGE SQL;


--modifySectionAssessmentItem gets called when an instructor wants to modify an assessment item in their section
DROP FUNCTION IF EXISTS Gradebook.modifySectionAssessmentItem(INTEGER, VARCHAR(20), INTEGER, VARCHAR(100), NUMERIC(5,2), DATE, DATE, DATE, NUMERIC(3,2), INTEGER);

CREATE OR REPLACE FUNCTION Gradebook.modifySectionAssessmentItem
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
         FROM Gradebook.Submission 
         WHERE Gradebook.Submission.Section = $1 
         AND Gradebook.Submission.Kind = $2
         AND Gradebook.Submission.AssessmentNumber = $3) > 0)
    THEN
     UPDATE Gradebook.Section_AssessmentItem
         SET Section = (SELECT ID FROM Gradebook.Section WHERE Gradebook.Section.ID = $1),
             Kind = (SELECT Name FROM Gradebook.Section_AssessmentKind WHERE Gradebook.Section_AssessmentKind.Section = $1 AND Gradebook.Section_AssessmentKind.Name = $2),
             AssessmentNumber = Gradebook.Section_AssessmentItem.AssessmentNumber,
             Description = COALESCE($4, Gradebook.Section_AssessmentItem.Description),
             BasePointsPossible = Gradebook.Section_AssessmentItem.BasePointsPossible,
             AssignedDate = Gradebook.Section_AssessmentItem.AssignedDate,
             DueDate = COALESCE($7, Gradebook.Section_AssessmentItem.DueDate),
             RevealDate = Gradebook.Section_AssessmentItem.RevealDate,
             Curve = COALESCE($9, Gradebook.Section_AssessmentItem.Curve)
         WHERE Gradebook.Section_AssessmentItem.Section = $1
           AND Gradebook.Section_AssessmentItem.Kind = $2
           AND Gradebook.Section_AssessmentItem.AssessmentNumber = $3;
    ELSE
     UPDATE Gradebook.Section_AssessmentItem
     SET Section = (SELECT ID FROM Gradebook.Section WHERE Gradebook.Section.ID = $1),
         Kind = (SELECT Name FROM Gradebook.Section_AssessmentKind WHERE Gradebook.Section_AssessmentKind.Section = $1 AND Gradebook.Section_AssessmentKind.Name = $2),
         AssessmentNumber = COALESCE($10, Gradebook.Section_AssessmentItem.AssessmentNumber),
         Description = COALESCE($4, Gradebook.Section_AssessmentItem.Description),
         BasePointsPossible = COALESCE($5, Gradebook.Section_AssessmentItem.BasePointsPossible),
         AssignedDate = COALESCE($6, Gradebook.Section_AssessmentItem.AssignedDate),
         DueDate = COALESCE($7, Gradebook.Section_AssessmentItem.DueDate),
         RevealDate = COALESCE($8, Gradebook.Section_AssessmentItem.RevealDate),
         Curve = COALESCE($9, Gradebook.Section_AssessmentItem.Curve)
     WHERE Gradebook.Section_AssessmentItem.Section = $1
       AND Gradebook.Section_AssessmentItem.Kind = $2
       AND Gradebook.Section_AssessmentItem.AssessmentNumber = $3;
    END IF;
  END;
$$ LANGUAGE plpgsql;

--Creating function to set NULL values for RevealDate to the AssignedDate
CREATE OR REPLACE FUNCTION Gradebook.CheckRevealDate() RETURNS TRIGGER AS
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
CREATE OR REPLACE FUNCTION Gradebook.DefaultCurve() RETURNS TRIGGER AS
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

--Creating trigger to fire on each insert into Section_AssessmentItem to replace any NULL RevealDate values with the item's AssignedDate.
CREATE TRIGGER Before_Section_AssessmentItem_Insert_RevealDate
BEFORE INSERT ON Gradebook.Section_AssessmentItem
FOR EACH ROW
EXECUTE PROCEDURE Gradebook.CheckRevealDate();

--Creating trigger to fire on each insert into Section_AssessmentItem to replace any NULL Curve values with 1.00 default.
CREATE TRIGGER Before_Section_AssessmentItem_Insert_Curve
BEFORE INSERT ON Gradebook.Section_AssessmentItem
FOR EACH ROW
EXECUTE PROCEDURE Gradebook.DefaultCurve();


--end spooling
\o