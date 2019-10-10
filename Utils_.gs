// 34567890123456789012345678901234567890123456789012345678901234567890123456789

// JSHint - TODO
/* jshint asi: true */

(function() {"use strict"})()

// Object1_.gs
// ===========
//
// Object template

var Utils_ = (function(ns) {

  /**
   *
   *
   * @param {object} 
   *
   * @return {object}
   */
 
  ns.scraper = function(html) {
  
    Log_.functionEntryPoint()    

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
    
    var tableIndex = 0
    var rowIndex = 0
    var cellIndex = 0
    var startStoreOffset = 0
    
    do {
      
      var result = getNextTag(html, offset)
      
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
          //        Logger.log(nextCell)
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
          
        } else {
        
          
        }      
        //      Logger.log(state)      
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
  
    Log_.functionEntryPoint() 
    
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
        
  return ns

})(Utils_ || {})
