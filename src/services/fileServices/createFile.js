import db from "../../models/index";
// //hàm tạo file
const createFileService = async (dataBody) => {
  try {
    const data = {};
    const creator = await checkAccount(dataBody.creatorID);
    if (!creator) {
      data.errCode = 1;
      data.message = "Người tạo không tồn tại";
      return data;
    }
    // Tạo file mới
    const createFile = await db.file.create({
      fileName: dataBody.fileName,
      creatorID: dataBody.creatorID,
      visibility: dataBody.visibility || "public",
    });
    if (createFile) {
      // Thêm chi tiết file nếu có
      if (
        Array.isArray(dataBody.arrFileDetail) &&
        dataBody.arrFileDetail.length > 0
      ) {
        await addDetailFile(dataBody.arrFileDetail, createFile.fileID);
        await createFile.update({ totalWords: dataBody.arrFileDetail.length });
      }

      data.errCode = 0;
      data.message = "Tạo file thành công";
      data.data = createFile;
    }

    return data;
  } catch (e) {
    throw e;
  }
};
// Hàm thêm chi tiết file theo mô hình file_detail (detailID, fileID, source, target)
const addDetailFile = async (dataBody, fileID) => {
  try {
    if (!Array.isArray(dataBody) || dataBody.length === 0) {
      return;
    }

    // Chỉ chấp nhận các trường hợp lệ: source (bắt buộc), target (tùy chọn)
    const rows = dataBody
      .filter( 
        (item) =>
          item &&
          typeof item.source === "string" &&
          item.source.trim().length > 0
      )
      .map((item) => ({
        // tạo detailID bằng UUID() của MySQL để phù hợp CHAR(36)
        detailID: db.sequelize.fn("UUID"),
        fileID,
        source: item.source,
        target: item.target ?? null,
      }));

    if (rows.length === 0) {
      return;
    }

    // Dùng transaction để đảm bảo đồng nhất
    await db.sequelize.transaction(async (t) => {
      await db.file_detail.bulkCreate(rows, { transaction: t });
    });
  } catch (error) {
    console.error("Lỗi khi thêm chi tiết file:", error);
    throw error;
  }
};
// Hàm kiểm tra tài khoản người tạo
const checkAccount = async (account) => {
  try {
    const check = await db.users.findOne({
      where: { userID: account },
      raw: true,
    });
    return check; // trả về true nếu không tồn tại tài khoản
  } catch (e) {
    throw e;
  }
};
module.exports = {
  createFileService: createFileService,
};