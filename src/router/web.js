// import express from "express";
// import userController from "../controllers/userController"
// import folderController from '../controllers/folderController'
// import fileController from '../controllers/fileController'
// let router = express.Router();

// let initWebRoutes = (app) => {
//   router.post("/api/createNewUser",userController.handleCreateUser)//Tạo mới người dùng
//   router.post("/api/login",userController.handleLogin)//Đăng nhập
//   router.post("/api/refreshToken", userController.handleRefreshToken)//refreshToken
//   router.post("/api/loginWithGoogle",userController.handleLoginWithGoogle)
//   //folders
//   router.get('/api/getAllFoldersUser',folderController.handleGetAllFoldersUser)// lấy dữ liệu folder của 1 người
//   router.get('/api/getAllFoldersExceptUser',folderController.handleGetAllFoldersExceptUser)// lấy dữ liệu folder trừ người dùng
//   router.post('/api/createNewFolder',folderController.handleCreateFolder)// tạo folder mới
//   router.get('/api/getFolderDetail',folderController.handleGetFolderDetail)// lấy chi tiết của folder
//   //file
//   router.get('/api/getAllDetailFile',fileController.handleGetAllDetailFile)// lấy dữ liệu chi tiết của file
//   router.post('/api/createNewFile', fileController.handleCreateFile)
//   return app.use("/", router)
// };

// module.exports = initWebRoutes; 
 