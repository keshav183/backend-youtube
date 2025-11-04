class ApiError extends Error {
    constructor(
        statusCode,
        message = "something went rong",
        errors = [],
        stack = ""
    ){
        super(message)
        this.statusCode = statusCode
        this.data = null
        this.messagee = message
        this.success = false
        this.errors = errors
    }
}

export {ApiError}