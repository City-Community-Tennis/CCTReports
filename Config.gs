// 34567890123456789012345678901234567890123456789012345678901234567890123456789

// JSHint - 20200108
/* jshint asi: true */

(function() {"use strict"})()

// Code review all files - 20200108
// JSHint review (see files) - 20200108
// Unit Tests - TODO
// System Test (Dev) - TODO
// System Test (Prod) - 20200108

// Config.gs
// =========
//
// Dev: AndrewRoberts.net
//
// All the constants and configuration settings

// Configuration
// =============

var SCRIPT_NAME = "CCTReports"
var SCRIPT_VERSION = "v1.0"

var PRODUCTION_VERSION_ = true

// Log Library
// -----------

var DEBUG_LOG_LEVEL_ = PRODUCTION_VERSION_ ? BBLog.Level.INFO : BBLog.Level.FINER
var DEBUG_LOG_DISPLAY_FUNCTION_NAMES_ = PRODUCTION_VERSION_ ? BBLog.DisplayFunctionNames.NO : BBLog.DisplayFunctionNames.YES

// Assert library
// --------------

var SEND_ERROR_EMAIL_ = PRODUCTION_VERSION_ ? true : false
var HANDLE_ERROR_ = Assert.HandleError.THROW
var ADMIN_EMAIL_ADDRESS_ = 'dev@citycommunitytennis.com.au'

// Tests
// -----

var TEST_SHEET_ID_ = '1s_8XPo-VM_mZuSbwSdmILN8rTTe-Br8jODp5-_nK1CU'

var TEST_GET_DATE_FROM_USER_ = true

if (PRODUCTION_VERSION_ && !TEST_GET_DATE_FROM_USER_) {
  throw new Error('Test flags set in production')
}

// Intrac
// ------

var INTRAC_USERNAME_ = "Andrew"
var INTRAC_PASSWORD_ = "google"

var INTRAC_BASE_URL_ = 'https://jensenstennis.intrac.com.au/tennis/admin/'
var INTRAC_USAGE_URL_ = 'usage.cfm?location='

// Sheets
// ------

var STAGING_UNPLAYABLE_CELL_        = 'K5'
var STAGING_NUMBER_OF_DAYS_CELL_    = 'K6'
var STAGING_NUMBER_OF_COURTS_RANGE_ = 'I9:I13'

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
    lostHoursRange: 'M12',
    bookingsRange: 'Q12',
    numberOfCourtsIndex: 3,
    courtMaintenanceRow: 15,
  },{
    name: 'Alexandria', 
    locationId: 3,
    lostHoursRange: 'M9',    
    bookingsRange: 'Q9',    
    numberOfCourtsIndex: 0,
    courtMaintenanceRow: 12,
  },{
    name: 'Beaconsfield', 
    locationId: 4,
    lostHoursRange: 'M10',
    bookingsRange: 'Q10',    
    numberOfCourtsIndex: 1,
    courtMaintenanceRow: 12,    
  },{
    name: 'Glebe Upper', 
    locationId: 5,
    lostHoursRange: 'M11',
    bookingsRange: 'Q11',  
    numberOfCourtsIndex: 2,
    courtMaintenanceRow: 12,    
  },{
    name: 'Rosebery', 
    locationId: 6,
    lostHoursRange: 'M13',
    bookingsRange: 'Q13',    
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

  

} // functionTemplate() 
*/