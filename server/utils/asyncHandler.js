const AsyncHandler=(requestHandler)=> async(req, res, next)=> {
    Promise.resolve(requestHandler(req, res, next)).catch((error)=>next(error));
}


export { AsyncHandler };

/* 

    const asynchandler= ()=>{}
    const asynchandler= (func)=>()=>{}
    const asynchandler=(func)=>async()={}
*/