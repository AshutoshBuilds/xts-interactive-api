const axios = require('axios');
const logger = require('./logger');
const { processRequest } = require('./request');

// Mock axios
jest.mock('axios');
// Mock logger to spy on logFile calls without actually writing files
jest.mock('./logger', () => ({
  logFile: jest.fn(),
  // We don't need init or other logger parts for these tests, 
  // but if request.js somehow used them, we might need to mock them too.
}));

describe('processRequest', () => {
  beforeEach(() => {
    // Reset mocks before each test
    axios.mockClear();
    logger.logFile.mockClear();
  });

  it('should make a GET request successfully and return data', async () => {
    const mockData = { id: 1, message: 'Hello' };
    axios.mockResolvedValue({ data: mockData }); // Simulate a successful axios response

    const method = 'GET';
    const url = 'http://test.com/api/data';
    const headers = { authorization: 'Bearer token123' };

    const result = await processRequest(method, url, headers, null); // No data for GET

    expect(axios).toHaveBeenCalledTimes(1);
    expect(axios).toHaveBeenCalledWith({
      method: 'GET',
      url: url,
      headers: { authorization: 'Bearer token123' },
      // data should be undefined for GET if not passed or passed as null
    });
    expect(result).toEqual(mockData);
    expect(logger.logFile).toHaveBeenCalledTimes(4); // Corrected: 2 for request, 2 for response
    expect(logger.logFile).toHaveBeenCalledWith("Request object sent to the server (Axios config):");
    expect(logger.logFile).toHaveBeenCalledWith("Response object received from the server (Axios response.data):");
  });

  it('should make a POST request successfully with data and return data', async () => {
    const requestBody = { name: 'Test Item', value: 42 };
    const mockResponseData = { id: 2, ...requestBody };
    axios.mockResolvedValue({ data: mockResponseData });

    const method = 'POST';
    const url = 'http://test.com/api/items';
    const headers = { authorization: 'Bearer token456' };

    const result = await processRequest(method, url, headers, requestBody);

    expect(axios).toHaveBeenCalledTimes(1);
    expect(axios).toHaveBeenCalledWith({
      method: 'POST',
      url: url,
      headers: { authorization: 'Bearer token456' },
      data: requestBody,
    });
    expect(result).toEqual(mockResponseData);
    expect(logger.logFile).toHaveBeenCalledTimes(4); // Corrected: 2 for request, 2 for response
  });

  it('should handle API error (e.g., 400 Bad Request) correctly', async () => {
    const apiError = {
      isAxiosError: true,
      response: {
        status: 400,
        data: { error: 'Bad Request', message: 'Invalid input' },
        headers: { 'content-type': 'application/json' },
      },
      // other axios error properties if needed for the test
    };
    axios.mockRejectedValue(apiError); // Simulate an axios error with a response object

    const method = 'POST';
    const url = 'http://test.com/api/action';
    const headers = { authorization: 'Bearer token789' };
    const requestBody = { data: 'some data' };

    await expect(processRequest(method, url, headers, requestBody)).rejects.toEqual(apiError);

    expect(axios).toHaveBeenCalledTimes(1);
    expect(logger.logFile).toHaveBeenCalledTimes(4); // 2 for request, 2 for this error logging path
    expect(logger.logFile).toHaveBeenCalledWith("Request object sent to the server (Axios config):");
    expect(logger.logFile).toHaveBeenCalledWith(JSON.stringify({ 
        url: url, 
        method: method, 
        headers: headers, 
        dataContent: Object.keys(requestBody) 
    }));
    expect(logger.logFile).toHaveBeenCalledWith("Exception object received from the server (Axios error):");
    expect(logger.logFile).toHaveBeenCalledWith(JSON.stringify({
      status: apiError.response.status,
      data: apiError.response.data,
      headers: apiError.response.headers
    }));
  });

  it('should handle network error (no response) correctly', async () => {
    const networkError = {
      isAxiosError: true,
      request: { message: 'Network Error' }, // Simulate error where request was made but no response
      message: 'Network Error',
    };
    axios.mockRejectedValue(networkError);

    const method = 'GET';
    const url = 'http://test.com/api/resource';
    const headers = { authorization: 'Bearer tokenABC' };

    await expect(processRequest(method, url, headers, null)).rejects.toEqual(networkError);
    
    expect(axios).toHaveBeenCalledTimes(1);
    expect(logger.logFile).toHaveBeenCalledTimes(4); // 2 for request, 2 for this error path
    expect(logger.logFile).toHaveBeenCalledWith("Exception object received from the server (Axios error):");
    expect(logger.logFile).toHaveBeenCalledWith(JSON.stringify({ message: "No response received", request: networkError.request }));
  });

  it('should handle other types of errors during request setup', async () => {
    const setupError = new Error('Request setup failed');
    // Simulate an error thrown before or during axios call not necessarily an axios error
    axios.mockImplementation(() => {
      throw setupError;
    });

    const method = 'GET';
    const url = 'http://test.com/api/another';
    const headers = { authorization: 'Bearer tokenDEF' };

    await expect(processRequest(method, url, headers, null)).rejects.toThrow(setupError);

    expect(axios).toHaveBeenCalledTimes(1);
    expect(logger.logFile).toHaveBeenCalledTimes(4); // Corrected: 2 for request, 2 for this error path
    expect(logger.logFile).toHaveBeenCalledWith("Exception object received from the server (Axios error):");
    expect(logger.logFile).toHaveBeenCalledWith(JSON.stringify({ message: setupError.message }));
  });

  // Add more tests for PUT, PATCH if applicable, different header scenarios, etc.

}); 