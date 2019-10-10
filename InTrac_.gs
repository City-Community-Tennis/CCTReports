// 34567890123456789012345678901234567890123456789012345678901234567890123456789

// JSHint - TODO
/* jshint asi: true */

(function() {"use strict"})()

// InTrac_.gs
// ===========
//
// Object for accessing InTrac web service

var InTrac_ = (function(ns) {

  /**
  * Log into InTrac to get the required cookies for auth
  *
  * @return {array] cookies
  */
  
  ns.login = function() {
    
    var options = {
      "method": "post",
      "payload": {
        "username": INTRAC_USERNAME_,
        "code": INTRAC_PASSWORD_,
        "location": 2,
      }
    };
    
    var response = UrlFetchApp.fetch(INTRAC_BASE_URL_ + 'login.cfm/', options);
    var content = response.getContentText()
    var headers = response.getAllHeaders()
    
    if (headers['Set-Cookie'] === undefined) {
      return
    }
    
    // Make sure that we are working with an array of cookies
    var cookies = (typeof headers['Set-Cookie'] == 'string') ? [headers['Set-Cookie']] : headers['Set-Cookie'];
    
    for (var cookiesIndex = 0; cookiesIndex < cookies.length; cookiesIndex++) {
      
      // We only need the cookie's value - it might have path, expiry time, etc here
      cookies[cookiesIndex] = cookies[cookiesIndex].split( ';' )[0];
    };
    
    cookies = cookies.join(';')
    return cookies
    
  } // InTrac_.login()

  /**
   * Get the usaage data
   */
 
  ns.getUsage = function() {
  
    Log_.functionEntryPoint()
        
    var spreadsheet           = Utils_.getSpreadsheet()
    var stagingSheet          = spreadsheet.getSheetByName('Staging')
    var dashboardSheet        = spreadsheet.getSheetByName('Dashboard')    
    var startDate             = dashboardSheet.getRange(DASHBOARD_START_DATE_CELL_).getValue()
    var numberOfMonths        = dashboardSheet.getRange(DASHBOARD_NUMBER_OF_MONTHS_CELL_).getValue()
    var numberOfCourts        = stagingSheet.getRange(STAGING_NUMBER_OF_COURTS_RANGE_).getValues()
    var today                 = new Date()
    var msFirstOfPresentMonth = (new Date(today.getYear(), today.getMonth())).getTime()    
    var cookies               = this.login()
    
    var options = {
      "headers": {
        "Cookie": cookies // // Set the cookies so that we appear logged-in
      }
    }
    
    var usage = getUsageArray()
    var message
    
    usage.forEach(function(location) {
    
      location.forEach(function(month) {
              
        var nextMonthDate = month[2]
        var msNextMonth = nextMonthDate.getTime()
        
        var sheetName = month[1]        
        var sheet = spreadsheet.getSheetByName(sheetName)
          
        var response = UrlFetchApp.fetch(INTRAC_BASE_URL_ + month[0], options);
        content = response.getContentText()
        var table = Utils_.scraper(content)
        
        if (sheet === null) {
          var numberOfSheets = spreadsheet.getSheets().length
          sheet = spreadsheet.insertSheet(sheetName, numberOfSheets)
        } 
        
        sheet
        .getRange(1, 1, table.length, 4)
        .setValues(table)
        
        message = 'Updated InTrac usage data for ' + sheetName

        Log_.info(message)        
        spreadsheet.toast(message)
        
      })
    })
    
    dashboardSheet.getRange('C18').setValue(new Date())
    completeFormula()
    dashboardSheet.activate()
    spreadsheet.toast('All InTrac location usage data updated!')

    return 
    
    // Private Functions
    // -----------------

    /**
     * Construct an array that lists all the locations and months
     *
     * @param {object} 
     *
     * @return {object}
     */
    
    // Since added a month object to the end of each row

    //var COURT_USUAGE_2019_Q2_ = [
    //  [
    //    ['usage.cfm?location=2&date=2019-07', 'Surry Hills - Jul 2019'],
    //    ['usage.cfm?location=2&date=2019-08', 'Surry Hills - Aug 2019'],
    //    ['usage.cfm?location=2&date=2019-09', 'Surry Hills - Sep 2019'],
    //  ],[
    //    ['usage.cfm?location=3&date=2019-07', 'Alexandria - Jul 2019'],
    //    ['usage.cfm?location=3&date=2019-08', 'Alexandria - Aug 2019'],
    //    ['usage.cfm?location=3&date=2019-09', 'Alexandria - Sep 2019'],
    //  ],[
    //    ['usage.cfm?location=4&date=2019-07', 'Beaconsfield - Jul 2019'],
    //    ['usage.cfm?location=4&date=2019-08', 'Beaconsfield - Aug 2019'],
    //    ['usage.cfm?location=4&date=2019-09', 'Beaconsfield - Sep 2019'],
    //  ],[
    //    ['usage.cfm?location=5&date=2019-07', 'Glebe Upper - Jul 2019'],
    //    ['usage.cfm?location=5&date=2019-08', 'Glebe Upper - Aug 2019'],
    //    ['usage.cfm?location=5&date=2019-09', 'Glebe Upper - Sep 2019'],
    //  ],[
    //    ['usage.cfm?location=6&date=2019-07', 'Rosebery - Jul 2019'],
    //    ['usage.cfm?location=6&date=2019-08', 'Rosebery - Aug 2019'],
    //    ['usage.cfm?location=6&date=2019-09', 'Rosebery - Sep 2019'],
    //  ],
    //]
    
    function getUsageArray() {
    
      Log_.functionEntryPoint()
      
      var usage = []
      var nextMonth = startDate
      
      for (var location in LOCATIONS_) {
      
        if (!LOCATIONS_.hasOwnProperty(location)) {
          break
        }
      
        var nextLocation = LOCATIONS_[location]
        var nextQuarter = []
        
        for (var monthIndex = 0; monthIndex < numberOfMonths; monthIndex++) {
        
          var monthData = getMonthData(nextMonth)
          nextMonth = monthData.next        
          
          var nextRow = [
            INTRAC_USAGE_URL_ + nextLocation.locationId + '&date=' + monthData.string1, 
            nextLocation.name + ' - ' + monthData.string2,
            monthData.present,
          ]
          
          nextQuarter.push(nextRow.slice())
        }
        
        usage.push(nextQuarter.slice())
        nextMonth = startDate
      }
      
      Log_.fine(usage)
      return usage
      
    } // InTrac_.getUsage.getUsageArray() 
    
    /**
    * @param {Date} presentMonth
    *
    * @return {object} various month values
    */
    
    function getMonthData(presentMonth) {
      
      Log_.functionEntryPoint()
      
      var data = {}
      var timeZone = Session.getScriptTimeZone()
      var string1 = Utilities.formatDate(presentMonth, timeZone, 'yyyy-MM')
      var string2 = Utilities.formatDate(presentMonth, timeZone, 'MMM yyyy')
      var nextMonth = new Date(presentMonth.getYear(), presentMonth.getMonth() + 1)
      var numberOfDays = (new Date(presentMonth.getYear(), presentMonth.getMonth(), 0)).getDate()
            
      return {
        string1: string1,
        string2: string2,
        present: presentMonth,
        next: nextMonth,
        numberOfDays: numberOfDays,
      }
      
    } // InTrac_.getUsage.getUsageArray.getMonthData() 
    
    /**
     * Complete all the formula on the staging sheet that use the location
     * name and quarter date
     */
    
    function completeFormula() {
    
      Log_.functionEntryPoint()

      var months = []
      var numberOfDays = 0
      
      for (var monthIndex = 0, nextMonth = {next: startDate}; monthIndex < numberOfMonths; monthIndex++) {
        nextMonth = getMonthData(nextMonth.next)
        months.push(nextMonth.string2)
        numberOfDays += nextMonth.numberOfDays
      }

      Log_.fine('numberOfDays: ' + numberOfDays)

      // Lost hours due to unplayable days

     
      // Number of days in quarter
          
      stagingSheet
        .getRange(STAGING_NUMBER_OF_DAYS_CELL_)
        .setValue(numberOfDays)
      
      // Unplayable days for each location & total booking for each location
      
      LOCATIONS_.forEach(function(location) {
      
        Log_.fine('Completing formula for "' + location.name + '"')

        var lostHoursFormula = '='
        var bookingsFormula = '='
        var unplayableFormula = '='

        for (monthIndex = 0; monthIndex < numberOfMonths; monthIndex++) {

          unplayableFormula += 
            "if('Alexandria - " + months[monthIndex] + "'!$A$12=\"Unplayable weather\"," + 
              "'Alexandria - " + months[monthIndex] + "'!$B$12," + 
              "'Alexandria - " + months[monthIndex] + "'!$B$13)+"  

          if (location.name === 'Rosebery') {
          
            // Ignore court maintenance at Rosebery, ignore last char as it always get stripped off
            lostHoursFormula += '' 
          
          } else {

            lostHoursFormula += 
              "if('" + location.name + " - " + months[monthIndex] + "'!$A$" + location.courtMaintenanceRow + "=\"Court maintenance\"," + 
                "'" + location.name + " - " + months[monthIndex] + "'!$B$" + location.courtMaintenanceRow + ", 0)+"
          }

          var nextNumberOfCourts = numberOfCourts[location.numberOfCourtsIndex][0]
          Log_.fine('nextNumberOfCourts: ' + nextNumberOfCourts)

          if (location.name === 'Rosebery') {
          
            // Although there is only one main court, all of the occupancy for the 
            // hot shot courts are used in the calculations
            nextNumberOfCourts = 5;
          }

          for (var courtIndex = 0; courtIndex < nextNumberOfCourts; courtIndex++) {
            bookingsFormula += "'" + location.name + " - " + months[monthIndex] + "'!$B$" + (8 + courtIndex) + "+"
          }
        }

        // Remove the final '+'
        lostHoursFormula = lostHoursFormula.slice(0, -1)
        bookingsFormula = bookingsFormula.slice(0, -1)
        unplayableFormula = unplayableFormula.slice(0, -1)

        stagingSheet.getRange(STAGING_UNPLAYABLE_CELL_).setFormula(unplayableFormula)
        stagingSheet.getRange(location.lostHoursRange).setFormula(lostHoursFormula)
        stagingSheet.getRange(location.bookingsRange).setFormula(bookingsFormula)      
        
      })
     
    } // InTrac_.getUsage.completeFormula() 
    
  } // InTrac_.getUsage()

  /**
   * get the revenue stream report data from InTrac
   */
 
  ns.onGetRevenueStreams = function() {
  
    Log_.functionEntryPoint()
        
    var spreadsheet = Utils_.getSpreadsheet()
    
    var stagingSheet = spreadsheet.getSheetByName('Staging')
    var dashboardSheet = spreadsheet.getSheetByName('Dashboard')
    
//    var startDate = dashboardSheet.getRange(DASHBOARD_START_DATE_CELL_).getValue()
//    var numberOfMonths = dashboardSheet.getRange(DASHBOARD_NUMBER_OF_MONTHS_CELL_).getValue()
//    var numberOfCourts = stagingSheet.getRange('E9:E13').getValues()
    
    var today = new Date()
    var msFirstOfPresentMonth = (new Date(today.getYear(), today.getMonth())).getTime()
    
    var cookies = this.login()
    
    for (var cookiesIndex = 0; cookiesIndex < cookies.length; cookiesIndex++) {
      
      // We only need the cookie's value - it might have path, expiry time, etc here
      cookies[cookiesIndex] = cookies[cookiesIndex].split( ';' )[0];
    };
    
    options = {
      "method": "get",     
      "headers": {
        "Cookie": cookies.join(';') // Set the cookies so that we appear logged-in
      }
    };
    
//    var usage = getUsageArray()

//    var MONTHS_ = [
//      ['revenue.cfm?month=2019-09', 'Surry Hills - Sep 2019', new Date()],
//    ]
    
//    var message
//    
//    usage.forEach(function(location) {
//    
//      location.forEach(function(month) {
//      
//        // If there is already a sheet for this month don't do the fetch,
//        // unless this is the present month
//        
//        var nextMonthDate = month[2]
//        var msNextMonth = nextMonthDate.getTime()
//        
        var sheetName = 'Revenues'        
        var sheet = spreadsheet.getSheetByName(sheetName)
//          
//        if (sheet === null || msNextMonth >= msFirstOfPresentMonth) {
        
          response = UrlFetchApp.fetch(INTRAC_BASE_URL_ + 'revenue.cfm?month=2019-09', options);
          content = response.getContentText()
          var table = Utils_.scraper(content)

          if (sheet === null) {
            var numberOfSheets = spreadsheet.getSheets().length
            sheet = spreadsheet.insertSheet(sheetName, numberOfSheets)
          } 

          sheet
            .getRange(1, 1, table.length, 4)
            .setValues(table)
                            
//          message = 'Updated InTrac usage data for ' + sheetName

//        } else {
//        
//          message = 'Using existing data for "' + sheetName + '".'
//        }
// 
//        Log_.info(message)        
//        spreadsheet.toast(message)
        
//      })
//    })
    
//    dashboardSheet.getRange('C18').setValue(new Date())
//    completeFormula()
//    dashboardSheet.activate()
//    spreadsheet.toast('All InTrac location usage data updated!')

    return 
    
    // Private Functions
    // -----------------

    

  } // InTrac_.getRevenueStreams()

  return ns

})(InTrac_ || {})
