const axios = require("axios");
const logger = require('./logger');

module.exports.processRequest = async function(method, url, headers, data) {
    try {
        const config = {
            method: method,
            url: url,
            headers: {
                "authorization": headers.authorization
                // Axios will automatically set Content-Type for JSON if data is an object
            },
            // Axios automatically stringifies the data object for common content types like application/json
        };

        if (method.toUpperCase() === "POST" || method.toUpperCase() === "PUT" || method.toUpperCase() === "PATCH") {
            config.data = data;
        }
        
        // For GET requests, if 'data' was intended as query parameters, 
        // it needs to be assigned to 'params' in axios config.
        // Assuming 'data' here is for request body only, as per original logic with 'body'.
        // If 'data' could also be query params for GET, this part needs adjustment.
        // The original code had 'body' only for POST/PUT, so this should be fine.

        logger.logFile("Request object sent to the server (Axios config):");
        // Log relevant parts of config, avoiding logging sensitive data if 'data' or 'headers' contain it.
        // For now, logging a simplified version for brevity and security.
        const dataToLog = config.data ? (typeof config.data === 'object' ? Object.keys(config.data) : typeof config.data) : 'N/A';
        logger.logFile(JSON.stringify({ url: config.url, method: config.method, headers: config.headers, dataContent: dataToLog }));

        const response = await axios(config);

        logger.logFile("Response object received from the server (Axios response.data):");
        logger.logFile(JSON.stringify(response.data));
        return response.data; // Axios wraps the response body in response.data

    } catch (error) {
        logger.logFile("Exception object received from the server (Axios error):");
        if (error.response) {
            // The request was made and the server responded with a status code
            // that falls out of the range of 2xx
            logger.logFile(JSON.stringify({
                status: error.response.status,
                data: error.response.data,
                headers: error.response.headers
            }));
        } else if (error.request) {
            // The request was made but no response was received
            logger.logFile(JSON.stringify({ message: "No response received", request: error.request }));
        } else {
            // Something happened in setting up the request that triggered an Error
            logger.logFile(JSON.stringify({ message: error.message }));
        }
        // For consistent error throwing as before, re-throw the original error for now.
        // Consider creating a custom error or re-throwing error.response for more specific handling downstream.
        throw error;
    }
};