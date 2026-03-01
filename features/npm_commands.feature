# Feature: NPM Command Logic
# Unit tests for the logic underpinning each npm script:
#   start / build-links / standings  -> src/index.js (arg parsing)
#   competitions                     -> src/scrapeCountries.js
#   results                          -> src/competitionResults.cjs (arg parsing)
#   fixtures                         -> src/competitionFixtures.cjs (arg parsing)
#   basketball / basketball:detailed -> src/scrapeAllBasketball.js (arg parsing)
#   basketball:seasons               -> src/extractLeagueSeasons.js (URL helpers)
#   read-csv                         -> src/readAllCsv.js
#   print-csv                        -> src/printCsv.js (file discovery)
#   test                             -> src/testBasketballCsv.js + testAllFunctionalities.js

Feature: NPM Command Logic
  As a developer
  I want the logic behind each npm command to work correctly
  So that the scripts produce the expected output and CSV files

  # ── npm run start / npm run build-links / npm run standings ──────────────────

  Scenario Outline: index.js CLI argument parsing recognises the action flag
    Given the CLI args contain "action=<action>"
    When I parse the CLI args
    Then the parsed action should be "<action>"

    Examples:
      | action       |
      | results      |
      | fixtures     |
      | standings    |
      | build-links  |

  Scenario: index.js CLI args default country and league are empty when not provided
    Given the CLI args contain no country or league
    When I parse the CLI args
    Then the parsed country should be empty
    And the parsed league should be empty

  Scenario: index.js CLI args parse country and league correctly
    Given the CLI args contain "country=spain" and "league=acb"
    When I parse the CLI args
    Then the parsed country should be "spain"
    And the parsed league should be "acb"

  # ── npm run results (competitionResults.cjs) ──────────────────────────────────

  Scenario: results script parses country and league from key=value args
    Given the competitionResults args are "country=spain" and "league=acb"
    When I parse the competitionResults args
    Then the results country should be "spain"
    And the results league should be "acb"

  Scenario: results script parses country and league from positional args
    Given the competitionResults positional args are "france" and "ligue1"
    When I parse the competitionResults args
    Then the results country should be "france"
    And the results league should be "ligue1"

  # ── npm run fixtures (competitionFixtures.cjs) ────────────────────────────────

  Scenario: fixtures script parses country and league from key=value args
    Given the competitionFixtures args are "country=germany" and "league=bundesliga"
    When I parse the competitionFixtures args
    Then the fixtures country should be "germany"
    And the fixtures league should be "bundesliga"

  Scenario: fixtures script defaults to France/lnb when no args provided
    Given the competitionFixtures args are empty
    When I parse the competitionFixtures args
    Then the fixtures country should be "France"
    And the fixtures league should be "lnb"

  # ── npm run basketball / basketball:detailed ──────────────────────────────────

  Scenario: basketball command defaults detailed to false
    Given no basketball args are provided
    When I parse the basketball args
    Then the detailed flag should be false

  Scenario: basketball:detailed command sets detailed to true
    Given the basketball arg "detailed=true" is provided
    When I parse the basketball args
    Then the detailed flag should be true

  Scenario: basketball:detailed accepts --detailed flag
    Given the basketball arg "--detailed" is provided
    When I parse the basketball args
    Then the detailed flag should be true

  # ── npm run basketball:seasons (extractLeagueSeasons.js) ─────────────────────

  Scenario: extractLeagueSeasons resolveSourceUrl uses default when no arg given
    Given no source URL arg is provided
    When I resolve the source URL
    Then the resolved URL should contain "raw.githubusercontent.com"

  Scenario: extractLeagueSeasons buildArchiveUrl appends archive path
    Given I have a league href "/basketball/usa/nba"
    When I call buildArchiveUrl
    Then the result should end with "/archive/"

  # ── npm run print-csv ─────────────────────────────────────────────────────────

  Scenario: print-csv finds CSV files recursively in a directory
    Given a temporary directory with 2 CSV files in subdirectories
    When I scan the directory for CSV files
    Then 2 CSV files should be found

  Scenario: print-csv returns empty list when no CSV files exist
    Given a temporary directory with no CSV files
    When I scan the directory for CSV files
    Then 0 CSV files should be found

  # ── npm run read-csv ──────────────────────────────────────────────────────────

  Scenario: read-csv processes CSV files that contain data
    Given a CSV file exists with data rows
    When I read and parse the CSV file
    Then at least 1 row of data should be returned

  # ── npm test (existing test scripts) ─────────────────────────────────────────

  Scenario: existing test scripts can be located on disk
    When I check for the test script "src/testBasketballCsv.js"
    Then the file should exist

  Scenario: existing test scripts can be located on disk for all functionalities
    When I check for the test script "src/testAllFunctionalities.js"
    Then the file should exist
