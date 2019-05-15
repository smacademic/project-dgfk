--Team Gradebook: Cristian Fitzgerald, Shelby Simpson; CS305-71: Fall 2018

--submissionMgmt.SQL version 1

--This script contains all functions necessary for the API to facilitate interaction between the end user and the db concerning submission operations

--spool results
\o spoolsubmissionMgmt.txt

--Diagnostics:
\qecho -n 'Script run on '
\qecho -n `date /t`
\qecho -n 'at '
\qecho `time /t`
\qecho -n 'Script run by ' :USER ' on server ' :HOST ' with db ' :DBNAME
\qecho ' '
\qecho --------------

--addSubmission gets called when an instructor wants to add an enrollee's submission to their section
DROP FUNCTION IF EXISTS Gradebook.addSubmission(INTEGER, INTEGER, VARCHAR(20), INTEGER, NUMERIC(5,2), NUMERIC(5,2), NUMERIC(5,2), DATE, VARCHAR(50));

CREATE OR REPLACE FUNCTION Gradebook.addSubmission
(studentId INTEGER,
sectionId INTEGER,
kind VARCHAR(20),
number INTEGER,
basePoints NUMERIC(5,2),
extraCredit NUMERIC(5,2),
penalty NUMERIC(5,2),
submissionDate DATE,
notes VARCHAR(50))
RETURNS VOID AS
$$
    INSERT INTO Gradebook.Submission (Student,Section,Kind,AssessmentNumber,BasePointsEarned,ExtraCreditEarned,Penalty,SubmissionDate,Notes) VALUES
    ((SELECT Student FROM Gradebook.Enrollee WHERE Gradebook.Enrollee.Student = $1 AND Gradebook.Enrollee.Section = $2),
    (SELECT Section FROM Gradebook.Enrollee WHERE Gradebook.Enrollee.Student = $1 AND Gradebook.Enrollee.Section = $2),
    (SELECT Kind FROM Gradebook.Section_AssessmentItem WHERE Gradebook.Section_AssessmentItem.Section = $2 AND Gradebook.Section_AssessmentItem.Kind = $3 AND Gradebook.Section_AssessmentItem.AssessmentNumber = $4),
    (SELECT AssessmentNumber FROM Gradebook.Section_AssessmentItem WHERE Gradebook.Section_AssessmentItem.Section = $2 AND Gradebook.Section_AssessmentItem.Kind = $3 AND Gradebook.Section_AssessmentItem.AssessmentNumber = $4),
    $5,
    $6,
    $7,
    $8,
    $9);
$$ LANGUAGE SQL;

--getAssessmentItemScoresEnrollee gets called when an enrollee wants to view a report of their scores on all assessment items of a specific kind
DROP FUNCTION IF EXISTS Gradebook.getAssessmentItemScoresEnrollee(IN INTEGER, IN INTEGER, IN VARCHAR(20), OUT VARCHAR(26), OUT NUMERIC(5,2), OUT NUMERIC(5,2), OUT NUMERIC(5,2), OUT NUMERIC(5,2), OUT VARCHAR(2), OUT DATE, OUT VARCHAR(50));

CREATE OR REPLACE FUNCTION Gradebook.getAssessmentItemScoresEnrollee
(IN studentId INTEGER,
IN sectionId INTEGER, 
IN kind VARCHAR(20),
OUT Name VARCHAR(26),
OUT BasePointsEarned NUMERIC(5,2),
OUT ExtraCreditEarned NUMERIC(5,2),
OUT Penalty NUMERIC(5,2),
OUT CurvedGradePercent NUMERIC(5,2),
OUT CurvedGradeLetter VARCHAR(2),
OUT SubmissionDate DATE,
OUT Notes VARCHAR(50))
RETURNS SETOF RECORD AS
$$
    SELECT CAST((Gradebook.Submission.Kind||' '||Gradebook.Submission.AssessmentNumber) AS VARCHAR(26)), Gradebook.Submission.BasePointsEarned, Gradebook.Submission.ExtraCreditEarned, Gradebook.Submission.Penalty, Gradebook.Submission.CurvedGradePercent, Gradebook.Submission.CurvedGradeLetter, Gradebook.Submission.SubmissionDate, Gradebook.Submission.Notes
    FROM Gradebook.Submission
    WHERE Gradebook.Submission.Section = $2
      AND Gradebook.Submission.Kind = $3
      AND Gradebook.Submission.Student = $1
    ORDER BY AssessmentNumber ASC;
$$ LANGUAGE SQL;

--getAssessmentItemScoresInstructor gets called when an instructor wants to view a report of all enrollees' scores in a section on an assessment item
DROP FUNCTION IF EXISTS Gradebook.getAssessmentItemScoresInstructor(IN INTEGER, IN VARCHAR(20), IN INTEGER, OUT VARCHAR(100), OUT INTEGER, OUT VARCHAR(2), OUT INTEGER, OUT NUMERIC(5,2), NUMERIC(5,2), NUMERIC(5,2), OUT NUMERIC(5,2), OUT DATE, OUT VARCHAR(50));

CREATE OR REPLACE FUNCTION Gradebook.getAssessmentItemScoresInstructor
(IN sectionId INTEGER, 
IN kind VARCHAR(20), 
IN number INTEGER,
OUT Enrollee VARCHAR(100),
OUT Student INTEGER,
OUT Kind VARCHAR(20),
OUT AssessmentNumber INTEGER,
OUT BasePointsEarned NUMERIC(5,2),
OUT ExtraCreditEarned NUMERIC(5,2),
OUT Penalty NUMERIC(5,2),
OUT Grade NUMERIC(5,2),
OUT SubmissionDate DATE,
OUT Notes VARCHAR(50))
RETURNS SETOF RECORD AS
$$
    SELECT CAST(((SELECT FName FROM Gradebook.Student WHERE Gradebook.Student.ID = Gradebook.Submission.Student)||' '||(SELECT LName FROM Gradebook.Student WHERE Gradebook.Student.ID = Gradebook.Submission.Student)) AS VARCHAR(100)) AS Enrollee, 
           Gradebook.Submission.Student,
           Gradebook.Submission.Kind, 
           Gradebook.Submission.AssessmentNumber,
           Gradebook.Submission.BasePointsEarned,
           Gradebook.Submission.ExtraCreditEarned,
           Gradebook.Submission.Penalty,
           Gradebook.Submission.CurvedGradePercent AS Grade,
           Gradebook.Submission.SubmissionDate,
           Gradebook.Submission.Notes
    FROM Gradebook.Submission
    WHERE Gradebook.Submission.Section = $1
      AND Gradebook.Submission.Kind = $2
      AND Gradebook.Submission.AssessmentNumber = $3
    GROUP BY Enrollee, Student, Kind, AssessmentNumber, BasePointsEarned, ExtraCreditEarned, Penalty, Grade, SubmissionDate, Notes
    ORDER BY Enrollee ASC;
$$ LANGUAGE SQL;

--getAssessmentKindAvgEnrollee computes a student's average grade for all the assessment items in an assessment kind
DROP FUNCTION IF EXISTS Gradebook.getAssessmentKindAvgEnrollee(IN INTEGER,IN INTEGER,INOUT VARCHAR(20),OUT NUMERIC(5,2));

CREATE FUNCTION Gradebook.getAssessmentKindAvgEnrollee
(IN studentId INTEGER,
IN sectionId INTEGER,
INOUT kind VARCHAR(20),
OUT Grade NUMERIC(5,2))
RETURNS SETOF RECORD AS
$$
    SELECT Kind, AVG(Gradebook.Submission.CurvedGradePercent)
    FROM Gradebook.Submission
    WHERE Gradebook.Submission.Section = $2
      AND Gradebook.Submission.Kind = $3
      AND Gradebook.Submission.Student = $1
    GROUP BY Kind;
$$
LANGUAGE SQL;

--getAssessmentKindAvgInstructor gets called when an instructor wants to view a report of the average scores of the enrollees for an assessment kind
DROP FUNCTION IF EXISTS Gradebook.getAssessmentKindAvgInstructor(IN INTEGER, IN VARCHAR(20), OUT VARCHAR(100), OUT NUMERIC(5,2));

CREATE OR REPLACE FUNCTION Gradebook.getAssessmentKindAvgInstructor
(IN sectionId INTEGER, 
IN kind VARCHAR(20),
OUT Enrollee VARCHAR(100),
OUT Grade NUMERIC(5,2))
RETURNS SETOF RECORD AS
$$
    SELECT CAST(((SELECT FName FROM Gradebook.Student WHERE Gradebook.Student.ID = Gradebook.Submission.Student)||' '||(SELECT LName FROM Gradebook.Student WHERE Gradebook.Student.ID = Gradebook.Submission.Student)) AS VARCHAR(100)) AS Enrollee, 
    AVG(Gradebook.Submission.CurvedGradePercent)
    FROM Gradebook.Submission
    WHERE Gradebook.Submission.Section = $1
      AND Gradebook.Submission.Kind = $2
    GROUP BY Enrollee
    ORDER BY Enrollee ASC;
$$ LANGUAGE SQL;

--modifySubmission gets called when the instructor wants to modify the information they inserted for a student's submission
DROP FUNCTION IF EXISTS Gradebook.modifySubmission(INTEGER, INTEGER, VARCHAR(20), INTEGER, NUMERIC(5,2), NUMERIC(5,2), NUMERIC(5,2), DATE, VARCHAR(50));

CREATE OR REPLACE FUNCTION Gradebook.modifySubmission
(studentId INTEGER,
sectionId INTEGER,
kind VARCHAR(20),
number INTEGER,
basePoints NUMERIC(5,2) DEFAULT NULL,
extraCredit NUMERIC(5,2) DEFAULT NULL,
penalty NUMERIC(5,2) DEFAULT NULL,
submissionDate DATE DEFAULT NULL,
notes VARCHAR(50) DEFAULT NULL)
RETURNS VOID AS
$$
    UPDATE Gradebook.Submission 
    SET BasePointsEarned = COALESCE($5, Gradebook.Submission.BasePointsEarned),
        ExtraCreditEarned = COALESCE($6, Gradebook.Submission.ExtraCreditEarned),
        Penalty = COALESCE($7, Gradebook.Submission.Penalty),
        submissionDate = COALESCE($8, Gradebook.Submission.SubmissionDate),
        notes = COALESCE($9, Gradebook.Submission.Notes)
        WHERE Gradebook.Submission.Student = $1
          AND Gradebook.Submission.Section = $2
          AND Gradebook.Submission.Kind = $3
          AND Gradebook.Submission.AssessmentNumber = $4;
$$ LANGUAGE SQL;

--getEnrollees gets called when the instructor needs to view a list of enrollees in their section.
DROP FUNCTION IF EXISTS Gradebook.getEnrollees(IN INTEGER, OUT INTEGER, OUT VARCHAR(100));

CREATE OR REPLACE FUNCTION Gradebook.getEnrollees
(IN studentId INTEGER,
OUT Id INTEGER,
OUT Enrollee VARCHAR(100))
RETURNS SETOF RECORD AS
$$
    SELECT Student, 
    CAST(((SELECT FName FROM Gradebook.Student WHERE Gradebook.Student.ID = Gradebook.Enrollee.Student)||' '||(SELECT LName FROM Gradebook.Student WHERE Gradebook.Student.ID = Gradebook.Enrollee.Student)) AS VARCHAR(100))
    FROM Gradebook.Enrollee
    WHERE Gradebook.Enrollee.Section = $1
    ORDER BY Student;
$$ LANGUAGE SQL;


--Creating function to compare the attempted insert base points with the base points of the original assessment item
CREATE OR REPLACE FUNCTION Gradebook.CompareBasePoints() RETURNS TRIGGER AS
$$
BEGIN
 IF (NEW.BasePointsEarned > (SELECT BasePointsPossible FROM Gradebook.Section_AssessmentItem WHERE Section = NEW.Section AND Kind = NEW.Kind AND AssessmentNumber = New.AssessmentNumber))
 THEN
  RAISE EXCEPTION
   'Error: Attempting to insert more base points than the assessment item allows';
  ELSE
   RETURN NEW;
 END IF;
END;
$$ LANGUAGE plpgsql;

--Creating function to compare the handout date and submission date
CREATE OR REPLACE FUNCTION Gradebook.CompareDates() RETURNS TRIGGER AS
$$
BEGIN
 IF (NEW.SubmissionDate < (SELECT AssignedDate FROM Gradebook.Section_AssessmentItem WHERE Section = NEW.Section AND Kind = NEW.Kind AND AssessmentNumber = New.AssessmentNumber))
 THEN
  RAISE EXCEPTION
   'Error: Attempting to submit before the assignment was handed out';
  ELSE
   RETURN NEW;
 END IF;
END;
$$ LANGUAGE plpgsql;


--Creating function to compute curved percentages for submissions
CREATE OR REPLACE FUNCTION Gradebook.ComputeCurvedGradePercent() RETURNS TRIGGER AS
$$
DECLARE
NewBasePointsEarned NUMERIC(5,2);
NewExtraCreditEarned NUMERIC(5,2);
NewPenalty NUMERIC(5,2);
BEGIN
NewBasePointsEarned = CAST(New.BasePointsEarned AS NUMERIC(5,2));
NewExtraCreditEarned = CAST(New.ExtraCreditEarned AS NUMERIC(5,2));
NewPenalty = CAST(New.Penalty AS NUMERIC(5,2));
 NEW.CurvedGradePercent = (COALESCE(NewBasePointsEarned,0) + COALESCE(NewExtraCreditEarned,0) - COALESCE(NewPenalty,0)) /(SELECT BasePointsPossible FROM Gradebook.Section_AssessmentItem WHERE Section = New.Section AND Kind = New.Kind AND AssessmentNumber = New.AssessmentNumber) * COALESCE((SELECT Curve FROM Gradebook.Section_AssessmentItem WHERE Section = New.Section AND Kind = New.Kind AND AssessmentNumber = New.AssessmentNumber),1) * 100;
 RETURN NEW;
 END;
$$ LANGUAGE plpgsql;

--Creating function to set NULL values for ExtraCreditEarned to 0.00
CREATE OR REPLACE FUNCTION Gradebook.DefaultExtraCreditEarned() RETURNS TRIGGER AS
$$
BEGIN
 IF (New.ExtraCreditEarned IS NULL)
 THEN
  New.ExtraCreditEarned = 0.00;
  RETURN NEW;
 ELSE
  RETURN NEW;
 END IF;
END;
$$ LANGUAGE plpgsql;

--Creating function set NULL values for Penalty to 0.00
CREATE OR REPLACE FUNCTION Gradebook.DefaultPenalty() RETURNS TRIGGER AS
$$
BEGIN
 IF (New.Penalty IS NULL)
 THEN
  New.Penalty = 0.00;
  RETURN NEW;
 ELSE
  RETURN NEW;
 END IF;
END;
$$ LANGUAGE plpgsql;

--Creating function to compute curved letter grades for submissions
CREATE OR REPLACE FUNCTION Gradebook.ComputeCurvedGradeLetter() RETURNS TRIGGER AS
$$
BEGIN
 NEW.CurvedGradeLetter = (SELECT Letter FROM Gradebook.Grade WHERE Letter IN (SELECT LetterGrade FROM Gradebook.Section_GradeTier WHERE (((COALESCE(New.BasePointsEarned,0) + COALESCE(New.ExtraCreditEarned,0) - COALESCE(New.Penalty,0)) /(SELECT BasePointsPossible FROM Gradebook.Section_AssessmentItem WHERE Section = New.Section AND Kind = New.Kind AND AssessmentNumber = New.AssessmentNumber) * COALESCE((SELECT Curve FROM Gradebook.Section_AssessmentItem WHERE Section = New.Section AND Kind = New.Kind AND AssessmentNumber = New.AssessmentNumber),1) * 100) BETWEEN LowPercentage AND HighPercentage) AND Section = New.Section));
 RETURN NEW;
 END;
$$ LANGUAGE plpgsql;

--Creating trigger to fire on each insert into the Submission table and check Base Points.
CREATE TRIGGER Before_Submission_Insert_Points
BEFORE INSERT ON Gradebook.Submission
FOR EACH ROW 
EXECUTE PROCEDURE Gradebook.CompareBasePoints();

--Creating trigger to fire on each insert into the Submission table and check Dates.
CREATE TRIGGER Before_Submission_Insert_Dates
BEFORE INSERT ON Gradebook.Submission
FOR EACH ROW 
EXECUTE PROCEDURE Gradebook.CompareDates();

--Creating trigger to fire on each insert into the Submission table and compute the curved percentage score
CREATE TRIGGER Before_Submission_Insert_Compute_Percent
BEFORE INSERT OR UPDATE ON Gradebook.Submission
FOR EACH ROW
EXECUTE PROCEDURE Gradebook.ComputeCurvedGradePercent();

--Creating trigger to fire on each insert into the Submission table and compute the curved letter grade
CREATE TRIGGER Before_Submission_Insert_Compute_Letter
BEFORE INSERT OR UPDATE ON Gradebook.Submission
FOR EACH ROW
EXECUTE PROCEDURE Gradebook.ComputeCurvedGradeLetter();

--Creating trigger to fire on each insert of the Submission table to replace any NULL ExtraCreditEarned values with 0.00.
CREATE TRIGGER Before_Submission_Insert_Extra
BEFORE INSERT ON Gradebook.Submission
FOR EACH ROW
EXECUTE PROCEDURE Gradebook.DefaultExtraCreditEarned();

--Creating trigger to fire on each insert of the Submission table to replace any NULL Penalty values with 0.00.
CREATE TRIGGER Before_Submission_Insert_Penalty
BEFORE INSERT ON Gradebook.Submission
FOR EACH ROW
EXECUTE PROCEDURE Gradebook.DefaultPenalty();

--end spooling
\o
    