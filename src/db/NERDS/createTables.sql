--Team NERDS: Cristian Fitzgerald, Shelby Simpson; CS305-71: Fall 2018

--create.SQL Version 3

--To create all tables currently described in our concpetual and logical schemas.

--Based on: tableandattributesummaries, logicalSchema

--moved all functions and triggers to their respeective table mgmt scripts.
--replaced curvedGrade attribute in table submission with curvedGradeLetter and curvedGradePercent
--changed section table PK to serial ID attribute
--changed name to createTables.sql

--spool results
\o spoolCreateTables.txt



--Course Season Term Instructor Section Grade Grade_Tier Student Enrollee 
--AttendanceStatus AttendanceRecord Assessment_Kind Assessment_Item Submission
--Diagnostics:
\qecho -n 'Script run on '
\qecho -n `date /t`
\qecho -n 'at '
\qecho `time /t`
\qecho -n 'Script run by ' :USER ' on server ' :HOST ' with db ' :DBNAME
\qecho ' '
\qecho --------------

--Creating Section Table

CREATE TABLE nerds.Course
(
   --Wonder if this table will eventually need a separate ID field
   Number VARCHAR(8) NOT NULL PRIMARY KEY, --e.g., 'CS170'
   Title VARCHAR(100) NOT NULL --e.g., 'C++ Programming'
);


CREATE TABLE nerds.Season
(
   --SeasonOrder denotes the sequence of seasons within a year: 0, 1,...9
   SeasonOrder NUMERIC(1,0) PRIMARY KEY CHECK (SeasonOrder >= 0),

   --Name is a description such as Spring and Summer: must be 2 or more chars
   -- uniqueness is enforced using a case-insensitive index
   Name VARCHAR(20) NOT NULL CHECK(LENGTH(TRIM(Name)) > 1),

   --Code is 'S', 'M', etc.: makes it easier for user to specify a season
   -- permit only A-Z (upper case)
   Code CHAR(1) NOT NULL UNIQUE CHECK(Code ~ '[A-Z]')
);

--enforce case-insensitive uniqueness of season name
CREATE UNIQUE INDEX idx_Unique_SeasonName ON nerds.Season(LOWER(TRIM(Name)));


CREATE TABLE nerds.Term
(
   Year NUMERIC(4,0) NOT NULL CHECK (Year > 0), --'2017'
   Season NUMERIC(1,0) NOT NULL REFERENCES nerds.Season,
   StartDate DATE NOT NULL, --date the term begins
   EndDate DATE NOT NULL, --date the term ends (last day of  "finals" week)
   PRIMARY KEY (Year,Season),
   UNIQUE(Year, Season)
);


CREATE TABLE nerds.Instructor
(
   ID SERIAL PRIMARY KEY,
   FName VARCHAR(50) NOT NULL,
   MName VARCHAR(50),
   LName VARCHAR(50) NOT NULL,
   Department VARCHAR(30),
   Email VARCHAR(319) CHECK(TRIM(Email) LIKE '_%@_%._%'),
   UNIQUE(FName, MName, LName)
);

--enforce case-insensitive uniqueness of instructor e-mail addresses
CREATE UNIQUE INDEX idx_Unique_InstructorEmail
ON nerds.Instructor(LOWER(TRIM(Email)));

--Create a partial index on the instructor names.  This enforces the CONSTRAINT
-- that only one of any (FName, NULL, LName) is unique
CREATE UNIQUE INDEX idx_Unique_Names_NULL
ON nerds.Instructor(FName, LName)
WHERE MName IS NULL;

CREATE TABLE nerds.Section
(
   ID SERIAL PRIMARY KEY,
   CRN VARCHAR(5) NOT NULL, 
   Year NUMERIC(4,0) NOT NULL,
   Season NUMERIC(1,0) NOT NULL,
   Course VARCHAR(8) NOT NULL REFERENCES nerds.Course,
   SectionNumber VARCHAR(3) NOT NULL, --'01', '72', etc.
   Schedule VARCHAR(7),  --days the class meets: 'MW', 'TR', 'MWF', etc.
   Location VARCHAR(25), --likely a classroom
   StartDate DATE NOT NULL, --first date the section meets
   EndDate DATE NOT NULL, --last date the section meets
   MidtermDate DATE NOT NULL, --date of the "middle" of term: used to compute mid-term grade
   Instructor1 INT NOT NULL REFERENCES nerds.Instructor, --primary instructor
   Instructor2 INT REFERENCES nerds.Instructor, --optional 2nd instructor
   Instructor3 INT REFERENCES nerds.Instructor, --optional 3rd instructor
   FOREIGN KEY (Year,Season) REFERENCES nerds.Term,
   UNIQUE(Year, Season, Course, SectionNumber),

   --make sure instructors are distinct
   CONSTRAINT DistinctSectionInstructors
        CHECK (Instructor1 <> Instructor2
               AND Instructor1 <> Instructor3
               AND Instructor2 <> Instructor3
              )
);


--Table to store all possible letter grades
--some universities permit A+
CREATE TABLE nerds.Grade
(
   Letter VARCHAR(2) NOT NULL PRIMARY KEY,
   GPA NUMERIC(4,3) UNIQUE,
   CONSTRAINT LetterChoices
      CHECK (Letter IN ('A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+',
                        'C', 'C-', 'D+', 'D', 'D-', 'F', 'W')
            ),
   CONSTRAINT GPAChoices
      CHECK (GPA IN (4.333, 4, 3.667, 3.333, 3, 2.667, 2.333, 2, 1.667, 1.333, 1, 0.667, 0)),
   UNIQUE(Letter,GPA) --Combinations of letter grade and GPA must be unique
);


--Table to store mapping of percentage score to a letter grade: varies by section
CREATE TABLE nerds.Grade_Tier
(
   Section INT REFERENCES nerds.Section,
   LetterGrade VARCHAR(2) NOT NULL REFERENCES nerds.Grade,
   LowPercentage NUMERIC(5,2) NOT NULL CHECK (LowPercentage >= 0),
   HighPercentage NUMERIC(5,2) NOT NULL CHECK (HighPercentage >= 0),
   PRIMARY KEY(LetterGrade,Section),
   UNIQUE(Section, LowPercentage, HighPercentage)
);


CREATE TABLE nerds.Student
(
   ID SERIAL PRIMARY KEY,
   FName VARCHAR(50) NOT NULL, --at least one of the name fields must be used: see below
   MName VARCHAR(50), --permit NULL in all 3 fields because some people have only one name: not sure which field will be used
   LName VARCHAR(50), --use a CONSTRAINT on names instead of NOT NULL until we understand the data
   SchoolIssuedID VARCHAR(50) NOT NULL UNIQUE,
   Email VARCHAR(319) CHECK(TRIM(Email) LIKE '_%@_%._%'),
   Major VARCHAR(50) NOT NULL, --non-matriculated students are not required to have a major
   Year VARCHAR(30), --represents the student year. Ex: Freshman, Sophomore, Junior, Senior
   CONSTRAINT StudentNameRequired --ensure at least one of the name fields is used
      CHECK (FName IS NOT NULL OR MName IS NOT NULL OR LName IS NOT NULL)
);

--enforce case-insensitive uniqueness of student e-mail addresses
CREATE UNIQUE INDEX idx_Unique_StudentEmail
ON nerds.Student(LOWER(TRIM(Email)));


CREATE TABLE nerds.Enrollee
(
   Student INT NOT NULL REFERENCES nerds.Student,
   Section INT REFERENCES nerds.Section,
   MidtermGradeComputed VARCHAR(2), --will eventually move to a view
   MidtermGradeAwarded VARCHAR(2), --actual grade assigned, if any
   FinalGradeComputed VARCHAR(2),  --will eventually move to a view
   FinalGradeAwarded VARCHAR(2), --actual grade assigned
   PRIMARY KEY (Student, Section)
);


CREATE TABLE nerds.AttendanceStatus
(
   Status CHAR(1) NOT NULL PRIMARY KEY, --'P', 'A', ...
   Description VARCHAR(20) NOT NULL UNIQUE --'Present', 'Absent', ...
);


CREATE TABLE nerds.AttendanceRecord
(
   Student INT NOT NULL,
   Section INT NOT NULL,
   Date DATE NOT NULL,
   Status CHAR(1) NOT NULL REFERENCES nerds.AttendanceStatus,
   PRIMARY KEY (Student, Section, Date),
   FOREIGN KEY (Student, Section) REFERENCES nerds.Enrollee
);


CREATE TABLE nerds.Assessment_Kind
(
   Section INT NOT NULL REFERENCES nerds.Section,
   Name VARCHAR(20) NOT NULL CHECK(TRIM(Name) <> ''), --"Assignment", "Quiz", "Exam",...
   Description VARCHAR(100),
   Weightage NUMERIC(3,2) NOT NULL CHECK (Weightage >= 0), --a percentage value: 0.25, 0.5,...
   PRIMARY KEY (Section, Name)
);


CREATE TABLE nerds.Assessment_Item
(
   Section INT NOT NULL REFERENCES nerds.Section,
   Kind VARCHAR(20) NOT NULL,
   AssessmentNumber INT NOT NULL CHECK (AssessmentNumber > 0),
   Description VARCHAR(100),
   BasePointsPossible NUMERIC(5,2) NOT NULL CHECK (BasePointsPossible >= 0),
   AssignedDate DATE NOT NULL,
   DueDate DATE NOT NULL,
   RevealDate DATE,
   Curve NUMERIC(3,2) DEFAULT 1.00, --A curve for the item
   PRIMARY KEY(Section, Kind, AssessmentNumber),
   FOREIGN KEY(Section, Kind) REFERENCES nerds.Assessment_Kind (Section, Name)
);


CREATE TABLE nerds.Submission
(
   Student INT NOT NULL,
   Section INT NOT NULL,
   Kind VARCHAR(20) NOT NULL,
   AssessmentNumber INT NOT NULL,
   BasePointsEarned NUMERIC(5,2) CHECK (BasePointsEarned >= 0),
   ExtraCreditEarned NUMERIC(5,2) DEFAULT 1.00 CHECK (ExtraCreditEarned >= 0),
   Penalty NUMERIC(5,2) DEFAULT 1.00 CHECK (Penalty >= 0),
   CurvedGradeLetter VARCHAR(2) NOT NULL,-- NUMERIC(5,2) NOT NULL,
   CurvedGradePercent NUMERIC(5,2) NOT NULL,
   SubmissionDate DATE,   
   Notes VARCHAR(50), --Optional notes about the submission
   PRIMARY KEY(Student, Section, Kind, AssessmentNumber),
   FOREIGN KEY (Student, Section) REFERENCES nerds.Enrollee,
   FOREIGN KEY (Section, Kind, AssessmentNumber) REFERENCES nerds.Assessment_Item
);


--end spooling
\o