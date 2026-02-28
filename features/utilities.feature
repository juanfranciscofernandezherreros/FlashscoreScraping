# Feature: Utility Functions
# Tests for utility functions in src/fecha.js, src/constants/index.js,
# src/extractLeagueSeasons.js, and src/utils/index.js

Feature: Utility Functions
  As a developer
  I want utility functions to behave correctly
  So that dates, URLs, and data are formatted and processed properly

  Scenario: formatFecha formats a date as a 14-digit timestamp string
    Given I have a date of "2026-02-26 14:30:45"
    When I call formatFecha
    Then the result should be "20260226143045"

  Scenario: formatFecha pads single-digit month and day
    Given I have a date of "2025-03-05 09:03:07"
    When I call formatFecha
    Then the result should be "20250305090307"

  Scenario: formatFecha handles midnight
    Given I have a date of "2025-01-01 00:00:00"
    When I call formatFecha
    Then the result should be "20250101000000"

  Scenario: formatFecha returns a string of exactly 14 characters
    Given I have any valid date
    When I call formatFecha
    Then the result should be a 14-character string of digits

  Scenario: BASE_URL is the correct flashscore URL
    When I read the BASE_URL constant
    Then it should equal "https://www.flashscore.com"

  Scenario: BASKETBALL_URL is derived from BASE_URL
    When I read the BASKETBALL_URL constant
    Then it should equal "https://www.flashscore.com/basketball"
    And it should start with BASE_URL

  Scenario: resolveSourceUrl converts github.com blob URL to raw URL
    Given I have a GitHub blob URL "https://github.com/owner/repo/blob/main/file.csv"
    When I call resolveSourceUrl
    Then the result should equal "https://raw.githubusercontent.com/owner/repo/main/file.csv"

  Scenario: resolveSourceUrl leaves non-GitHub URLs unchanged
    Given I have a direct URL "https://example.com/data.csv"
    When I call resolveSourceUrl
    Then the result should equal "https://example.com/data.csv"

  Scenario: buildArchiveUrl appends /archive/ to a relative league href
    Given I have a league href "/basketball/spain/acb"
    When I call buildArchiveUrl
    Then the result should end with "/archive/"
    And the result should start with "https://www.flashscore.com"

  Scenario: buildArchiveUrl returns empty string for empty href
    Given I have an empty league href
    When I call buildArchiveUrl
    Then the result should be an empty string

  Scenario: filterSeasonEntries keeps only valid season entries
    Given I have season entries including valid years and invalid entries
    When I call filterSeasonEntries
    Then only entries with season year patterns should be returned

  Scenario: filterSeasonEntries removes duplicate hrefs
    Given I have season entries with duplicate hrefs
    When I call filterSeasonEntries
    Then duplicate href entries should be removed

  Scenario: getStatsMatchButtonXPath returns correct XPath for index 4
    When I call getStatsMatchButtonXPath with index 4
    Then the result should be "//*[@id=\"detail\"]/div[4]/div[1]/div/a[5]/button"

  Scenario: getStatsMatchPeriodCandidates includes OT for index 4
    When I call getStatsMatchPeriodCandidates with index 4
    Then the result should include "OT"
