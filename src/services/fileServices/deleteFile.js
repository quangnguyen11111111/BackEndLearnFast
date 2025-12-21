import db from "../../models/index";
const deleteFileService = async (dataBody) => {
  const data = {};
  const { fileID, creatorID } = dataBody;
  try {
    // Kiểm tra file tồn tại và thuộc về người dùng
    const file = await db.file.findOne({
      where: { fileID, creatorID },
      raw: false,
    });
    if (!file) {
      data.errCode = 1;
      data.message = "File không tồn tại hoặc không thuộc về người dùng";
      return data;
    }
    // Xóa file
    await file.destroy();
    data.errCode = 0;
    data.message = "Xóa file thành công";
    return data;
  } catch (error) {
    data.errCode = 2;
    data.message = "Lỗi server";
    data.error = error.message;
    return data;
  }
};
module.exports = {
  deleteFileService,
};
