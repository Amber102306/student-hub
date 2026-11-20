export const notFound = (req, res) => res.status(404).json({ message: 'Route not found.' });

export const errorHandler = (err, req, res, next) => { // eslint-disable-line no-unused-vars
  if (err.status) return res.status(err.status).json({ message: err.message });
  if (err.name === 'ValidationError')
    return res.status(400).json({ message: Object.values(err.errors).map((e) => e.message).join(' ') });
  if (err.code === 11000)
    return res.status(409).json({ message: `${Object.keys(err.keyPattern || {}).join(', ')} already exists.` });
  if (err.name === 'CastError') return res.status(400).json({ message: 'Invalid id.' });
  console.error(err);
  res.status(500).json({ message: 'Server error.' });
};
