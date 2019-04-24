-- addTermMgmt.SQL

-- Team GEEKS, CS298 Spring 2019

--Function to get all terms that a course if offered
-- returns the term's season (i.e. spring) and year (i.e 2019)

CREATE OR REPLACE FUNCTION getTerms()
RETURNS Table(outSeason VARCHAR, outYear NUMERIC(4,0)) AS
$$
BEGIN
RETURN QUERY
    SELECT S.Name, T.Year
    FROM Gradebook.Term T INNER JOIN Gradebook.Season S 
    ON (T.Season = S."Order");
END
$$
LANGUAGE plpgsql;