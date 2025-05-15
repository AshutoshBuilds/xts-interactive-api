# Q&A Log

This file will store questions and answers that arise during our development session.

## Questions:

1.  **Dependency Replacement (HTTP Client):** The `request` and `request-promise` libraries are deprecated. What is the preferred modern HTTP client to replace them with? Common choices include `axios`, `node-fetch` (or built-in `fetch` if Node.js version supports it well for this library's needs), or `got`. Please specify or indicate if there's a project standard.
    *   **Answer:** `axios` has been implemented as the replacement. (User confirmed 'yes' to proceed with `axios` proposal).

2.  **Preferred Testing Framework:** What is the preferred testing framework for implementing the test suite? Common choices include Jest, Mocha, Jasmine, etc. (PRD proposes Jest).
    *   **Answer:** Jest has been set up as the testing framework based on the PRD proposal and implicit user approval to proceed.

3.  **Supported Node.js Versions:** Are there specific Node.js versions that this library must support? This information will influence decisions such as whether to use native `fetch` or a library-based HTTP client.
    *   **Answer:** (Pending)

4.  **Critical API Functionalities for Testing:** What are the most critical API functionalities or user workflows that must be covered by integration tests in Phase 1 of the enhancement project? (e.g., login, order placement, market data subscription).
    *   **Answer:** (Pending)

5.  **Performance Benchmarks:** Are there any specific performance benchmarks or expectations that the library needs to meet after the planned enhancements?
    *   **Answer:** (Pending) 