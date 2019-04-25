-- addTermMgmt.SQL

-- Team GEEKS, CS298 Spring 2019

--Function to get all terms that a course if offered
-- returns the term's ID, season (i.e. spring), year (i.e 2019)

CREATE OR REPLACE FUNCTION gradebook.getTerms()
RETURNS Table(outID INT, outSeason VARCHAR, outYear NUMERIC(4,0)) AS
$$
BEGIN
RETURN QUERY
    SELECT T.ID, S.Name, T.Year
    FROM Gradebook.Term T INNER JOIN Gradebook.Season S
    ON (T.Season = S."Order");
END
$$
LANGUAGE plpgsql;
