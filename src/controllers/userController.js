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
    try {
        let data = await userService.createNewUsers(req.body)
    return res.status(200).json({
        errCode:data.errCode,
        message:data.message
    })
    } catch (error) {
        console.log(error);
        
        return res.status(500).json({
            errCode:2,
            message:"Lỗi server",
            error: error.message,
        })
    }
}
// //Đăng nhập local
let handleLoginLocal=async(req,res)=>{
    if (!req.body.email||!req.body.password) {
        return res.status(500).json({
            errCode:1,
            message:"Không được để trống dữ liệu"
        })
    }
    try {
        let data = await userService.LoginServices(req.body)
        return res.status(200).json({
            errCode:data.errCode,
            message:data.message,
            data:data.data,
            accessToken:data.accessToken,
            refreshToken:data.refreshToken
        })
    } catch (error) {
        return res.status(500).json({
            errCode:2,
            message:"Lỗi server",
            error: error.message,
        })
    }
}
// //làm mới token
let handleRefreshToken = async(req,res)=>{
    if (!req.body.refreshToken) {
        return res.status(401).json({ 
            errCode:1,
            message: "Không có token" });
    }
    try {
      let data = await userService.refreshTokenService(req.body.refreshToken);
      return res.status(200).json({
        errCode: data.errCode,
        message: data.message,
        newAccessToken: data.newAccessToken,
        data: data.data,
      });
    } catch (error) {
      return res.status(500).json({
        errCode: 2,
        message: "Lỗi server",
      });
    }
} 
// //đăng nhập bằng google
let handleLoginWithGoogle=async(req,res)=>{
    if (!req.body.idToken) {
        return res.status(500).json({
            errCode:1,
            message:"Không được để trống dữ liệu"
        })
    }
   try {
    let data = await userService.loginWithGoogleService(req.body.idToken)
    return res.status(200).json({
        errCode:data.errCode,
        message:data.message,
        data:data.data,
        accessToken:data.accessToken,
        refreshToken:data.refreshToken
    })
   } catch (error) {
    return res.status(500).json({
        errCode:2,
        message:"Lỗi server" 
    })
   }
}
module.exports = {

    handleCreateUser:handleCreateUser,
    handleLoginLocal:handleLoginLocal,
    handleRefreshToken:handleRefreshToken,
    handleLoginWithGoogle:handleLoginWithGoogle
  };