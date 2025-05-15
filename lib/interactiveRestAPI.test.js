const XTSInteractive = require('./interactiveRestAPI');
const request = require('./request');
const logger = require('./logger');
const CustomError = require('./customError');
const config = require('./config/app/config.json');
const settings = require('./config/app/settings.json');

// Mock console methods for cleaner test output
let consoleInfoSpy, consoleErrorSpy;

// Mock dependencies
jest.mock('./request', () => ({
    processRequest: jest.fn(),
}));

jest.mock('./logger', () => ({
    logFile: jest.fn(),
    // Assuming logger.init may also be called or relevant, mock if necessary
}));

// Mock CustomError to check instantiation, not its internal logic here
// jest.mock('./customError'); // Optional: if we want to assert it's new-ed up

describe('XTSInteractive', () => {
    const testUrl = 'http://test-api.com';
    let xtsApi;

    beforeAll(() => {
        consoleInfoSpy = jest.spyOn(console, 'info').mockImplementation(() => {});
        consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterAll(() => {
        consoleInfoSpy.mockRestore();
        consoleErrorSpy.mockRestore();
    });

    beforeEach(() => {
        // Reset mocks before each test
        request.processRequest.mockReset();
        logger.logFile.mockReset();
        // CustomError.mockClear(); // If mocking CustomError constructor

        xtsApi = new XTSInteractive(testUrl);
    });

    describe('Constructor and Properties', () => {
        test('should initialize with provided URL', () => {
            expect(xtsApi.url).toBe(testUrl);
        });

        test('should use default URL if undefined is provided', () => {
            const defaultApi = new XTSInteractive(undefined);
            expect(defaultApi.url).toBe(config.url); // config.url should be the expected default
        });

        test('should initialize responseTypes and isLoggedIn', () => {
            expect(xtsApi.responseTypes).toEqual({ success: "success", failure: "failure" });
            expect(xtsApi.isLoggedIn).toBe(false);
        });

        // Test basic getters and setters
        const properties = ['token', 'userID', 'source', 'enums'];
        properties.forEach(prop => {
            test(`should set and get ${prop}`, () => {
                const value = `${prop}Value`;
                xtsApi[prop] = value;
                expect(xtsApi[prop]).toBe(value);
            });
        });
    });

    describe('logIn()', () => {
        const loginCredentials = {
            userID: 'testUser',
            password: 'testPass',
            publicKey: 'testKey',
            source: 'testSource'
        };
        const mockLoginSuccessResponse = {
            result: {
                token: 'mockToken',
                enums: { key: 'value' },
                clientCodes: ['C001'],
                isInvestorClient: false
            },
            type : "success", // Assuming a type field in the response
        };

        beforeEach(() => {
            // Spy on populateEnums before each test in this suite
            jest.spyOn(xtsApi, 'populateEnums').mockImplementation(() => {});
        });

        afterEach(() => {
            // Restore the spy after each test
            xtsApi.populateEnums.mockRestore();
        });

        test('should call processRequest with correct params and set properties on success', async () => {
            request.processRequest.mockResolvedValue(mockLoginSuccessResponse);

            const response = await xtsApi.logIn(loginCredentials);

            expect(request.processRequest).toHaveBeenCalledWith(
                "POST",
                testUrl + settings.restApi.session,
                {},
                loginCredentials
            );
            expect(xtsApi.userID).toBe(loginCredentials.userID);
            expect(xtsApi.source).toBe(loginCredentials.source);
            expect(xtsApi.token).toBe(mockLoginSuccessResponse.result.token);
            expect(xtsApi.enums).toEqual(mockLoginSuccessResponse.result.enums);
            expect(xtsApi.clientCodes).toEqual(mockLoginSuccessResponse.result.clientCodes);
            expect(xtsApi.isInvestorClient).toBe(mockLoginSuccessResponse.result.isInvestorClient);
            expect(xtsApi.isLoggedIn).toBe(true);
            expect(xtsApi.populateEnums).toHaveBeenCalledWith(mockLoginSuccessResponse.result.enums);
            expect(response).toEqual(mockLoginSuccessResponse);
        });

        test('should return CustomError if processRequest rejects', async () => {
            const mockError = { message: 'Login failed', statusCode: 401 };
            request.processRequest.mockRejectedValue(mockError);
            const response = await xtsApi.logIn(loginCredentials);
            expect(request.processRequest).toHaveBeenCalledTimes(1);
            expect(response).toBeInstanceOf(CustomError);
            expect(xtsApi.isLoggedIn).toBe(false);
            expect(xtsApi.token).toBeUndefined();
            expect(xtsApi.populateEnums).not.toHaveBeenCalled();
        });

        test('should return CustomError if processRequest returns an API error structure', async () => {
            const mockError = { message: 'API error during login', statusCode: 500 };
            request.processRequest.mockRejectedValue(mockError);
            const response = await xtsApi.logIn(loginCredentials);
            expect(response).toBeInstanceOf(CustomError);
        });
    });

    describe('logOut()', () => {
        const mockLogoutSuccessResponse = { type: "success", message: "Logged out successfully" };

        test('should call processRequest with DELETE and auth header on success', async () => {
            // Setup for logged-in state
            xtsApi.isLoggedIn = true;
            xtsApi.token = 'mockToken';
            request.processRequest.mockResolvedValue(mockLogoutSuccessResponse);

            const response = await xtsApi.logOut();

            expect(request.processRequest).toHaveBeenCalledWith(
                "DELETE",
                testUrl + settings.restApi.session,
                { 'authorization': 'mockToken' },
                null
            );
            expect(response).toEqual(mockLogoutSuccessResponse);
        });

        test('should return CustomError if processRequest rejects', async () => {
            xtsApi.isLoggedIn = true;
            xtsApi.token = 'mockToken';
            const mockError = { message: 'Logout API failed', statusCode: 500 };
            request.processRequest.mockRejectedValue(mockError);
            const response = await xtsApi.logOut();
            expect(request.processRequest).toHaveBeenCalledTimes(1);
            expect(response).toBeInstanceOf(CustomError);
        });

        test('should return CustomError with "User is not Logged In" if not logged in', async () => {
            xtsApi.isLoggedIn = false;
            const response = await xtsApi.logOut();
            expect(request.processRequest).not.toHaveBeenCalled();
            expect(response).toBeInstanceOf(CustomError);
        });
    });

    describe('getProfile()', () => {
        const mockProfileSuccessResponse = { result: { name: 'Test User', email: 'test@example.com' } };

        beforeEach(() => {
            // Most getProfile tests require login
            xtsApi.isLoggedIn = true;
            xtsApi.token = 'mockToken';
        });

        test('should call processRequest without clientID if reqObject is null', async () => {
            request.processRequest.mockResolvedValue(mockProfileSuccessResponse);
            const response = await xtsApi.getProfile(null);

            expect(request.processRequest).toHaveBeenCalledWith(
                "GET",
                testUrl + settings.restApi.profile,
                { 'authorization': 'mockToken' },
                null
            );
            expect(response).toEqual(mockProfileSuccessResponse);
        });

        test('should call processRequest with clientID if reqObject is provided', async () => {
            request.processRequest.mockResolvedValue(mockProfileSuccessResponse);
            const clientID = 'client123';
            const response = await xtsApi.getProfile({ clientID: clientID });

            expect(request.processRequest).toHaveBeenCalledWith(
                "GET",
                testUrl + settings.restApi.profile + "?clientID=" + clientID,
                { 'authorization': 'mockToken' },
                null
            );
            expect(response).toEqual(mockProfileSuccessResponse);
        });

        test('should return CustomError if processRequest rejects', async () => {
            const mockError = { message: 'GetProfile API failed', statusCode: 500 };
            request.processRequest.mockRejectedValue(mockError);
            const response = await xtsApi.getProfile(null);
            expect(response).toBeInstanceOf(CustomError);
        });

        test('should return CustomError if not logged in', async () => {
            xtsApi.isLoggedIn = false;
            const response = await xtsApi.getProfile(null);
            expect(request.processRequest).not.toHaveBeenCalled();
            expect(response).toBeInstanceOf(CustomError);
        });
    });

    describe('getBalance()', () => {
        const mockBalanceSuccessResponse = { result: { balance: 10000, currency: 'USD' } };

        beforeEach(() => {
            xtsApi.isLoggedIn = true;
            xtsApi.token = 'mockToken';
        });

        test('should call processRequest without clientID if reqObject is null', async () => {
            request.processRequest.mockResolvedValue(mockBalanceSuccessResponse);
            const response = await xtsApi.getBalance(null);

            expect(request.processRequest).toHaveBeenCalledWith(
                "GET",
                testUrl + settings.restApi.balance,
                { 'authorization': 'mockToken' },
                null
            );
            expect(response).toEqual(mockBalanceSuccessResponse);
        });

        test('should call processRequest with clientID if reqObject is provided', async () => {
            request.processRequest.mockResolvedValue(mockBalanceSuccessResponse);
            const clientID = 'client123';
            const response = await xtsApi.getBalance({ clientID: clientID });

            expect(request.processRequest).toHaveBeenCalledWith(
                "GET",
                testUrl + settings.restApi.balance + "?clientID=" + clientID,
                { 'authorization': 'mockToken' },
                null
            );
            expect(response).toEqual(mockBalanceSuccessResponse);
        });

        test('should return CustomError if processRequest rejects', async () => {
            const mockError = { message: 'GetBalance API failed', statusCode: 500 };
            request.processRequest.mockRejectedValue(mockError);
            const response = await xtsApi.getBalance(null);
            expect(response).toBeInstanceOf(CustomError);
        });

        test('should return CustomError if not logged in', async () => {
            xtsApi.isLoggedIn = false;
            const response = await xtsApi.getBalance(null);
            expect(request.processRequest).not.toHaveBeenCalled();
            expect(response).toBeInstanceOf(CustomError);
        });
    });

    describe('getHoldings()', () => {
        const mockHoldingsSuccessResponse = { result: { holdings: [{ symbol: 'AAPL', quantity: 100 }] } };

        beforeEach(() => {
            xtsApi.isLoggedIn = true;
            xtsApi.token = 'mockToken';
        });

        test('should call processRequest without clientID if reqObject is null', async () => {
            request.processRequest.mockResolvedValue(mockHoldingsSuccessResponse);
            const response = await xtsApi.getHoldings(null);
            expect(request.processRequest).toHaveBeenCalledWith("GET", testUrl + settings.restApi.holding, { 'authorization': 'mockToken' }, null);
            expect(response).toEqual(mockHoldingsSuccessResponse);
        });

        test('should call processRequest with clientID if reqObject is provided', async () => {
            request.processRequest.mockResolvedValue(mockHoldingsSuccessResponse);
            const clientID = 'client123';
            const response = await xtsApi.getHoldings({ clientID: clientID });
            expect(request.processRequest).toHaveBeenCalledWith("GET", testUrl + settings.restApi.holding + "?clientID=" + clientID, { 'authorization': 'mockToken' }, null);
            expect(response).toEqual(mockHoldingsSuccessResponse);
        });

        test('should return CustomError if processRequest rejects', async () => {
            const mockError = { message: 'GetHoldings API failed', statusCode: 500 };
            request.processRequest.mockRejectedValue(mockError);
            const response = await xtsApi.getHoldings(null);
            expect(response).toBeInstanceOf(CustomError);
        });

        test('should return CustomError if not logged in', async () => {
            xtsApi.isLoggedIn = false;
            const response = await xtsApi.getHoldings(null);
            expect(request.processRequest).not.toHaveBeenCalled();
            expect(response).toBeInstanceOf(CustomError);
        });
    });
    
    describe('getPositions()', () => {
        const mockPositionsSuccessResponse = { result: { positions: [{ symbol: 'MSFT', netQuantity: 50 }] } };

        beforeEach(() => {
            xtsApi.isLoggedIn = true;
            xtsApi.token = 'mockToken';
        });

        test('should call processRequest with correct dayOrNet and clientID variations', async () => {
            // Test case 1: dayOrNet='DayWise', no clientID
            request.processRequest.mockResolvedValue(mockPositionsSuccessResponse);
            let response = await xtsApi.getPositions({ dayOrNet: 'DayWise' });
            expect(request.processRequest).toHaveBeenCalledWith("GET", testUrl + settings.restApi.position + "?dayOrNet=DayWise", { 'authorization': 'mockToken' }, null);
            expect(response).toEqual(mockPositionsSuccessResponse);
            request.processRequest.mockReset();

            // Test case 2: dayOrNet='NetWise', with clientID
            request.processRequest.mockResolvedValue(mockPositionsSuccessResponse);
            const clientID = 'client456';
            response = await xtsApi.getPositions({ dayOrNet: 'NetWise', clientID: clientID });
            expect(request.processRequest).toHaveBeenCalledWith("GET", testUrl + settings.restApi.position + "?dayOrNet=NetWise&clientID=" + clientID, { 'authorization': 'mockToken' }, null);
            expect(response).toEqual(mockPositionsSuccessResponse);
        });
        
        test('should default to dayOrNet=\'DayWise\' if not provided', async () => {
            request.processRequest.mockResolvedValue(mockPositionsSuccessResponse);
            await xtsApi.getPositions(null); // reqObject is null
            expect(request.processRequest).toHaveBeenCalledWith("GET", testUrl + settings.restApi.position + "?dayOrNet=DayWise", { 'authorization': 'mockToken' }, null);
            request.processRequest.mockReset();

            await xtsApi.getPositions({}); // reqObject is empty
            expect(request.processRequest).toHaveBeenCalledWith("GET", testUrl + settings.restApi.position + "?dayOrNet=DayWise", { 'authorization': 'mockToken' }, null);
        });

        test('should return CustomError if processRequest rejects', async () => {
            const mockError = { message: 'GetPositions API failed', statusCode: 500 };
            request.processRequest.mockRejectedValue(mockError);
            const response = await xtsApi.getPositions({ dayOrNet: 'DayWise' });
            expect(response).toBeInstanceOf(CustomError);
        });

        test('should return CustomError if not logged in', async () => {
            xtsApi.isLoggedIn = false;
            const response = await xtsApi.getPositions({ dayOrNet: 'DayWise' });
            expect(request.processRequest).not.toHaveBeenCalled();
            expect(response).toBeInstanceOf(CustomError);
        });
    });

    describe('positionConversion()', () => {
        const mockReqObject = {
            appOrderID: '12345',
            executionID: 'exec678',
            oldProductType: 'MIS',
            newProductType: 'NRML'
        };
        const mockSuccessResponse = { type: 'success', result: { message: 'Position converted successfully' } };

        beforeEach(() => {
            xtsApi.isLoggedIn = true;
            xtsApi.token = 'mockToken';
        });

        test('should call processRequest with PUT, auth header, and reqObject on success', async () => {
            request.processRequest.mockResolvedValue(mockSuccessResponse);
            const response = await xtsApi.positionConversion(mockReqObject);

            expect(request.processRequest).toHaveBeenCalledWith(
                "PUT",
                testUrl + settings.restApi.convert,
                { 'authorization': 'mockToken' },
                mockReqObject
            );
            expect(response).toEqual(mockSuccessResponse);
        });

        test('should return CustomError if processRequest rejects', async () => {
            const mockApiError = { message: 'Position conversion failed', statusCode: 400 };
            request.processRequest.mockRejectedValue(mockApiError);
            const response = await xtsApi.positionConversion(mockReqObject);

            expect(response).toBeInstanceOf(CustomError);
            // The actual message/statusCode will be from the CustomError instance based on mockApiError
            expect(response.message).toBe(mockApiError.message);
            expect(response.statusCode).toBe(mockApiError.statusCode);
        });

        test('should return CustomError if not logged in', async () => {
            xtsApi.isLoggedIn = false;
            const response = await xtsApi.positionConversion(mockReqObject);

            expect(request.processRequest).not.toHaveBeenCalled();
            expect(response).toBeInstanceOf(CustomError);
            expect(response.message).toBe('Login is Required'); 
            expect(response.statusCode).toBe(404); // Corrected status code
        });
    });

    describe('squareOff()', () => {
        const mockReqObject = {
            exchangeSegment: "NSECM",
            exchangeInstrumentID: 22,
            productType: "NRML",
            squareoffMode: "DayWise",
            positionSquareOffQuantityType: "ExactQty",
            squareOffQtyValue: 5
        };
        const mockSuccessResponse = { type: 'success', result: { message: 'Squared off successfully' } };

        beforeEach(() => {
            xtsApi.isLoggedIn = true;
            xtsApi.token = 'mockToken';
        });

        test('should call processRequest with PUT, auth header, and reqObject on success', async () => {
            request.processRequest.mockResolvedValue(mockSuccessResponse);
            const response = await xtsApi.squareOff(mockReqObject);

            expect(request.processRequest).toHaveBeenCalledWith(
                "PUT",
                testUrl + settings.restApi.squareoff,
                { 'authorization': 'mockToken' },
                mockReqObject
            );
            expect(response).toEqual(mockSuccessResponse);
        });

        test('should return CustomError if processRequest rejects', async () => {
            const mockApiError = { message: 'Square off failed', statusCode: 400 };
            request.processRequest.mockRejectedValue(mockApiError);
            const response = await xtsApi.squareOff(mockReqObject);

            expect(response).toBeInstanceOf(CustomError);
            expect(response.message).toBe(mockApiError.message);
            expect(response.statusCode).toBe(mockApiError.statusCode);
        });

        test('should return CustomError if not logged in', async () => {
            xtsApi.isLoggedIn = false;
            const response = await xtsApi.squareOff(mockReqObject);

            expect(request.processRequest).not.toHaveBeenCalled();
            expect(response).toBeInstanceOf(CustomError);
            expect(response.message).toBe('Login is Required');
            expect(response.statusCode).toBe(404); // Corrected status code
        });
    });

    describe('placeOrder()', () => {
        const mockReqObject = {
            exchangeSegment: "NSECM",
            exchangeInstrumentID: 22,
            productType: "MIS",
            orderType: "LIMIT",
            orderSide: "BUY",
            timeInForce: "DAY",
            disclosedQuantity: 0,
            orderQuantity: 20,
            limitPrice: 1500.00,
            stopPrice: 1600.00,
            orderUniqueIdentifier: "454845"
        };
        const mockSuccessResponse = { type: 'success', result: { AppOrderID: 'order123' } };

        beforeEach(() => {
            xtsApi.isLoggedIn = true;
            xtsApi.token = 'mockToken';
        });

        test('should call processRequest with POST, auth header, and reqObject on success', async () => {
            request.processRequest.mockResolvedValue(mockSuccessResponse);
            const response = await xtsApi.placeOrder(mockReqObject);

            expect(request.processRequest).toHaveBeenCalledWith(
                "POST",
                testUrl + settings.restApi.orders,
                { 'authorization': 'mockToken' },
                mockReqObject
            );
            expect(response).toEqual(mockSuccessResponse);
        });

        test('should return CustomError if processRequest rejects', async () => {
            const mockApiError = { message: 'Place order failed', statusCode: 400 };
            request.processRequest.mockRejectedValue(mockApiError);
            const response = await xtsApi.placeOrder(mockReqObject);

            expect(response).toBeInstanceOf(CustomError);
            expect(response.message).toBe(mockApiError.message);
            expect(response.statusCode).toBe(mockApiError.statusCode);
        });

        test('should return CustomError if not logged in', async () => {
            xtsApi.isLoggedIn = false;
            const response = await xtsApi.placeOrder(mockReqObject);

            expect(request.processRequest).not.toHaveBeenCalled();
            expect(response).toBeInstanceOf(CustomError);
            expect(response.message).toBe('Login is Required');
            expect(response.statusCode).toBe(404); // Corrected status code
        });
    });

    describe('modifyOrder()', () => {
        const mockReqObject = {
            appOrderID: 1991237756,
            modifiedProductType: "NRML",
            modifiedOrderType: "LIMIT",
            modifiedOrderQuantity: 100,
            modifiedDisclosedQuantity: 0,
            modifiedLimitPrice: 300,
            modifiedStopPrice: 300,
            modifiedTimeInForce: "DAY",
            orderUniqueIdentifier: "5656",
            clientID: "testClient" // Assuming checkClientCodes might need this
        };
        const mockSuccessResponse = { type: 'success', result: { AppOrderID: 'order123' } };
        let checkClientCodesSpy;

        beforeEach(() => {
            xtsApi.isLoggedIn = true;
            xtsApi.token = 'mockToken';
            // Spy on checkClientCodes, assume it resolves if clientID is present or not needed for investor clients
            checkClientCodesSpy = jest.spyOn(xtsApi, 'checkClientCodes').mockResolvedValue(true);
        });

        afterEach(() => {
            checkClientCodesSpy.mockRestore();
        });

        test('should call checkClientCodes, then processRequest with PUT on success', async () => {
            request.processRequest.mockResolvedValue(mockSuccessResponse);
            const response = await xtsApi.modifyOrder(mockReqObject);

            expect(checkClientCodesSpy).toHaveBeenCalledWith(mockReqObject);
            expect(request.processRequest).toHaveBeenCalledWith(
                "PUT",
                testUrl + settings.restApi.orders,
                { 'authorization': 'mockToken' },
                mockReqObject
            );
            expect(response).toEqual(mockSuccessResponse);
        });

        test('should return CustomError if checkClientCodes rejects', async () => {
            const clientCodeErrorMsg = 'ClientCode is Required';
            const clientCodeErrorStatus = 400;
            checkClientCodesSpy.mockRejectedValue(new CustomError(clientCodeErrorMsg, undefined, clientCodeErrorStatus));
            
            const response = await xtsApi.modifyOrder(mockReqObject);
            expect(response).toBeInstanceOf(CustomError);
            expect(response.message).toBe(clientCodeErrorMsg);
            expect(response.statusCode).toBe(clientCodeErrorStatus);
            expect(request.processRequest).not.toHaveBeenCalled();
        });

        test('should return CustomError if processRequest rejects', async () => {
            const mockApiError = { message: 'Modify order failed', statusCode: 400 };
            request.processRequest.mockRejectedValue(mockApiError);
            const response = await xtsApi.modifyOrder(mockReqObject);

            expect(response).toBeInstanceOf(CustomError);
            expect(response.message).toBe(mockApiError.message);
            expect(response.statusCode).toBe(mockApiError.statusCode);
        });

        test('should return CustomError if not logged in', async () => {
            xtsApi.isLoggedIn = false;
            const response = await xtsApi.modifyOrder(mockReqObject);

            expect(checkClientCodesSpy).not.toHaveBeenCalled();
            expect(request.processRequest).not.toHaveBeenCalled();
            expect(response).toBeInstanceOf(CustomError);
            expect(response.message).toBe('Login is Required');
            expect(response.statusCode).toBe(404); // Corrected status code
        });
    });

    describe('cancelOrder()', () => {
        const mockReqObject = {
            appOrderID: '1828071433',
            orderUniqueIdentifier: '155151',
            clientID: 'testClient'
        };
        const mockSuccessResponse = { type: 'success', result: { message: 'Order cancelled' } };
        // Calculate expected query string using URLSearchParams for verification
        const expectedQueryString = new URLSearchParams(mockReqObject).toString();
        let checkClientCodesSpy;

        beforeEach(() => {
            xtsApi.isLoggedIn = true;
            xtsApi.token = 'mockToken';
            checkClientCodesSpy = jest.spyOn(xtsApi, 'checkClientCodes').mockResolvedValue(true);
        });

        afterEach(() => {
            checkClientCodesSpy.mockRestore();
        });

        test('should call checkClientCodes, then processRequest with DELETE and correct query string on success', async () => {
            request.processRequest.mockResolvedValue(mockSuccessResponse);
            const response = await xtsApi.cancelOrder(mockReqObject);

            expect(checkClientCodesSpy).toHaveBeenCalledWith(mockReqObject);
            expect(request.processRequest).toHaveBeenCalledWith(
                "DELETE",
                testUrl + settings.restApi.orders + "?" + expectedQueryString, // Use dynamically generated expected query string
                { 'authorization': 'mockToken' },
                null
            );
            expect(response).toEqual(mockSuccessResponse);
        });

        test('should return CustomError if checkClientCodes rejects', async () => {
            const clientCodeErrorMsg = 'ClientCode is Required';
            const clientCodeErrorStatus = 400;
            checkClientCodesSpy.mockRejectedValue(new CustomError(clientCodeErrorMsg, undefined, clientCodeErrorStatus)); 
            
            const response = await xtsApi.cancelOrder(mockReqObject);
            expect(response).toBeInstanceOf(CustomError);
            expect(response.message).toBe(clientCodeErrorMsg);
            expect(response.statusCode).toBe(clientCodeErrorStatus);
            expect(request.processRequest).not.toHaveBeenCalled();
        });

        test('should return CustomError if processRequest rejects', async () => {
            const mockApiError = { message: 'Cancel order failed', statusCode: 400 };
            request.processRequest.mockRejectedValue(mockApiError);
            const response = await xtsApi.cancelOrder(mockReqObject);

            expect(response).toBeInstanceOf(CustomError);
            expect(response.message).toBe(mockApiError.message);
        });

        test('should return CustomError if not logged in', async () => {
            xtsApi.isLoggedIn = false;
            const response = await xtsApi.cancelOrder(mockReqObject);

            expect(checkClientCodesSpy).not.toHaveBeenCalled();
            expect(request.processRequest).not.toHaveBeenCalled();
            expect(response).toBeInstanceOf(CustomError);
            expect(response.message).toBe('Login is Required');
            expect(response.statusCode).toBe(404); // Corrected status code
        });
    });

    describe('placeCoverOrder()', () => {
        const mockReqObject = {
            exchangeSegment: "NSECM",
            exchangeInstrumentID: 22,
            orderSide: "BUY",
            orderQuantity: 2,
            disclosedQuantity: 2,
            limitPrice: 2054,
            stopPrice: 2054,
            orderUniqueIdentifier: "454845"
        };
        const mockSuccessResponse = { type: 'success', result: { AppOrderID: 'coverOrder123' } };

        beforeEach(() => {
            xtsApi.isLoggedIn = true;
            xtsApi.token = 'mockToken';
        });

        test('should call processRequest with POST, auth header, and reqObject on success', async () => {
            request.processRequest.mockResolvedValue(mockSuccessResponse);
            const response = await xtsApi.placeCoverOrder(mockReqObject);

            expect(request.processRequest).toHaveBeenCalledWith(
                "POST",
                testUrl + settings.restApi.cover,
                { 'authorization': 'mockToken' },
                mockReqObject
            );
            expect(response).toEqual(mockSuccessResponse);
        });

        test('should return CustomError if processRequest rejects', async () => {
            const mockApiError = { message: 'Place cover order failed', statusCode: 400 };
            request.processRequest.mockRejectedValue(mockApiError);
            const response = await xtsApi.placeCoverOrder(mockReqObject);

            expect(response).toBeInstanceOf(CustomError);
            expect(response.message).toBe(mockApiError.message);
            expect(response.statusCode).toBe(mockApiError.statusCode);
        });

        test('should return CustomError if not logged in', async () => {
            xtsApi.isLoggedIn = false;
            const response = await xtsApi.placeCoverOrder(mockReqObject);

            expect(request.processRequest).not.toHaveBeenCalled();
            expect(response).toBeInstanceOf(CustomError);
            expect(response.message).toBe('Login is Required');
            expect(response.statusCode).toBe(404);
        });
    });

    describe('exitCoverOrder()', () => {
        const mockReqObject = { appOrderID: "2426016103" };
        const mockSuccessResponse = { type: 'success', result: { message: 'Cover order exited' } };

        beforeEach(() => {
            xtsApi.isLoggedIn = true;
            xtsApi.token = 'mockToken';
        });

        test('should call processRequest with PUT, auth header, and appOrderID in query on success', async () => {
            request.processRequest.mockResolvedValue(mockSuccessResponse);
            const response = await xtsApi.exitCoverOrder(mockReqObject);

            expect(request.processRequest).toHaveBeenCalledWith(
                "PUT",
                testUrl + settings.restApi.cover + "?appOrderID=" + mockReqObject.appOrderID,
                { 'authorization': 'mockToken' },
                null
            );
            expect(response).toEqual(mockSuccessResponse);
        });

        test('should return CustomError if processRequest rejects', async () => {
            const mockApiError = { message: 'Exit cover order failed', statusCode: 400 };
            request.processRequest.mockRejectedValue(mockApiError);
            const response = await xtsApi.exitCoverOrder(mockReqObject);

            expect(response).toBeInstanceOf(CustomError);
            expect(response.message).toBe(mockApiError.message);
            expect(response.statusCode).toBe(mockApiError.statusCode);
        });

        test('should return CustomError if not logged in', async () => {
            xtsApi.isLoggedIn = false;
            const response = await xtsApi.exitCoverOrder(mockReqObject);

            expect(request.processRequest).not.toHaveBeenCalled();
            expect(response).toBeInstanceOf(CustomError);
            expect(response.message).toBe('Login is Required');
            expect(response.statusCode).toBe(404);
        });
    });

    describe('getOrderBook()', () => {
        const mockSuccessResponse = { type: 'success', result: [{ order: 'details1' }, { order: 'details2' }] };
        let checkClientCodesSpy;

        beforeEach(() => {
            xtsApi.isLoggedIn = true;
            xtsApi.token = 'mockToken';
            checkClientCodesSpy = jest.spyOn(xtsApi, 'checkClientCodes').mockResolvedValue(true);
        });
        
        afterEach(() => {
            checkClientCodesSpy.mockRestore();
        });

        test('should call checkClientCodes, then processRequest with GET and auth header on success', async () => {
            request.processRequest.mockResolvedValue(mockSuccessResponse);
            const mockReqObject = { clientID: 'testClient' }; // Optional, for checkClientCodes
            const response = await xtsApi.getOrderBook(mockReqObject);

            expect(checkClientCodesSpy).toHaveBeenCalledWith(mockReqObject);
            expect(request.processRequest).toHaveBeenCalledWith(
                "GET",
                testUrl + settings.restApi.orders,
                { 'authorization': 'mockToken' },
                null
            );
            expect(response).toEqual(mockSuccessResponse);
        });
        
        test('should call processRequest even if reqObject is null (for investor clients)', async () => {
            request.processRequest.mockResolvedValue(mockSuccessResponse);
            await xtsApi.getOrderBook(null);
            expect(checkClientCodesSpy).toHaveBeenCalledWith(null);
            expect(request.processRequest).toHaveBeenCalledWith(
                "GET",
                testUrl + settings.restApi.orders,
                { 'authorization': 'mockToken' },
                null
            );
        });

        test('should return CustomError if checkClientCodes rejects', async () => {
            const clientCodeErrorMsg = 'ClientCode is Required';
            const clientCodeErrorStatus = 400;
            checkClientCodesSpy.mockRejectedValue(new CustomError(clientCodeErrorMsg, undefined, clientCodeErrorStatus));
            const mockReqObject = { clientID: 'testClient' }; 
            
            const response = await xtsApi.getOrderBook(mockReqObject);
            expect(response).toBeInstanceOf(CustomError);
            expect(response.message).toBe(clientCodeErrorMsg);
            expect(response.statusCode).toBe(clientCodeErrorStatus);
            expect(request.processRequest).not.toHaveBeenCalled();
        });

        test('should return CustomError if processRequest rejects', async () => {
            const mockApiError = { message: 'Get order book failed', statusCode: 500 };
            request.processRequest.mockRejectedValue(mockApiError);
            const response = await xtsApi.getOrderBook(null);

            expect(response).toBeInstanceOf(CustomError);
            expect(response.message).toBe(mockApiError.message);
        });

        test('should return CustomError if not logged in', async () => {
            xtsApi.isLoggedIn = false;
            const response = await xtsApi.getOrderBook(null);

            expect(checkClientCodesSpy).not.toHaveBeenCalled();
            expect(request.processRequest).not.toHaveBeenCalled();
            expect(response).toBeInstanceOf(CustomError);
            expect(response.message).toBe('Login is Required');
            expect(response.statusCode).toBe(404);
        });
    });

    describe('getTradeBook()', () => {
        const mockSuccessResponse = { type: 'success', result: [{ trade: 'details1' }, { trade: 'details2' }] };
        let checkClientCodesSpy;

        beforeEach(() => {
            xtsApi.isLoggedIn = true;
            xtsApi.token = 'mockToken';
            checkClientCodesSpy = jest.spyOn(xtsApi, 'checkClientCodes').mockResolvedValue(true);
        });

        afterEach(() => {
            checkClientCodesSpy.mockRestore();
        });

        test('should call checkClientCodes, then processRequest with GET and auth header on success', async () => {
            request.processRequest.mockResolvedValue(mockSuccessResponse);
            const mockReqObject = { clientID: 'testClient' }; // Optional, for checkClientCodes
            const response = await xtsApi.getTradeBook(mockReqObject);

            expect(checkClientCodesSpy).toHaveBeenCalledWith(mockReqObject);
            expect(request.processRequest).toHaveBeenCalledWith(
                "GET",
                testUrl + settings.restApi.trade,
                { 'authorization': 'mockToken' },
                null
            );
            expect(response).toEqual(mockSuccessResponse);
        });

        test('should call processRequest even if reqObject is null (for investor clients)', async () => {
            request.processRequest.mockResolvedValue(mockSuccessResponse);
            await xtsApi.getTradeBook(null);
            expect(checkClientCodesSpy).toHaveBeenCalledWith(null);
            expect(request.processRequest).toHaveBeenCalledWith(
                "GET",
                testUrl + settings.restApi.trade,
                { 'authorization': 'mockToken' },
                null
            );
        });
        
        test('should return CustomError if checkClientCodes rejects', async () => {
            const clientCodeErrorMsg = 'ClientCode is Required';
            const clientCodeErrorStatus = 400;
            checkClientCodesSpy.mockRejectedValue(new CustomError(clientCodeErrorMsg, undefined, clientCodeErrorStatus));
            const mockReqObject = { clientID: 'testClient' };
            
            const response = await xtsApi.getTradeBook(mockReqObject);
            expect(response).toBeInstanceOf(CustomError);
            expect(response.message).toBe(clientCodeErrorMsg);
            expect(response.statusCode).toBe(clientCodeErrorStatus);
            expect(request.processRequest).not.toHaveBeenCalled();
        });

        test('should return CustomError if processRequest rejects', async () => {
            const mockApiError = { message: 'Get trade book failed', statusCode: 500 };
            request.processRequest.mockRejectedValue(mockApiError);
            const response = await xtsApi.getTradeBook(null);

            expect(response).toBeInstanceOf(CustomError);
            expect(response.message).toBe(mockApiError.message);
        });

        test('should return CustomError if not logged in', async () => {
            xtsApi.isLoggedIn = false;
            const response = await xtsApi.getTradeBook(null);

            expect(checkClientCodesSpy).not.toHaveBeenCalled();
            expect(request.processRequest).not.toHaveBeenCalled();
            expect(response).toBeInstanceOf(CustomError);
            expect(response.message).toBe('Login is Required');
            expect(response.statusCode).toBe(404);
        });
    });

    describe('getOrderHistory()', () => {
        const mockAppOrderID = 'order12345';
        const mockSuccessResponse = { type: 'success', result: [{ status: 'FILLED' }, { status: 'PARTIALLY_FILLED' }] };

        beforeEach(() => {
            xtsApi.isLoggedIn = true;
            xtsApi.token = 'mockToken';
        });

        test('should call processRequest with GET, auth header, and appOrderID in query on success', async () => {
            request.processRequest.mockResolvedValue(mockSuccessResponse);
            const response = await xtsApi.getOrderHistory(mockAppOrderID);

            expect(request.processRequest).toHaveBeenCalledWith(
                "GET",
                testUrl + settings.restApi.orderHistory + "/" + mockAppOrderID,
                { 'authorization': 'mockToken' },
                null
            );
            expect(response).toEqual(mockSuccessResponse);
        });

        test('should return CustomError if processRequest rejects', async () => {
            const mockApiError = { message: 'Get order history failed', statusCode: 500 };
            request.processRequest.mockRejectedValue(mockApiError);
            const response = await xtsApi.getOrderHistory(mockAppOrderID);

            expect(response).toBeInstanceOf(CustomError);
            expect(response.message).toBe(mockApiError.message);
        });

        test('should return CustomError if not logged in', async () => {
            xtsApi.isLoggedIn = false;
            const response = await xtsApi.getOrderHistory(mockAppOrderID);

            expect(request.processRequest).not.toHaveBeenCalled();
            expect(response).toBeInstanceOf(CustomError);
            expect(response.message).toBe('Login is Required');
            expect(response.statusCode).toBe(404);
        });
    });
    
    describe('loginWithToken()', () => {
        const userID = 'testUserWithToken';
        const token = 'preExistingToken';
        const source = 'testSourceToken'; 
        const mockEnumsData = { enumKey: 'enumValue' };
        const mockClientCodes = ['C002'];
        const mockIsInvestorClient = true;
        
        // This response is for the single call to /user/enums
        const mockEnumsApiSuccessResponse = {
            type: "success",
            result: {
                enums: mockEnumsData,
                clientCodes: mockClientCodes,
                isInvestorClient: mockIsInvestorClient,
                userID: userID 
            }
        };

        beforeEach(() => {
            xtsApi.source = source; 
            jest.spyOn(xtsApi, 'populateEnums').mockImplementation(() => {});
        });

        afterEach(() => {
            xtsApi.populateEnums.mockRestore();
        });

        test('should set properties and call populateEnums on successful token login', async () => {
            request.processRequest.mockResolvedValueOnce(mockEnumsApiSuccessResponse);

            const result = await xtsApi.loginWithToken(userID, token);

            expect(xtsApi.userID).toBe(userID);
            expect(xtsApi.token).toBe(token);
            expect(xtsApi.isLoggedIn).toBe(true);
            expect(xtsApi.source).toBe(source);

            expect(request.processRequest).toHaveBeenCalledWith(
                "GET",
                testUrl + settings.restApi.enums + "?userID=" + userID,
                { 'authorization': token }, 
                null
            );
            
            expect(xtsApi.enums).toEqual(mockEnumsData);
            expect(xtsApi.clientCodes).toEqual(mockClientCodes);
            expect(xtsApi.isInvestorClient).toBe(mockIsInvestorClient);
            expect(xtsApi.populateEnums).toHaveBeenCalledWith(mockEnumsData);
            expect(result).toEqual(mockEnumsApiSuccessResponse); 
        });

        test('should return CustomError if the API call fails during token login', async () => {
            const mockError = { message: 'Enums API call with token failed', statusCode: 401 };
            request.processRequest.mockRejectedValueOnce(mockError); 

            const result = await xtsApi.loginWithToken(userID, token);

            expect(result).toBeInstanceOf(CustomError);
            expect(result.message).toBe(mockError.message);
            expect(result.statusCode).toBe(mockError.statusCode);
            expect(xtsApi.isLoggedIn).toBe(false);
            expect(xtsApi.populateEnums).not.toHaveBeenCalled();
        });
    });

    // Test suites for each public method will follow (e.g., logIn, logOut, getProfile, etc.)

}); 