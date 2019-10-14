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
  var a = [1]
  var b = a.slice()
  a = [2]
  
  return
}

function test_InTrac_getUsage() {
  test_init()
  InTrac_.getUsage()
  return
}


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