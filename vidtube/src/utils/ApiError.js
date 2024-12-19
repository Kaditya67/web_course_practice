class ApiError extends Error{
    constructor(status, message="something went wrong", errors=[],stack=""){
        super(message);
        this.status = status;
        this.message = message;
        this.success = false;
        this.errors = errors; 

        if(stack){  // stack is always present in dev environment
            this.stack = stack;
        }else{
            Error.captureStackTrace(this, this.constructor);
        }
    }
}

export {ApiError};