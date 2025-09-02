const sendResponse = (res, status, success, message, data = {}) => {
  res.status(status).json({ 
    success, 
    message, 
    ...data 
  });
};

module.exports = sendResponse;
