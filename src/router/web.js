import express from "express";
import userController from "../controllers/userController";
import folderController from "../controllers/folderController";
import fileController from "../controllers/fileController";
let router = express.Router();

let initWebRoutes = (app) => {
  // --------------------- User routes -----------------------
  router.post("/api/createNewUser", userController.handleCreateUser); //Tạo mới người dùng
  router.post("/api/loginLocal", userController.handleLoginLocal); //Đăng nhập
  router.post("/api/refreshToken", userController.handleRefreshToken); //refreshToken
  router.post("/api/loginWithGoogle", userController.handleLoginWithGoogle); //Đăng nhập bằng google
// --------------------- Files routes -----------------------
  router.post("/api/files", fileController.handleCreateFile); // tạo file mới
  router.get("/api/files/detail", fileController.handleGetDetailFile); // lấy dữ liệu chi tiết của file
  router.get("/api/files/recently", fileController.handleGetRecentlyFiles); // lấy các file gần đây mà người dùng đã truy cập
  router.get("/api/files/search", fileController.handleSearchFiles); // tìm kiếm file theo tên kèm phân trang
  router.get("/api/files/top", fileController.handleGetTopFiles); // lấy top 6 bộ thẻ được truy cập nhiều nhất
  router.get("/api/files/similar", fileController.handleGetSimilarFiles); // lấy các file tương tự mà người dùng hay truy cập
  router.get("/api/files/user", fileController.handleGetAllFilesOfUser);//lấy tất cả các file mà người dùng đã tạo
  router.put("/api/files", fileController.handleUpdateFile);// cập nhật file (phải kiểm tra đó có đúng là người sở hữu file không)
  router.put("/api/files/progress", fileController.handleUpdateLearningProgress);// cập nhật quá trình học tập của người dùng
  router.delete("/api/files", fileController.handleDeleteFile); // xóa file
// --------------------- Folder routes -----------------------

// --------------------- AI api -----------------------
  router.post("/api/ai/generateFlashcards", fileController.handleAIGenerateFlashcards); // Tạo flashcards bằng AI
  return app.use("/", router);
};

module.exports = initWebRoutes;
