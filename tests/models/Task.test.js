const Task = require('../../models/Task');

describe('Task Model', () => {
  it('should require a title', () => {
    const task = new Task({ description: 'Test description', project: '507f1f77bcf86cd799439011', estimatedHours: 2 });
    const error = task.validateSync();
    expect(error.errors.title).toBeDefined();
  });

  it('should require a description', () => {
    const task = new Task({ title: 'Test Task', project: '507f1f77bcf86cd799439011', estimatedHours: 2 });
    const error = task.validateSync();
    expect(error.errors.description).toBeDefined();
  });
  it('should not require estimatedHours when default value is used', () => {
    const task = new Task({ title: 'Test Task', description: 'Test description', project: '507f1f77bcf86cd799439011' });
    const error = task.validateSync();
    expect(error).toBeUndefined();
    expect(task.estimatedHours).toBe(1);
  });

  it('should require a project', () => {
    const task = new Task({ title: 'Test Task', description: 'Test description', estimatedHours: 2 });
    const error = task.validateSync();
    expect(error.errors.project).toBeDefined();
  });

  it('should default status to pending', () => {
    const task = new Task({ title: 'Test Task', description: 'Test description', project: '507f1f77bcf86cd799439011', estimatedHours: 2 });
    expect(task.status).toBe('pending');
  });

  it('should default priority to medium', () => {
    const task = new Task({ title: 'Test Task', description: 'Test description', project: '507f1f77bcf86cd799439011', estimatedHours: 2 });
    expect(task.priority).toBe('medium');
  });

  it('should default estimatedHours to 1', () => {
    const task = new Task({ title: 'Test Task', description: 'Test description', project: '507f1f77bcf86cd799439011' });
    expect(task.estimatedHours).toBe(1);
  });

  it('should validate estimatedHours minimum value', () => {
    const task = new Task({ title: 'Test Task', description: 'Test description', project: '507f1f77bcf86cd799439011', estimatedHours: 0.2 });
    const error = task.validateSync();
    expect(error.errors.estimatedHours).toBeDefined();
  });

  it('should default completionQuality to pending', () => {
    const task = new Task({ title: 'Test Task', description: 'Test description', project: '507f1f77bcf86cd799439011', estimatedHours: 2 });
    expect(task.completionQuality).toBe('pending');
  });

  it('should default totalHoursLogged to 0', () => {
    const task = new Task({ title: 'Test Task', description: 'Test description', project: '507f1f77bcf86cd799439011', estimatedHours: 2 });
    expect(task.totalHoursLogged).toBe(0);
  });
});
