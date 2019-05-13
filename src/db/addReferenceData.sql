--addReferenceData.sql - Gradebook

--Zaid Bhujwala, Zach Boylan, Steven Rollo, Sean Murthy
--Data Science & Systems Lab (DASSL), Western Connecticut State University (WCSU)

--(C) 2017- DASSL. ALL RIGHTS RESERVED.
--Licensed to others under CC 4.0 BY-SA-NC
--https://creativecommons.org/licenses/by-nc-sa/4.0/

--PROVIDED AS IS. NO WARRANTIES EXPRESSED OR IMPLIED. USE AT YOUR OWN RISK.

--This script populates tables that contain "reference data"
-- installers should review and customize the data to meet their requirement

--This script should be run after the script createTables.sql is run
-- the script should be run before adding rows into any other tables because
-- the rows added here influence all other data, either directly or indirectly 


--populate the Season table with values found in the OpenClose system at WCSU
-- the value of the "Order" column should start with zero and be incremented by
-- 1 with each season;
-- the order of values in the "Order" column must follow the order of seasons
-- in the calendar year; not in the school's academic year. For example, the
-- rows inserted here say that Spring is the first season classes are held in a
-- calendar year, followed by "Spring_Break" and so on
INSERT INTO Gradebook.Season("Order", Name, Code)
VALUES
   ('0','Spring','S'),  ('1','Spring_Break','B'),  ('2','Summer','M'),
   ('3','Fall','F'),    ('4','Intersession','I');



--populate the Grade table with values used at most US schools
-- each record establishes a correspondence between a letter grade and eqt. GPA;
-- see schema of Gradebook.Grade for values permitted in these columns
INSERT INTO Gradebook.Grade(Letter, GPA)
VALUES
   ('A+', 4.333), ('A', 4),      ('A-', 3.667), ('B+', 3.333), ('B', 3),
   ('B-', 2.667), ('C+', 2.333), ('C', 2),      ('C-', 1.667), ('D+', 1.333),
   ('D', 1),      ('D-', 0.667), ('F', 0),      ('W', 0),      ('SA', 0);



--add some well-known attendance statuses
-- each record creates a correspondence between an internal status code and a
-- description that is displayed to the user
INSERT INTO Gradebook.AttendanceStatus(Status, Description)
VALUES
   ('P', 'Present'),           ('A', 'Absent'),   ('E', 'Explained'),
   ('S', 'Stopped Attending'), ('X', 'Excused'),  ('N', 'Not Registered'),
   ('C', 'Cancelled'),         ('W', 'Withdrawn');

--NERDS, TO COMMENT

INSERT INTO Gradebook.course(Number,Title,Credits) VALUES
 ('CS170','C++ Programming',3),
 ('CS221','Object-Oriented Programming',4);
 
INSERT INTO Gradebook.season("Order",Name,Code) VALUES
 (0,'Fall','F'),
 (1,'Winter','W'),
 (2,'Spring','S');
 
INSERT INTO Gradebook.term(Year,Season,StartDate,EndDate) VALUES
 (2018,(SELECT "Order" FROM Gradebook.Season WHERE "Order" = 0),'2018-08-28','2018-12-15'),
 (2019,(SELECT "Order" FROM Gradebook.Season WHERE "Order" = 1),'2019-01-16','2019-05-20');
 
 INSERT INTO Gradebook.section(Term,Course,SectionNumber,CRN,Schedule,Capacity,Location,StartDate,EndDate,MidtermDate,Instructor1,Instructor2) VALUES
 (1,(SELECT Number FROM Gradebook.Course WHERE Number = 'CS170'),01,4080,'MW',20,'WS103',(SELECT StartDate FROM Gradebook.Term WHERE Year = 2018 AND Season = 0),(SELECT EndDate FROM Gradebook.Term WHERE Year = 2018 AND Season = 0),'2018-10-30',(SELECT ID FROM Gradebook.Instructor WHERE ID = 1),(SELECT ID FROM Gradebook.Instructor WHERE ID = 2)),
 (1,(SELECT Number FROM Gradebook.Course WHERE Number = 'CS221'),72,4089,'TR',25,'WS116',(SELECT StartDate FROM Gradebook.Term WHERE Year = 2018 AND Season = 0),(SELECT EndDate FROM Gradebook.Term WHERE Year = 2018 AND Season = 0),'2019-3-20',(SELECT ID FROM Gradebook.Instructor WHERE ID = 2),(SELECT ID FROM Gradebook.Instructor WHERE ID = 1)); 
 
 INSERT INTO Gradebook.student(ID,FName,MName,LName,SchoolIssuedID,Email,Major,Year) VALUES
 (DEFAULT,'William','Joseph','Blazkowicz',20519436,'blazkowicz001@connect.wcsu.edu','Applied Physics','Sophomore'),
 (DEFAULT,'Wall','Strong','E',45612336,'e001@connect.wcsu.edu','Waste Management','Freshman');
 
 INSERT INTO Gradebook.enrollee(Student,Section,DateEnrolled,YearEnrolled,MajorEnrolled,MidtermGradeComputed,MidtermGradeAwarded,FinalGradeComputed,FinalGradeAwarded) VALUES 
 ((SELECT ID FROM Gradebook.Student WHERE ID = 1),(SELECT ID FROM Gradebook.section WHERE ID = 1),NULL,'2018-01-01','Applied Physics',NULL,NULL,NULL,NULL),
 ((SELECT ID FROM Gradebook.Student WHERE ID = 2),(SELECT ID FROM Gradebook.section WHERE ID = 1),NULL,'2016-01-10','Waste Management',NULL,NULL,NULL,NULL);
 
 INSERT INTO Gradebook.attendancerecord(Student,Section,Date,Status) VALUES
 ((SELECT Student FROM Gradebook.Enrollee WHERE Student = 1),(SELECT DISTINCT Section FROM Gradebook.Enrollee WHERE Section = 1),CURRENT_DATE,(SELECT Status FROM Gradebook.AttendanceStatus WHERE Status = 'P')),
 ((SELECT Student FROM Gradebook.Enrollee WHERE Student = 2),(SELECT DISTINCT Section FROM Gradebook.Enrollee WHERE Section = 1),CURRENT_DATE,(SELECT Status FROM Gradebook.AttendanceStatus WHERE Status = 'P'));


SELECT Gradebook.addSectionGradeTier(1, 'A+', 100.01, 999.99);
SELECT Gradebook.addSectionGradeTier(1, 'A', 89.50, 100.00);
SELECT Gradebook.addSectionGradeTier(1, 'B', 79.50, 89.49);
SELECT Gradebook.addSectionGradeTier(1, 'C', 69.50, 79.49);
SELECT Gradebook.addSectionGradeTier(1, 'D', 59.50, 69.49);
SELECT Gradebook.addSectionGradeTier(1, 'F', 0.00, 59.49);

SELECT Gradebook.addSectionAssessmentKind(1, 'Exam', 'Tests and Quizzes', 1.00);
SELECT Gradebook.addSectionAssessmentKind(1, 'Homework', 'Work done outside of class', 0.5);
SELECT Gradebook.addSectionAssessmentKind(1, 'Presentation', 'Student presentation of concepts to the class', 0.66);

SELECT Gradebook.addSectionAssessmentItem(1,'Test',1,'First test of the semester',100,CURRENT_DATE,CURRENT_DATE,NULL,1.06);
SELECT Gradebook.addSectionAssessmentItem(1,'Homework',1,'First homework of the semester',25,'2018-10-02', '2018-10-04',NULL,1.00);
SELECT Gradebook.addSectionAssessmentItem(1,'Homework',2,'Second homework of the semester',25,'2018-10-06', '2018-10-10',NULL,1.03);
SELECT Gradebook.addSectionAssessmentItem(1,'Homework',3,'Third homework of the semester',25,'2018-10-12', '2018-10-20','2018-10-12',NULL);

SELECT Gradebook.addSubmission(1,1,'Test',1,85,NULL,NULL,CURRENT_DATE,'Nice job');
SELECT Gradebook.addSubmission(2,1,'Test',1,90,NULL,NULL,CURRENT_DATE,'Highest grade in class');
SELECT Gradebook.addSubmission(2,1,'Homework',1,20,NULL,2,'2018-10-02','Early');
SELECT Gradebook.addSubmission(1,1,'Homework',3,20,5,NULL,'2018-10-09','Bonus points!');
SELECT Gradebook.addSubmission(2,1,'Homework',3,20,NULL,NULL,'2018-10-09','No comment');