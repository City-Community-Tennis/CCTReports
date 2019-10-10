// 34567890123456789012345678901234567890123456789012345678901234567890123456789

// Tests.gs
// ========
//
// Dev: AndrewRoberts.net
//
// Code for internal/unit testing

function test_init() {
  Log_ = BBLog.getLog({
    sheetId:              MASTER_SHEET_ID_,
    level:                BBLog.Level.FINE, 
    displayFunctionNames: BBLog.DisplayFunctionNames.NO,
  })  
}

function test_misc() {
  var a = [0,1,2]
  var b = a.slice()
  return
}

function test_inTrac_getRevenues() {

  var monthDate = SpreadsheetApp
    .getUi()
    .prompt('Enter the date of the second day of the month you would ' + 
      'like to retrieve and categories revenue data for, in the form yyyy-MM, e.g. 2019-08').getResponseText()
  
  var cookies = InTrac_.login()
  
  var options = {
    'method' : 'get',
    'headers': {
      'Cookie': cookies // Set the cookies so that we appear logged-in
    }
  }
        
  var response = UrlFetchApp.fetch('https://jensenstennis.intrac.com.au/tennis/admin/revenue.cfm?month=' + monthDate + '&raw=1', options);
  var content = response.getContentText()
  var inTracData = Utilities.parseCsv(content) // 2D Array
  
  var spreasdsheet = Utils_.getSpreadsheet(TEST_SHEET_ID_)
  
  var csvSheet = spreasdsheet.getSheetByName('Revenues - InTrac Raw Data')
  csvSheet.clear()
  
  csvSheet
    .getRange(1, 1, inTracData.length, inTracData[0].length)
    .setValues(inTracData)

  inTracData.shift() // Remove headers

  var categoriesTable = spreasdsheet
    .getSheetByName('Categories')
    .getDataRange()
    .getValues()
    
  categoriesTable.shift() // Remove headers
  
  var nextRow = []
  var cctData = []
  
//  for (var i = 0; i < 1000; i++) {
//    var inTracRow = InTracData[i]
  
  inTracData.forEach(function(inTracRow, inTracRowIndex) {
  
//    if (inTracRowIndex > 2) {
//      return 
//    }
  
    var inTracTimestamp = new Date(inTracRow[1].slice(0, 10)) // Remove the time element
    var timeZone = Session.getScriptTimeZone()
    var dateString = Utilities.formatDate(inTracTimestamp, timeZone, 'MMMM - yyyy')
    
    var inTracCategory = inTracRow[2]
    var inTracDescription = inTracRow[3]
    var nextCategory = getCategories(inTracDescription, inTracCategory)
    
    var inTracLocation = inTracRow[4]
    var cctLocation = getCctLocation(inTracLocation, inTracDescription, inTracCategory) 
    
    var amountIncGst = parseInt(inTracRow[5].slice(1), 10)
    var amountExGST = amountIncGst / (1 + SALES_TAX_)

    // InTrac: 0 - receipt, 1 - timestamp, 2 - category, 3 - description, 4 - location, 5 - amount,6 - customer

    nextRow = [
      dateString,               // 0  - date string 
      inTracRow[0],             // 1 - receipt (InTrac receipt)
      inTracRow[1],             // 2 - timestamp (InTrac timestamp)
      nextCategory.cct || '',   // 3 - CCT category
      nextCategory.ta || '',    // 4 - ta category
      inTracRow[2],             // 5 - category (InTrac category)
      nextCategory.description, // 6 - CCT description
      inTracRow[3],             // 7 - description (InTrac description)
      cctLocation,              // 8 - CCT location
      inTracLocation,           // 9 - location (InTrac location)
      amountIncGst,             // 10 - "rev (GST Inc)" (InTrac amount)
      amountExGST,              // 11 - rev (GST Ex)
      inTracRow[6],             // 12 - customer (InTrac customer)
    ]
    
    cctData.push(nextRow.slice())
  })
  
  var revenueSheet = spreasdsheet.getSheetByName('Revenues - Script CCT Data')
  
  revenueSheet
    .getRange(2, 1, revenueSheet.getLastRow() - 1, revenueSheet.getLastColumn())
    .clearContent()
  
  revenueSheet
    .getRange(2, 1, cctData.length, cctData[0].length)
    .setValues(cctData)
  
  return
  
  // Private Functions
  // -----------------
  
  /**
   * getCategories
   *
   * @param {object} 
   *
   * @return {object}
   */
   
  function getCategories(inTracDescription, inTracCategory) {
  
    Log_.functionEntryPoint()
    
    var categories = {
      cct: '',
      ta: '',
      description: '',
    }
    
    categoriesTable.some(function(row) {
    
      var nextInTracDescription = row[0]
      var nextInTracCategory = row[1]
    
      if (inTracDescription.indexOf(nextInTracDescription) !== -1) {
      
        if (nextInTracCategory === '') {
        
          categories.cct = row[2]
          categories.ta = row[3]
          return true
          
        } else { // nextInTracCategory !== ''
          
          if (nextInTracCategory === inTracCategory) {
          
            categories.cct = row[2]
            categories.ta = row[3]
            return true
          }
        }
      }
      
      if (inTracDescription === '') {
      
        if (inTracCategory === 'Refund') {
        
          categories.description = 'Player booking cancellation / credit issued'
          
        } else {
          // No Description
        }
      } else {
      
        if (inTracDescription === 'Try Before You Buy!') {
        
          categories.description = 'Proshop - Racquet Hire'
          
        } else {
      
          categories.description = inTracDescription
        }
      }
      
    }) // search InTrac data rows
    
    return categories
  
  } // InTrac_.getRevenues.getCategories() 
  
  /**
   * getCctLocation
   *
   * @param {string} inTracLocation 
   *
   * @return {strting} cctLocation
   */
   
  function getCctLocation(inTracLocation, inTracDescription, inTracCategory) {
  
    Log_.functionEntryPoint()
    
    var cctLocation = ''
    
    if (inTracLocation === '') {
    
      if (inTracDescription === 'Admin') {
      
        cctLocation = 'Admin'
        
      } else if (
        inTracDescription.indexOf('Advantage') !== -1 || 
        inTracDescription.indexOf('Pro shop') !== -1 ||
        inTracDescription.indexOf('Proshop') !== -1 || 
        inTracDescription.indexOf('Kiosk - ') !== -1 ||
        inTracDescription.indexOf('Credit') !== -1 ||
        inTracDescription.indexOf('Competition - ESTA') !== -1 ||
        inTracDescription.indexOf('Proshop - Racquet Hire') !== -1 ||
        inTracDescription.indexOf('Try Before You Buy!') !== -1) {
        
        cctLocation = 'Surry Hills'
        
      } else if (inTracDescription.indexOf('Hall Hire - Extras') !== -1) {
      
        cctLocation = 'Coronation'
        
      } else if (inTracDescription === '') {
      
        if (inTracCategory === 'Refund') {
        
          cctLocation = 'Admin'
        }
      }
      
    } else {
    
      cctLocation = inTracLocation
    }
       
    return cctLocation
  
  } // InTrac_.getRevenues.getCctLocation() 
  
  return
  
} // InTrac_.getRevenues()

function test_db() {

  var db = Jdbc.getConnection('jdbc:mysql://sql2.freesqldatabase.com:3306/sql2306295',{user: 'sql2306295', password: 'uT1!dV2%'})
  var statement = db.createStatement()
  statement.setMaxRows(100)
  
  var data = SpreadsheetApp
    .openById('1_y9v-Gam5dAQt4ckCij3_qpW0slFVRWxlXxoW5PFLyo')
    .getSheetByName('Pat Rev Aug 2019')
    .getRange(2, 1, 1, 11)
    .getValues()
  
  var sql = 
    'INSERT INTO transactions VALUES ('
        
  var sql2 = ''
  
  data[0].forEach(function(cell) {    
  
    if (typeof cell === 'object') {
      cell = '"2019-08-16"'
    } else if (typeof cell === 'string') {
//      cell = '"' + cell + '"'
      cell = '"' + cell + '"'
    } 
    
    sql2 += cell + ','
  })
  
  sql2 = sql2.slice(0,-1)
  sql2 += ')'

  Logger.log(sql)  
  Logger.log(sql2)
  
  sql += sql2
  
//  sql = 'INSERT INTO transactions VALUES ("August 2019",6660030,"2019-08-16","Active Kids","Coaching programs","Active Kids voucher","Credit","Surry Hills",100,90.9,"Ali Fanning")'    
  var result = statement.execute(sql)

  sql = "select * from transactions"
  var result = statement.executeQuery(sql)

// Jdbc.getCloudSqlConnection(url).createStatement(resultSetType, resultSetConcurrency).executeQuery(sql).getString(columnIndex)

  while(result.next()) {
    Logger.log(result.getString(1))
  }

  result.close()
  statement.close()
  db.close()

  return
}

function test_InTrac_getTables() {
  test_init()
  InTrac_.getTables()
  return
}

function test_Utils_scraper() {
  test_init()
  var html = HtmlService.createHtmlOutputFromFile('TestTable2').getContent()
  var sheetName = 'Test'
  Utils_.scraper(html, sheetName)
  return
}

function test_() {
  test_init()
  // ...
}