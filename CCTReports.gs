// JSHint - 20200108
/* jshint asi: true */

(function() {"use strict"})()

// CCTReports.gs
// =============
//
// Dev: AndrewRoberts.net
//
// External interface to this script - all of the event handlers.
//
// This files contains all of the event handlers, plus miscellaneous functions 
// not worthy of their own files yet
//
// The filename is prepended with _API as the Github chrome extension won't 
// push a file with the same name as the project.

var Log_

// Public event handlers
// ---------------------
//
// All external event handlers need to be top-level function calls; they can't 
// be part of an object, and to ensure they are all processed similarily 
// for things like logging and error handling, they all go through 
// errorHandler_(). These can be called from custom menus, web apps, 
// triggers, etc
// 
// The main functionality of a call is in a function with the same name but 
// post-fixed with an underscore (to indicate it is private to the script)
//
// For debug, rather than production builds, lower level functions are exposed
// in the menu

var EVENT_HANDLERS_ = {

//                           Name                            onError Message                          Main Functionality
//                           ----                            ---------------                          ------------------

  onGetUsage:                ['onGetUsage()',                'Failed to get usuage',                  onGetUsage_],
  onGetRevenueStreams:       ['onGetRevenueStreams()',       'Failed to get revenue streams',         onGetRevenueStreams_],
  onGetCoachHours:           ['onGetCoachHours()',           'Failed to get revenue streams',         onGetCoachHours_],
  onGetNewMemberData:        ['onGetNewMemberData()',        'Failed to get new member data',         onGetNewMemberData_],
}

function onGetUsage(args) {return eventHandler_(EVENT_HANDLERS_.onGetUsage, args)}
function onGetRevenueStreams(args) {return eventHandler_(EVENT_HANDLERS_.onGetRevenueStreams, args)}
function onGetCoachHours(args) {return eventHandler_(EVENT_HANDLERS_.onGetCoachHours, args)}
function onGetNewMemberData(args) {return eventHandler_(EVENT_HANDLERS_.onGetNewMemberData, args)}

// Private Functions
// =================

// General
// -------

/**
 * All external function calls should call this to ensure standard 
 * processing - logging, errors, etc - is always done.
 *
 * @param {Array} config:
 *   [0] {Function} prefunction
 *   [1] {String} eventName
 *   [2] {String} onErrorMessage
 *   [3] {Function} mainFunction
 *
 * @param {Object}   args       The argument passed to the top-level event handler
 */

function eventHandler_(config, args) {

  try {

    var userEmail = Session.getActiveUser().getEmail()

    Log_ = BBLog.getLog({
      level:                DEBUG_LOG_LEVEL_, 
      displayFunctionNames: DEBUG_LOG_DISPLAY_FUNCTION_NAMES_,
    })
    
    Log_.info('Handling ' + config[0] + ' from ' + (userEmail || 'unknown email') + ' (' + SCRIPT_NAME + ' ' + SCRIPT_VERSION + ')')
    
    // Call the main function
    return config[2](args)
    
  } catch (error) {
  
    var handleError = Assert.HandleError.DISPLAY_FULL

    if (!PRODUCTION_VERSION_) {
      handleError = Assert.HandleError.THROW
    }

    var assertConfig = {
      error:          error,
      userMessage:    config[1],
      log:            Log_,
      handleError:    handleError, 
      sendErrorEmail: SEND_ERROR_EMAIL_, 
      emailAddress:   ADMIN_EMAIL_ADDRESS_,
      scriptName:     SCRIPT_NAME,
      scriptVersion:  SCRIPT_VERSION, 
    }

    Assert.handleError(assertConfig) 
  }
  
} // eventHandler_()

// Private event handlers
// ----------------------

function onGetUsage_(args) {return InTrac_.getUsage(args)}
function onGetRevenueStreams_(args) {return InTrac_.getRevenues(args)}
function onGetCoachHours_(args) {return InTrac_.getCoachHours(args)}
function onGetNewMemberData_(args) {return InTrac_.getNewMemberData(args)}
