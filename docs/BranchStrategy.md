<!--
BranchStrategy.md

This is the same document as Branch-Strategy.docs.
It has been converted so that it can be viewed without the
need for a word processor.

Bruno Desilva, Cristian Fitzgerald, Elly Griffin,
Kenneth Kozlowski
Team GEEKS

Date of Last Modification: 2/26/2019
-->
# <u>Team GEEKS Branching Strategy</u>
##### Bruno Desilva, Cris Fitzgerald, Elly Griffin, Kenneth Kozlowski  

***

We have elected to use *4* different branches in the development of this project:  
* Master
* Development (dev)
* Feature
* Hot Fix

***

#### <u>Master</u>:
A branch for production-ready code. Each *"release"* is pushed to `master` from `dev`.

***
#### <u>Development</u>:  
A branch for the current build of the product. Each task that is finished and tested will be pushed to `master`. This branch is the **default** branch of the repo.  

***
#### <u>Feature</u>:
Each *leaf level requirement* that will be worked on which are located in [Gradebook Requirements](https://github.com/smacademic/project-GEEKS/blob/dev/docs/GradebookRequirements.pdf) will become a feature branch. *Leaf Level requirements* are the sub-requirements of the main requirements (two of which will be focused on for the project [Course Management & Section Management]). An example of this would be `add a course` and `report on courses`.  
Once competed, the feature branch will be pushed to the `dev` branch where it will be tested before it is pushed to `master`.  

Currently we are as a team going to be working on implementing *11* different features which will result in *11* different feature branches being created and worked on during the duration of the project.  
**NOTE**: Each specific change to a feature should be added to a branch of the main feature being worked on *I.E.* If a team member creates a new function for `add course` with an appropriate name (like `add-course-function-3`). Once the fnuction development is completed, then a **Merge/Pull Request** will be created so that all changes made will be reviewed by team members before it is pulled into the *Main Feature Branch*.  
***
#### <u>Hot Fix</u>:
This type of branch will be used to fix minor bugs that pop up later within sections of the project that have been pushed to `master`. Once the issue has been addressed and resolved, the branch for the fix will be pulled into `master`, `dev` and any feature branch that is being worked on so that all current branches will be up to date.  
***
#### <u>Testing</u>:
Although a testing branch would be helpful in much larger projects, it will **not** be used in the repo. The inclusion of this branch would be redundant since the team will be testing code as it is being developed. The action of testing itself will be done in the `dev` branch.  
***
#### <u>Merge Days</u>:
As a team, we have agreed that on **Fridays** we will set aside a portion of the day to review any code that are in *pending* pull requests. Reviews of pull requests will happen as they pop up.  
Team meetings will happen on *Fridays (or another day specified by the team)* where all team members can be brought up to speed on what development is being done. This will also allow us to being up any issues that popped up during development so that everyone is aware of it so it can be resolved.  
**NOTE**: This does **not** negate using *Microsoft Teams* and *GitHub* to discuss changes during the week, but rather sets a "soft" deadline for work.
