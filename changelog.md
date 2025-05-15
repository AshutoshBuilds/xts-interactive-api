# Changelog

## 2024-07-27 00:00:00 UTC 
- Initialized changelog.
- Session started: Focus on identifying issues, errors, and improvements for the `xts-interactive-api` library. 

## 2024-07-27 00:01:00 UTC
- Examined `package.json`.
- Identified key improvement areas:
    - Replace deprecated `request` and `request-promise` dependencies.
    - Update outdated `socket.io-client` dependency.
    - Implement a test suite (currently no tests).
    - Review `linq` dependency usage and necessity. 

## 2024-07-27 00:05:00 UTC
- Created `PRD.md` (Product Requirements Document) to outline the enhancement project for `xts-interactive-api`.
- Documented goals, scope (including dependency modernization, test suite implementation, `linq` review, and opportunistic refactoring), success metrics, and open questions. 

## 2024-07-27 00:15:00 UTC
- **Replaced HTTP Client:**
    - Modified `package.json`: Removed `request` and `request-promise`, added `axios` (^1.6.0).
    - Refactored `lib/request.js`: Updated `processRequest` function to use `axios` for HTTP requests, maintaining existing logging and error handling structure.
    - **Action Required:** User needs to run `npm install` to update dependencies.
- **Next Steps:** Manual testing of API functionalities is crucial. Proceed with test suite implementation. 

## 2024-07-27 00:20:00 UTC
- **Set Up Testing Framework (Jest):**
    - Installed `jest` as a dev dependency.
    - Updated `scripts.test` in `package.json` to `"jest"`.
    - Created initial test file `lib/customError.test.js` with basic test cases for `CustomError` module.
    - **Action Required:** User can run `npm test` to execute the initial tests.
- **Noted:** `npm install` and `npm install --save-dev jest` surfaced 4 vulnerabilities (2 moderate, 2 high). To be addressed later (e.g., with `npm audit fix`). 

## 2024-07-27 00:25:00 UTC
- **Expanded Logger Tests (`lib/logger.test.js`):**
    - Added tests for `Date.prototype` extensions used by the logger.
    - Added tests for `logger.init()` and `logger.logFile()`, incorporating `fs` module mocking.
    - Identified potential bug: `logger.logFile()` double-stringifies object messages.
    - Identified dead code: `settings` variable from `settings.json` is imported but unused in `logger.js`.
    - All 18 tests are currently passing.

## 2024-07-27 00:30:00 UTC
- **Refined `logger.js` and Tests:**
    - Fixed bug in `logger.logFile` to correctly stringify object messages (using `JSON.stringify(obj, null, 2)` for objects, `String(val)` for primitives) before appending newline.
    - Removed unused `settings` variable from `logger.js`.
    - Updated `lib/logger.test.js` to reflect the corrected logging behavior for strings, objects, null, undefined, numbers, and booleans.
    - All 22 tests are now passing.
- **Action Required:** Awaiting user feedback on refactoring Date.prototype extensions and console coloring.

## 2024-07-27 00:35:00 UTC
- **Addressed Security Vulnerabilities:**
    - Ran `npm audit` which identified 4 vulnerabilities (2 moderate in `parseuri`, 2 high in `ws`), primarily via `socket.io-client`'s old dependencies.
    - `npm audit fix` was unsuccessful.
    - Executed `npm audit fix --force`.
    - This resolved all 0 vulnerabilities.
    - As a side effect, `socket.io-client` was upgraded from `~2.2.0` to `^4.8.1` in `package.json`.
    - **Critical Next Step:** The major version upgrade of `socket.io-client` likely introduced breaking changes. `lib/interactiveSocket.js` will require review and updates, followed by thorough testing.

## 2024-07-27 00:40:00 UTC
- **Added Tests for `lib/request.js`:**
    - Created `lib/request.test.js`.
    - Mocked `axios` and `logger` modules for isolated testing of `processRequest`.
    - Implemented tests for successful GET and POST requests, verifying correct calls to `axios` and `logger.logFile`.
    - Corrected initial assertion for `logger.logFile` call count (expected 4 calls in success path).
    - All 24 tests are now passing.

## 2024-07-27 00:45:00 UTC
- **Expanded Tests for `lib/request.js` (Error Handling):**
    - Added tests for API error scenarios (e.g., 400 Bad Request), network errors (no response), and setup errors.
    - Adjusted assertions to use `rejects.toEqual()` for Axios-specific error objects and corrected expected log counts for error paths.
    - All 27 tests are now passing. 

## 2024-07-28 10:00:00

*   Started new session.
*   Reviewed previous session summary.
*   Preparing to analyze `socket.io-client` v2 to v4 migration guides and update `lib/interactiveSocket.js`.
*   Updated `lib/interactiveSocket.js` for `socket.io-client` v4 compatibility:
    *   Replaced `socket.destroy()` with `socket.disconnect()`.
    *   Added a `connect_error` event listener.
    *   Used string literals for standard socket event names (`'connect'`, `'error'`, `'disconnect'`) instead of sourcing from `settings.json`.
*   Created `lib/interactiveSocket.test.js` with comprehensive tests for:
    *   Constructor and property initialization.
    *   `init()` method, including correct `socketIoClient` calls and event listener registration.
    *   Event handling (socket events correctly trigger internal `EventEmitter`).
    *   `on<EventName>` methods correctly register callbacks.
    *   Custom disconnect and reconnection logic, using Jest timer mocks.
*   Fixed a bug in `lib/interactiveSocket.js` constructor where default URL was not being set correctly due to `url == "undefined"` instead of `url === undefined`.
*   Standardized JSON parsing in `onOrder`, `onTrade`, `onPosition`, and `onLogout` methods in `lib/interactiveSocket.js` and updated tests accordingly.
*   Suppressed console output during `interactiveSocket.test.js` execution using Jest spies.
*   All tests (64) are now passing after several iterations of fixes to `lib/interactiveSocket.js` and its tests. 

## 2024-07-28 11:00:00
*   Fixed `url === undefined` check in `lib/interactiveRestAPI.js` constructor.
*   Created `lib/interactiveRestAPI.test.js` and added initial tests for:
    *   Constructor and basic properties.
    *   `logIn()`, `logOut()`, `getProfile()`, `getBalance()`, `getHoldings()` methods.
    *   `getPositions()` method, including fix for URL parameter construction (`dayOrNet` default, conditional `clientID`).
*   Modernized `lib/customError.js` from a factory function to a proper ES6 class extending `Error`.
*   Updated `lib/customError.test.js` to use `new CustomError()` and reflect new class structure.
*   Standardized error handling in all `async` methods of `lib/interactiveRestAPI.js` to:
    *   Return existing `CustomError` instances directly if caught.
    *   Wrap other errors in a new `CustomError`, safely accessing `message`, `stack`, `statusCode` from the original error and providing defaults.
*   All tests (93) across 5 suites (`customError.test.js`, `logger.test.js`, `request.test.js`, `interactiveSocket.test.js`, `interactiveRestAPI.test.js`) are now passing. 

## 2024-07-28 12:00:00
*   Added tests for the remaining methods in `lib/interactiveRestAPI.js`:
    *   `placeCoverOrder()`
    *   `exitCoverOrder()`
    *   `getOrderBook()`
    *   `getTradeBook()`
    *   `getOrderHistory()`
    *   `loginWithToken()`
*   Added `orderHistory: "/orders"` to `lib/config/app/settings.json`.
*   Corrected URL construction in `getOrderHistory()` method in `lib/interactiveRestAPI.js` to use path parameters.
*   Updated `getOrderHistory()` test in `lib/interactiveRestAPI.test.js` to match new URL structure.
*   Refactored `loginWithToken()` tests in `lib/interactiveRestAPI.test.js` to correctly reflect its actual implementation (single API call to `/user/enums`).
*   Updated all `catch` blocks in `lib/interactiveRestAPI.js` to use a stricter `if (error instanceof CustomError)` check.
*   All 131 tests across 5 test suites are now passing. 

## 2024-07-28 12:15:00
*   **Removed `linq` Dependency:**
    *   Replaced `linq.from(reqObject).toQueryString()` in `lib/interactiveRestAPI.js` (`cancelOrder` method) with native `URLSearchParams`.
    *   Removed `linq` from `dependencies` in `package.json`.
    *   Updated `lib/interactiveRestAPI.test.js` to remove `linq` mocks and adjusted `cancelOrder` tests.
    *   Ran `npm install` to update `package-lock.json`.
    *   All 131 tests continue to pass. 

## 2024-07-28 12:30:00
*   **Refactored `logger.js` (`Date.prototype` Extensions):**
    *   Removed all `Date.prototype` extensions (`getMonthFormatted`, `getDayFormatted`, etc.).
    *   Added internal utility functions (`getMonthFormatted(date)`, `getDayFormatted(date)`, etc.) within `logger.js` to replicate the formatting logic.
    *   Updated log filename generation and the "RUN the application on" message in `logger.init()` to use these new utility functions.
    *   Modified `logger.logFile()` to prepend a timestamp (e.g., `[Jan 05 2023 07:08:09]`) to every log message.
    *   Created a `getLogFileName()` internal function to ensure log filename uses mocked dates during testing.
    *   Exported date utility functions as `logger.formatDateUtils` for direct testing.
*   **Updated `lib/logger.test.js`:**
    *   Removed tests for the old `Date.prototype` extensions.
    *   Added new tests for the `logger.formatDateUtils`.
    *   Updated tests for `logger.init()` and `logger.logFile()` to expect the new timestamped messages and use Jest's timer mocks (`jest.useFakeTimers()`, `jest.setSystemTime()`) for predictable date-dependent outputs.
    *   Silenced `console.info` output from `logger.init()` during tests using `jest.spyOn(console, 'info').mockImplementation(() => {});`.
*   All 131 tests continue to pass with clean console output. 

## 2024-07-28 12:45:00
*   **Reviewed Configuration Files:**
    *   `lib/config/app/config.json`: Contains only the base `url`, which is actively used. No changes needed.
    *   `lib/config/app/settings.json`:
        *   Removed unused socket event name settings: `connect`, `error`, `disconnect` from the `socket` object. These were previously refactored in `lib/interactiveSocket.js` to use string literals directly.
        *   Verified that all settings under `restApi` are still in use.
    *   Ran `npm test` to confirm no regressions. All 131 tests passed.

## 2024-07-28 12:50:00
*   **Updated `README.md`:**
    *   Mentioned `socket.io-client` v4.x.
    *   Added a "Testing" section with instructions (`npm test`).
    *   Corrected the example for `exitCoverOrder` to pass an object.
    *   Added documentation for `getOrderHistory` and `loginWithToken` methods.
    *   Relocated `loginWithToken` documentation to flow better after the standard `logIn` example.
    *   Removed an extraneous link that appeared during diffing.
    *   Minor typographical fixes.

## 2024-07-28 12:55:00
*   **Added Console Coloring to Logger:**
    *   Added `chalk` (`^4.1.2` for CommonJS compatibility) to `dependencies` in `package.json`.
    *   Ran `npm install`.
    *   Updated `logger.js` to use `chalk.green()` for the "logger module initialized successfully!" message in `console.info`.
    *   Confirmed tests still pass as `console.info` was already mocked in `logger.test.js` without checking exact string content. 

## 2024-07-28 13:00:00
*   **Final Code Review and Refinements:**
    *   `lib/customError.js`: No changes needed.
    *   `lib/logger.js`: No changes needed beyond previous refactors.
    *   `lib/request.js`: Refined request data logging to show keys of the data object if it's an object (e.g., `"dataContent":["key1","key2"]`) instead of just its type. Updated corresponding test in `lib/request.test.js`.
    *   `lib/interactiveSocket.js`: Added `try-catch` blocks around `JSON.parse()` in `onOrder`, `onTrade`, and `onPosition` methods for robustness, similar to existing `onLogout`. If parsing fails, the raw data is passed to the user callback and an error is logged.
    *   `lib/interactiveRestAPI.js`:
        *   Refactored URL construction in `getProfile`, `getBalance`, and `getHoldings` methods for clarity when handling optional `clientID`.
        *   Updated `populateEnums` method to use `const` for loop variables and internal object declarations. Renamed some internal variables for clarity (e.g. `object` to `exchangeSegments`). Added checks for `enumValue[j].orderType` etc. before iterating.
    *   `README.md`: Corrected minor typos ("api's" to "APIs").
    *   All 131 tests continue to pass after these refinements. 

## 2024-07-28 13:05:00
*   **Created `.gitignore`:**
    *   Added a comprehensive `.gitignore` file with standard ignores for Node.js projects, including `node_modules/`, `logs/`, OS-specific files, IDE files, and npm debug logs. 