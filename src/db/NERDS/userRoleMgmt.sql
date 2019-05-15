--Team NERDS: Cristian Fitzgerald, Shelby Simpson; CS305-71: Fall 2018

--userRoleMgmt.sql version 1

--To create all roles and assign permissions neccessary for Gradebook operations

--Based on FunctionalToUserRoles.docx

--spool results
\o spooluserRoleMgmt.txt

--Diagnostics:
\qecho -n 'Script run on '
\qecho -n `date /t`
\qecho -n 'at '
\qecho `time /t`
\qecho -n 'Script run by ' :USER ' on server ' :HOST ' with db ' :DBNAME
\qecho ' '
\qecho --------------

--set role to NERDS group role in order to create users/roles (CLASS DB ONLY)
SET ROLE 'nerds';

--Create test users
CREATE USER nerds_test_student WITH ENCRYPTED PASSWORD 'yeah';
CREATE USER nerds_test_instructor WITH ENCRYPTED PASSWORD 'yeah';
CREATE USER nerds_john_cena WITH ENCRYPTED PASSWORD 'yeah';
CREATE USER nerds_mickey_mouse WITH ENCRYPTED PASSWORD 'yeah';
CREATE USER nerds_test_deptHead WITH ENCRYPTED PASSWORD 'yeah';


--Create all roles
DROP ROLE IF EXISTS nerds_student_role;
CREATE ROLE nerds_student_role;

DROP ROLE IF EXISTS nerds_instructor_role;
CREATE ROLE nerds_instructor_role;

DROP ROLE IF EXISTS nerds_deptHead_role;
CREATE ROLE nerds_deptHead_role;

--Assign roles to test users
GRANT nerds_student_role TO nerds_test_student;
GRANT nerds_instructor_role TO nerds_test_instructor;
GRANT nerds_instructor_role TO nerds_john_cena;
GRANT nerds_instructor_role TO nerds_mickey_mouse;
GRANT nerds_deptHead_role TO nerds_test_deptHead;
GRANT nerds_student_role TO fitzgerald077;
GRANT nerds_instructor_role TO simpson055;

--Revoke all permissions for all tables from all roles

-- reset role (CLASS DB ONLY)
RESET ROLE;

--Allow select priveleges on all tables 
GRANT SELECT ON TABLE nerds.Course TO nerds_student_role;
GRANT SELECT ON TABLE nerds.Course TO nerds_instructor_role;
GRANT SELECT ON TABLE nerds.Course TO nerds_deptHead_role;

GRANT SELECT ON TABLE nerds.Season TO nerds_student_role;
GRANT SELECT ON TABLE nerds.Season TO nerds_instructor_role;
GRANT SELECT ON TABLE nerds.Season TO nerds_deptHead_role;

GRANT SELECT ON TABLE nerds.Term TO nerds_student_role;
GRANT SELECT ON TABLE nerds.Term TO nerds_instructor_role;
GRANT SELECT ON TABLE nerds.Term TO nerds_deptHead_role;

GRANT SELECT ON TABLE nerds.Instructor TO nerds_student_role;
GRANT SELECT ON TABLE nerds.Instructor TO nerds_instructor_role;
GRANT SELECT ON TABLE nerds.Instructor TO nerds_deptHead_role;

GRANT SELECT ON TABLE nerds.Grade TO nerds_student_role;
GRANT SELECT ON TABLE nerds.Grade TO nerds_instructor_role;
GRANT SELECT ON TABLE nerds.Grade TO nerds_deptHead_role;

GRANT SELECT ON TABLE nerds.Grade_Tier TO nerds_student_role;
GRANT SELECT ON TABLE nerds.Grade_Tier TO nerds_instructor_role;
GRANT SELECT ON TABLE nerds.Grade_Tier TO nerds_deptHead_role;

GRANT SELECT ON TABLE nerds.Student TO nerds_student_role;
GRANT SELECT ON TABLE nerds.Student TO nerds_instructor_role;
GRANT SELECT ON TABLE nerds.Student TO nerds_deptHead_role;

GRANT SELECT ON TABLE nerds.Enrollee TO nerds_student_role;
GRANT SELECT ON TABLE nerds.Enrollee TO nerds_instructor_role;
GRANT SELECT ON TABLE nerds.Enrollee TO nerds_deptHead_role;

GRANT SELECT ON TABLE nerds.Assessment_Kind TO nerds_student_role;
GRANT SELECT ON TABLE nerds.Assessment_Kind TO nerds_instructor_role;
GRANT SELECT ON TABLE nerds.Assessment_Kind TO nerds_deptHead_role;

GRANT SELECT ON TABLE nerds.Assessment_Item TO nerds_student_role;
GRANT SELECT ON TABLE nerds.Assessment_Item TO nerds_instructor_role;
GRANT SELECT ON TABLE nerds.Assessment_Item TO nerds_deptHead_role;

GRANT SELECT ON TABLE nerds.Submission TO nerds_student_role;
GRANT SELECT ON TABLE nerds.Submission TO nerds_instructor_role;
GRANT SELECT ON TABLE nerds.Submission TO nerds_deptHead_role;

--Allow insert priveleges for instructor role on certain tables
GRANT INSERT ON TABLE nerds.Grade_Tier TO nerds_instructor_role;

GRANT INSERT ON TABLE nerds.Assessment_Kind TO nerds_instructor_role;

GRANT INSERT ON TABLE nerds.Assessment_Item TO nerds_instructor_role;

GRANT INSERT ON TABLE nerds.Submission TO nerds_instructor_role;

--Allow update privileges for instructor role on certain tables

GRANT UPDATE ON TABLE nerds.Grade_Tier TO nerds_instructor_role;

GRANT UPDATE ON TABLE nerds.Assessment_Kind TO nerds_instructor_role;

GRANT UPDATE ON TABLE nerds.Assessment_Item TO nerds_instructor_role;

GRANT UPDATE ON TABLE nerds.Submission TO nerds_instructor_role;

--Allow delete privileges for instructor role on certain tables
GRANT DELETE ON TABLE nerds.Grade_Tier TO nerds_instructor_role;

GRANT DELETE ON TABLE nerds.Assessment_Kind TO nerds_instructor_role;

GRANT DELETE ON TABLE nerds.Assessment_Item TO nerds_instructor_role;



--end spooling
\o