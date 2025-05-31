const User = require('../../models/User');

describe('User Model', () => {
  it('should require a name', () => {
    const user = new User({ dni: '12345678', email: 'test@example.com', address: '123 Street', skills: ['coding'], phone: '1234567890', password: 'password123', isGoogleUser: false });
    const error = user.validateSync();
    expect(error.errors.name).toBeDefined();
  });

  it('should require a dni', () => {
    const user = new User({ name: 'Test', email: 'test@example.com', address: '123 Street', skills: ['coding'], phone: '1234567890', password: 'password123', isGoogleUser: false });
    const error = user.validateSync();
    expect(error.errors.dni).toBeDefined();
  });

  it('should require a unique email', () => {
    const user = new User({ name: 'Test', dni: '12345678', address: '123 Street', skills: ['coding'], phone: '1234567890', password: 'password123', isGoogleUser: false });
    const error = user.validateSync();
    expect(error.errors.email).toBeDefined();
  });

  it('should require an address', () => {
    const user = new User({ name: 'Test', dni: '12345678', email: 'test@example.com', skills: ['coding'], phone: '1234567890', password: 'password123', isGoogleUser: false });
    const error = user.validateSync();
    expect(error.errors.address).toBeDefined();
  });

  it('should require a password if not a Google user', () => {
    const user = new User({ isGoogleUser: false, name: 'Test', dni: '12345678', email: 'test@example.com', address: '123 Street', skills: ['coding'], phone: '1234567890' });
    const error = user.validateSync();
    expect(error.errors.password).toBeDefined();
  });

  it('should not require a password if a Google user', () => {
    const user = new User({ isGoogleUser: true, name: 'Test', dni: '12345678', email: 'test@example.com', address: '123 Street', skills: ['coding'], phone: '1234567890' });
    const error = user.validateSync();
    expect(error).toBeUndefined();
  });

  it('should require skills', () => {
    const user = new User({ name: 'Test', dni: '12345678', email: 'test@example.com', address: '123 Street', phone: '1234567890', password: 'password123', isGoogleUser: false, skills: [] });
    const error = user.validateSync();
    console.log('Validation Error:', error);
    expect(error.errors.skills).toBeDefined();
  });

  it('should require a phone number', () => {
    const user = new User({ name: 'Test', dni: '12345678', email: 'test@example.com', address: '123 Street', skills: ['coding'], password: 'password123', isGoogleUser: false });
    const error = user.validateSync();
    expect(error.errors.phone).toBeDefined();
  });

  it('should default role to volunteer', () => {
    const user = new User({ name: 'Test', dni: '12345678', email: 'test@example.com', address: '123 Street', skills: ['coding'], phone: '1234567890', password: 'password123', isGoogleUser: false });
    expect(user.role).toBe('volunteer');
  });

  it('should update updatedAt before saving', () => {
    const user = new User({ name: 'Test', dni: '12345678', email: 'test@example.com', address: '123 Street', skills: ['coding'], phone: '1234567890', password: 'password123', isGoogleUser: false });
    const now = new Date();
    user.save();
    expect(user.updatedAt.getTime()).toBeGreaterThanOrEqual(now.getTime());
  });
});