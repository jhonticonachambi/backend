const Postulation = require('../../models/Postulation');

describe('Postulation Model', () => {
  it('should require a userId', () => {
    const postulation = new Postulation({ 
      projectId: '507f1f77bcf86cd799439011'
    });
    const error = postulation.validateSync();
    expect(error.errors.userId).toBeDefined();
  });

  it('should require a projectId', () => {
    const postulation = new Postulation({ 
      userId: '507f1f77bcf86cd799439012'
    });
    const error = postulation.validateSync();
    expect(error.errors.projectId).toBeDefined();
  });

  it('should default status to pending', () => {
    const postulation = new Postulation({ 
      userId: '507f1f77bcf86cd799439012',
      projectId: '507f1f77bcf86cd799439011'
    });
    expect(postulation.status).toBe('pending');
  });

  it('should default applicationDate to current date', () => {
    const postulation = new Postulation({ 
      userId: '507f1f77bcf86cd799439012',
      projectId: '507f1f77bcf86cd799439011'
    });
    expect(postulation.applicationDate).toBeDefined();
    expect(postulation.applicationDate).toBeInstanceOf(Date);
  });

  it('should accept valid status values', () => {
    const postulation = new Postulation({ 
      userId: '507f1f77bcf86cd799439012',
      projectId: '507f1f77bcf86cd799439011',
      status: 'accepted'
    });
    const error = postulation.validateSync();
    expect(error).toBeUndefined();
    expect(postulation.status).toBe('accepted');
  });

  it('should reject invalid status values', () => {
    const postulation = new Postulation({ 
      userId: '507f1f77bcf86cd799439012',
      projectId: '507f1f77bcf86cd799439011',
      status: 'invalid_status'
    });
    const error = postulation.validateSync();
    expect(error.errors.status).toBeDefined();
  });

  it('should accept rejected status', () => {
    const postulation = new Postulation({ 
      userId: '507f1f77bcf86cd799439012',
      projectId: '507f1f77bcf86cd799439011',
      status: 'rejected'
    });
    const error = postulation.validateSync();
    expect(error).toBeUndefined();
    expect(postulation.status).toBe('rejected');
  });

  it('should allow custom applicationDate', () => {
    const customDate = new Date('2025-01-01');
    const postulation = new Postulation({ 
      userId: '507f1f77bcf86cd799439012',
      projectId: '507f1f77bcf86cd799439011',
      applicationDate: customDate
    });
    expect(postulation.applicationDate).toEqual(customDate);
  });

  it('should validate ObjectId format for userId and projectId', () => {
    const postulation = new Postulation({ 
      userId: 'invalid_id',
      projectId: 'invalid_id'
    });
    const error = postulation.validateSync();
    expect(error.errors.userId).toBeDefined();
    expect(error.errors.projectId).toBeDefined();
  });

  it('should create valid postulation with all required fields', () => {
    const postulation = new Postulation({ 
      userId: '507f1f77bcf86cd799439012',
      projectId: '507f1f77bcf86cd799439011'
    });
    const error = postulation.validateSync();
    expect(error).toBeUndefined();
    expect(postulation.userId.toString()).toBe('507f1f77bcf86cd799439012');
    expect(postulation.projectId.toString()).toBe('507f1f77bcf86cd799439011');
  });
});
