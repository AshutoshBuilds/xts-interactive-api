# Product Requirements Document: XTS Interactive API - Enhancement Project

## 1. Introduction

The `xts-interactive-api` is the official JavaScript client library for the Symphony Fintech Trading APIs. It enables developers to integrate trading functionalities into their Node.js applications.

This document outlines the requirements for the initial phase of an enhancement project aimed at modernizing the library, improving its reliability, maintainability, security, and overall quality.

## 2. Goals

The primary goals for this enhancement project are:

*   **Modernize Core Dependencies:** Replace outdated and deprecated libraries with modern, secure, and well-maintained alternatives.
*   **Enhance Code Quality & Robustness:** Introduce a comprehensive test suite to ensure reliability and facilitate future development.
*   **Improve Security:** Eliminate known vulnerabilities associated with deprecated dependencies.
*   **Ensure Long-Term Maintainability:** Refactor code for clarity, reduce complexity, and adopt best practices.
*   **Maintain API Stability:** Ensure that essential functionalities remain backward compatible or that any breaking changes are clearly documented and justified.

## 3. Target Audience

*   Developers building applications that interact with the Symphony Fintech Trading APIs using JavaScript or Node.js.
*   Internal teams at Symphony Fintech responsible for maintaining and supporting the API client.

## 4. Scope of Work (Phase 1 - Initial Enhancements)

This phase will focus on the most critical improvements:

### 4.1. Dependency Modernization

*   **HTTP Client Replacement:**
    *   **Current:** `request` (deprecated, known security vulnerabilities), `request-promise`.
    *   **Task:** Replace `request` and `request-promise` with a modern HTTP client.
    *   **Recommendation:** `axios` is a strong candidate due to its popularity, feature set, and promise-based API. (Awaiting final confirmation - see Q&A.md).
    *   **Affected Modules:** Primarily `lib/request.js`, which will impact `lib/interactiveRestAPI.js`.
*   **WebSocket Client Update:**
    *   **Current:** `socket.io-client` version ~2.2.0 (outdated).
    *   **Task:** Update `socket.io-client` to the latest stable version (currently 4.x.x).
    *   **Considerations:** This is a major version update and may involve breaking changes. Thorough testing will be required.
    *   **Affected Modules:** `lib/interactiveSocket.js`.

### 4.2. Test Suite Implementation

*   **Current:** No automated test suite exists (`"test": "echo \"Error: no test specified\" && exit 1"`).
*   **Task:**
    1.  Select and configure a testing framework (e.g., Jest, Mocha). (Jest is a common recommendation).
    2.  Develop unit tests for core modules, starting with:
        *   `lib/request.js` (after HTTP client replacement).
        *   `lib/interactiveRestAPI.js` (key public methods).
        *   `lib/interactiveSocket.js` (connection, event handling).
        *   `lib/customError.js`.
        *   `lib/logger.js`.
    3.  Begin developing integration tests to cover common API interaction flows.
*   **Goal:** Achieve foundational test coverage to build confidence in changes and prevent regressions.

### 4.3. Dependency Review

*   **`linq` library:**
    *   **Task:** Analyze the usage of the `linq` library throughout the codebase.
    *   **Goal:** Determine if its functionality can be replaced with native JavaScript array methods (ES6+) or other modern utility functions to potentially reduce the dependency footprint and simplify the code.

### 4.4. Code Quality & Refactoring (Opportunistic)

*   **Large Files:** The file `lib/interactiveRestAPI.js` (766 lines) is quite large. As we work on it, identify opportunities for logical decomposition into smaller, more focused modules if it improves readability and maintainability.
*   **Logging:** Review and enhance logging in `logger.js` and its usage, ensuring that logs are informative for debugging and monitoring.
*   **Error Handling:** Ensure consistent and robust error handling using `customError.js` and standard JavaScript error patterns.

## 5. Success Metrics (Phase 1)

*   **Dependency Health:**
    *   `request` and `request-promise` successfully removed and replaced.
    *   `socket.io-client` updated to a stable 4.x version.
    *   `npm audit` (or equivalent) reports no critical or high-severity vulnerabilities related to project dependencies.
*   **Test Coverage:**
    *   A testing framework is successfully integrated.
    *   Initial unit test coverage for critical modules (e.g., `lib/request.js`, `lib/interactiveRestAPI.js`, `lib/interactiveSocket.js`) reaches a target of at least 50% (to be refined).
    *   At least 2-3 key end-to-end API flows are covered by integration tests.
*   **Functionality:**
    *   The library maintains backward compatibility for core public API methods, or any necessary breaking changes are minimal, justified, and well-documented.
    *   Key trading operations (e.g., login, order placement, market data subscription – *specifics to be confirmed based on API capabilities*) are fully functional after changes.
*   **`linq` Dependency:** A decision is made regarding the `linq` library (retain or replace), with a clear rationale.

## 6. Open Questions & Future Considerations

*(Refer to `Q&A.md` for an ongoing list of detailed questions)*

*   **Q1:** What is the preferred modern HTTP client? (`axios` proposed).
*   **Q2:** What is the preferred testing framework? (Jest proposed).
*   **Q3:** Are there specific Node.js versions the library must support? (This influences choices like using native `fetch` vs. a library).
*   **Q4:** What are the most critical API functionalities/workflows that must be covered by integration tests in Phase 1?
*   **Q5:** Are there any performance benchmarks to meet?

**Future Considerations (Post-Phase 1):**

*   Comprehensive API documentation (e.g., using JSDoc, generating a static site).
*   TypeScript conversion for improved type safety and developer experience.
*   Advanced mocking strategies for tests.
*   Continuous Integration (CI) pipeline setup for automated testing and builds.
*   More granular refactoring of large modules.
*   Expansion of test coverage.

---
This PRD will be a living document and will be updated as the project progresses and more information becomes available. 