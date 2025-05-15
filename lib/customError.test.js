const CustomError = require('./customError');

describe('CustomError', () => {
  it('should create an error object with the correct structure and message', () => {
    const message = 'Test error message';
    const stack = 'Test stack trace';
    const statusCode = 500;

    const errorInstance = new CustomError(message, stack, statusCode);

    expect(errorInstance.name).toBe('CustomError');
    expect(errorInstance.message).toBe(message);
    expect(errorInstance.statusCode).toBe(statusCode);
    expect(errorInstance.stack).toBe(stack);
    expect(errorInstance).toBeInstanceOf(Error);
    expect(errorInstance).toBeInstanceOf(CustomError);
  });

  it('should handle missing optional parameters gracefully', () => {
    const message = 'Another test message';
    const errorInstance = new CustomError(message, undefined, undefined);

    expect(errorInstance.name).toBe('CustomError');
    expect(errorInstance.message).toBe(message);
    expect(errorInstance.statusCode).toBeUndefined();
    expect(errorInstance.stack).toBeUndefined();
    expect(errorInstance).toBeInstanceOf(Error);
    expect(errorInstance).toBeInstanceOf(CustomError);
  });
}); 