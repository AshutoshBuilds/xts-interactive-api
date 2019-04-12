var linq = require('linq');
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
        this.url = url == "undefined" ? config.url : url;
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
            this.isLoggedIn = true;
            this.populateEnums(response.result.enums);
            return response;

        } catch (error) {

            let customError = new CustomError(error.message, error.stack, error.statusCode);
            return customError;

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

            let customError = new CustomError(error.message, error.stack, error.statusCode);
            return customError;

        }
    }

   /**
    * getProfile API of the application provides functionality of getting profile details from the application
    * 
    */
    async getProfile() {

        try {
            await this.checkLoggedIn();
            let response = await request.processRequest("GET", this.url + settings.restApi.profile, { 'authorization': this.token }, null);
            return response;

        } catch (error) {

            let customError = new CustomError(error.message, error.stack, error.statusCode);
            return customError;

        }

    }

    /**
     * getBalance API of the application provides functionality of getting balance details from the application
     * 
     */
    async getBalance() {

        try {
            await this.checkLoggedIn();
            let response = await request.processRequest("GET", this.url + settings.restApi.balance, { 'authorization': this.token }, null);
            return response;

        } catch (error) {

            let customError = new CustomError(error.message, error.stack, error.statusCode);
            return customError;

        }
    }

    /**
     * getHoldings API of the application provides functionality of getting holding details from the application
     * 
     */
    async getHoldings() {

        try {
            await this.checkLoggedIn();
            let response = await request.processRequest("GET", this.url + settings.restApi.holding, { 'authorization': this.token }, null);
            return response;

        } catch (error) {

            let customError = new CustomError(error.message, error.stack, error.statusCode);
            return customError;

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
            let response = await request.processRequest("GET", this.url + settings.restApi.position + "?dayOrNet=" + reqObject.dayOrNet, { 'authorization': this.token }, null);
            return response;

        } catch (error) {

            let customError = new CustomError(error.message, error.stack, error.statusCode);
            return customError;

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

            let customError = new CustomError(error.message, error.stack, error.statusCode);
            return customError;

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
    async squareOff(exchangeSegment, exchangeInstrumentID, productType, squareoffMode, positionSquareOffQuantityType, squareOffQtyValue) {

        try {
            await this.checkLoggedIn();
            let response = await request.processRequest("PUT", this.url + settings.restApi.squareoff, { 'authorization': this.token }, reqObject);
            return response;

        } catch (error) {

            let customError = new CustomError(error.message, error.stack, error.statusCode);
            return customError;

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

            let customError = new CustomError(error.message, error.stack, error.statusCode);
            return customError;

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
            let response = await request.processRequest("PUT", this.url + settings.restApi.orders, { 'authorization': this.token }, reqObject);
            return response;

        } catch (error) {

            let customError = new CustomError(error.message, error.stack, error.statusCode);
            return customError;

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
            let response = await request.processRequest("DELETE", this.url + settings.restApi.orders + "?appOrderID=" + reqObject.appOrderID + "&orderUniqueIdentifier=" + reqObject.orderUniqueIdentifier, { 'authorization': this.token }, null);
            return response;

        } catch (error) {

            let customError = new CustomError(error.message, error.stack, error.statusCode);
            return customError;

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

            let customError = new CustomError(error.message, error.stack, error.statusCode);
            return customError;

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
            let response = await request.processRequest("PUT", this.url + settings.restApi.cover, { 'authorization': this.token }, reqObject);
            return response;

        } catch (error) {

            let customError = new CustomError(error.message, error.stack, error.statusCode);
            return customError;

        }
    }

    /**
      * getOrderBook API of the application provides functionality of getting the list of orders present in the orderBook
      * 
      */
    async getOrderBook() {

        try {
            await this.checkLoggedIn();
            let response = await request.processRequest("GET", this.url + settings.restApi.orders, { 'authorization': this.token }, null);
            return response;

        } catch (error) {

            let customError = new CustomError(error.message, error.stack, error.statusCode);
            return customError;

        }
    }

    /**
     * getTradeBook API of the application provides functionality of getting the list of orders present in the orderBook
     *  
     */
    async getTradeBook() {

        try {
            await this.checkLoggedIn();
            let response = await request.processRequest("GET", this.url + settings.restApi.trade, { 'authorization': this.token }, null);
            return response;

        } catch (error) {

            let customError = new CustomError(error.message, error.stack, error.statusCode);
            return customError;
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
            let response = await request.processRequest("GET", this.url + settings.restApi.orders + "?appOrderID=" + appOrderID, { 'authorization': this.token }, null);
            return response;

        } catch (error) {

            let customError = new CustomError(error.message, error.stack, error.statusCode);
            return customError;

        }
    }

    async checkLoggedIn() {
        if (this.isLoggedIn) {
            return true;
        } else {
            throw { message: "Login is Required", stack: "login is mandatory", statusCode: 404 };
        }
    }

    populateEnums(enums) {

        for (var i in enums) {

            var enumKey = i;
            var enumValue = enums[i];

            if (enumValue.length == undefined) {

                var object = {};
                var orderTypes = {};
                var productTypes = {};
                var timeInForce = {};

                for (var j of Object.keys(enumValue)) {

                    object[j] = j;

                    for (var k of (enumValue[j].orderType)) {

                        orderTypes[k] = k;
                    }

                    for (var k of (enumValue[j].productType)) {

                        productTypes[k] = k;
                    }

                    for (var k of (enumValue[j].timeInForce)) {

                        timeInForce[k] = k;
                    }
                }

                this[enumKey] = object;
                this.orderTypes = orderTypes;
                this.productTypes = productTypes;
                this.timeInForce = timeInForce;

            } else {

                var object = {};

                for (var j of enumValue) {
                    object[j] = j;
                }

                this[enumKey] = object;
            }
        }
    }
}