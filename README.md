# UpPromote API Google Apps Script Integration

A Google Apps Script project that pulls affiliate data from the UpPromote platform API into Google Sheets for easy analysis and reporting.

## Features

- **Automated Data Pull**: Retrieves data from multiple UpPromote API endpoints
- **Multi-Sheet Organization**: Separates different data types into organized sheets
- **Scheduled Execution**: Set up automated daily data pulls
- **Error Handling**: Comprehensive error logging and API validation
- **Easy Configuration**: Simple setup with API key configuration

## API Endpoints Supported

- **Affiliates**: Pull comprehensive affiliate partner information including contact details, social media links, and program data
- **Referrals**: Track referral transactions, commissions, and payment status (includes payment data for paid referrals)
- **Coupons**: Monitor coupon codes assigned to affiliates and their usage

*Note: The UpPromote API doesn't have a separate payments endpoint. Payment information is available in the referrals data when the status is 'paid'.*

## Setup Instructions

### 1. Get Your UpPromote API Key

1. Log in to your UpPromote dashboard
2. Navigate to Settings → API Settings
3. Generate or copy your API key

### 2. Configure the Script

1. Open the `Code.js` file
2. Replace the empty `API_KEY` value in the `CONFIG` object with your actual API key:
   ```javascript
   const CONFIG = {
     API_KEY: 'your-api-key-here', // Replace with your actual API key
     // ... other settings
   };
   ```

### 3. Deploy to Google Apps Script

1. Go to [Google Apps Script](https://script.google.com/)
2. Create a new project
3. Replace the default code with the contents of `Code.js`
4. Copy the `appsscript.json` configuration
5. Save the project

### 4. Set Up Google Sheets

The script will automatically create a new Google Sheet named "UpPromoter_Data" or use the currently active one. Each data type will be organized into separate sheets:

- **Affiliates**: Comprehensive partner information including contact details, social media links, program data, and status
- **Referrals**: Complete transaction data including order details, commission calculations, and payment status  
- **Coupons**: Coupon codes assigned to affiliates with descriptions and creation dates

## Usage

### Manual Execution

1. In Google Apps Script editor, select the `pullUpPromoteData` function
2. Click the "Run" button
3. Grant necessary permissions when prompted
4. Check the execution log for results

### Test API Connection

Run the `testApiConnection()` function to verify your API key is working correctly.

### Automated Execution

Set up automated daily data pulls:

```javascript
// Run this function once to set up daily automation
setupTrigger();
```

This will create a trigger that runs the data pull every day at 9 AM.

### Remove Automation

To stop automated execution:

```javascript
// Run this function to remove all triggers
removeTriggers();
```

## Configuration Options

You can customize the script behavior by modifying the `CONFIG` object:

```javascript
const CONFIG = {
  API_BASE_URL: 'https://aff-api.uppromote.com/api/v1',
  API_KEY: 'your-api-key-here',
  SHEET_NAME: 'UpPromoter_Data', // Name for new spreadsheets
  ENDPOINTS: {
    // API endpoints to pull data from
    AFFILIATES: '/affiliates',
    REFERRALS: '/referrals',
    COUPONS: '/coupons'
    // Note: /payments endpoint doesn't exist - payment data is in referrals
  }
};
```

## Error Handling

The script includes comprehensive error handling:

- **API Connection**: Validates API responses and handles network errors
- **Authentication**: Checks for valid API key configuration
- **Data Processing**: Handles empty responses and malformed data
- **Logging**: All errors are logged to Google Apps Script's execution log

## Security Best Practices

For production use, consider these security improvements:

1. **Store API Key Securely**: Use Google Apps Script's PropertiesService instead of hardcoding:
   ```javascript
   // Store the API key
   PropertiesService.getScriptProperties().setProperty('UPPROMOTE_API_KEY', 'your-api-key');
   
   // Retrieve the API key
   const apiKey = PropertiesService.getScriptProperties().getProperty('UPPROMOTE_API_KEY');
   ```

2. **Limit Execution Permissions**: Set appropriate sharing and execution permissions
3. **Monitor Usage**: Regularly check execution logs for unusual activity

## Troubleshooting

### Common Issues

1. **"API key not configured" Error**
   - Ensure you've added your API key to the CONFIG object
   - Verify the API key is correct and active

2. **"API request failed" Error**
   - Check your internet connection
   - Verify the UpPromote API is accessible
   - Ensure your API key has the necessary permissions

3. **Permission Errors**
   - Grant necessary permissions when prompted
   - Ensure you have edit access to the target Google Sheet

### API Rate Limits

If you encounter rate limiting issues:

- Add delays between API calls
- Implement retry logic with exponential backoff
- Contact UpPromote support for rate limit increases

## API Documentation

For complete API documentation, visit: https://aff-api.uppromote.com/docs/index.html#info

## Support

For issues related to:
- **UpPromote API**: Contact UpPromote support
- **Google Apps Script**: Check Google's documentation and community forums
- **This Integration**: Review the code comments and error logs

## License

This project is provided as-is for educational and integration purposes.
