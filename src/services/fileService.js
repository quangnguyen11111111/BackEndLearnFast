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
// const createFileService = async (dataBody) => {
//   try {
//     const data = {};
//     const creator = await checkAccount(dataBody.creatorID);
//     if (!creator) {
//       data.errCode = 1;
//       data.message = "Người tạo không tồn tại";
//       return data;
//     }
//     // Tạo file mới
//     const createFile = await db.file.create({
//       fileName: dataBody.fileName,
//       creatorID: dataBody.creatorID,
//       visibility: dataBody.visibility || "public",
//     });
//     if (createFile) {
//       // Thêm chi tiết file nếu có
//       if (
//         Array.isArray(dataBody.arrFileDetail) &&
//         dataBody.arrFileDetail.length > 0
//       ) {
//         await addDetailFile(dataBody.arrFileDetail, createFile.fileID);
//         await createFile.update({ totalWords: dataBody.arrFileDetail.length });
//       }

//       data.errCode = 0;
//       data.message = "Tạo file thành công";
//       data.data = createFile;
//     }

//     return data;
//   } catch (e) {
//     throw e;
//   }
// };
// // Hàm thêm chi tiết file theo mô hình file_detail (detailID, fileID, source, target)
// const addDetailFile = async (dataBody, fileID) => {
//   try {
//     if (!Array.isArray(dataBody) || dataBody.length === 0) {
//       return;
//     }

//     // Chỉ chấp nhận các trường hợp lệ: source (bắt buộc), target (tùy chọn)
//     const rows = dataBody
//       .filter(
//         (item) =>
//           item &&
//           typeof item.source === "string" &&
//           item.source.trim().length > 0
//       )
//       .map((item) => ({
//         // tạo detailID bằng UUID() của MySQL để phù hợp CHAR(36)
//         detailID: db.sequelize.fn("UUID"),
//         fileID,
//         source: item.source,
//         target: item.target ?? null,
//       }));

//     if (rows.length === 0) {
//       return;
//     }

//     // Dùng transaction để đảm bảo đồng nhất
//     await db.sequelize.transaction(async (t) => {
//       await db.file_detail.bulkCreate(rows, { transaction: t });
//     });
//   } catch (error) {
//     console.error("Lỗi khi thêm chi tiết file:", error);
//     throw error;
//   }
// };
// // Hàm kiểm tra tài khoản người tạo
// const checkAccount = async (account) => {
//   try {
//     const check = await db.users.findOne({
//       where: { userID: account },
//       raw: true,
//     });
//     return check; // trả về true nếu không tồn tại tài khoản
//   } catch (e) {
//     throw e;
//   }
// };
// Hàm lấy chi tiết file và tiến độ học
const getDetailFileService = async (fileID, userID = null) => {
  try {
    const data = {};

    // Lấy toàn bộ chi tiết file
    const fileDetails = await db.file_detail.findAll({
      where: { fileID },
      raw: true,
    });

    if (!fileDetails || fileDetails.length === 0) {
      data.errCode = 1;
      data.message = "Không tìm thấy chi tiết file";
      data.data = [];
      return data;
    }

    // Nếu không truyền userID, chỉ trả lại fileDetails
    if (!userID) {
      data.errCode = 0;
      data.message = "Lấy dữ liệu thành công";
      data.data = fileDetails.map((item) => ({
        ...item,
        flashcardState: 0,
        quizState: 0,
      }));
      return data;
    }

    // Nếu có userID, lấy tiến độ học và tạo nếu chưa có
    const detailsWithProgress = await Promise.all(
      fileDetails.map(async (detail) => {
        let progress = await db.learning_progress.findOne({
          where: {
            userID,
            fileID,
            detailID: detail.detailID,
          },
          raw: true,
        });

        // Nếu chưa có progress, tạo mới với giá trị mặc định
        if (!progress) {
          progress = await db.learning_progress.create({
            userID,
            fileID,
            detailID: detail.detailID,
            flashcardState: 0,
            quizState: 0,
          });
          progress = progress.toJSON ? progress.toJSON() : progress;
        }

        return {
          ...detail,
          flashcardState: progress.flashcardState,
          quizState: progress.quizState,
        };
      })
    );

    data.errCode = 0;
    data.message = "Lấy dữ liệu thành công";
    data.data = detailsWithProgress;
    return data;
  } catch (error) {
    console.error("Lỗi khi lấy chi tiết file:", error);
    throw error;
  }
};

// Lấy tối đa 12 file người dùng đã truy cập, sắp xếp lần truy cập đầu tiên ở đầu danh sách
const getRecentlyFiles = async (userID) => {
  try {
    const response = {
      errCode: 0,
      message: "Lấy dữ liệu thành công",
      data: [],
    };

    const histories = await db.user_file_history.findAll({
      where: { userID },
      include: [
        {
          model: db.file,
          attributes: ["fileID", "fileName"],
        },
      ],
      order: [["openedAt", "ASC"]],
      limit: 12,
    });

    if (!histories || histories.length === 0) {
      response.message = "Không có lịch sử truy cập";
      return response;
    }

    response.data = histories.map((item) => ({
      fileID: item.fileID,
      fileName: item.file ? item.file.fileName : null,
      openedAt: item.openedAt,
    }));

    return response;
  } catch (error) {
    console.error("Lỗi khi lấy lịch sử file gần đây:", error);
    throw error;
  }
};

module.exports = {
  // getAllDetailFileService:getAllDetailFileService,
  // createFileService: createFileService,
  getDetailFileService: getDetailFileService,
  getRecentlyFiles: getRecentlyFiles,
};
