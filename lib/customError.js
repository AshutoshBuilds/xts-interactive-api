module.exports = class CustomError extends Error {
    constructor(message, stack, statusCode) {
        super(message); // Sets the message property on the Error base class
        this.message = message; // Explicitly ensure it's on the instance
        this.name = this.constructor.name; // Best practice to set name
        this.stack = stack;
        this.statusCode = statusCode;
    }
}