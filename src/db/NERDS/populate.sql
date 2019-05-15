--Team NERDS: Cristian Fitzgerald, Shelby Simpson; CS305-71: Fall 2018

--populate.SQL version 2

--To populate all tables currently described in our concpetual and logical schemas.

--Based on: create.sql

--Removed set schema 
--Integrated Current Gradebook implementations

--spool results
\o spoolpopulate.txt

--Suppress notices when running scripts
SET client_min_messages TO WARNING;

--Diagnostics:
\qecho -n 'Script run on '
\qecho -n `date /t`
\qecho -n 'at '
\qecho `time /t`
\qecho -n 'Script run by ' :USER ' on server ' :HOST ' with db ' :DBNAME
\qecho ' '
\qecho --------------

--CLEAR
\qecho Clearing tables of data...

DELETE FROM nerds.Submission;
DELETE FROM nerds.Assessment_Item;
DELETE FROM nerds.Assessment_Kind;
DELETE FROM nerds.AttendanceRecord;
DELETE FROM nerds.AttendanceStatus;
DELETE FROM nerds.Enrollee;
DELETE FROM nerds.Student;
DELETE FROM nerds.Grade_Tier;
--DELETE FROM Grade;
DELETE FROM nerds.Section;
DELETE FROM nerds.Instructor;
DELETE FROM nerds.Term;
DELETE FROM nerds.Season;
DELETE FROM nerds.Course;

INSERT INTO nerds.course(Number,Title) VALUES
 ('CS170','C++ Programming'),
 ('CS221','Object-Oriented Programming');
 
INSERT INTO nerds.season(SeasonOrder,Name,Code) VALUES
 (0,'Fall','F'),
 (1,'Winter','W'),
 (2,'Spring','S');
 
INSERT INTO nerds.term(Year,Season,StartDate,EndDate) VALUES
 (2018,(SELECT SeasonOrder FROM nerds.Season WHERE SeasonOrder = 0),'2018-08-28','2018-12-15'),
 (2019,(SELECT SeasonOrder FROM nerds.Season WHERE SeasonOrder = 1),'2019-01-16','2019-05-20');
 
INSERT INTO nerds.instructor(ID,FName,MName,LName,Department,Email) VALUES
 (DEFAULT,'Dr','John','Cena','Computer Science','john.cena@wcsu.edu'),
 --(DEFAULT,'Michael','Ishmael','Mouse','Computer Science','mickey.mouse@wcsu.edu');
 --(DEFAULT,'Cristian','Thomas','Fitzgerald','Computer Science','fitzgerald077@connect.wcsu.edu'),
 (DEFAULT,'Shelby','Ishmael','Simpson','Computer Science','simpson055@connect.wcsu.edu');

INSERT INTO nerds.section(CRN,Year,Season,Course,SectionNumber,Schedule,Location,StartDate,EndDate,MidtermDate,Instructor1,Instructor2) VALUES
 (4080,(SELECT Year FROM nerds.Term WHERE Year = 2018),(SELECT Season FROM nerds.Term WHERE Season = 0),(SELECT Number FROM nerds.Course WHERE Number = 'CS170'),01,'MW','WS103',(SELECT StartDate FROM nerds.Term WHERE Year = 2018 AND Season = 0),(SELECT EndDate FROM nerds.Term WHERE Year = 2018 AND Season = 0),'2018-10-30',(SELECT ID FROM nerds.Instructor WHERE ID = 1),(SELECT ID FROM nerds.Instructor WHERE ID = 2)),
 (4081,(SELECT Year FROM nerds.Term WHERE Year = 2018),(SELECT Season FROM nerds.Term WHERE Season = 0),(SELECT Number FROM nerds.Course WHERE Number = 'CS221'),71,'TR','WS116',(SELECT StartDate FROM nerds.Term WHERE Year = 2018 AND Season = 0),(SELECT EndDate FROM nerds.Term WHERE Year = 2018 AND Season = 0),'2019-3-20',(SELECT ID FROM nerds.Instructor WHERE ID = 2),(SELECT ID FROM nerds.Instructor WHERE ID = 1));
 
 --Should fail
 --\qecho This next insert should fail as it is attempting insert a range that overlaps with the range of an existing grade tier.
 --INSERT INTO grade_tier(Section,LetterGrade,LowPercentage,HighPercentage) VALUES 
 --((SELECT ID FROM section WHERE ID = 1),'F',0,69);
 
INSERT INTO nerds.student(ID,FName,MName,LName,SchoolIssuedID,Email,Major,Year) VALUES
 (DEFAULT,'William','Joseph','Blazkowicz',20519436,'blazkowicz001@connect.wcsu.edu','Applied Physics','Sophomore'),
 (DEFAULT, 'Cristian','Thomas','Fitzgerald',20319987,'fitzgerald077@connect.wcsu.edu','Applied Physics','Sophomore'),
 (DEFAULT,'Wall','Strong','E',45612336,'e001@connect.wcsu.edu','Waste Management','Freshman');

INSERT INTO nerds.enrollee(Student,Section,MidtermGradeComputed,MidtermGradeAwarded,FinalGradeComputed,FinalGradeAwarded) VALUES 
 ((SELECT ID FROM nerds.Student WHERE ID = 1),(SELECT ID FROM nerds.section WHERE ID = 1),NULL,NULL,NULL,NULL),
 ((SELECT ID FROM nerds.Student WHERE ID = 2),(SELECT ID FROM nerds.section WHERE ID = 1),NULL,NULL,NULL,NULL),
 ((SELECT ID FROM nerds.Student WHERE ID = 3),(SELECT ID FROM nerds.section WHERE ID = 1),NULL,NULL,NULL,NULL);

INSERT INTO nerds.attendancestatus(Status,Description) VALUES
 ('P','Present'),
 ('A','Absent');
 
INSERT INTO nerds.attendancerecord(Student,Section,Date,Status) VALUES
 ((SELECT Student FROM nerds.Enrollee WHERE Student = 1),(SELECT DISTINCT Section FROM nerds.Enrollee WHERE Section = 1),CURRENT_DATE,(SELECT Status FROM nerds.AttendanceStatus WHERE Status = 'P')),
 ((SELECT Student FROM nerds.Enrollee WHERE Student = 2),(SELECT DISTINCT Section FROM nerds.Enrollee WHERE Section = 1),CURRENT_DATE,(SELECT Status FROM nerds.AttendanceStatus WHERE Status = 'P'));



--Calling gradeTierMgmt.sql functions for testing

--Calling addGradeTier
SELECT nerds.addSectionGradeTier(1, 'A+', 100.01, 999.99);
SELECT nerds.addSectionGradeTier(1, 'A', 89.50, 100.00);
SELECT nerds.addSectionGradeTier(1, 'B', 79.50, 89.49);
SELECT nerds.addSectionGradeTier(1, 'C', 69.50, 79.49);
SELECT nerds.addSectionGradeTier(1, 'D', 59.50, 69.49);
SELECT nerds.addSectionGradeTier(1, 'F', 0.00, 59.49);



--Calling getSectionGradeTier
SELECT * FROM nerds.getSectionGradeTiers(1);

--Calling dropSectionGradeTier
SELECT nerds.dropSectionGradeTier(1, 'C');

--Should return an error
\qecho this should return an error
SELECT nerds.addSectionGradeTier(1, 'C', 89.51, 95.00);

--Calling getSectionGradeTier
SELECT * FROM nerds.getSectionGradeTiers(1);

--Calling modifySectionGradeTier
SELECT nerds.modifySectionGradeTier(1, 'A', 95, NULL, NULL);
SELECT nerds.modifySectionGradeTier(1, 'A', NULL, NULL, 'A-');

--Calling addSectionGradeTier
SELECT nerds.addSectionGradeTier(1, 'C', 69.50, 79.49);

--Calling getSectionGradeTier
SELECT * FROM nerds.getSectionGradeTiers(1);

--Calling copySectionGradeTier
SELECT nerds.copySectionGradeTier(1, 'A-', 2);

--Calling modifySectionGradeTier
SELECT nerds.modifySectionGradeTier(1, 'A-', 89.50, NULL, 'A');

--Calling getSectionGradeTier
SELECT * FROM nerds.getSectionGradeTiers(2);


--Calling assessmentKindMgmt.sql functions for testing

--Calling addSectionAssessmentKind
SELECT nerds.addSectionAssessmentKind(1, 'Exam', 'Tests and Quizzes', 1.00);
SELECT nerds.addSectionAssessmentKind(1, 'Homework', 'Work done outside of class', 0.5);
SELECT nerds.addSectionAssessmentKind(1, 'Presentation', 'Student presentation of concepts to the class', 0.66);

--Calling getSectionAssessmentKinds
SELECT * FROM nerds.getSectionAssessmentKinds(1);

--Calling dropSectionAssessmentKind
SELECT nerds.dropSectionAssessmentKind(1, 'Presentation');

--Calling getSectionAssessmentKinds
SELECT * FROM nerds.getSectionAssessmentKinds(1);

--Calling modifySectionAssessmentKind
SELECT nerds.modifySectionAssessmentKind(1,'Exam', 'Tests only', NULL, NULL);
SELECT nerds.modifySectionAssessmentKind(1,'Exam', NULL, NULL, 'Test');

--Calling getSectionAssessmentKinds
SELECT * FROM nerds.getSectionAssessmentKinds(1);

--Calling copySectionAssessmentKind
SELECT nerds.copySectionAssessmentKind(1,'Homework', 2);

--Calling getSectionAssessmentKinds
SELECT * FROM nerds.getSectionAssessmentKinds(2);


--Calling assessmentItemMgmt functions for testing

--Calling addSectionAssessmentItem
SELECT nerds.addSectionAssessmentItem(1,'Test',1,'First test of the semester',100,CURRENT_DATE,CURRENT_DATE,NULL,1.06);
SELECT nerds.addSectionAssessmentItem(1,'Homework',1,'First homework of the semester',25,'2018-10-02', '2018-10-04',NULL,1.00);
SELECT nerds.addSectionAssessmentItem(1,'Homework',2,'Second homework of the semester',25,'2018-10-06', '2018-10-10',NULL,1.03);
SELECT nerds.addSectionAssessmentItem(1,'Homework',3,'Third homework of the semester',25,'2018-10-12', '2018-10-20','2018-10-12',NULL);

--Calling getSectionAssessmentItems
SELECT * FROM nerds.getSectionAssessmentItems(1,'Homework');

--Calling dropSectionAssessmentItem
SELECT nerds.dropSectionAssessmentItem(1,'Homework',3);

--Calling getSectionAssessmentItems
SELECT * FROM nerds.getSectionAssessmentItems(1,'Homework');

--Calling modifySectionAssessmentItem
SELECT nerds.modifySectionAssessmentItem(1,'Homework',2,'See updated syllabus',NULL,NULL,NULL,NULL,NULL,NULL);
SELECT nerds.modifySectionAssessmentItem(1,'Homework',2,NULL,30,NULL,NULL,NULL,NULL,3);

--Calling getSectionAssessmentItems
SELECT * FROM nerds.getSectionAssessmentItems(1,'Homework');


--Calling submissionMgmt functions for testing

--Calling addSubmission
SELECT nerds.addSubmission(1,1,'Test',1,85,NULL,NULL,CURRENT_DATE,'Nice job');
SELECT nerds.addSubmission(2,1,'Test',1,90,NULL,NULL,CURRENT_DATE,'Highest grade in class');
SELECT nerds.addSubmission(2,1,'Homework',1,20,NULL,2,'2018-10-02','Early');
SELECT nerds.addSubmission(1,1,'Homework',3,20,5,NULL,'2018-10-09','Bonus points!');
SELECT nerds.addSubmission(2,1,'Homework',3,20,NULL,NULL,'2018-10-09','No comment');

--Calling getAssessmentItemScoresEnrollee
\qecho Assessment Item Scores for Enrollee 1, Section 1
SELECT * FROM nerds.getAssessmentItemScoresEnrollee(1,1,'Homework');

--Calling getAssessmentItemScoresInstructor
\qecho Assessment Item Scores for Section 1 Test 1
SELECT * FROM nerds.getAssessmentItemScoresInstructor(1,'Test',1);

--Calling getAssessmentKindAvgEnrollee
SELECT * FROM nerds.getAssessmentKindAvgEnrollee(2,1,'Homework');

--Calling getAssessmentKindAvgInstructor
SELECT * FROM nerds.getAssessmentKindAvgInstructor(1,'Homework');

--Calling modifySubmission
SELECT nerds.modifySubmission(1,1,'Test',1,NULL,10,NULL,NULL,NULL);

--Calling getAssessmentItemScoresEnrollee
SELECT * FROM nerds.getAssessmentItemScoresEnrollee(1,1,'Test');

--Should fail
\qecho This next insert should fail, as it is attempting to insert more base points earned than an assessment item is worth.
SELECT nerds.addSubmission(2,1,'Homework',1,30,NULL,2,'2018-10-05','Late');

--Should fail
\qecho This next insert should fail, as it is attempting to insert a submission date that is before the handout date of an assessment item.
SELECT nerds.addSubmission(2,1,'Homework',1,20,NULL,2,'2018-10-01','Super Early');



--end spooling
\o