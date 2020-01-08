// 34567890123456789012345678901234567890123456789012345678901234567890123456789

// JSHint - 20200108
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
  * @return {array} cookies
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
    var headers = response.getAllHeaders()
    
    if (headers['Set-Cookie'] === undefined) {
      return
    }
    
    // Make sure that we are working with an array of cookies
    var cookies = (typeof headers['Set-Cookie'] == 'string') ? [headers['Set-Cookie']] : headers['Set-Cookie'];
    
    for (var cookiesIndex = 0; cookiesIndex < cookies.length; cookiesIndex++) {
      
      // We only need the cookie's value - it might have path, expiry time, etc here
      cookies[cookiesIndex] = cookies[cookiesIndex].split( ';' )[0];
    }
    
    cookies = cookies.join(';')
    return cookies
    
  } // InTrac_.login()

  /**
   * Get the usaage data
   */
 
  ns.getUsage = function() {
  
    var spreadsheet           = Utils_.getSpreadsheet()
    var usageStagingSheet     = spreadsheet.getSheetByName('Staging - Occupancy')
    var bookingStagingSheet   = spreadsheet.getSheetByName('Processed Data - Booking Types')
    var dashboardSheet        = spreadsheet.getSheetByName('Dashboard')    
    var startDate             = dashboardSheet.getRange(DASHBOARD_START_DATE_CELL_).getValue()
    var numberOfMonths        = dashboardSheet.getRange(DASHBOARD_NUMBER_OF_MONTHS_CELL_).getValue()
    var numberOfCourts        = usageStagingSheet.getRange(STAGING_NUMBER_OF_COURTS_RANGE_).getValues()
    var cookies               = this.login()
    
    var options = {
      "headers": {
        "Cookie": cookies // // Set the cookies so that we appear logged-in
      }
    }
    
    var usage = getUsageArray()    
    importInTracUsageData()
    completeOccupancyStaging()
    completeBookingStaging()
    dashboardSheet.getRange('C18').setValue(new Date())    
    dashboardSheet.activate()

    if (SpreadsheetApp.getActive() !== null) { 
      spreadsheet.toast('All InTrac location usage data updated!')
    }

    return 
    
    // Private Functions
    // -----------------
    
    /**
     * Import InTrac Usage Data
     */
     
    function importInTracUsageData() {
    
      usage.forEach(function(location) {
        
        location.forEach(function(month) {
          
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
          
          var message = 'Updated InTrac usage data for ' + sheetName
          
          Log_.info(message)        
          spreadsheet.toast(message)         
        })
      })
        
    } // InTrac_.getUsage.importInTracUsageData() 
    
    /**
     * Construct an array that lists all the locations and months
     *
     * @return {object} usage
     */
    
    // !!! Since added a month object to the end of each row !!!

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
    
      var usage = []
      var nextMonth = startDate
      
      for (var location in LOCATIONS_) {
      
        if (LOCATIONS_.hasOwnProperty(location)) {
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
      
    } // InTrac_.getUsage.getMonthData() 

    /**
     * Complete Booking Staging
     */
     
    function completeBookingStaging() {
    
      var writeData = []
      
      var categoriesTable = spreadsheet
        .getSheetByName('Booking Categories')
        .getDataRange()
        .getValues()
        
      categoriesTable.shift() // Remove headers
      
      usage.forEach(function(location) {
        
        location.forEach(function(month) {
        
          // Look for the rows "Booking by type" and "Visits by type"
          
          var sheetName = month[1]
          var data = spreadsheet.getSheetByName(sheetName).getDataRange().getValues()
          var bookingTypeRowNumber = null
          var visitsRowNumber = null
          
          data.forEach(function(row, rowIndex) {
            if (row[0] === 'Bookings by type') {
              bookingTypeRowNumber = rowIndex + 1
            } else if (row[0] === 'Visits by type') {
              visitsRowNumber = rowIndex + 1
            }
          })

          if (bookingTypeRowNumber === null) {
            throw new Error('Could not find "Booking by type" in "' + sheetName + '"')
          }
          
          if (visitsRowNumber === null) {
            throw new Error('Could not find "Visits by type" in "' + sheetName + '"')
          }

          // Read in the "Booking by type" section

          var endOfBookingsRow = visitsRowNumber - 2
          var nextWriteRow = []
          
          for (var rowIndex = bookingTypeRowNumber; rowIndex < endOfBookingsRow; rowIndex++) {
            
            var nextReadRow = data[rowIndex]
            var numberOfSessions = ''
            
            if (nextReadRow[3] !== '') {
              numberOfSessions = parseInt(nextReadRow[3].split(' ')[0], 10) // "[n] sessions"
            }
            
            var monthStart = month[2]
            var inTracDescription = nextReadRow[0]
            var categories = getBookingCategories(inTracDescription)
                        
            nextWriteRow = [
              monthStart, // Date - "MMMM yyyy" - formatted in sheet
              monthStart.getYear(),
              Utilities.formatDate(monthStart, Session.getScriptTimeZone(), 'MMMM'), // Month string
              sheetName.split(' - ')[0], // Location
              categories.cos, // CoS Category
              categories.cct, // CCT Category
              categories.ta, // TA Category
              categories.description, // Description - CCT
              inTracDescription, // Booking - InTrac description
              nextReadRow[1], // Hours              
              getNumberOfVisits(data, inTracDescription, rowIndex), // Visits
              numberOfSessions
            ]
            
            writeData.push(nextWriteRow.slice())

          }  // for each row of data
        }) // for each month
      }) // for each location
      
      bookingStagingSheet
        .getRange(2, 1, bookingStagingSheet.getLastRow() - 1, bookingStagingSheet.getLastColumn())
        .clearContent()
      
      bookingStagingSheet
        .getRange(2, 1, writeData.length, writeData[0].length)
        .setValues(writeData)
        
      Log_.info('Written ' + writeData.length + ' rows to Bookings Staging tab')    
      return 
      
      // Private Functions
      // -----------------

      /**
       * @param {string} booking
       *
       * @return {object} categories
       */
       
      function getBookingCategories(booking) {
      
        var categories = {}
        
        var found = categoriesTable.some(function(row) {
          if (row[0].trim() === booking.trim()) {
            categories.cos = row[1]
            categories.cct = row[2]
            categories.ta = row[3]
            categories.description = row[4]
            return true
          }
        })

        if (!found) {
          categories = {
            cos: '',
            cct: '',
            ta: '',
            description: '',
          }
          
          Log_.warning('Not found booking "' + booking + '" in categories table')
        }

        return categories
      
      } // InTrac_.getUsage.completeBookingStaging.getBookingCategories() 

      /**
       * Get the number of visits for this location/month. Start looking from 
       * where the last instance of this booking was found which would have been
       * in the "Booking by type" section
       *
       * @param {string} booking 
       *
       * @return {number} number of visits
       */
       
      function getNumberOfVisits(data, booking, startRowIndex) {
      
        var numberOfVisits = null
        
        for (var rowIndex = startRowIndex; rowIndex < data.length; rowIndex++) {
          var nextRow = data[rowIndex]
          if (nextRow[0] === booking) {
            numberOfVisits = nextRow[1]
            break
          }
        }
        
        if (numberOfVisits === null) {
          throw new Error('Could not find number of visits for "' + booking + '"')
        }
      
        return numberOfVisits
      
      } // InTrac_.getUsage.completeBookingStaging.getNumberOfVisits() 
          
    } // InTrac_.getUsage.completeBookingStaging() 

    /**
     * Complete all the formula on the staging sheet that use the location
     * name and quarter date
     */
    
    function completeOccupancyStaging() {
    
      var months = []
      var numberOfDays = 0
      
      for (var monthIndex = 0, nextMonth = {next: startDate}; monthIndex < numberOfMonths; monthIndex++) {
        nextMonth = getMonthData(nextMonth.next)
        months.push(nextMonth.string2)
        numberOfDays += nextMonth.numberOfDays
      }

      Log_.fine('numberOfDays: ' + numberOfDays)

      // Number of days in quarter
          
      usageStagingSheet
        .getRange(STAGING_NUMBER_OF_DAYS_CELL_)
        .setValue(numberOfDays)
      
      // Unplayable days for each location & total booking for each location
      
      LOCATIONS_.forEach(function(location) {
      
        Log_.fine('Completing occupancy formula for "' + location.name + '"')

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

        usageStagingSheet.getRange(STAGING_UNPLAYABLE_CELL_).setFormula(unplayableFormula)
        usageStagingSheet.getRange(location.lostHoursRange).setFormula(lostHoursFormula)
        usageStagingSheet.getRange(location.bookingsRange).setFormula(bookingsFormula)              
      })
     
    } // InTrac_.getUsage.completeOccupancyStaging() 
    
  } // InTrac_.getUsage()

  /**
   * Get the raw revenue data from Intrac and update the InTrac categories to CCT ones
   */

  ns.getRevenues = function() {
  
    var monthDate = SpreadsheetApp
      .getUi()
      .prompt(
        'Enter the date of the second day of the month you would ' + 
          'like to retrieve categories revenue data for, in the form yyyy-MM, e.g. 2019-08')
        .getResponseText()

    var cookies = InTrac_.login()
    
    var options = {
      'method' : 'get',
      'headers': {
        'Cookie': cookies // Set the cookies so that we appear logged-in
      }
    }
          
    var response = UrlFetchApp
      .fetch(
        INTRAC_BASE_URL_ + 'revenue.cfm?month=' + monthDate + '&raw=1', 
        options);
    
    var content = response.getContentText()
    var inTracData = Utilities.parseCsv(content) // 2D Array
    
    var spreasdsheet = Utils_.getSpreadsheet()
    
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
    
    inTracData.forEach(function(inTracRow, inTracRowIndex) {
    
      var inTracTimestamp = new Date(inTracRow[1].slice(0, 10)) // Remove the time element
      var timeZone = Session.getScriptTimeZone()
      var dateString = Utilities.formatDate(inTracTimestamp, timeZone, 'MMMM - yyyy')
      
      var inTracCategory = inTracRow[2]
      var inTracDescription = inTracRow[3]
      var nextCategory = getCategories(inTracDescription, inTracCategory)
      
      var inTracLocation = inTracRow[4]
      var cctLocation = getCctLocation(inTracLocation, inTracDescription, inTracCategory) 
      
      var amountIncGst = parseFloat(inTracRow[5].slice(1))
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
    
    var numberOfRows = cctData.length
    
    revenueSheet
      .getRange(2, 1, cctData.length, cctData[0].length)
      .setValues(cctData)
      
    Log_.info('Written ' + numberOfRows + ' row to revenue sheet')
    
    return
    
    // Private Functions
    // -----------------
    
    /**
     * getCategories
     *
     * @param {string} inTracDescription
     * @param {string} inTracCategory
     *
     * @return {object} categories
     */
     
    function getCategories(inTracDescription, inTracCategory) {
    
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
              
              if (inTracDescription === 'Admin' && inTracCategory === 'Purchase') {
                categories.description = 'Unallocated item (TYRO time out) Kiosk / Pro shop'
              }
              
              return true
            }
          }
        }
        
        if (inTracDescription === '') {
        
          if (inTracCategory === 'Refund') {
          
            categories.description = 'Refund'
            
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
    
      var cctLocation = ''
      
      if (inTracLocation === '') {
      
        if (inTracDescription === 'Admin') {
        
          if (inTracCategory === 'Purchase') {
            cctLocation = 'Surry Hills'
          } else {
            cctLocation = 'Admin'
          }
          
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
          
            cctLocation = 'Surry Hills'
          }
        }
        
      } else {
      
        cctLocation = inTracLocation
      }
         
      return cctLocation
    
    } // InTrac_.getRevenues.getCctLocation() 
    
    return
    
  } // InTrac_.getRevenues()

  /**
   * Get and process the number of coach hours from InTrac
   */ 

  ns.getCoachHours = function() {
  
    var monthDate = SpreadsheetApp
      .getUi()
      .prompt('Enter the date of the second day of the month you would ' + 
        'like to retrieve coach hours for, in the form yyyy-MM, e.g. 2019-08').getResponseText()
    
    var cookies = InTrac_.login()
    
    var options = {
      'method' : 'get',
      'headers': {
        'Cookie': cookies // Set the cookies so that we appear logged-in
      }
    }
              
    var response = UrlFetchApp.fetch(INTRAC_BASE_URL_ + 'coaches.cfm?date=' + monthDate + '&month=1&raw=1', options);
    var content = response.getContentText()
    var inTracData = Utilities.parseCsv(content) // 2D Array
    
    var spreasdsheet = Utils_.getSpreadsheet()
    
    var csvSheet = spreasdsheet.getSheetByName('Raw Data')
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
        
    inTracData.forEach(function(inTracRow, inTracRowIndex) {
    
      var inTracDescription = inTracRow[4]

      // InTrac raw data: 0 - date, 1 - time, 2 - coach, 3 - location, 4 - description, 5 - duration
  
      nextRow = [
        inTracRow[0],             // 0 - date (InTrac date)
        inTracRow[1],             // 1 - time (InTrac time)
        inTracRow[2],             // 2 - coach (InTrac coach)
        inTracRow[3],             // 3 - location (InTrac location)
        '',                       // 4 - CCT category - Looked up by sheet formula
        inTracDescription,        // 5 - description (InTrac description)
        inTracRow[5],             // 6 - duration (InTrac duration)
      ]
      
      cctData.push(nextRow.slice())
    })
    
    var coachHoursSheet = spreasdsheet.getSheetByName('Coach Hours')
    
    coachHoursSheet
      .getRange(2, 1, coachHoursSheet.getLastRow() - 1, coachHoursSheet.getLastColumn())
      .clearContent()
    
    var numberOfRows = cctData.length
    
    coachHoursSheet
      .getRange(2, 1, numberOfRows, cctData[0].length)
      .setValues(cctData)
      
    Log_.info('Written ' + numberOfRows + ' rows to "Coach Hours".')
    
  } // InTrac_.getCoachHours()

  /**
   * Get and process the number of new members per month by suburb
   */ 

  ns.getNewMemberData = function() {
  
    var monthDate = getMonthDate()
    var inTracData = getInTraceData()
    var postcodes = getPostCodes(inTracData[12][0]) // A13
    var spreadsheet = Utils_.getSpreadsheet()
    writeRawPostCodesToSheet()
    writeNewMemberNumbersToSheet()
    spreadsheet.getSheetByName('New Members').getRange('B2').setValue(monthDate)
    return
    
    // Private Functions
    // -----------------

    function getMonthDate() {     
    
      if (!TEST_GET_DATE_FROM_USER_) {
        return '2019-12'
      }
        
      var monthDate = SpreadsheetApp.getUi() 
        .prompt('Enter the date of the second day of the month you would ' + 
              'like to retrieve coach hours for, in the form yyyy-MM, e.g. 2019-08').getResponseText()
      
      if (monthDate === '') {
        throw new Error('Please enter a date and try again.')
      } 
            
      return monthDate
      
    } // InTrac_.getNewMemberData.getMonthDate()

    function getInTraceData() {  
    
      var cookies = InTrac_.login()
      
      var options = {
        'headers': {
          'Cookie': cookies // Set the cookies so that we appear logged-in
        }
      }
                
      var response = UrlFetchApp.fetch(INTRAC_BASE_URL_ + 'member.cfm?month=' + monthDate, options);
      var content = response.getContentText()
      return Utils_.scraper(content)
      
    } // InTrac_.getNewMemberData.getInTraceData()

    /*
     * @param {string} postCodeString
     *
     * @return {array} postcodes
     */
    
    function getPostCodes(postCodeString) {
    
      var postcodes = []
      var regex = /[0-9]+\,[0-9]+/gm // '  222,22 <br>'
      var postcodeList = postCodeString.match(regex);

      postcodeList.forEach(function(item) {
        var commaIndex = item.indexOf(',')
        postcodes.push([item.slice(0, commaIndex), item.slice(commaIndex + 1)])
      })
      
      return postcodes
    
    } // InTrac_.getNewMemberData.getPostCodes()

    function writeRawPostCodesToSheet() {
          
      var rawDataSheet = spreadsheet.getSheetByName('Raw Data')
      rawDataSheet.clear()
      
      rawDataSheet
        .getRange(1, 1, postcodes.length, postcodes[0].length)
        .setValues(postcodes)
        
    } // InTrac_.getNewMemberData.writeRawPostCodesToSheet
        
    function writeNewMemberNumbersToSheet() {

      var members = []
          
      postcodes.forEach(function(row, rowIndex) {
        members.push([row[0], Utils_.getSuburb(row[0]), row[1]])
      })
  
      var membersSheet = spreadsheet.getSheetByName('New Members')
  
      membersSheet
        .getRange(5, 1, membersSheet.getLastRow() - 1, 3)
        .clearContent()
      
      var numberOfRows = members.length
      
      membersSheet
        .getRange(5, 1, numberOfRows, 3)
        .setValues(members)
        
      Log_.info('Written ' + numberOfRows + ' rows to "New Members".')
      
    } // InTrac_.getNewMemberData.writeNewMemberNumbersToSheet()
    
  } // InTrac_.getNewMemberData()

  return ns

})(InTrac_ || {})
