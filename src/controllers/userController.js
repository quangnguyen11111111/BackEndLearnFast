import userService from "../services/userService"
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// //Tạo mới người dùng
let handleCreateUser = async(req,res)=>
{
    if (!req.body.email||!req.body.password||!req.body.username) {
        return res.status(500).json({
            errCode:1,
            message:"Không được bỏ trống dữ liệu"
        })
    }else if (!emailRegex.test(req.body.email)) {
        return res.status(500).json({
            errCode:1,
            message:"Email không đúng định dạng"
        })
    }
    let data = await userService.createNewUsers(req.body)
    return res.status(200).json({
        errCode:data.errCode,
        message:data.message
    })
}
// //Đăng nhập local
let handleLoginLocal=async(req,res)=>{
    if (!req.body.email||!req.body.password) {
        return res.status(500).json({
            errCode:1,
            message:"Không được để trống dữ liệu"
        })
    }
    let data = await userService.LoginServices(req.body)
    return res.status(200).json({
        errCode:data.errCode,
        message:data.message,
        data:data.data,
        accessToken:data.accessToken,
        refreshToken:data.refreshToken
    })
}
// //làm mới token
let handleRefreshToken = async(req,res)=>{
    if (!req.body.refreshToken) {
        return res.status(401).json({ 
            errCode:1,
            message: "Không có token" });
    }
    let data = await userService.refreshToken(req.body.refreshToken)
    return res.status(200).json({
        errCode:data.errCode,
        message:data.message,
        accessToken:data.newAccessToken,
        data:data.data
    })
} 
// //đăng nhập bằng google
let handleLoginWithGoogle=async(req,res)=>{
    if (!req.body) {
        return res.status(500).json({
            errCode:1,
            message:"Không được để trống dữ liệu"
        })
    }
    let data = await userService.loginWithGoogleService(req.body.token)
    return res.status(200).json({
        errCode:data.errCode,
        message:data.message,
        data:data.data,
        accessToken:data.accessToken,
        refreshToken:data.refreshToken
    })
}
module.exports = {

    handleCreateUser:handleCreateUser,
    handleLoginLocal:handleLoginLocal,
    handleRefreshToken:handleRefreshToken,
    handleLoginWithGoogle:handleLoginWithGoogle
  };