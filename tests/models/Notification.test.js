const Notification = require('../../models/Notification');

describe('Notification Model', () => {
  it('should require a userId', () => {
    const notification = new Notification({ 
      message: 'Test notification message'
    });
    const error = notification.validateSync();
    expect(error.errors.userId).toBeDefined();
  });

  it('should require a message', () => {
    const notification = new Notification({ 
      userId: '507f1f77bcf86cd799439011'
    });
    const error = notification.validateSync();
    expect(error.errors.message).toBeDefined();
  });

  it('should default read to false', () => {
    const notification = new Notification({ 
      userId: '507f1f77bcf86cd799439011',
      message: 'Test notification message'
    });
    expect(notification.read).toBe(false);
  });

  it('should default createdAt to current date', () => {
    const notification = new Notification({ 
      userId: '507f1f77bcf86cd799439011',
      message: 'Test notification message'
    });
    expect(notification.createdAt).toBeDefined();
    expect(notification.createdAt).toBeInstanceOf(Date);
  });

  it('should accept read as true', () => {
    const notification = new Notification({ 
      userId: '507f1f77bcf86cd799439011',
      message: 'Test notification message',
      read: true
    });
    const error = notification.validateSync();
    expect(error).toBeUndefined();
    expect(notification.read).toBe(true);
  });

  it('should accept custom createdAt date', () => {
    const customDate = new Date('2025-01-01');
    const notification = new Notification({ 
      userId: '507f1f77bcf86cd799439011',
      message: 'Test notification message',
      createdAt: customDate
    });
    expect(notification.createdAt).toEqual(customDate);
  });

  it('should validate ObjectId format for userId', () => {
    const notification = new Notification({ 
      userId: 'invalid_id',
      message: 'Test notification message'
    });
    const error = notification.validateSync();
    expect(error.errors.userId).toBeDefined();
  });

  it('should accept valid notification with all required fields', () => {
    const notification = new Notification({ 
      userId: '507f1f77bcf86cd799439011',
      message: 'Test notification message'
    });
    const error = notification.validateSync();
    expect(error).toBeUndefined();
    expect(notification.userId.toString()).toBe('507f1f77bcf86cd799439011');
    expect(notification.message).toBe('Test notification message');
  });
  it('should reject empty string as message', () => {
    const notification = new Notification({ 
      userId: '507f1f77bcf86cd799439011',
      message: ''
    });
    const error = notification.validateSync();
    expect(error).toBeDefined();
    expect(error.errors.message).toBeDefined();
    expect(error.errors.message.message).toBe('Path `message` is required.');
  });

  it('should accept long message', () => {
    const longMessage = 'This is a very long notification message that contains multiple words and should be accepted by the model validation without any issues since there is no maximum length specified in the schema.';
    const notification = new Notification({ 
      userId: '507f1f77bcf86cd799439011',
      message: longMessage
    });
    const error = notification.validateSync();
    expect(error).toBeUndefined();
    expect(notification.message).toBe(longMessage);
  });
});
