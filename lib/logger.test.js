require('./logger'); // This will execute the Date.prototype extensions

const logger = require('./logger'); // Import logger to access formatDateUtils
const { formatDateUtils } = logger; // Destructure the utility functions

// Mock console.info before tests run to suppress logger.init output
jest.spyOn(console, 'info').mockImplementation(() => {});

describe('Date formatting utility functions in logger', () => {
  let testDate;

  beforeEach(() => {
    testDate = new Date(2023, 0, 5, 7, 8, 9); // 2023-01-05 07:08:09 (Month is 0-indexed)
  });

  it('getMonthFormatted should return a zero-padded month', () => {
    expect(formatDateUtils.getMonthFormatted(testDate)).toBe('01');
    const juneDate = new Date(2023, 5, 5);
    expect(formatDateUtils.getMonthFormatted(juneDate)).toBe('06');
    const decDate = new Date(2023, 11, 5);
    expect(formatDateUtils.getMonthFormatted(decDate)).toBe('12');
  });

  it('getMonthFormattedString should return the abbreviated month name', () => {
    expect(formatDateUtils.getMonthFormattedString(testDate)).toBe('Jan');
    const febDate = new Date(2023, 1, 1);
    expect(formatDateUtils.getMonthFormattedString(febDate)).toBe('Feb');
    // ... (add more months if desired for full coverage, or trust the switch)
    const decDate = new Date(2023, 11, 1);
    expect(formatDateUtils.getMonthFormattedString(decDate)).toBe('Dec');
  });

  it('getDayFormatted should return a zero-padded day', () => {
    expect(formatDateUtils.getDayFormatted(testDate)).toBe('05');
    const anotherDate = new Date(2023, 0, 15);
    expect(formatDateUtils.getDayFormatted(anotherDate)).toBe('15');
  });

  it('getHourFormatted should return a zero-padded hour', () => {
    expect(formatDateUtils.getHourFormatted(testDate)).toBe('07');
    const anotherDate = new Date(2023, 0, 5, 17);
    expect(formatDateUtils.getHourFormatted(anotherDate)).toBe('17');
  });

  it('getMinuteFormatted should return a zero-padded minute', () => {
    expect(formatDateUtils.getMinuteFormatted(testDate)).toBe('08');
    const anotherDate = new Date(2023, 0, 5, 7, 18);
    expect(formatDateUtils.getMinuteFormatted(anotherDate)).toBe('18');
  });

  it('getSecondFormatted should return a zero-padded second', () => {
    expect(formatDateUtils.getSecondFormatted(testDate)).toBe('09');
    const anotherDate = new Date(2023, 0, 5, 7, 8, 19);
    expect(formatDateUtils.getSecondFormatted(anotherDate)).toBe('19');
  });

  it('getFormattedDateTime should return date and time in DD/MM/YYYY HH:MM:SS format', () => {
    expect(formatDateUtils.getFormattedDateTime(testDate)).toBe('05/01/2023 07:08:09');
  });

  it('getDateTimeFormatted should return date and time in Mon DD YYYY HH:MM:SS format', () => {
    expect(formatDateUtils.getDateTimeFormatted(testDate)).toBe('Jan 05 2023 07:08:09');
  });
});

// Mock the fs module
jest.mock('fs');
const fs = require('fs');
// const logger = require('./logger'); // logger is already required above for formatDateUtils

describe('logger file operations', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    // Mock Date constructor to control timestamps for predictable log output
    // Ensure this mock is active for tests that check specific timestamped messages
    jest.useFakeTimers();
    jest.setSystemTime(new Date(2023, 0, 5, 7, 8, 9)); // Jan 05 2023 07:08:09
  });

  afterEach(() => {
    jest.useRealTimers(); // Restore real timers after each test
  });

  describe('logger.init', () => {
    it('should create logs directory if it does not exist', () => {
      fs.existsSync.mockReturnValue(false);
      logger.init();
      expect(fs.mkdirSync).toHaveBeenCalledWith(expect.stringContaining('/logs'));
    });

    it('should not try to create logs directory if it already exists', () => {
      fs.existsSync.mockReturnValue(true);
      logger.init();
      expect(fs.mkdirSync).not.toHaveBeenCalled();
    });

    it('should append init message to new log file', () => {
      fs.existsSync.mockImplementation(path => !path.endsWith('.txt')); 
      logger.init();
      expect(fs.appendFile).toHaveBeenCalledWith(
        expect.stringMatching(/debug_05012023\.txt$/), // Expecting DDMMYYYY based on mocked date
        expect.stringContaining('Initialized logger'),
        expect.any(Function)
      );
    });

    it('should append run application message with formatted timestamp to existing log file', () => {
      fs.existsSync.mockReturnValue(true);
      logger.init();
      const expectedTimestampMessage = 'RUN the application on Jan 05 2023 07:08:09';
      expect(fs.appendFile).toHaveBeenCalledWith(
        expect.stringMatching(/debug_05012023\.txt$/),
        expect.stringContaining(expectedTimestampMessage),
        expect.any(Function)
      );
    });

    it('should handle error during fs.appendFile in init', () => {
      fs.existsSync.mockReturnValue(true);
      const mockError = new Error('Failed to append');
      fs.appendFile.mockImplementation((path, data, cb) => cb(mockError));
      expect(() => logger.init()).not.toThrow();
    });
  });

  describe('logger.logFile', () => {
    const logMessageString = 'Test log message';
    const logObject = { data: 'test', value: 123 };
    const expectedTimestampPrefix = '[Jan 05 2023 07:08:09]'; // Based on mocked date

    it('should append string message with timestamp and newline', () => {
      logger.logFile(logMessageString);
      const expectedMessage = `${expectedTimestampPrefix} ${logMessageString} \n`;
      expect(fs.appendFile).toHaveBeenCalledWith(
        expect.stringMatching(/debug_05012023\.txt$/),
        expectedMessage,
        expect.any(Function)
      );
    });

    it('should handle objects by stringifying them with timestamp and newline', () => {
      logger.logFile(logObject);
      const expectedMessage = `${expectedTimestampPrefix} ${JSON.stringify(logObject, null, 2)} \n`;
      expect(fs.appendFile).toHaveBeenCalledWith(
        expect.stringMatching(/debug_05012023\.txt$/),
        expectedMessage,
        expect.any(Function)
      );
    });

    it('should handle null with timestamp and newline', () => {
      logger.logFile(null);
      const expectedMessage = `${expectedTimestampPrefix} null \n`;
      expect(fs.appendFile).toHaveBeenCalledWith(
        expect.stringMatching(/debug_05012023\.txt$/),
        expectedMessage,
        expect.any(Function)
      );
    });

    it('should handle undefined with timestamp and newline', () => {
      logger.logFile(undefined);
      const expectedMessage = `${expectedTimestampPrefix} undefined \n`;
      expect(fs.appendFile).toHaveBeenCalledWith(
        expect.stringMatching(/debug_05012023\.txt$/),
        expectedMessage,
        expect.any(Function)
      );
    });

    it('should handle numbers with timestamp and newline', () => {
      logger.logFile(12345);
      const expectedMessage = `${expectedTimestampPrefix} 12345 \n`;
      expect(fs.appendFile).toHaveBeenCalledWith(
        expect.stringMatching(/debug_05012023\.txt$/),
        expectedMessage,
        expect.any(Function)
      );
    });
    
    it('should handle booleans with timestamp and newline', () => {
      logger.logFile(true);
      const expectedMessage = `${expectedTimestampPrefix} true \n`;
      expect(fs.appendFile).toHaveBeenCalledWith(
        expect.stringMatching(/debug_05012023\.txt$/),
        expectedMessage,
        expect.any(Function)
      );
    });

    it('should handle error during fs.appendFile in logFile', () => {
      const mockError = new Error('Failed to append log');
      fs.appendFile.mockImplementation((path, data, cb) => cb(mockError));
      expect(() => logger.logFile('some message')).not.toThrow();
    });
  });
}); 