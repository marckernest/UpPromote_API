/**
 * Setup and configuration functions for UpPromote API integration
 */

/**
 * One-time setup function to configure the script
 */
function setupScript() {
  Logger.log('Starting UpPromote API script setup...');
  
  try {
    // Prompt user for API key (in real deployment, this would be set manually)
    const apiKey = Browser.inputBox(
      'UpPromote API Setup',
      'Please enter your UpPromote API key:',
      Browser.Buttons.OK_CANCEL
    );
    
    if (apiKey === 'cancel' || !apiKey) {
      Logger.log('Setup cancelled by user');
      return;
    }
    
    // Store API key securely
    ApiKeyManager.setApiKey(apiKey);
    
    // Test API connection
    if (testApiConnectionSecure()) {
      Logger.log('Setup completed successfully!');
      Browser.msgBox(
        'Setup Complete',
        'UpPromote API integration has been configured successfully. You can now run pullUpPromoteData() to fetch data.',
        Browser.Buttons.OK
      );
    } else {
      Logger.log('Setup failed - API connection test unsuccessful');
      ApiKeyManager.clearApiKey();
    }
    
  } catch (error) {
    ErrorReporter.logError('setupScript', error);
    Browser.msgBox(
      'Setup Failed',
      'There was an error during setup: ' + error.toString(),
      Browser.Buttons.OK
    );
  }
}

/**
 * Enhanced data pull function with improved error handling and monitoring
 */
function pullUpPromoteDataEnhanced() {
  const startTime = new Date();
  Logger.log('Starting enhanced data pull at ' + startTime.toISOString());
  
  try {
    // Get API key from secure storage
    const apiKey = ApiKeyManager.getApiKey();
    if (!apiKey) {
      throw new Error('API key not found. Please run setupScript() first.');
    }
    
    // Validate configuration
    const config = {
      API_KEY: apiKey,
      API_BASE_URL: CONFIG.API_BASE_URL,
      ENDPOINTS: CONFIG.ENDPOINTS
    };
    ConfigValidator.validateConfig(config);
    
    // Initialize API client with rate limiting
    const apiClient = new ApiClient(CONFIG.API_BASE_URL, apiKey);
    
    // Get or create spreadsheet
    const spreadsheet = getOrCreateSpreadsheet();
    const sheetManager = new SheetManager(spreadsheet);
    
    // Track data counts for summary
    const dataCounts = {};
    
    // Pull data from each endpoint
    dataCounts.affiliates = pullAffiliatesDataEnhanced(apiClient, sheetManager);
    dataCounts.referrals = pullReferralsDataEnhanced(apiClient, sheetManager);
    dataCounts.coupons = pullCouponsDataEnhanced(apiClient, sheetManager);
    dataCounts.payments = pullPaymentsDataEnhanced(apiClient, sheetManager);
    
    // Add summary sheet
    sheetManager.addSummarySheet(dataCounts);
    
    const endTime = new Date();
    const duration = (endTime - startTime) / 1000;
    
    Logger.log(`Data pull completed successfully in ${duration} seconds`);
    Logger.log('Data summary: ' + JSON.stringify(dataCounts));
    
    return {
      success: true,
      duration: duration,
      dataCounts: dataCounts,
      timestamp: endTime.toISOString()
    };
    
  } catch (error) {
    ErrorReporter.logError('pullUpPromoteDataEnhanced', error, {
      timestamp: new Date().toISOString(),
      function: 'pullUpPromoteDataEnhanced'
    });
    throw error;
  }
}

/**
 * Enhanced affiliates data pull with better formatting
 */
function pullAffiliatesDataEnhanced(apiClient, sheetManager) {
  Logger.log('Pulling affiliates data...');
  
  try {
    const data = apiClient.makeRequest(CONFIG.ENDPOINTS.AFFILIATES);
    const sheet = sheetManager.getOrCreateSheet('Affiliates');
    
    if (data && data.data && data.data.length > 0) {
      const headers = [
        'ID', 'Email', 'Name', 'Status', 'Commission Rate (%)', 
        'Total Referrals', 'Total Earnings', 'Created Date', 'Last Updated'
      ];
      
      const rows = data.data.map(affiliate => [
        affiliate.id || '',
        DataFormatter.sanitizeString(affiliate.email) || '',
        DataFormatter.sanitizeString(affiliate.name) || '',
        affiliate.status || '',
        affiliate.commission_rate || '',
        affiliate.total_referrals || 0,
        DataFormatter.formatCurrency(affiliate.total_earnings) || '',
        DataFormatter.formatDate(affiliate.created_at) || '',
        DataFormatter.formatDate(affiliate.updated_at) || ''
      ]);
      
      sheetManager.writeDataWithFormatting(sheet, headers, rows);
      Logger.log(`Successfully pulled ${rows.length} affiliates`);
      return rows.length;
    } else {
      Logger.log('No affiliates data found');
      return 0;
    }
  } catch (error) {
    ErrorReporter.logError('pullAffiliatesDataEnhanced', error);
    return 0;
  }
}

/**
 * Enhanced referrals data pull with better formatting
 */
function pullReferralsDataEnhanced(apiClient, sheetManager) {
  Logger.log('Pulling referrals data...');
  
  try {
    const data = apiClient.makeRequest(CONFIG.ENDPOINTS.REFERRALS);
    const sheet = sheetManager.getOrCreateSheet('Referrals');
    
    if (data && data.data && data.data.length > 0) {
      const headers = [
        'ID', 'Affiliate ID', 'Customer Email', 'Order Value', 
        'Commission Amount', 'Commission Rate (%)', 'Status', 'Order Date', 'Created Date'
      ];
      
      const rows = data.data.map(referral => [
        referral.id || '',
        referral.affiliate_id || '',
        DataFormatter.sanitizeString(referral.customer_email) || '',
        DataFormatter.formatCurrency(referral.order_value) || '',
        DataFormatter.formatCurrency(referral.commission) || '',
        referral.commission_rate || '',
        referral.status || '',
        DataFormatter.formatDate(referral.order_date) || '',
        DataFormatter.formatDate(referral.created_at) || ''
      ]);
      
      sheetManager.writeDataWithFormatting(sheet, headers, rows);
      Logger.log(`Successfully pulled ${rows.length} referrals`);
      return rows.length;
    } else {
      Logger.log('No referrals data found');
      return 0;
    }
  } catch (error) {
    ErrorReporter.logError('pullReferralsDataEnhanced', error);
    return 0;
  }
}

/**
 * Enhanced coupons data pull with better formatting
 */
function pullCouponsDataEnhanced(apiClient, sheetManager) {
  Logger.log('Pulling coupons data...');
  
  try {
    const data = apiClient.makeRequest(CONFIG.ENDPOINTS.COUPONS);
    const sheet = sheetManager.getOrCreateSheet('Coupons');
    
    if (data && data.data && data.data.length > 0) {
      const headers = [
        'ID', 'Code', 'Affiliate ID', 'Discount Type', 'Discount Value', 
        'Usage Count', 'Usage Limit', 'Status', 'Expiry Date', 'Created Date'
      ];
      
      const rows = data.data.map(coupon => [
        coupon.id || '',
        DataFormatter.sanitizeString(coupon.code) || '',
        coupon.affiliate_id || '',
        coupon.discount_type || '',
        coupon.discount_value || '',
        coupon.usage_count || 0,
        coupon.usage_limit || '',
        coupon.status || '',
        DataFormatter.formatDate(coupon.expiry_date) || '',
        DataFormatter.formatDate(coupon.created_at) || ''
      ]);
      
      sheetManager.writeDataWithFormatting(sheet, headers, rows);
      Logger.log(`Successfully pulled ${rows.length} coupons`);
      return rows.length;
    } else {
      Logger.log('No coupons data found');
      return 0;
    }
  } catch (error) {
    ErrorReporter.logError('pullCouponsDataEnhanced', error);
    return 0;
  }
}

/**
 * Enhanced payments data pull with better formatting
 */
function pullPaymentsDataEnhanced(apiClient, sheetManager) {
  Logger.log('Pulling payments data...');
  
  try {
    const data = apiClient.makeRequest(CONFIG.ENDPOINTS.PAYMENTS);
    const sheet = sheetManager.getOrCreateSheet('Payments');
    
    if (data && data.data && data.data.length > 0) {
      const headers = [
        'ID', 'Affiliate ID', 'Amount', 'Currency', 'Status', 
        'Payment Method', 'Transaction ID', 'Processing Date', 'Created Date'
      ];
      
      const rows = data.data.map(payment => [
        payment.id || '',
        payment.affiliate_id || '',
        DataFormatter.formatCurrency(payment.amount, payment.currency) || '',
        payment.currency || '',
        payment.status || '',
        payment.payment_method || '',
        payment.transaction_id || '',
        DataFormatter.formatDate(payment.processing_date) || '',
        DataFormatter.formatDate(payment.created_at) || ''
      ]);
      
      sheetManager.writeDataWithFormatting(sheet, headers, rows);
      Logger.log(`Successfully pulled ${rows.length} payments`);
      return rows.length;
    } else {
      Logger.log('No payments data found');
      return 0;
    }
  } catch (error) {
    ErrorReporter.logError('pullPaymentsDataEnhanced', error);
    return 0;
  }
}

/**
 * Test API connection using secure key storage
 */
function testApiConnectionSecure() {
  const apiKey = ApiKeyManager.getApiKey();
  
  if (!apiKey) {
    Logger.log('Error: API key not found in secure storage');
    return false;
  }
  
  try {
    const apiClient = new ApiClient(CONFIG.API_BASE_URL, apiKey);
    const data = apiClient.makeRequest(CONFIG.ENDPOINTS.AFFILIATES, { limit: 1 });
    
    Logger.log('API connection successful');
    Logger.log('Test response received with data length: ' + (data.data ? data.data.length : 0));
    return true;
  } catch (error) {
    ErrorReporter.logError('testApiConnectionSecure', error);
    return false;
  }
}

/**
 * Advanced trigger setup with error handling
 */
function setupAdvancedTrigger() {
  try {
    // Remove existing triggers
    removeTriggers();
    
    // Create new trigger with error handling
    const trigger = ScriptApp.newTrigger('pullUpPromoteDataEnhanced')
      .timeBased()
      .everyDays(1)
      .atHour(9)
      .create();
    
    Logger.log('Advanced daily trigger set up successfully');
    Logger.log('Trigger ID: ' + trigger.getUniqueId());
    
    return trigger.getUniqueId();
  } catch (error) {
    ErrorReporter.logError('setupAdvancedTrigger', error);
    throw error;
  }
}

/**
 * Get execution statistics
 */
function getExecutionStats() {
  try {
    const triggers = ScriptApp.getProjectTriggers();
    const activeTriggers = triggers.filter(t => t.getHandlerFunction().includes('pullUpPromote'));
    
    const stats = {
      activeTriggers: activeTriggers.length,
      lastExecution: 'Unknown', // Would need to store this in properties
      apiKeyConfigured: !!ApiKeyManager.getApiKey(),
      projectId: ScriptApp.getScriptId()
    };
    
    Logger.log('Execution stats: ' + JSON.stringify(stats, null, 2));
    return stats;
  } catch (error) {
    ErrorReporter.logError('getExecutionStats', error);
    return { error: error.toString() };
  }
}
