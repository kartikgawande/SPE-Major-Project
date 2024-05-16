class ErrorHandler extends Error{
    constructor(message,statuscode){
        super(message);
        this.statuscode=statuscode;
    }
}

export const errorMiddleware=(err,req,res,next)=>{
    err.msg=err.message || "Internal server error";
    err.statuscode=err.statuscode || 500;
    if(err.name=="CaseError"){
        const message=`Resoursce not found. Invalid${err.path}`
        err=new ErrorHandler(message,400);
    }

    if(err.code==11000){
        const message=`Duplicate ${Object.keys(err.keyValue)}Entered`;
        err=new ErrorHandler(message,400);
    }
    if(err.name=="JsonWebTokenError"){
        const message=`Json web Token is Invalid,Try again.`;
        err=new ErrorHandler(message,400);
    }
    if(err.name=="TokenExpiredError"){
        const message=`Json web Token is Expired. Try again.`;
        err=new ErrorHandler(message,400);
    }

    return res.status(err.statuscode).json({
        success:false,
        message:err.message,
    })
    if(err.name="Exception"){
        const message=`Some Exception is Occured`;
        err=new ErrorHandler(message,400);
    }
}
export default ErrorHandler;