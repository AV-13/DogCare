const jwt = require('jsonwebtoken');
const authenticate = require('../src/middleware/auth');

const buildRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('authenticate middleware', () => {
  it('returns 401 when no Authorization header is provided', () => {
    const req = { headers: {} };
    const res = buildRes();
    const next = jest.fn();

    authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: expect.objectContaining({ code: 'UNAUTHORIZED' }) })
    );
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 401 when the header does not start with Bearer', () => {
    const req = { headers: { authorization: 'Basic abc' } };
    const res = buildRes();
    const next = jest.fn();

    authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 401 for an invalid token', () => {
    const req = { headers: { authorization: 'Bearer not.a.valid.token' } };
    const res = buildRes();
    const next = jest.fn();

    authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 401 for an expired token', () => {
    const expired = jwt.sign({ userId: 'u', email: 'e@e' }, process.env.JWT_SECRET, {
      expiresIn: '-1s',
    });
    const req = { headers: { authorization: `Bearer ${expired}` } };
    const res = buildRes();
    const next = jest.fn();

    authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('attaches req.user and calls next() when the token is valid', () => {
    const token = jwt.sign({ userId: '123', email: 'a@b.com' }, process.env.JWT_SECRET);
    const req = { headers: { authorization: `Bearer ${token}` } };
    const res = buildRes();
    const next = jest.fn();

    authenticate(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.user).toEqual({ userId: '123', email: 'a@b.com' });
  });
});
