const XTSEmitter = require('./interactiveSocket');
const socketIoClient = require('socket.io-client');
const logger = require('./logger');
const settings = require('./config/app/settings.json'); // Import settings

// Mock console methods
let consoleInfoSpy, consoleErrorSpy;

// Mock socket.io-client
let mockSocketInstance;
const mockSocketOnHandlers = {};

jest.mock('socket.io-client', () => {
    return jest.fn().mockImplementation(() => {
        // Clear handlers for new instance
        for (const key in mockSocketOnHandlers) {
            delete mockSocketOnHandlers[key];
        }
        mockSocketInstance = {
            on: jest.fn((event, handler) => {
                mockSocketOnHandlers[event] = handler;
            }),
            disconnect: jest.fn(),
            // Add other methods if needed by the class, e.g., emit, io
        };
        return mockSocketInstance;
    });
});

// Mock logger
jest.mock('./logger', () => ({
    logFile: jest.fn(),
}));

describe('XTSEmitter', () => {
    const testUrl = 'http://test-server.com';
    const testUserID = 'testUser';
    const testToken = 'testToken';
    let xtsEmitter;

    beforeAll(() => {
        // Suppress console output for these tests
        consoleInfoSpy = jest.spyOn(console, 'info').mockImplementation(() => {});
        consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterAll(() => {
        // Restore console output
        consoleInfoSpy.mockRestore();
        consoleErrorSpy.mockRestore();
    });

    beforeEach(() => {
        // Clear mocks before each test
        socketIoClient.mockClear();
        if (mockSocketInstance) {
            mockSocketInstance.on.mockClear();
            mockSocketInstance.disconnect.mockClear();
        }
        logger.logFile.mockClear();
        xtsEmitter = new XTSEmitter(testUrl);
    });

    describe('Constructor and Properties', () => {
        test('should initialize with provided URL', () => {
            expect(xtsEmitter.url).toBe(testUrl);
        });

        test('should use default URL if undefined is provided', () => {
            const config = require('./config/app/config.json');
            const defaultEmitter = new XTSEmitter(undefined);
            expect(defaultEmitter.url).toBe(config.url);
        });

        test('should initialize socketMD properties', () => {
            expect(xtsEmitter.socketMD.isConnected).toBe(false);
            expect(xtsEmitter.socketMD.socketMarketData).toBeNull();
            expect(xtsEmitter.socketMD.interval).toBeNull();
        });

        test('should set and get token', () => {
            xtsEmitter.token = testToken;
            expect(xtsEmitter.token).toBe(testToken);
        });

        test('should set and get userID', () => {
            xtsEmitter.userID = testUserID;
            expect(xtsEmitter.userID).toBe(testUserID);
        });
    });

    describe('init()', () => {
        beforeEach(() => {
            xtsEmitter.init({ userID: testUserID, token: testToken });
        });

        test('should set userID and token', () => {
            expect(xtsEmitter.userID).toBe(testUserID);
            expect(xtsEmitter.token).toBe(testToken);
        });

        test('should call socketIoClient with correct parameters', () => {
            expect(socketIoClient).toHaveBeenCalledTimes(1);
            expect(socketIoClient).toHaveBeenCalledWith(testUrl, {
                path: "/interactive/socket.io",
                reconnection: false,
                query: { token: testToken, userID: testUserID }
            });
        });

        test('should log initialization', () => {
            expect(logger.logFile).toHaveBeenCalledWith(expect.stringContaining('socket is initialized'));
        });

        test('should disconnect existing socket if one exists before creating new', () => {
            const oldSocketDisconnectMock = jest.fn();
            xtsEmitter.socketMD.socketMarketData = {
                disconnect: oldSocketDisconnectMock,
                on: jest.fn() // Add a mock 'on' to prevent errors if it's accessed
            };
            
            xtsEmitter.init({ userID: 'newUser', token: 'newToken' });
            
            expect(oldSocketDisconnectMock).toHaveBeenCalledTimes(1);
            expect(socketIoClient).toHaveBeenCalledTimes(2); // Called once in beforeEach, once here
        });

        test('should register a "connect" event handler', () => {
            expect(mockSocketInstance.on).toHaveBeenCalledWith('connect', expect.any(Function));
        });
        
        test('should register a "joined" event handler from settings', () => {
            expect(mockSocketInstance.on).toHaveBeenCalledWith(settings.socket.joined, expect.any(Function));
        });

        test('should register a "connect_error" event handler', () => {
            expect(mockSocketInstance.on).toHaveBeenCalledWith('connect_error', expect.any(Function));
        });

        test('should register an "error" event handler', () => {
            expect(mockSocketInstance.on).toHaveBeenCalledWith('error', expect.any(Function));
        });

        test('should register a "disconnect" event handler', () => {
            expect(mockSocketInstance.on).toHaveBeenCalledWith('disconnect', expect.any(Function));
        });
        
        // Test for custom application events
        ['order', 'trade', 'position', 'logout'].forEach(eventKey => {
            test('should register a "' + settings.socket[eventKey] + '" event handler from settings', () => {
                expect(mockSocketInstance.on).toHaveBeenCalledWith(settings.socket[eventKey], expect.any(Function));
            });
        });
    });
    
    describe('Event Handling', () => {
        beforeEach(() => {
            xtsEmitter.init({ userID: testUserID, token: testToken });
        });

        test('should emit "connect" event via eventEmitter when socket receives connect', () => {
            const connectListener = jest.fn();
            xtsEmitter.eventEmitter.on('connect', connectListener);
            // Simulate socket connect event
            mockSocketOnHandlers['connect']('connect data');
            expect(connectListener).toHaveBeenCalledWith('connect data');
            expect(xtsEmitter.socketMD.isConnected).toBe(true);
        });

        test('should emit "joined" event via eventEmitter when socket receives joined', () => {
            const joinedListener = jest.fn();
            xtsEmitter.eventEmitter.on(settings.socket.joined, joinedListener);
            mockSocketOnHandlers[settings.socket.joined]('joined data');
            expect(joinedListener).toHaveBeenCalledWith('joined data');
        });

        test('should emit "error" event via eventEmitter for connect_error', () => {
            const errorListener = jest.fn();
            xtsEmitter.eventEmitter.on('error', errorListener);
            const mockError = { message: 'Connection failed', description: 'details', cause: 'network issue' };
            mockSocketOnHandlers['connect_error'](mockError);
            expect(errorListener).toHaveBeenCalledWith({
                type: 'connect_error',
                message: mockError.message,
                description: mockError.description,
                cause: mockError.cause
            });
        });

        test('should emit "error" event via eventEmitter when socket receives error', () => {
            const errorListener = jest.fn();
            xtsEmitter.eventEmitter.on('error', errorListener);
            mockSocketOnHandlers['error']('generic error data');
            expect(errorListener).toHaveBeenCalledWith('generic error data');
        });

        // Test for custom application events emissions
        const customEvents = ['order', 'trade', 'position', 'logout'];
        customEvents.forEach(eventKey => {
            const eventName = settings.socket[eventKey];
            test(`should emit "${eventName}" event via eventEmitter when socket receives ${eventName}`, () => {
                const listener = jest.fn();
                xtsEmitter.eventEmitter.on(eventName, listener);
                const eventData = `${eventName} data`;
                mockSocketOnHandlers[eventName](eventData);
                expect(listener).toHaveBeenCalledWith(eventData);
            });
        });
    });

    describe('on<EventName> Methods', () => {
        // Test `onConnect`
        test('onConnect should register a callback for the "connect" event', () => {
            const mockCallback = jest.fn();
            xtsEmitter.onConnect(mockCallback);
            xtsEmitter.eventEmitter.emit('connect', 'connectPayload');
            expect(mockCallback).toHaveBeenCalledWith('connectPayload');
        });

        // Test `onJoined`
        test('onJoined should register a callback for the "joined" event', () => {
            const mockCallback = jest.fn();
            xtsEmitter.onJoined(mockCallback);
            xtsEmitter.eventEmitter.emit(settings.socket.joined, 'joinedPayload');
            expect(mockCallback).toHaveBeenCalledWith('joinedPayload');
        });

        // Test `onError`
        test('onError should register a callback for the "error" event', () => {
            const mockCallback = jest.fn();
            xtsEmitter.onError(mockCallback);
            xtsEmitter.eventEmitter.emit('error', 'errorPayload');
            expect(mockCallback).toHaveBeenCalledWith('errorPayload');
        });

        // Test `onDisconnect`
        test('onDisconnect should register a callback for the "disconnect" event', () => {
            const mockCallback = jest.fn();
            xtsEmitter.onDisconnect(mockCallback);
            xtsEmitter.eventEmitter.emit('disconnect', 'disconnectPayload');
            expect(mockCallback).toHaveBeenCalledWith('disconnectPayload');
        });

        // Test custom on<Event> methods
        const customOnMethods = {
            onOrder: settings.socket.order,
            onTrade: settings.socket.trade,
            onPosition: settings.socket.position,
            onLogout: settings.socket.logout
        };

        for (const [methodName, eventName] of Object.entries(customOnMethods)) {
            test(`${methodName} should register a callback for the "${eventName}" event`, () => {
                const mockCallback = jest.fn();
                xtsEmitter[methodName](mockCallback); // Call the method like xtsEmitter.onOrder(mockCallback)
                const payloadObject = { data: `${eventName}Payload` };
                const payloadString = JSON.stringify(payloadObject);
                xtsEmitter.eventEmitter.emit(eventName, payloadString);
                expect(mockCallback).toHaveBeenCalledWith(payloadObject);
            });
        }
    });

    describe('Disconnect and Reconnection Logic', () => {
        beforeAll(() => {
            jest.useFakeTimers();
        });

        afterAll(() => {
            jest.useRealTimers();
        });

        beforeEach(() => {
            // Ensure emitter is initialized and has a socket instance for disconnect tests
            xtsEmitter.init({ userID: testUserID, token: testToken });
        });

        test('should attempt to re-initialize after disconnect event', () => {
            // Spy on init to see if it's called by the interval
            const initSpy = jest.spyOn(xtsEmitter, 'init');
            
            // Simulate a disconnect event
            mockSocketOnHandlers['disconnect']('disconnected by server');

            // Check that isConnected is false
            expect(xtsEmitter.socketMD.isConnected).toBe(false);

            // initSpy should not have been called yet by this test context
            expect(initSpy).toHaveBeenCalledTimes(0);

            jest.advanceTimersByTime(5000);
            
            // init should be called once by the interval callback
            expect(initSpy).toHaveBeenCalledTimes(1);
            expect(initSpy).toHaveBeenLastCalledWith({ userID: testUserID, token: testToken });

            // Restore spy
            initSpy.mockRestore();
        });

        test('should emit "disconnect" event via eventEmitter when socket disconnects', () => {
            const disconnectListener = jest.fn();
            xtsEmitter.eventEmitter.on('disconnect', disconnectListener);
            mockSocketOnHandlers['disconnect']('disconnect data');
            expect(disconnectListener).toHaveBeenCalledWith('disconnect data');
            expect(xtsEmitter.socketMD.isConnected).toBe(false);
        });

        test('should clear interval if connected before interval fires again', () => {
            const clearIntervalSpy = jest.spyOn(global, 'clearInterval');
            // initSpy is to ensure the reconnection init() is NOT called by the interval
            const initSpy = jest.spyOn(xtsEmitter, 'init'); 

            // Simulate disconnect
            mockSocketOnHandlers['disconnect']('disconnect for interval test');
            expect(xtsEmitter.socketMD.isConnected).toBe(false);
            const intervalId = xtsEmitter.socketMD.interval; // Capture the interval ID
            expect(intervalId).not.toBeNull(); // Interval should be set
            
            xtsEmitter.socketMD.isConnected = true; 

            jest.advanceTimersByTime(5000); 

            expect(clearIntervalSpy).toHaveBeenCalledWith(intervalId);
            expect(xtsEmitter.socketMD.interval).toBeNull();
            // initSpy (for the call within setInterval) should not have been called
            expect(initSpy).toHaveBeenCalledTimes(0); 

            clearIntervalSpy.mockRestore();
            initSpy.mockRestore();
        });
    });
}); 