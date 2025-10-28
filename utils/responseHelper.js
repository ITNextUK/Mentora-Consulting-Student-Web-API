/**
 * Create a standardized success response
 */
const createSuccessResponse = (message, data = null) => {
  const response = {
    success: true,
    message
  };
  
  if (data !== null) {
    response.data = data;
  }
  
  return response;
};

/**
 * Create a standardized error response
 */
const createErrorResponse = (message, error = null) => {
  const response = {
    success: false,
    message
  };
  
  if (error !== null && process.env.NODE_ENV === 'development') {
    response.error = error;
  }
  
  return response;
};

/**
 * Create a paginated response
 */
const createPaginatedResponse = (message, data, pagination) => {
  return {
    success: true,
    message,
    data,
    pagination: {
      page: pagination.page,
      limit: pagination.limit,
      total: pagination.total,
      totalPages: Math.ceil(pagination.total / pagination.limit)
    }
  };
};

module.exports = {
  createSuccessResponse,
  createErrorResponse,
  createPaginatedResponse
};
