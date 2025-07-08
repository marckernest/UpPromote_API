/**
 * UpPromote API Google Apps Script Integration
 * This script pulls affiliate data from UpPromote API into Google Sheets
 */

// Configuration
const CONFIG = {
  API_BASE_URL: 'https://aff-api.uppromote.com/api/v1',
  API_KEY: '', // Add your API key here
  SHEET_NAME: 'UpPromoter_Data',
  ENDPOINTS: {
    AFFILIATES: '/affiliates',
    REFERRALS: '/referrals',
    COUPONS: '/coupons'
    // Note: /payments endpoint doesn't exist in UpPromote API
    // Payment data can be found in referrals with status 'paid'
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
 * Make API request to UpPromote with pagination support
 */
function makeApiRequest(endpoint, params = {}) {
  const allData = [];
  let page = 1;
  let hasMoreData = true;
  
  while (hasMoreData) {
    const url = CONFIG.API_BASE_URL + endpoint;
    
    // Add pagination parameters
    const paginationParams = {
      ...params,
      limit: 100, // Maximum allowed per request
      page: page
    };
    
    const queryString = Object.keys(paginationParams).length > 0 
      ? '?' + Object.keys(paginationParams).map(key => `${key}=${encodeURIComponent(paginationParams[key])}`).join('&')
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
      Logger.log(`Fetching page ${page} from ${endpoint}...`);
      
      const response = UrlFetchApp.fetch(url + queryString, options);
      const responseCode = response.getResponseCode();
      
      if (responseCode !== 200) {
        throw new Error(`API request failed with status ${responseCode}: ${response.getContentText()}`);
      }
      
      const responseData = JSON.parse(response.getContentText());
      
      // Add current page data to all data
      if (responseData.data && responseData.data.length > 0) {
        allData.push(...responseData.data);
        Logger.log(`Page ${page}: Retrieved ${responseData.data.length} records`);
        
        // Check if there are more pages
        if (responseData.meta) {
          hasMoreData = responseData.meta.current_page < responseData.meta.last_page;
        } else if (responseData.links && responseData.links.next) {
          hasMoreData = true;
        } else {
          hasMoreData = responseData.data.length === 100; // If we got max records, there might be more
        }
        
        page++;
        
        // Add a small delay between requests to be respectful to the API
        if (hasMoreData) {
          Utilities.sleep(500); // 0.5 second delay between pages
        }
      } else {
        hasMoreData = false;
      }
      
    } catch (error) {
      Logger.log(`API request error for ${endpoint} (page ${page}): ${error.toString()}`);
      throw error;
    }
  }
  
  Logger.log(`Total records retrieved from ${endpoint}: ${allData.length}`);
  return { data: allData };
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
      const headers = [
        'ID', 'Email', 'First Name', 'Last Name', 'Status', 'Email Verified',
        'Company', 'Address', 'Country', 'City', 'State', 'Zipcode', 'Phone',
        'Facebook', 'YouTube', 'Instagram', 'Twitter', 'Affiliate Link',
        'Program ID', 'Program Name', 'Created At'
      ];
      
      const rows = data.data.map(affiliate => [
        affiliate.id || '',
        affiliate.email || '',
        affiliate.first_name || '',
        affiliate.last_name || '',
        affiliate.status === 1 ? 'Active' : 'Inactive',
        affiliate.email_verified === 1 ? 'Verified' : 'Not Verified',
        affiliate.company || '',
        affiliate.address || '',
        affiliate.country || '',
        affiliate.city || '',
        affiliate.state || '',
        affiliate.zipcode || '',
        affiliate.phone || '',
        affiliate.facebook || '',
        affiliate.youtube || '',
        affiliate.instagram || '',
        affiliate.twitter || '',
        affiliate.affiliate_link || '',
        affiliate.program_id || '',
        affiliate.program_name || '',
        affiliate.created_at_timestamp ? new Date(affiliate.created_at_timestamp * 1000).toLocaleString() : ''
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
      const headers = [
        'ID', 'Order ID', 'Order Number', 'Affiliate ID', 'Customer ID', 
        'Quantity', 'Total Sales', 'Commission', 'Commission Adjustment',
        'Status', 'Commission Type', 'Commission Amount', 'Refund ID',
        'Tracking Type', 'Affiliate Email', 'Affiliate Name', 'Created At'
      ];
      
      const rows = data.data.map(referral => [
        referral.id || '',
        referral.order_id || '',
        referral.order_number || '',
        referral.affiliate_id || '',
        referral.customer_id || '',
        referral.quantity || '',
        referral.total_sales || '',
        referral.commission || '',
        referral.commission_adjustment || '',
        referral.status || '',
        referral.commission_type || '',
        referral.commission_amount || '',
        referral.refund_id || '',
        referral.tracking_type || '',
        referral.affiliate ? referral.affiliate.email : '',
        referral.affiliate ? `${referral.affiliate.first_name} ${referral.affiliate.last_name}` : '',
        referral.created_at ? new Date(referral.created_at * 1000).toLocaleString() : ''
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
      const headers = ['ID', 'Affiliate ID', 'Coupon Code', 'Description', 'Created At'];
      
      const rows = data.data.map(coupon => [
        coupon.id || '',
        coupon.affiliate_id || '',
        coupon.coupon || '',
        coupon.description || '',
        coupon.created_timestamp ? new Date(coupon.created_timestamp * 1000).toLocaleString() : ''
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
