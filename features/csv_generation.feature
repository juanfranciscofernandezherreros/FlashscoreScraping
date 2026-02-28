# Feature: CSV Generation Functions
# Tests for all generateCSV* functions in src/csvGenerator.js
# Verifies that CSV files are created and contain data

Feature: CSV Generation
  As a developer
  I want the CSV generator functions to create valid CSV files with data
  So that scraped data is properly persisted

  Background:
    Given the test output directory is clean

  Scenario: generateCSVData creates a CSV file with headers and rows
    Given I have match result data with 3 records
    When I call generateCSVData with a file path
    Then a CSV file should exist at that path
    And the CSV file should contain 3 data rows
    And the CSV file should contain proper headers

  Scenario: generateCSVData with empty data does not create a file
    Given I have empty data
    When I call generateCSVData with a file path
    Then no CSV file should be created

  Scenario: generateCSVDataResults creates a CSV file with match results
    Given I have basketball match results with 2 records
    When I call generateCSVDataResults with a file path
    Then a CSV file should exist at that path
    And the CSV file should contain 2 data rows

  Scenario: generateCSVDataResults handles null field values
    Given I have match results data with null fields
    When I call generateCSVDataResults with a file path
    Then a CSV file should exist at that path
    And the CSV file should not contain the word "null"

  Scenario: generateCSVPlayerStats creates a CSV file with player statistics
    Given I have player stats data with 2 players
    When I call generateCSVPlayerStats with a file path
    Then a CSV file should exist at that path
    And the CSV file should contain player names

  Scenario: generateCSVStatsMatch creates a CSV file with match statistics
    Given I have match stats data as CSV rows
    When I call generateCSVStatsMatch with a file path
    Then a CSV file should exist at that path
    And the CSV file should contain the stats headers

  Scenario: generateCSVFromObject creates a CSV from a flat object
    Given I have a flat object with match summary data
    When I call generateCSVFromObject with a file path
    Then a CSV file should exist at that path
    And the CSV file should have a header row and a value row

  Scenario: generateCSVOdds creates a CSV file with odds data
    Given I have odds data with 3 records
    When I call generateCSVOdds with a file path
    Then a CSV file should exist at that path
    And the CSV file should contain 3 data rows

  Scenario: generateCSVOdds with empty data does not create a file
    Given I have empty odds data
    When I call generateCSVOdds with a file path
    Then no CSV file should be created

  Scenario: generateCSVHeadToHead creates a CSV file with H2H match data
    Given I have head-to-head data with home and away last matches
    When I call generateCSVHeadToHead with a file path
    Then a CSV file should exist at that path
    And the CSV file should contain section headers

  Scenario: generateCSVStandings creates a CSV file with league standings
    Given I have standings data with 5 teams
    When I call generateCSVStandings with a file path
    Then a CSV file should exist at that path
    And the CSV file should contain 5 data rows

  Scenario: generateCSVLineups creates a CSV file with team lineups
    Given I have lineup data with home and away players
    When I call generateCSVLineups with a file path
    Then a CSV file should exist at that path
    And the CSV file should contain lineup rows for both teams

  Scenario: generateCSVCountriesAndLeagues creates a CSV with countries and leagues
    Given I have countries and leagues data with 4 entries
    When I call generateCSVCountriesAndLeagues with a file path
    Then a CSV file should exist at that path
    And the CSV file should contain 4 data rows

  Scenario: generateCSVPointByPoint creates a CSV with point-by-point data
    Given I have point-by-point data with 5 events
    When I call generateCSVPointByPoint with a file path and match id
    Then a CSV file should exist at that path
    And the CSV file should contain matchId in every row
