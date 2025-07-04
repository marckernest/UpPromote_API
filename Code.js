/**
 * UpPromote API Google Apps Script Integration
 * This script pulls affiliate data from UpPromote API into Google Sheets
 */

// Configuration
const CONFIG = {
  API_BASE_URL: 'https://aff-api.uppromote.com/api/v1',
  API_KEY: '', // Add your API key here
  SHEET_NAME: 'UpPromote Data',
  ENDPOINTS: {
    AFFILIATES: '/affiliates',
    REFERRALS: '/referrals',
    COUPONS: '/coupons',
    PAYMENTS: '/payments'
  }
};

/**
 * Main function to pull all data from UpPromote API
 */
function pullUpPromoteData() {
  try {
    // Check if API key is configured
    if (!CONFIG.API_KEY) {
      throw new Error('API key not configured. Please set your API key in the CONFIG object.');
    }
    
    // Get or create the spreadsheet
    const spreadsheet = getOrCreateSpreadsheet();
    
    // Pull data from different endpoints
    pullAffiliatesData(spreadsheet);
    pullReferralsData(spreadsheet);
    pullCouponsData(spreadsheet);
    pullPaymentsData(spreadsheet);
    
    Logger.log('Data pull completed successfully');
    
  } catch (error) {
    Logger.log('Error pulling data: ' + error.toString());
    throw error;
  }
}

/**
 * Get or create the main spreadsheet
 */
function getOrCreateSpreadsheet() {
  const activeSpreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  if (activeSpreadsheet) {
    return activeSpreadsheet;
  }
  
  // Create new spreadsheet if none is active
  const newSpreadsheet = SpreadsheetApp.create(CONFIG.SHEET_NAME);
  Logger.log('Created new spreadsheet: ' + newSpreadsheet.getUrl());
  return newSpreadsheet;
}

/**
 * Make API request to UpPromote
 */
function makeApiRequest(endpoint, params = {}) {
  const url = CONFIG.API_BASE_URL + endpoint;
  const queryString = Object.keys(params).length > 0 
    ? '?' + Object.keys(params).map(key => `${key}=${encodeURIComponent(params[key])}`).join('&')
    : '';
  
  const options = {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${CONFIG.API_KEY}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }
  };
  
  try {
    const response = UrlFetchApp.fetch(url + queryString, options);
    const responseCode = response.getResponseCode();
    
    if (responseCode !== 200) {
      throw new Error(`API request failed with status ${responseCode}: ${response.getContentText()}`);
    }
    
    return JSON.parse(response.getContentText());
  } catch (error) {
    Logger.log(`API request error for ${endpoint}: ${error.toString()}`);
    throw error;
  }
}

/**
 * Pull affiliates data
 */
function pullAffiliatesData(spreadsheet) {
  Logger.log('Pulling affiliates data...');
  
  try {
    const data = makeApiRequest(CONFIG.ENDPOINTS.AFFILIATES);
    const sheet = getOrCreateSheet(spreadsheet, 'Affiliates');
    
    if (data && data.data && data.data.length > 0) {
      const headers = ['ID', 'Email', 'Name', 'Status', 'Commission Rate', 'Created At', 'Updated At'];
      const rows = data.data.map(affiliate => [
        affiliate.id || '',
        affiliate.email || '',
        affiliate.name || '',
        affiliate.status || '',
        affiliate.commission_rate || '',
        affiliate.created_at || '',
        affiliate.updated_at || ''
      ]);
      
      writeDataToSheet(sheet, headers, rows);
      Logger.log(`Successfully pulled ${rows.length} affiliates`);
    } else {
      Logger.log('No affiliates data found');
    }
  } catch (error) {
    Logger.log('Error pulling affiliates data: ' + error.toString());
  }
}

/**
 * Pull referrals data
 */
function pullReferralsData(spreadsheet) {
  Logger.log('Pulling referrals data...');
  
  try {
    const data = makeApiRequest(CONFIG.ENDPOINTS.REFERRALS);
    const sheet = getOrCreateSheet(spreadsheet, 'Referrals');
    
    if (data && data.data && data.data.length > 0) {
      const headers = ['ID', 'Affiliate ID', 'Customer Email', 'Order Value', 'Commission', 'Status', 'Created At'];
      const rows = data.data.map(referral => [
        referral.id || '',
        referral.affiliate_id || '',
        referral.customer_email || '',
        referral.order_value || '',
        referral.commission || '',
        referral.status || '',
        referral.created_at || ''
      ]);
      
      writeDataToSheet(sheet, headers, rows);
      Logger.log(`Successfully pulled ${rows.length} referrals`);
    } else {
      Logger.log('No referrals data found');
    }
  } catch (error) {
    Logger.log('Error pulling referrals data: ' + error.toString());
  }
}

/**
 * Pull coupons data
 */
function pullCouponsData(spreadsheet) {
  Logger.log('Pulling coupons data...');
  
  try {
    const data = makeApiRequest(CONFIG.ENDPOINTS.COUPONS);
    const sheet = getOrCreateSheet(spreadsheet, 'Coupons');
    
    if (data && data.data && data.data.length > 0) {
      const headers = ['ID', 'Code', 'Affiliate ID', 'Discount Type', 'Discount Value', 'Status', 'Created At'];
      const rows = data.data.map(coupon => [
        coupon.id || '',
        coupon.code || '',
        coupon.affiliate_id || '',
        coupon.discount_type || '',
        coupon.discount_value || '',
        coupon.status || '',
        coupon.created_at || ''
      ]);
      
      writeDataToSheet(sheet, headers, rows);
      Logger.log(`Successfully pulled ${rows.length} coupons`);
    } else {
      Logger.log('No coupons data found');
    }
  } catch (error) {
    Logger.log('Error pulling coupons data: ' + error.toString());
  }
}

/**
 * Pull payments data
 */
function pullPaymentsData(spreadsheet) {
  Logger.log('Pulling payments data...');
  
  try {
    const data = makeApiRequest(CONFIG.ENDPOINTS.PAYMENTS);
    const sheet = getOrCreateSheet(spreadsheet, 'Payments');
    
    if (data && data.data && data.data.length > 0) {
      const headers = ['ID', 'Affiliate ID', 'Amount', 'Currency', 'Status', 'Payment Method', 'Created At'];
      const rows = data.data.map(payment => [
        payment.id || '',
        payment.affiliate_id || '',
        payment.amount || '',
        payment.currency || '',
        payment.status || '',
        payment.payment_method || '',
        payment.created_at || ''
      ]);
      
      writeDataToSheet(sheet, headers, rows);
      Logger.log(`Successfully pulled ${rows.length} payments`);
    } else {
      Logger.log('No payments data found');
    }
  } catch (error) {
    Logger.log('Error pulling payments data: ' + error.toString());
  }
}

/**
 * Get or create a sheet with the given name
 */
function getOrCreateSheet(spreadsheet, sheetName) {
  let sheet = spreadsheet.getSheetByName(sheetName);
  if (!sheet) {
    sheet = spreadsheet.insertSheet(sheetName);
  }
  return sheet;
}

/**
 * Write data to sheet with headers
 */
function writeDataToSheet(sheet, headers, rows) {
  // Clear existing content
  sheet.clear();
  
  // Write headers
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
  
  // Write data if available
  if (rows.length > 0) {
    sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
  }
  
  // Auto-resize columns
  sheet.autoResizeColumns(1, headers.length);
}

/**
 * Set up automated trigger to run data pull periodically
 */
function setupTrigger() {
  // Delete existing triggers
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(trigger => {
    if (trigger.getHandlerFunction() === 'pullUpPromoteData') {
      ScriptApp.deleteTrigger(trigger);
    }
  });
  
  // Create new daily trigger
  ScriptApp.newTrigger('pullUpPromoteData')
    .timeBased()
    .everyDays(1)
    .atHour(9) // 9 AM
    .create();
    
  Logger.log('Daily trigger set up to run at 9 AM');
}

/**
 * Remove all triggers
 */
function removeTriggers() {
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(trigger => {
    if (trigger.getHandlerFunction() === 'pullUpPromoteData') {
      ScriptApp.deleteTrigger(trigger);
    }
  });
  
  Logger.log('All triggers removed');
}

/**
 * Test API connection
 */
function testApiConnection() {
  if (!CONFIG.API_KEY) {
    Logger.log('Error: API key not configured');
    return false;
  }
  
  try {
    const data = makeApiRequest(CONFIG.ENDPOINTS.AFFILIATES, { limit: 1 });
    Logger.log('API connection successful');
    Logger.log('Response: ' + JSON.stringify(data));
    return true;
  } catch (error) {
    Logger.log('API connection failed: ' + error.toString());
    return false;
  }
}
