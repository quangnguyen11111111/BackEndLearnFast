import db from "../../models/index";
import { getDetailFileService } from "./getFile";
const formatCreatedAt = (dateString) => {
  return dateString ? new Date(dateString).toLocaleDateString("vi-VN") : null;
};

const updateFileService = async (dataBody) => {
  try {
    const data = {};
    const { fileID, creatorID, fileName, visibility, arrFileDetail } = dataBody;

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
    if (Array.isArray(arrFileDetail) && arrFileDetail.length < 4) {
      data.errCode = 1;
      data.message = "File phải có ít nhất 4 chi tiết";
      return data;
    }
    // Sử dụng transaction để đảm bảo tính toàn vẹn dữ liệu
    await db.sequelize.transaction(async (t) => {
      // Chuẩn bị dữ liệu cập nhật file
      const updateData = {};
      if (fileName) updateData.fileName = fileName;
      if (visibility) updateData.visibility = visibility;

      // Cập nhật chi tiết file nếu có
      if (Array.isArray(arrFileDetail) && arrFileDetail.length >= 4) {
        // Xóa chi tiết cũ
        await db.file_detail.destroy({ where: { fileID }, transaction: t });

        // Lọc và thêm chi tiết mới
        const validDetails = arrFileDetail.filter(
          (item) =>
            item &&
            typeof item.source === "string" &&
            item.source.trim().length > 0
        );

        if (validDetails.length > 0) {
          const detailRows = validDetails.map((item) => ({
            detailID: db.sequelize.fn("UUID"),
            fileID,
            source: item.source,
            target: item.target || null,
          }));
          await db.file_detail.bulkCreate(detailRows, { transaction: t });
          updateData.totalWords = validDetails.length;
        } else {
          updateData.totalWords = 0;
        }
      }

      // Cập nhật file một lần duy nhất
      if (Object.keys(updateData).length > 0) {
        await file.update(updateData, { transaction: t });
      }
    });
    const detailData = await getDetailFileService(fileID);

    data.errCode = 0;
    data.message = "Cập nhật file thành công";
    data.data = {
      fileID: file.fileID,
      fileName: file.fileName,
      visibility: file.visibility,
      totalWords: file.totalWords,
      createdAt: formatCreatedAt(file.createdAt),
      detail: detailData.data,
    };
    return data;
  } catch (error) {
    console.error("Lỗi khi cập nhật file:", error);
    throw error;
  }
};

module.exports = {
  updateFileService: updateFileService,
};
