// 34567890123456789012345678901234567890123456789012345678901234567890123456789

// JSHint - TODO
/* jshint asi: true */

(function() {"use strict"})()

// Code review all files - TODO
// JSHint review (see files) - TODO
// Unit Tests - TODO
// System Test (Dev) - TODO
// System Test (Prod) - TODO

// Config.gs
// =========
//
// Dev: AndrewRoberts.net
//
// All the constants and configuration settings

// Configuration
// =============

var SCRIPT_NAME = "CCTReports"
var SCRIPT_VERSION = "v0.4"

var PRODUCTION_VERSION_ = false

// Log Library
// -----------

var DEBUG_LOG_LEVEL_ = PRODUCTION_VERSION_ ? BBLog.Level.INFO : BBLog.Level.ALL
var DEBUG_LOG_DISPLAY_FUNCTION_NAMES_ = PRODUCTION_VERSION_ ? BBLog.DisplayFunctionNames.NO : BBLog.DisplayFunctionNames.YES

// Assert library
// --------------

var SEND_ERROR_EMAIL_ = PRODUCTION_VERSION_ ? true : false
var HANDLE_ERROR_ = Assert.HandleError.THROW
var ADMIN_EMAIL_ADDRESS_ = ''

// Tests
// -----

// var TEST_SHEET_ID_ = '1cWei66UX8JuCGOz_eP3hY7ln_yDCQ0-pXUrkAxmPuTs' // Usage
// var TEST_SHEET_ID_ = '1_y9v-Gam5dAQt4ckCij3_qpW0slFVRWxlXxoW5PFLyo' // CCT Dashboard - Revenue Streams - v0.2.dev_ajr
var TEST_SHEET_ID_ = '1WfJpAtswMspl_rEuS0fxs8dmOt3SSxgfKkC5lpTB_Cg' // Copy of CCT Dashboard - Occupancy - v0.2 - for Rosebery updates

// Intrac
// ------

var INTRAC_USERNAME_ = "Andrew"
var INTRAC_PASSWORD_ = "google"

var INTRAC_BASE_URL_ = 'https://jensenstennis.intrac.com.au/tennis/admin/'
var INTRAC_USAGE_URL_ = 'usage.cfm?location='

// Sheets
// ------

var STAGING_UNPLAYABLE_CELL_        = 'I5'
var STAGING_NUMBER_OF_DAYS_CELL_    = 'I6'
var STAGING_NUMBER_OF_COURTS_RANGE_ = 'G9:G13'

var DASHBOARD_START_DATE_CELL_       = 'C3'
var DASHBOARD_NUMBER_OF_MONTHS_CELL_ = 'F3'

// Constants/Enums
// ===============

var MASTER_SHEET_ID_ = '1ZbGUWCW0lEn0ksBaIH_klj6jLpFClTdn82XDwUzbChQ'


var SALES_TAX_ = 0.1

        

/**
 * Location config
 *
 * name {string}                - e.g. 'Surry Hills' 
 * locationId {number}          - Intrac ID, e.g. 2
 * lostHoursRange {string}      - Cell range in staging sheet, e.g. 'I12',
 * bookingsRange {string}       - Cell range in staging sheet, e.g. 'M12',
 * numberOfCourtsIndex {number} - Index into the number of courts range in the staging sheet
 * courtMaintenanceRow {number} - Row number in raw Intrac data
 */

var LOCATIONS_ = [
  {
    name: 'Surry Hills', 
    locationId: 2,
    lostHoursRange: 'K12',
    bookingsRange: 'O12',
    numberOfCourtsIndex: 3,
    courtMaintenanceRow: 15,
  },{
    name: 'Alexandria', 
    locationId: 3,
    lostHoursRange: 'K9',    
    bookingsRange: 'O9',    
    numberOfCourtsIndex: 0,
    courtMaintenanceRow: 12,
  },{
    name: 'Beaconsfield', 
    locationId: 4,
    lostHoursRange: 'K10',
    bookingsRange: 'O10',    
    numberOfCourtsIndex: 1,
    courtMaintenanceRow: 12,    
  },{
    name: 'Glebe Upper', 
    locationId: 5,
    lostHoursRange: 'K11',
    bookingsRange: 'O11',  
    numberOfCourtsIndex: 2,
    courtMaintenanceRow: 12,    
  },{
    name: 'Rosebery', 
    locationId: 6,
    lostHoursRange: 'K13',
    bookingsRange: 'O13',    
    numberOfCourtsIndex: 4, 
    courtMaintenanceRow: 15,    
  }
]

// Function Template
// -----------------

/**
 *
 *
 * @param {object} 
 *
 * @return {object}
 */
/* 
function functionTemplate() {

  Log_.functionEntryPoint()
  
  

} // functionTemplate() 
*/