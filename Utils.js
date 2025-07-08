/**
 * Enhanced utility functions for UpPromote API integration
 */

/**
 * Secure API key management using PropertiesService
 */
class ApiKeyManager {
  static setApiKey(apiKey) {
    PropertiesService.getScriptProperties().setProperty('UPPROMOTE_API_KEY', apiKey);
    Logger.log('API key stored securely');
  }
  
  static getApiKey() {
    return PropertiesService.getScriptProperties().getProperty('UPPROMOTE_API_KEY');
  }
  
  static clearApiKey() {
    PropertiesService.getScriptProperties().deleteProperty('UPPROMOTE_API_KEY');
    Logger.log('API key cleared');
  }
}

/**
 * Rate limiting and retry logic for API requests
 */
class ApiClient {
  constructor(baseUrl, apiKey, maxRetries = 3) {
    this.baseUrl = baseUrl;
    this.apiKey = apiKey;
    this.maxRetries = maxRetries;
    this.requestCount = 0;
  }
  
  makeRequest(endpoint, params = {}, retryCount = 0) {
    const allData = [];
    let page = 1;
    let hasMoreData = true;
    
    while (hasMoreData) {
      const url = this.baseUrl + endpoint;
      
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
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      };
      
      try {
        // Add delay to respect rate limits
        if (this.requestCount > 0) {
          Utilities.sleep(1000); // 1 second delay between requests
        }
        
        const response = UrlFetchApp.fetch(url + queryString, options);
        const responseCode = response.getResponseCode();
        this.requestCount++;
        
        if (responseCode === 429) { // Rate limited
          if (retryCount < this.maxRetries) {
            const delay = Math.pow(2, retryCount) * 1000; // Exponential backoff
            Logger.log(`Rate limited, retrying in ${delay}ms...`);
            Utilities.sleep(delay);
            return this.makeRequest(endpoint, params, retryCount + 1);
          } else {
            throw new Error('Rate limit exceeded, max retries reached');
          }
        }
        
        if (responseCode !== 200) {
          throw new Error(`API request failed with status ${responseCode}: ${response.getContentText()}`);
        }
        
        const responseData = JSON.parse(response.getContentText());
        
        // Add current page data to all data
        if (responseData.data && responseData.data.length > 0) {
          allData.push(...responseData.data);
          Logger.log(`Page ${page}: Retrieved ${responseData.data.length} records from ${endpoint}`);
          
          // Check if there are more pages
          if (responseData.meta) {
            hasMoreData = responseData.meta.current_page < responseData.meta.last_page;
          } else if (responseData.links && responseData.links.next) {
            hasMoreData = true;
          } else {
            hasMoreData = responseData.data.length === 100; // If we got max records, there might be more
          }
          
          page++;
          
          // Add a small delay between pages
          if (hasMoreData) {
            Utilities.sleep(500); // 0.5 second delay between pages
          }
        } else {
          hasMoreData = false;
        }
        
      } catch (error) {
        if (retryCount < this.maxRetries && error.toString().includes('timeout')) {
          Logger.log(`Request timeout, retrying... (${retryCount + 1}/${this.maxRetries})`);
          Utilities.sleep(2000);
          return this.makeRequest(endpoint, params, retryCount + 1);
        }
        
        Logger.log(`API request error for ${endpoint} (page ${page}): ${error.toString()}`);
        throw error;
      }
    }
    
    Logger.log(`Total records retrieved from ${endpoint}: ${allData.length}`);
    return { data: allData };
  }
}

/**
 * Data formatting and validation utilities
 */
class DataFormatter {
  static formatDate(dateString) {
    if (!dateString) return '';
    try {
      return new Date(dateString).toLocaleString();
    } catch (error) {
      return dateString;
    }
  }
  
  static formatCurrency(amount, currency = 'USD') {
    if (!amount) return '';
    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency
      }).format(amount);
    } catch (error) {
      return amount;
    }
  }
  
  static validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
  
  static sanitizeString(str) {
    if (!str) return '';
    return str.toString().replace(/[\r\n\t]/g, ' ').trim();
  }
}

/**
 * Advanced sheet management
 */
class SheetManager {
  constructor(spreadsheet) {
    this.spreadsheet = spreadsheet;
  }
  
  getOrCreateSheet(sheetName) {
    let sheet = this.spreadsheet.getSheetByName(sheetName);
    if (!sheet) {
      sheet = this.spreadsheet.insertSheet(sheetName);
      this.formatSheet(sheet);
    }
    return sheet;
  }
  
  formatSheet(sheet) {
    // Set default formatting
    const range = sheet.getDataRange();
    if (range.getNumRows() > 0) {
      range.setFontFamily('Arial');
      range.setFontSize(10);
    }
  }
  
  writeDataWithFormatting(sheet, headers, rows) {
    // Clear existing content
    sheet.clear();
    
    // Write and format headers
    const headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setValues([headers]);
    headerRange.setFontWeight('bold');
    headerRange.setBackground('#4285f4');
    headerRange.setFontColor('#ffffff');
    
    // Write data if available
    if (rows.length > 0) {
      const dataRange = sheet.getRange(2, 1, rows.length, headers.length);
      dataRange.setValues(rows);
      
      // Apply alternating row colors using banding for better performance
      const banding = sheet.getRange(1, 1, rows.length + 1, headers.length).setBanding(SpreadsheetApp.BandingTheme.LIGHT_GREY);
      banding.setHeaderRowColor('#4285f4');
      banding.setHeaderRowFontColor('#ffffff');
      banding.setFirstRowColor('#ffffff');
      banding.setSecondRowColor('#f8f9fa');
    }
    
    // Auto-resize columns
    sheet.autoResizeColumns(1, headers.length);
    
    // Freeze header row
    sheet.setFrozenRows(1);
  }
  
  addSummarySheet(data) {
    const summarySheet = this.getOrCreateSheet('Summary');
    summarySheet.clear();
    
    const summaryData = [
      ['UpPromote Data Summary', ''],
      ['Last Updated', new Date().toLocaleString()],
      ['', ''],
      ['Data Type', 'Count'],
      ['Affiliates', data.affiliates || 0],
      ['Referrals', data.referrals || 0],
      ['Coupons', data.coupons || 0]
    ];
    
    summarySheet.getRange(1, 1, summaryData.length, 2).setValues(summaryData);
    
    // Format summary sheet
    summarySheet.getRange(1, 1).setFontSize(14).setFontWeight('bold');
    summarySheet.getRange(4, 1, 1, 2).setFontWeight('bold').setBackground('#e8f0fe');
    summarySheet.autoResizeColumns(1, 2);
  }
}

/**
 * Error reporting and monitoring
 */
class ErrorReporter {
  static logError(context, error, additionalInfo = {}) {
    const errorLog = {
      timestamp: new Date().toISOString(),
      context: context,
      error: error.toString(),
      stack: error.stack || 'No stack trace available',
      additionalInfo: additionalInfo
    };
    
    Logger.log('ERROR: ' + JSON.stringify(errorLog, null, 2));
    
    // Optional: Send error to external monitoring service
    // this.sendToMonitoring(errorLog);
  }
  
  static sendToMonitoring(errorLog) {
    // Implement external error monitoring if needed
    // Example: send to webhook, email, or monitoring service
  }
}

/**
 * Configuration validator
 */
class ConfigValidator {
  static validateConfig(config) {
    const errors = [];
    
    if (!config.API_KEY) {
      errors.push('API_KEY is required');
    }
    
    if (!config.API_BASE_URL) {
      errors.push('API_BASE_URL is required');
    }
    
    if (!config.ENDPOINTS || Object.keys(config.ENDPOINTS).length === 0) {
      errors.push('ENDPOINTS configuration is required');
    }
    
    if (errors.length > 0) {
      throw new Error('Configuration validation failed: ' + errors.join(', '));
    }
    
    return true;
  }
}
