var config = require('./config/app/config.json');
var settings = require('./config/app/settings.json');
var request = require('./request');
var CustomError = require('./customError');
var logger = require('./logger');

module.exports = class XTSInteractive {



    /**
     * Constructs an XTSInteractive instance to enable data transfer via restful API's.
     *  
     * @constructor
     *
     * @param {String} url
     *   url parameter is used to connect to the particular server.
     * 
     */
    constructor(url) {
        this.url = url === undefined ? config.url : url;
        this.responseTypes = { success: "success", failure: "failure" };
        this.isLoggedIn = false;
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
     * set the source value by providing the source in the input
     *
     * @param {string} source
     *  source used by the particular user
     */
    set source(source) {
        this._source = source;
    }

    /**
     * Returns source used by the particular user
     *
     *
     * @return
     *   the userID used by the particular user
     */
    get source() {
        return this._source;
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
    * set the enums value obtained after successful LogIn.
    *
    * @param {Object} enums
    *  sets the enums value obtained after successful LogIn.
    */
    set enums(enums) {
        this._enums = enums;
    }

    /**
     * Returns enums value obtained after successful LogIn.
     *
     * @return
     *   enums value obtained after successful LogIn.
     */
    get enums() {
        return this._enums;
    }

    /**
     * LogIn API of the application provides functionality of logIn into the application
     *
     *  @param {Object} reqObject request object.
     * 
     * @param {string} reqObject.userID
     *  userID of the particular user.
     * 
     * @param {string} reqObject.password
     *  password of the particular user.
     * 
     * @param {string} reqObject.publicKey
     *  publicKey of the particular user.
     * 
     * @param {string} reqObject.source
     *  source used by the particular user.
     * 
     */
    async logIn(reqObject) {
        try {
            var response = await request.processRequest("POST", this.url + settings.restApi.session, {}, reqObject);
            this.userID = reqObject.userID;
            this.source = reqObject.source;
            this.token = response.result.token;
            this.enums = response.result.enums;
            this.clientCodes = response.result.clientCodes;
            this.isInvestorClient = response.result.isInvestorClient;
            this.isLoggedIn = true;
            this.populateEnums(response.result.enums);
            return response;
        } catch (error) {
            if (error instanceof CustomError) { return error; }
            let message = error && error.message ? error.message : 'Login operation failed.';
            let stack = error && error.stack ? error.stack : undefined;
            let statusCode = error && error.statusCode ? error.statusCode : 500;
            return new CustomError(message, stack, statusCode);
        }
    }

    /**
     * Logout API of the application provides functionality of logOut from the application
     * 
     */
    async logOut() {
        try {
            await this.checkLoggedIn();
            let response = await request.processRequest("DELETE", this.url + settings.restApi.session, { 'authorization': this.token }, null);
            return response;
        } catch (error) {
            if (error instanceof CustomError) { return error; }
            let message = error && error.message ? error.message : 'Logout operation failed.';
            let stack = error && error.stack ? error.stack : undefined;
            let statusCode = error && error.statusCode ? error.statusCode : 500;
            return new CustomError(message, stack, statusCode);
        }
    }

   /**
    * getProfile API of the application provides functionality of getting profile details from the application
    * 
    */
    async getProfile(reqObject) {
        try {
            await this.checkLoggedIn();
            let apiUrl = this.url + settings.restApi.profile;
            if (reqObject && reqObject.clientID) {
                apiUrl += "?clientID=" + reqObject.clientID;
            }
            const response = await request.processRequest("GET", apiUrl, { 'authorization': this.token }, null);
            return response;
        } catch (error) {
            if (error instanceof CustomError) { return error; }
            let message = error && error.message ? error.message : 'Get profile operation failed.';
            let stack = error && error.stack ? error.stack : undefined;
            let statusCode = error && error.statusCode ? error.statusCode : 500;
            return new CustomError(message, stack, statusCode);
        }
    }

    /**
     * getBalance API of the application provides functionality of getting balance details from the application
     * 
     */
    async getBalance(reqObject) {
        try {
            await this.checkLoggedIn();
            let apiUrl = this.url + settings.restApi.balance;
            if (reqObject && reqObject.clientID) {
                apiUrl += "?clientID=" + reqObject.clientID;
            }
            const response = await request.processRequest("GET", apiUrl, { 'authorization': this.token }, null);
            return response;
        } catch (error) {
            if (error instanceof CustomError) { return error; }
            let message = error && error.message ? error.message : 'Get balance operation failed.';
            let stack = error && error.stack ? error.stack : undefined;
            let statusCode = error && error.statusCode ? error.statusCode : 500;
            return new CustomError(message, stack, statusCode);
        }
    }

    /**
     * getHoldings API of the application provides functionality of getting holding details from the application
     * 
     */
    async getHoldings(reqObject) {
        try {
            await this.checkLoggedIn();
            let apiUrl = this.url + settings.restApi.holding;
            if (reqObject && reqObject.clientID) {
                apiUrl += "?clientID=" + reqObject.clientID;
            }
            const response = await request.processRequest("GET", apiUrl, { 'authorization': this.token }, null);
            return response;
        } catch (error) {
            if (error instanceof CustomError) { return error; }
            let message = error && error.message ? error.message : 'Get holdings operation failed.';
            let stack = error && error.stack ? error.stack : undefined;
            let statusCode = error && error.statusCode ? error.statusCode : 500;
            return new CustomError(message, stack, statusCode);
        }
    }

    /**
     * getPositions API of the application provides functionality of getting postion details from the application
     * 
     * @param {Object} reqObject request object.
     * 
     * @param {string} reqObject.dayOrNet
     *  dayOrNet parameter for getting the day or Net positions respectively
     */
    async getPositions(reqObject) {
        try {
            await this.checkLoggedIn();
            
            let dayOrNetVal = 'DayWise'; // Default
            if (reqObject && reqObject.dayOrNet) {
                dayOrNetVal = reqObject.dayOrNet;
            }
            
            let constructedURL = this.url + settings.restApi.position + "?dayOrNet=" + dayOrNetVal;

            if (reqObject && reqObject.clientID) {
                constructedURL += "&clientID=" + reqObject.clientID;
            }

            let response = await request.processRequest("GET", constructedURL, { 'authorization': this.token }, null);
            return response;
        } catch (error) {
            if (error instanceof CustomError) { return error; }
            let message = error && error.message ? error.message : 'Get positions operation failed.';
            let stack = error && error.stack ? error.stack : undefined;
            let statusCode = error && error.statusCode ? error.statusCode : 500;
            return new CustomError(message, stack, statusCode);
        }
    }

    /**
     * positionConversion API of the application provides functionality of converting position details in the application 
     * 
     *  @param {Object} reqObject request object.
     * 
     * @param {string} reqObject.appOrderID
     *  appOrderID of the particular order
     * 
     *  @param {string} reqObject.executionID
     *  executionID of the particular order
     * 
     * @param {string} reqObject.oldProductType
     *  oldProductType of the particular order
     * 
     *  @param {string} reqObject.newProductType
     *  newProductType of the particular order
     * 
     */
    async positionConversion(reqObject) {
        try {
            await this.checkLoggedIn();
            let response = await request.processRequest("PUT", this.url + settings.restApi.convert, { 'authorization': this.token }, reqObject);
            return response;
        } catch (error) {
            if (error instanceof CustomError) { return error; }
            let message = error && error.message ? error.message : 'Position conversion operation failed.';
            let stack = error && error.stack ? error.stack : undefined;
            let statusCode = error && error.statusCode ? error.statusCode : 500;
            return new CustomError(message, stack, statusCode);
        }
    }

    // {
    //     "exchangeSegment":"NSECM",
    //     "exchangeInstrumentID" :22,
    //     "productType":"NRML",
    //     "squreoffMode":"DayWise",
    //     "positionSquareOffQuantityType" : "ExactQty", 
    //     "squareOffQtyValue":5
    // }

    /**
     * squareOff API of the application provides functionality of squaringOff the order in the application
     * 
     *  @param {Object} reqObject request object.
     * 
     * @param {string} reqObject.exchangeSegment
     *  exchangeSegment of the instrument used for placing the order
     * 
     *  @param {number} reqObject.exchangeInstrumentID
     *  exchangeInstrumentID of the instrument used for placing the order
     * 
     * @param {string} reqObject.productType
     *  productType of the particular order
     * 
     *  @param {number} reqObject.squareoffMode
     *  squreoffMode used for the particular order. 
     * 
     *  @param {string} reqObject.positionSquareOffQuantityType
     *  squreoffMode used for the particular order. 
     * 
     *  @param {number} reqObject.squareOffQtyValue
     *  squreoffMode used for the particular order. 
     * 
     * 
     */
    async squareOff(reqObject) {
        try {
            await this.checkLoggedIn();
            let response = await request.processRequest("PUT", this.url + settings.restApi.squareoff, { 'authorization': this.token }, reqObject);
            return response;
        } catch (error) {
            if (error instanceof CustomError) { return error; }
            let message = error && error.message ? error.message : 'Square off operation failed.';
            let stack = error && error.stack ? error.stack : undefined;
            let statusCode = error && error.statusCode ? error.statusCode : 500;
            return new CustomError(message, stack, statusCode);
        }
    }

    // {
    //     "exchangeSegment":"NSECM",
    //     "exchangeInstrumentID":22,
    //     "productType":"MIS",
    //   "orderType":"LIMIT",
    //   "orderSide":"BUY",
    //   "timeInForce":"DAY",
    //   "disclosedQuantity":0,
    //   "orderQuantity":20,
    //   "limitPrice":1500.00,
    //   "stopPrice":1600.00,
    //   "orderUniqueIdentifier":"454845"
    // }

    /**
     * placeOrder API of the application provides functionality of placing the order in the application
     * 
     * @param {Object} reqObject request object.
     * 
     * @param {string} reqObject.exchangeSegment
     *  exchangeSegment of the instrument used for placing the order
     * 
     *  @param {number} reqObject.exchangeInstrumentID
     *  exchangeInstrumentID of the instrument used for placing the order
     * 
     * @param {string} reqObject.productType
     *  productType of the particular order
     * 
     *  @param {string} reqObject.orderType
     *  orderType of the particular order. 
     * 
     *  @param {string} reqObject.orderSide
     *  orderSide of the particular order.
     * 
     * @param {string} reqObject.timeInForce
     *  timeInForce of the particular order. 
     * 
     *  @param {number} reqObject.disclosedQuantity
     *  disclosedQuantity of the particular order.  
     * 
     * @param {number} reqObject.orderQuantity
     *  orderQuantity of the particular order. 
     * 
     * @param {number} reqObject.limitPrice
     *  limitPrice of the particular order. 
     * 
     * @param {number} reqObject.stopPrice
     *  stopPrice of the particular order. 
     * 
     * @param {string} reqObject.orderUniqueIdentifier
     *  orderUniqueIdentifier of the particular order. 
     */
    async placeOrder(reqObject) {
        try {
            await this.checkLoggedIn();
            let response = await request.processRequest("POST", this.url + settings.restApi.orders, { 'authorization': this.token }, reqObject);
            return response;
        } catch (error) {
            if (error instanceof CustomError) { return error; }
            let message = error && error.message ? error.message : 'Place order operation failed.';
            let stack = error && error.stack ? error.stack : undefined;
            let statusCode = error && error.statusCode ? error.statusCode : 500;
            return new CustomError(message, stack, statusCode);
        }
    }

    // {
    //     "appOrderID" :1991237756,
    //    "modifiedProductType" :"NRML",
    //    "modifiedOrderType" :"LIMIT",
    //  "modifiedOrderQuantity" :100,
    //    "modifiedDisclosedQuantity":0,
    //    "modifiedLimitPrice" :300,
    //    "modifiedStopPrice":300, 
    //  "modifiedTimeInForce":"DAY",
    //  "modifiedOrderExpiryDate":"Feb 18 2019 15:15:00",
    //  "orderUniqueIdentifier":"5656"
    // }

    /**
      * modify order API of the application provides functionality of modifing the order in the application
      * 
      *  @param {Object} reqObject request object.
      * 
      * @param {number} reqObject.appOrderID
      *  appOrderID of the particular order
      * 
      *  @param {string} reqObject.modifiedProductType
      *  modifiedProductType of the particular order
      * 
      * @param {string} reqObject.modifiedOrderType
      *  modifiedOrderType of the particular order
      * 
      *  @param {number} reqObject.modifiedOrderQuantity
      *  modifiedOrderQuantity of the particular order. 
      * 
      *  @param {number} reqObject.modifiedDisclosedQuantity
      *  modifiedDisclosedQuantity of the particular order.
      * 
      * @param {number} reqObject.modifiedLimitPrice
      *  modifiedLimitPrice of the particular order. 
      * 
      *  @param {number} reqObject.modifiedStopPrice
      *  modifiedStopPrice of the particular order.  
      * 
      * @param {string} reqObject.modifiedTimeInForce
      *  modifiedTimeInForce of the particular order.
      * 
      * @param {string} reqObject.orderUniqueIdentifier
      *  orderUniqueIdentifier of the particular order. 
      */
    async modifyOrder(reqObject) {
        try {
            await this.checkLoggedIn();
            await this.checkClientCodes(reqObject);
            let response = await request.processRequest("PUT", this.url + settings.restApi.orders, { 'authorization': this.token }, reqObject);
            return response;
        } catch (error) {
            if (error instanceof CustomError) { return error; }
            let message = error && error.message ? error.message : 'Modify order operation failed.';
            let stack = error && error.stack ? error.stack : undefined;
            let statusCode = error && error.statusCode ? error.statusCode : 500;
            return new CustomError(message, stack, statusCode);
        }
    }

    //?appOrderID=1828071433&orderUniqueIdentifier=155151
    /**
      * cancel order API of the application provides functionality of canceling the order in the application
      * 
      *  @param {Object} reqObject request object.
      * 
      * @param {string} reqObject.appOrderID
      *  appOrderID of the particular order
      * 
      * @param {string} reqObject.orderUniqueIdentifier
      *  orderUniqueIdentifier of the particular order. 
      */
    async cancelOrder(reqObject) {
        try {
            await this.checkLoggedIn();
            await this.checkClientCodes(reqObject);
            const params = new URLSearchParams(reqObject);
            const queryString = params.toString();
            let response = await request.processRequest("DELETE", this.url + settings.restApi.orders + "?" + queryString, { 'authorization': this.token }, null);
            return response;
        } catch (error) {
            if (error instanceof CustomError) { return error; }
            let message = error && error.message ? error.message : 'Cancel order operation failed.';
            let stack = error && error.stack ? error.stack : undefined;
            let statusCode = error && error.statusCode ? error.statusCode : 500;
            return new CustomError(message, stack, statusCode);
        }
    }

    // {
    //     "exchangeSegment": "NSECM",
    //     "exchangeInstrumentID": 22,
    //     "orderSide": "BUY",
    //     "orderQuantity": 2,
    //     "disclosedQuantity": 2,
    //     "limitPrice": 2054,
    //     "stopPrice": 2054,
    //     "orderUniqueIdentifier":"454845"
    // }

    /**
      * placeCoverOrder API of the application provides functionality of placing the cover order in the application
      * 
      * @param {Object} reqObject request object.
      * 
      * @param {string} reqObject.exchangeSegment
      *  exchangeSegment of the instrument used for placing the order
      * 
      *  @param {number} reqObject.exchangeInstrumentID
      *  exchangeInstrumentID of the instrument used for placing the order
      * 
      *  @param {string} reqObject.orderSide
      *  orderSide of the particular order.
      * 
      *  @param {number} reqObject.orderQuantity
      *  orderQuantity of the particular order. 
      * 
      *  @param {number} reqObject.disclosedQuantity
      *  disclosedQuantity of the particular order.
      * 
      * @param {number} reqObject.limitPrice
      *  limitPrice of the particular order. 
      * 
      * @param {number} reqObject.stopPrice
      *  stopPrice of the particular order. 
      * 
      * @param {string} reqObject.orderUniqueIdentifier
      *  orderUniqueIdentifier of the particular order. 
      * 
      */
    async placeCoverOrder(reqObject) {
        try {
            await this.checkLoggedIn();
            let response = await request.processRequest("POST", this.url + settings.restApi.cover, { 'authorization': this.token }, reqObject);
            return response;
        } catch (error) {
            if (error instanceof CustomError) { return error; }
            let message = error && error.message ? error.message : 'Place cover order operation failed.';
            let stack = error && error.stack ? error.stack : undefined;
            let statusCode = error && error.statusCode ? error.statusCode : 500;
            return new CustomError(message, stack, statusCode);
        }
    }

    // {
    //     "appOrderID": "2426016103"
    // }

    /**
      * exitCoverOrder API of the application provides functionality of exiting the cover order in the application
      * 
      * @param {Object} reqObject request object.
      * 
      * @param {string} reqObject.appOrderID
      *  appOrderID of the particular order
      * 
      */
    async exitCoverOrder(reqObject) {
        try {
            await this.checkLoggedIn();
            let response = await request.processRequest("PUT", this.url + settings.restApi.cover + "?appOrderID=" + reqObject.appOrderID, { 'authorization': this.token }, null);
            return response;
        } catch (error) {
            if (error instanceof CustomError) { return error; }
            let message = error && error.message ? error.message : 'Exit cover order operation failed.';
            let stack = error && error.stack ? error.stack : undefined;
            let statusCode = error && error.statusCode ? error.statusCode : 500;
            return new CustomError(message, stack, statusCode);
        }
    }

    /**
      * getOrderBook API of the application provides functionality of getting the list of orders present in the orderBook
      * 
      */
    async getOrderBook(reqObject) {
        try {
            await this.checkLoggedIn();
            await this.checkClientCodes(reqObject);
            let response = await request.processRequest("GET", this.url + settings.restApi.orders, { 'authorization': this.token }, null);
            return response;
        } catch (error) {
            if (error instanceof CustomError) { return error; }
            let message = error && error.message ? error.message : 'Get order book operation failed.';
            let stack = error && error.stack ? error.stack : undefined;
            let statusCode = error && error.statusCode ? error.statusCode : 500;
            return new CustomError(message, stack, statusCode);
        }
    }

    /**
     * getTradeBook API of the application provides functionality of getting the list of orders present in the orderBook
     *  
     */
    async getTradeBook(reqObject) {
        try {
            await this.checkLoggedIn();
            await this.checkClientCodes(reqObject);
            let response = await request.processRequest("GET", this.url + settings.restApi.trade, { 'authorization': this.token }, null);
            return response;
        } catch (error) {
            if (error instanceof CustomError) { return error; }
            let message = error && error.message ? error.message : 'Get trade book operation failed.';
            let stack = error && error.stack ? error.stack : undefined;
            let statusCode = error && error.statusCode ? error.statusCode : 500;
            return new CustomError(message, stack, statusCode);
        }
    }

    //?appOrderID=344566
    /**
      * getOrderHistory API of the application provides functionality of getting the order history in the application
      * 
      * @param {string} appOrderID
      *  appOrderID of the particular order
      * 
      */
    async getOrderHistory(appOrderID) {
        try {
            await this.checkLoggedIn();
            let orderHistoryPath = settings.restApi.orderHistory.endsWith('/') ? settings.restApi.orderHistory : settings.restApi.orderHistory + '/';
            let response = await request.processRequest("GET", this.url + orderHistoryPath + appOrderID, { 'authorization': this.token }, null);
            return response;
        } catch (error) {
            if (error instanceof CustomError) { return error; }
            let message = error && error.message ? error.message : 'Get order history operation failed.';
            let stack = error && error.stack ? error.stack : undefined;
            let statusCode = error && error.statusCode ? error.statusCode : 500;
            return new CustomError(message, stack, statusCode);
        }
    }

    async checkLoggedIn() {
        if (this.isLoggedIn) {
            return true;
        } else {
            throw { message: "Login is Required", stack: "login is mandatory", statusCode: 404 };
        }
    }
    
    async checkClientCodes(reqObject){
        if (this.isInvestorClient) {
            return true;
        } else {
            if(reqObject==null|| reqObject.clientID==undefined){
                throw { message: "ClientCode is Required", stack: "clientCode is mandatory", statusCode: 404 };
            } else {
                return true;
            } 
        }
    }
	
	 async loginWithToken(userID, token){
        try {
            var response = await request.processRequest("GET", this.url + settings.restApi.enums+"?userID="+userID, { 'authorization': token }, null);
            this.userID = userID;
            this.token = token;
            this.enums = response.result.enums;
            this.clientCodes = response.result.clientCodes;
            this.isInvestorClient = response.result.isInvestorClient;
            this.isLoggedIn = true;
            this.populateEnums(response.result.enums);
            return response;
        } catch (error) {
            if (error instanceof CustomError) { return error; }
            let message = error && error.message ? error.message : 'Login with token operation failed.';
            let stack = error && error.stack ? error.stack : undefined;
            let statusCode = error && error.statusCode ? error.statusCode : 500;
            return new CustomError(message, stack, statusCode);
        }
    }
	

    populateEnums(enums) {

        for (const i in enums) {

            const enumKey = i;
            const enumValue = enums[i];

            if (enumValue.length == undefined) {

                const exchangeSegments = {};
                const orderTypes = {};
                const productTypes = {};
                const timeInForce = {};

                for (const j of Object.keys(enumValue)) {

                    exchangeSegments[j] = j;

                    if (enumValue[j].orderType) {
                        for (const k of (enumValue[j].orderType)) {
                            orderTypes[k] = k;
                        }
                    }

                    if (enumValue[j].productType) {
                        for (const k of (enumValue[j].productType)) {
                            productTypes[k] = k;
                        }
                    }

                    if (enumValue[j].timeInForce) {
                        for (const k of (enumValue[j].timeInForce)) {
                            timeInForce[k] = k;
                        }
                    }
                }

                this[enumKey] = exchangeSegments;
                this.orderTypes = orderTypes;
                this.productTypes = productTypes;
                this.timeInForce = timeInForce;

            } else {

                const simpleEnumObject = {};

                for (const j of enumValue) {
                    simpleEnumObject[j] = j;
                }

                this[enumKey] = simpleEnumObject;
            }
        }
    }
}