<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

# UpPromote API Google Apps Script Project

This project integrates with the UpPromote affiliate platform API to pull data into Google Sheets.

## Code Guidelines

- Use Google Apps Script V8 runtime
- Follow Google Apps Script best practices for API calls and error handling
- Use UrlFetchApp for HTTP requests
- Implement proper error logging with Logger.log()
- Use SpreadsheetApp for Google Sheets operations
- Handle API rate limits and timeouts gracefully
- Validate API responses before processing data
- Use clear, descriptive function names
- Add JSDoc comments for all functions
- Handle edge cases like empty responses or network errors

## API Integration Notes

- The UpPromote API uses Bearer token authentication
- Base URL: https://aff-api.uppromote.com/api/v1
- Main endpoints: /affiliates, /referrals, /coupons, /payments
- Always check response status codes before parsing JSON
- Implement retry logic for failed requests
- Use proper error handling for network timeouts

## Google Sheets Best Practices

- Clear existing data before writing new data
- Use batch operations for better performance
- Auto-resize columns after data insertion
- Apply proper formatting to headers
- Create separate sheets for different data types
- Use meaningful sheet names

## Security Considerations

- Store API keys in script properties, not in code
- Use proper authorization scopes
- Validate all input data
- Log errors without exposing sensitive information
