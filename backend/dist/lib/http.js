export class AppError extends Error {
    statusCode;
    constructor(message, statusCode = 400) {
        super(message);
        this.statusCode = statusCode;
    }
}
export const asyncHandler = (handler) => (req, res, next) => {
    handler(req, res, next).catch(next);
};
