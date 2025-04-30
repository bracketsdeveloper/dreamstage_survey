//backend/controller/testController.js
async function testController(req,res){
    try{
        const message = "hello world";
        res.json({
            message:"test message",
            data:message,
            success:true,
            error:false
        })
    }catch(err){
        res.status(400).json({
            message:err.message || err,
            success:false,
            error:true
        })
    }
}        

module.exports = testController