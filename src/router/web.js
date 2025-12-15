import express from "express";
import userController from "../controllers/userController";
import folderController from "../controllers/folderController";
import fileController from "../controllers/fileController";
let router = express.Router();

let initWebRoutes = (app) => {
  router.post("/api/createNewUser", userController.handleCreateUser); //Tạo mới người dùng
  router.post("/api/loginLocal", userController.handleLoginLocal); //Đăng nhập
  router.post("/api/refreshToken", userController.handleRefreshToken); //refreshToken
  router.post("/api/loginWithGoogle", userController.handleLoginWithGoogle); //Đăng nhập bằng google
  //   //folders
  //   router.get('/api/getAllFoldersUser',folderController.handleGetAllFoldersUser)// lấy dữ liệu folder của 1 người
  //   router.get('/api/getAllFoldersExceptUser',folderController.handleGetAllFoldersExceptUser)// lấy dữ liệu folder trừ người dùng
  //   router.post('/api/createNewFolder',folderController.handleCreateFolder)// tạo folder mới
  //   router.get('/api/getFolderDetail',folderController.handleGetFolderDetail)// lấy chi tiết của folder
  //   //file
  //   router.get('/api/getAllDetailFile',fileController.handleGetAllDetailFile)// lấy dữ liệu chi tiết của file
  //   router.post('/api/createNewFile', fileController.handleCreateFile)
  router.post("/api/files", fileController.handleCreateFile); // tạo file mới
  router.get("/api/files/detail", fileController.handleGetDetailFile); // lấy dữ liệu chi tiết của file
  router.get("/api/files/recently", fileController.handleGetRecentlyFiles); // lấy các file gần đây mà người dùng đã truy cập
  router.get("/api/files/search", fileController.handleSearchFiles); // tìm kiếm file theo tên kèm phân trang
  router.get("/api/files/top", fileController.handleGetTopFiles); // lấy top 6 bộ thẻ được truy cập nhiều nhất
  
  return app.use("/", router);
};

module.exports = initWebRoutes;
