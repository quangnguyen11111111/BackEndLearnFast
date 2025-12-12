import db from "../models/index";
// //hàm ấy dữ liệu detail file
// let getAllDetailFileService = (fileID)=>{
//     return new Promise(async(resolve, reject) => {
//         try {
//             let data={}
//         let detailFile = await db.fileDetail.findAll({
//             attributes: {exclude:["fileID","fileDetailStatus"]},
//             where:{
//                 fileID
//             }
//         })
//         if (detailFile) {
//             data.errCode=0
//             data.data=detailFile
//         }else{
//             data.errCode=1
//             data.data=[]
//         }
//         resolve(data)
//         } catch (e) {
//             reject(e)
//         }
//     })
// }

// hàm tạo file
const createFileService = async (dataBody) => {
  try {
    const data = {};
    // Tạo file mới
    const createFile = await db.file.create({
      fileName: dataBody.fileName,
      creatorID: dataBody.creatorID,
    });

    if (createFile) {
      // Thêm chi tiết file nếu có
      if (
        Array.isArray(dataBody.arrFileDetail) &&
        dataBody.arrFileDetail.length > 0
      ) {
        await addDetailFile(dataBody.arrFileDetail, createFile.fileID);
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
      await db.fileDetail.bulkCreate(rows, { transaction: t });
    });
  } catch (error) {
    console.error("Lỗi khi thêm chi tiết file:", error);
    throw error;
  }
};

module.exports = {
  // getAllDetailFileService:getAllDetailFileService,
  createFileService: createFileService,
};
