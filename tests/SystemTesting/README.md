# System Testing Documentation

This directory will contain all of the various version of the System Testing Documentation for Gradebook. All of the different versions will be contained in their own subdirectory with the same name as the Release that it supports.  
For example, if there was a release of Gradebook called *Gradebook v0.5.0* then the System Testing subdirectory would be called `Gradebook v0.5.0`  
***
Within the main System Testing directory, there will only be 2 *markdown* files: this README and the file `GradebookSystemTesting.md`.  
When a new subdirectory is created for an official *release* of the System Testing Documentation, a copy of `GradebookSystemTesting.md` will be created and added to the subdirectory. It will then be renamed to `GradebookSystemTesting<releaseVersionNumber>.md`.  
Then a *PDF* copy of the Testing Document will be created so that when an end user downloads a release of Gradebook then there will be a **printable** version of the testing available for the end user to download and use to test that the functionality of the product is working as intended for the release.
***
### Sample Directory Breakdown
A sample of what this directory would look like would be as follows with the assumption that there are 2 different versions of Gradebook published (v0.5.0 and v0.5.9):  
- System Testing Directory
    - README.md
    - GradebookSystemTesting.md
    - dir: Gradebook v0.5.0
        - GradebookSystemTesting0.5.0.md
        - GradebookSystemTesting0.5.0.pdf
    - dir: Gradebook v0.5.9
        - GradebookSystemTesting0.5.9.md
        - GradebookSystemTesting0.5.9.pdf
