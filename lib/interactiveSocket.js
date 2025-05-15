var socketIoClient = require("socket.io-client");
var settings = require('./config/app/settings.json');
var events = require('events');
var logger = require('./logger');
var config = require('./config/app/config.json');

module.exports = class XTSEmitter {

    /**
     * Constructs an XTSEmitter instance to enable data transfer via socket related events.
     *  
     * @constructor
     *
     * @param {String} url
     *   url parameter is used to connect to the particular server.
     * 
     */
    constructor(url) {

        this.url = url === undefined ? config.url : url;
        this.socketMD = {
            isConnected: false,
            socketMarketData: null,
            interval: null,
        }
        this.eventEmitter = new events.EventEmitter();

    }

    /**
     * set the token value by providing the token in the input
     *
     * @param {string} token
     *  token parameter will be generated after successful login and will be used in other private API's
     *
     */
    set token(token) {
        this._token = token;
    }

    /**
     * Returns the token generated after successful logIn
     *
     *
     * @return
     *   the value of token generated after successful logIn
     */
    get token() {
        return this._token;
    }


    /**
     * set the userID value by providing the userID in the input
     *
     * @param {string} userID
     *  userID for the particular user
     */
    set userID(userID) {
        this._userID = userID;
    }

    /**
     * Returns userID for the particular user
     *
     *
     * @return
     *   the userID for the particular user
     */
    get userID() {
        return this._userID;
    }

    /**
     * set the url value by providing the url in the input
     *
     * @param {string} url
     *  url parameter is used to connect to the particular server.
     */
    set url(url) {
        this._url = url;
    }


    /**
     * Returns url used to connect to the particular server.
     *
     *
     * @return
     *   the url used to connect to the particular server.
     */
    get url() {
        return this._url;
    }

    /**
     * Initalizes the socket by accepting userID and token as input parameters
     *
     * @param {Object} reqObject request object.
     * 
     * @param {string} reqObject.userID
     *  userID for the particular user.
     * 
     * @param {string} reqObject.token
     *  token parameter will be generated after successful login and will be used in other private API's
     * 
     */
    init(reqObject) {

        this.userID = reqObject.userID;
        this.token = reqObject.token;

        if (this.socketMD.socketMarketData) {
            this.socketMD.socketMarketData.disconnect();
            delete this.socketMD.socketMarketData;
            this.socketMD.socketMarketData = null;
        }
        // path: "/interactive/socket.io",
        this.socketMD.socketMarketData = socketIoClient(this.url, { path: "/interactive/socket.io", reconnection: false, query: { token: this.token, userID: this.userID } });
        logger.logFile("socket is initialized with the following parameters url " + this.url + " token " + this.token + " userID " + this.userID);

        /**
         * Listener of the connect event via socket and emit the connect event via event Emitter
         *
         *
         * @event connect
         */
        this.socketMD.socketMarketData.on('connect', (data) => {
            this.socketMD.isConnected = true;
            console.info("socket connected successfully");
            this.eventEmitter.emit('connect', data);
        });


        /**
         * Listener of the joined event via socket and emit the joined event via event Emitter
         *
         *
         * @event joined
         */
        this.socketMD.socketMarketData.on(settings.socket.joined, (data) => {
            console.info("socket joined successfully");
            this.eventEmitter.emit(settings.socket.joined, data);
        });

        /**
         * Listener of the connect_error event via socket and emit the error event via event Emitter
         *
         *
         * @event connect_error
         */
        this.socketMD.socketMarketData.on('connect_error', (err) => {
            console.error("socket connection error:", err.message);
            // Optionally, emit a specific event or the general error event
            this.eventEmitter.emit('error', { type: 'connect_error', message: err.message, description: err.description, cause: err.cause });
            // If you have a custom reconnection strategy or want to inform the user, do it here.
            // Note: with reconnection: false, the socket won't attempt to reconnect automatically.
            // The existing custom disconnect handler already attempts to re-init.
        });

        /**
         * Listener of the error event via socket and emit the error event via event Emitter
         *
         *
         * @event error
         */
        this.socketMD.socketMarketData.on('error', (data) => {
            console.info("socket error occurred");
            this.eventEmitter.emit('error', data);
        });


        /**
         * Listener of the disconnect event via socket and emit the disconnect event via event Emitter
         *
         *
         * @event disconnect
         */
        this.socketMD.socketMarketData.on('disconnect', (data) => {

            console.info("socket got disconnected");

            this.socketMD.isConnected = false;
            this.socketMD.interval = setInterval(() => {
                if (this.socketMD.isConnected) {
                    clearInterval(this.socketMD.interval);
                    this.socketMD.interval = null;
                    return;
                }
                let reqObject = {
                    userID: this.userID,
                    token: this.token
                }
                this.init(reqObject);
            }, 5000);

            this.eventEmitter.emit('disconnect', data);

        });

        /**
         * Listener of the order event via socket and emit the order event via event Emitter
         *
         *
         * @event order
         */
        this.socketMD.socketMarketData.on(settings.socket.order, (data) => {
            console.info("inside order response channel");
            this.eventEmitter.emit(settings.socket.order, data);
        });

        /**
         * Listener of the trade event via socket and emit the trade event via event Emitter
         *
         *
         * @event trade
         */
        this.socketMD.socketMarketData.on(settings.socket.trade, (data) => {
            console.info("inside trade response channel");
            this.eventEmitter.emit(settings.socket.trade, data);
        });

        /**
         * Listener of the position event via socket and emit the position event via event Emitter
         *
         *
         * @event position
         */
        this.socketMD.socketMarketData.on(settings.socket.position, (data) => {
            console.info("inside positions response channel");
            this.eventEmitter.emit(settings.socket.position, data);
        });

        /**
         * Listener of the logout event via socket and emit the logout event via event Emitter
         *
         *
         * @event logout
         */
        this.socketMD.socketMarketData.on(settings.socket.logout, (data) => {
            console.info("socket logout successfully");
            this.eventEmitter.emit(settings.socket.logout, data);
        });
    }

    /**
     * connect listener for event emitter
     * 
     */
    onConnect(fn) {
        this.eventEmitter.on('connect', (data) => {

            fn(data)
        });
    }

    /**
     * joined listener for event emitter
     * 
     */
    onJoined(fn) {
        this.eventEmitter.on(settings.socket.joined, (data) => {

            fn(data)
        });
    }

    /**
     * error listener for event emitter
     * 
     */
    onError(fn) {
        this.eventEmitter.on('error', (data) => {

            fn(data)
        });
    }

    /**
     * disconnect listener for event emitter
     * 
     */
    onDisconnect(fn) {
        this.eventEmitter.on('disconnect', (data) => {

            fn(data)
        });
    }

    /**
     * order listener for event emitter
     * 
     */
    onOrder(fn) {
        this.eventEmitter.on(settings.socket.order, (data) => {
            try {
                const orderObject = JSON.parse(data);
                fn(orderObject);
            } catch (e) {
                logger.logFile('Error parsing order data in onOrder: ' + e.message + ", raw data: " + data);
                fn(data); // Pass raw data if parse fails
            }
        });
    }

    /**
     * trade listener for event emitter
     * 
     */
    onTrade(fn) {
        this.eventEmitter.on(settings.socket.trade, (data) => {
            try {
                const tradeObject = JSON.parse(data);
                fn(tradeObject);
            } catch (e) {
                logger.logFile('Error parsing trade data in onTrade: ' + e.message + ", raw data: " + data);
                fn(data); // Pass raw data if parse fails
            }
        });
    }

    /**
     * position listener for event emitter
     * 
     */
    onPosition(fn) {
        this.eventEmitter.on(settings.socket.position, (data) => {
            try {
                const positionObject = JSON.parse(data);
                fn(positionObject);
            } catch (e) {
                logger.logFile('Error parsing position data in onPosition: ' + e.message + ", raw data: " + data);
                fn(data); // Pass raw data if parse fails
            }
        });
    }

    /**
     * logout listener for event emitter
     * 
     */
    onLogout(fn) {
        this.eventEmitter.on(settings.socket.logout, (data) => {
            try {
                const logoutObject = JSON.parse(data);
                fn(logoutObject);
            } catch (e) {
                logger.logFile('Error parsing logout data in onLogout: ' + e.message + ", raw data: " + data);
                // Depending on requirements, you might want to pass the raw data or a specific error object.
                // For now, passing raw data if parse fails to maintain some level of notification.
                fn(data); 
            }
        });
    }
}