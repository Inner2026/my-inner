import { Types } from 'mongoose';

const test = { _id: new Types.ObjectId(), slug: 'energy', active: true, removedAt: null as Date | null, save: jest.fn(), deleteOne: jest.fn() };
jest.mock('../../models/Test', () => ({ Test: { findById: jest.fn() } }));
jest.mock('../../models/TestVersion', () => ({ TestVersion: { find: jest.fn(), deleteMany: jest.fn() } }));
jest.mock('../../models/Question', () => ({ Question: { deleteMany: jest.fn() } }));
jest.mock('../../models/ResultDefinition', () => ({ ResultDefinition: { deleteMany: jest.fn() } }));
jest.mock('../../models/TestAttempt', () => ({ TestAttempt: { countDocuments: jest.fn() } }));
jest.mock('../../models/Purchase', () => ({ Purchase: { countDocuments: jest.fn() } }));
jest.mock('../../models/TestRating', () => ({ TestRating: { deleteMany: jest.fn() } }));
jest.mock('../../models/MarketingDelivery', () => ({ MarketingDelivery: { deleteMany: jest.fn() } }));

import { Test } from '../../models/Test';
import { TestVersion } from '../../models/TestVersion';
import { Question } from '../../models/Question';
import { TestAttempt } from '../../models/TestAttempt';
import { Purchase } from '../../models/Purchase';
import { deleteTest } from './testContent.service';

describe('deleteTest', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    test.active = true; test.removedAt = null;
    (Test.findById as jest.Mock).mockResolvedValue(test);
    (TestVersion.find as jest.Mock).mockReturnValue({ select: () => ({ lean: () => Promise.resolve([{ _id: new Types.ObjectId() }]) }) });
  });

  it('permanently deletes a test with no customer history, including its content', async () => {
    (Purchase.countDocuments as jest.Mock).mockResolvedValue(0);
    (TestAttempt.countDocuments as jest.Mock).mockResolvedValue(0);
    const result = await deleteTest(test._id.toString());
    expect(result.mode).toBe('deleted');
    expect(Question.deleteMany).toHaveBeenCalled();
    expect(TestVersion.deleteMany).toHaveBeenCalledWith({ testId: test._id });
    expect(test.deleteOne).toHaveBeenCalled();
  });

  it('removes (keeps history of) a test that has purchases, instead of erroring', async () => {
    (Purchase.countDocuments as jest.Mock).mockResolvedValue(3);
    (TestAttempt.countDocuments as jest.Mock).mockResolvedValue(2);
    const result = await deleteTest(test._id.toString());
    expect(result).toMatchObject({ mode: 'removed', purchases: 3, attempts: 2 });
    expect(test.active).toBe(false);
    expect(test.removedAt).toBeInstanceOf(Date);
    expect(test.slug).toBe('energy');
    expect(test.deleteOne).not.toHaveBeenCalled();
    expect(Question.deleteMany).not.toHaveBeenCalled();
  });

  it('gives a clear 404 for an unknown test and 400 for a bad id', async () => {
    (Test.findById as jest.Mock).mockResolvedValue(null);
    await expect(deleteTest(new Types.ObjectId().toString())).rejects.toThrow(/not found/i);
    await expect(deleteTest('nope')).rejects.toThrow(/Invalid test id/);
  });
});
