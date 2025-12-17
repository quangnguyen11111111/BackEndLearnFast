import fileServiceCreateFile from "../services/fileServices/createFile";
import fileServiceGetFile from "../services/fileServices/getFile";
import fileService from "../services/fileService";

// //hàm tạo file
const handleCreateFile = async (req, res) => {
  if (!req.body.fileName || !req.body.creatorID || !req.body.arrFileDetail) {
    return res.status(500).json({
      errCode: 1,
      message: "Không được bỏ trống dữ liệu",
    });
  }
  try {
    const data = await fileServiceCreateFile.createFileService(req.body);
    return res.status(200).json({
      errCode: data.errCode,
      message: data.message,
      data: data.data,
    });
  } catch (error) {
    return res.status(500).json({
      errCode: 2,
      message: "Lỗi server",
      error: error.message,
    });
  }
};
// --------------------- lấy dữ liệu file -----------------------
//lấy dữ liệu chi tiết của file
const handleGetDetailFile = async (req, res) => {
  const fileID = req.query.fileID;
  const userID = req.query.userID || null;

  if (!fileID) {
    return res.status(400).json({
      errCode: 1,
      message: "Vui lòng truyền fileID",
    });
  }

  try {
    const data = await fileServiceGetFile.getDetailFileService(fileID, userID);
    return res.status(200).json({
      errCode: data.errCode,
      message: data.message,
      data: data.data,
    });
  } catch (error) {
    return res.status(500).json({
      errCode: 2,
      message: "Lỗi server",
      error: error.message,
    });
  }
};
//lấy các file gần đây mà người dùng đã truy cập
const handleGetRecentlyFiles = async (req, res) => {
  const { userID } = req.query;

  if (!userID) {
    return res.status(400).json({
      errCode: 1,
      message: "Vui lòng truyền userID",
    });
  }

  try {
    const data = await fileServiceGetFile.getRecentlyFiles(userID);
    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({
      errCode: 2,
      message: "Lỗi server",
      error: error.message,
    });
  }
};
//tìm kiếm file theo tên kèm phân trang
const handleSearchFiles = async (req, res) => {
  const { q = "", page = 1, limit = 10 } = req.query;
  if (q === "") {
    return res.status(400).json({
      errCode: 1,
      message: "Vui lòng truyền từ khóa tìm kiếm",
    });
  }
  try {
    const result = await fileServiceGetFile.searchFilesService(q, page, limit);
    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({
      errCode: 2,
      message: "Lỗi server",
      error: error.message,
    });
  }
};
// lấy top 6 bộ thẻ được truy cập nhiều nhất
const handleGetTopFiles = async (req, res) => {
  try {
    const result = await fileServiceGetFile.getTopFilesService();
    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({
      errCode: 2,
      message: "Lỗi server",
      error: error.message,
    });
  }
};
// lấy các file tương tự mà người dùng hay truy cập(dựa trên lịch sử truy cập, lấy ra 6 file)
const handleGetSimilarFiles = async (req, res) => {
  const { userID } = req.query;
  if (!userID) {
    return res.status(400).json({
      errCode: 1,
      message: "Vui lòng truyền userID",
    });
  }
  try {
    const result = await fileServiceGetFile.getSimilarFilesService(userID);
    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({
      errCode: 2,
      message: "Lỗi server",
      error: error.message,
    });
  }
};
//lấy tất cả các file mà người dùng đã tạo
const handleGetAllFilesOfUser = async (req, res) => {
  const { userID } = req.query;
  if (!userID) {
    return res.status(400).json({
      errCode: 1,
      message: "Vui lòng truyền userID",
    });
  }
  try {
    const result = await fileServiceGetFile.getAllFilesOfUserService(userID);
    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({
      errCode: 2,
      message: "Lỗi server",
      error: error.message,
    });
  }
};
// --------------------- cập nhật file -----------------------
const handleUpdateFile = async (req, res) => {
  const { fileID, creatorID, fileName, visibility, arrFileDetail } = req.body;

  if (!fileID || !creatorID) {
    return res.status(400).json({
      errCode: 1,
      message: "Vui lòng truyền fileID và creatorID",
    });
  }
  try {
    const result = await fileService.updateFileService({
      fileID,
      creatorID,
      fileName,
      visibility,
      arrFileDetail,
    });
    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({
      errCode: 2,
      message: "Lỗi server",
      error: error.message,
    });
  }
}
module.exports = {
  // handleGetAllDetailFile:handleGetAllDetailFile,
  handleCreateFile: handleCreateFile,
  handleGetDetailFile: handleGetDetailFile,
  handleGetRecentlyFiles: handleGetRecentlyFiles,
  handleSearchFiles: handleSearchFiles,
  handleGetTopFiles: handleGetTopFiles,
  handleGetSimilarFiles: handleGetSimilarFiles,
  handleGetAllFilesOfUser: handleGetAllFilesOfUser,
  handleUpdateFile: handleUpdateFile,
};
