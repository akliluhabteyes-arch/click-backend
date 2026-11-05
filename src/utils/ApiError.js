export class ApiError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details;
  }

  static badRequest(message = "Bad request", details) {
    return new ApiError(400, message, details);
  }
  static unauthorized(message = "Authentication required") {
    return new ApiError(401, message);
  }
  static forbidden(message = "You do not have access to this resource") {
    return new ApiError(403, message);
  }
  static notFound(message = "Resource not found") {
    return new ApiError(404, message);
  }
  static conflict(message = "Resource already exists") {
    return new ApiError(409, message);
  }
}

// Maps Supabase / PostgREST / Postgres errors to HTTP errors.
export const fromDbError = (error) => {
  switch (error.code) {
    case "PGRST116":
      return ApiError.notFound();
    case "PGRST205":
    case "42P01":
      return new ApiError(
        500,
        "Database table missing — run the SQL files in Backend/database in Supabase",
        error.message
      );
    case "23505":
      return ApiError.conflict("A record with the same unique value (e.g. slug) already exists");
    case "23503":
      return ApiError.badRequest("Referenced record does not exist");
    case "23502":
    case "23514":
    case "22P02":
      return ApiError.badRequest(error.message);
    default:
      return new ApiError(500, "Database error", error.message);
  }
};

// Unwraps a Supabase response: returns data or throws a mapped ApiError.
export const unwrap = ({ data, error }) => {
  if (error) throw fromDbError(error);
  return data;
};
