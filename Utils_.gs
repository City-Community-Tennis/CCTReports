// 34567890123456789012345678901234567890123456789012345678901234567890123456789

// JSHint - 20200108
/* jshint asi: true */

(function() {"use strict"})()

// Object1_.gs
// ===========
//
// Object template

var Utils_ = (function(ns) {

  /**
   * Scrape data from the InTrac website
   *
   * @param {string} html 
   *
   * @return {array} data
   */
 
  ns.scraper = function(html) {
  
    // Remove all the <b> and </b>s
    html = html.replace(/<b>/g, '').replace(/<\/b>/g, '')

    var STATES = {
      'NULL'  : 'NULL',
      'TABLE' : 'TABLE',
      'TR'    : 'TR',
      'TD'    : 'TD'
    }
    
    var nextTag
    var state = STATES.NULL
    var lastOffset = 0
    var offset = 0
    
    var table = []
    var nextRow = []
    var nextCell
    
    var startStoreOffset = 0    
    var result
    
    do {
      
      result = getNextTag(html, offset)
      
      if (result !== null) {
        
        nextTag    = result.tag
        lastOffset = offset
        offset     = result.offset
        
        if (nextTag === 'table') {   
        
          state = STATES.TABLE
          
        } else if (nextTag === 'tr') {
        
          state = STATES.TR
          
        } else if (nextTag === 'td') {
        
          state = STATES.TD
          startStoreOffset = offset
          
        } else if (nextTag === '/td') {
          
          nextCell = html.slice(startStoreOffset + 1, offset - '</td'.length)
          nextRow.push(nextCell)
          
          state = STATES.TR
          
        } else if (nextTag === '/tr') {
          
          while (nextRow.length < 4) {
            nextRow.push([])
          }
          
          table.push(nextRow.slice())
          nextRow = []
          
          state = STATES.TABLE
          
        } else if (nextTag === '/table') { 
        
          state = STATES.NULL          
        }      
      }
      
    } while (result !== null)
        
    return table  
          
    // Private Functions
    // -----------------
    
    function getNextTag(text, startOffset) {
      
      var openOffset = text.indexOf('<', startOffset)
      
      if (openOffset === -1) {
        return null
      }
      
      openOffset++
        
      var closeOffset = text.indexOf('>', openOffset)
        
      if (closeOffset === -1) {
        return null
      }
      
      var tagEndOffset = text.indexOf(' ', openOffset)
      
      var tag
      
      if (tagEndOffset !== -1) {
        if (tagEndOffset > closeOffset) {
          tag = text.slice(openOffset, closeOffset)      
        } else {
          tag = text.slice(openOffset, tagEndOffset)
        }
      } else {
        tag = text.slice(openOffset, closeOffset)      
      }
      
      return {
        tag: tag,
        offset: closeOffset
      }
      
    } // Utils_.scraper.getNextTag()
    
  } // Utils_.scraper()
  
  /**
   * Get the active spreadsheet, failing that the test one.
   *
   * @return {Spreadsheet} spreadsheet
   */
 
  ns.getSpreadsheet = function() {
    
    var spreadsheet = SpreadsheetApp.getActive()
    
    if (spreadsheet === null) {
      if (!PRODUCTION_VERSION_) {
        spreadsheet = SpreadsheetApp.openById(TEST_SHEET_ID_)
      } else {
        throw new Error('No active spreadsheet')
      }
    }
    
    return spreadsheet
    
  } // Utils_.getSpreadsheet()

  /**
   * Get the suburb for an Australian postcode
   *
   * @param {string} postcode
   *
   * @return {string} suburb or ''
   */
 
  ns.getSuburb = function(postcode) {      
  
    Log_.fine('postcode: ' + postcode)
    
    var url = 'http://api.geonames.org/postalCodeSearchJSON?postalcode=' + postcode + '&maxRows=1&username=citytennis&country=AU'
    var response = UrlFetchApp.fetch(url)
    var data = JSON.parse(response.getContentText())
    Log_.finest('data: %s', data)
    
    if (data.postalCodes.length === 0) {
      Log_.warning('Could not find a subburb for postcode ' + postcode)
      return 'NOT_FOUND'
    }
    
    var suburb = data.postalCodes[0].placeName || ''
    Log_.finest('suburb: ' + suburb)
    return suburb
    
  } // Utils_.getSuburb()

  return ns

})(Utils_ || {})
