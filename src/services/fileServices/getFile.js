import db from "../../models/index";
// Helper function để format createdAt
const formatCreatedAt = (dateString) => {
  return dateString ? new Date(dateString).toLocaleDateString("vi-VN") : null;
};

// Hàm format cho mảng files
const formatFilesCreatedAt = (files) => {
  return files.map((file) => ({
    ...file,
    createdAt: formatCreatedAt(file.createdAt),
  }));
};
// Lấy dữ liệu chi tiết của file, kèm tiến độ học nếu có userID
const getDetailFileService = async (fileID, userID = null) => {
  try {
    const data = {};

    // Lấy toàn bộ chi tiết file
    const fileDetails = await db.file_detail.findAll({
      where: { fileID },
      raw: true,
    });

    // Lấy thông tin chủ sở hữu file (creatorID)
    const fileMeta = await db.file.findOne({
      where: { fileID },
      attributes: ["creatorID"],
      raw: true,
    });
    const ownerID = fileMeta?.creatorID || null;

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
        creatorID: ownerID,
        flashcardState: 0,
        quizState: 0,
      }));
      return data;
    }
    // Lưu lịch sử truy cập file

    try {
      await db.user_file_history.upsert({
        userID,
        fileID,
        openedAt: new Date(),
      });
    } catch (historyError) {
      console.log("Lưu lịch sử truy cập:", historyError.message);
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
          creatorID: ownerID,
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
const getRecentlyFiles = async (userID, page = 1, limit = 12) => {
  try {
    const response = {
      errCode: 0,
      message: "Lấy dữ liệu thành công",
      data: [],
      pagination: null,
      canNextPage: false,
    };

    const currentPage = Math.max(parseInt(page, 10) || 1, 1);
    const pageSize = Math.max(parseInt(limit, 10) || 12, 1);
    const offset = (currentPage - 1) * pageSize;

    // Đếm tổng số bản ghi để tính phân trang
    const total = await db.user_file_history.count({ where: { userID } });

    // Lấy danh sách fileID từ user_file_history kèm phân trang
    const histories = await db.user_file_history.findAll({
      where: { userID },
      attributes: ["fileID", "openedAt"],
      order: [["openedAt", "DESC"]],
      limit: pageSize,
      offset,
      raw: true,
    });

    if (!histories || histories.length === 0) {
      response.message = "Không có lịch sử truy cập";
      response.pagination = {
        total,
        page: currentPage,
        limit: pageSize,
        pageCount: Math.ceil(total / pageSize) || 0,
      };
      response.canNextPage = currentPage * pageSize < total;
      return response;
    }

    // Lấy thông tin file riêng - chỉ lấy file public hoặc file của user
    const fileIDs = histories.map((h) => h.fileID);
    const files = await db.file.findAll({
      where: {
        fileID: fileIDs,
        [db.Sequelize.Op.or]: [{ visibility: "public" }, { creatorID: userID }],
      },
      attributes: ["fileID", "fileName", "totalWords", "creatorID"],
      raw: true,
    });

    // Map dữ liệu
    const fileMap = {};
    files.forEach((f) => {
      fileMap[f.fileID] = f.fileName;
    });

    response.data = histories.map((item) => {
      const fileInfo = files.find((f) => f.fileID === item.fileID);
      return {
        fileID: item.fileID,
        fileName: fileMap[item.fileID] || null,
        totalWords: fileInfo?.totalWords || 0,
        creatorID: fileInfo?.creatorID || null,
        openedAt: item.openedAt,
      };
    });

    response.pagination = {
      total,
      page: currentPage,
      limit: pageSize,
      pageCount: Math.ceil(total / pageSize) || 0,
    };
    response.canNextPage = currentPage * pageSize < total;

    return response;
  } catch (error) {
    console.error("Lỗi khi lấy lịch sử file gần đây:", error);
    throw error;
  }
};
// Tìm kiếm file theo tên kèm phân trang
const searchFilesService = async (query = "", page = 1, limit = 10) => {
  try {
    const q = String(query).trim();
    const currentPage = Math.max(parseInt(page, 10) || 1, 1);
    const pageSize = Math.max(parseInt(limit, 10) || 10, 1);

    const { count, rows } = await db.file.findAndCountAll({
      where: {
        fileName: { [db.Sequelize.Op.like]: `%${q}%` },
        visibility: "public",
      },
      attributes: [
        "fileID",
        "fileName",
        "visibility",
        "createdAt",
        "totalWords",
        "creatorID",
      ],
      order: [["createdAt", "DESC"]],
      offset: (currentPage - 1) * pageSize,
      limit: pageSize,
      raw: true,
    });

    return {
      errCode: 0,
      message: "Lấy dữ liệu thành công",
      data: formatFilesCreatedAt(rows),
      pagination: {
        total: count,
        page: currentPage,
        limit: pageSize,
        pageCount: Math.ceil(count / pageSize),
      },
    };
  } catch (error) {
    console.error("Lỗi tìm kiếm files:", error);
    return { errCode: 2, message: "Lỗi server", data: [] };
  }
};
//Lấy dữ liệu top 6 file được truy cập nhiều nhất
const getTopFilesService = async () => {
  try {
    const data = {};
    const topFiles = await db.file.findAll({
      subQuery: false,
      where: { visibility: "public" },
      attributes: [
        "fileID",
        "fileName",
        "visibility",
        "createdAt",
        "totalWords",
        "creatorID",
        [
          db.sequelize.fn(
            "COUNT",
            db.sequelize.col("user_file_histories.fileID")
          ),
          "accessCount",
        ],
      ],
      include: [
        {
          model: db.user_file_history,
          attributes: [],
        },
      ],
      group: ["file.fileID"],
      order: [[db.sequelize.literal("accessCount"), "DESC"]],
      limit: 6,
      raw: true,
    });
    if (topFiles && topFiles.length > 0) {
      data.errCode = 0;
      data.message = "Lấy top file thành công";
      data.data = formatFilesCreatedAt(topFiles);
    } else {
      data.errCode = 1;
      data.message = "Không có file nào";
      data.data = [];
    }
    return data;
  } catch (error) {
    console.error("Lỗi khi lấy top file:", error);
    throw error;
  }
};
// Lấy các file tương tự mà người dùng hay truy cập(dựa trên lịch sử truy cập, lấy ra 6 file có cùng chủ đề và được truy cập nhiều nhất)
const getSimilarFilesService = async (userID) => {
  try {
    const data = {};
    // Lấy danh sách fileID mà user đã truy cập
    const userHistories = await db.user_file_history.findAll({
      where: { userID },
      attributes: ["fileID"],
      raw: true,
    });
    const accessedFileIDs = userHistories.map((h) => h.fileID);
    if (accessedFileIDs.length === 0) {
      data.errCode = 1;
      data.message = "Người dùng chưa truy cập file nào";
      data.data = [];
      return data;
    }
    // Lấy các file tương tự dựa trên fileID đã truy cập
    const similarFiles = await db.file.findAll({
      subQuery: false,
      where: {
        fileID: { [db.Sequelize.Op.notIn]: accessedFileIDs },
        visibility: "public",
      },
      attributes: [
        "fileID",
        "fileName",
        "visibility",
        "createdAt",
        "totalWords",
        "creatorID",
        [
          db.sequelize.fn(
            "COUNT",
            db.sequelize.col("user_file_histories.fileID")
          ),
          "accessCount",
        ],
      ],
      include: [
        {
          model: db.user_file_history,
          attributes: [],
        },
      ],
      group: ["file.fileID"],
      order: [[db.sequelize.literal("accessCount"), "DESC"]],
      limit: 6,
      raw: true,
    });
    if (similarFiles && similarFiles.length > 0) {
      data.errCode = 0;
      data.message = "Lấy file tương tự thành công";
      data.data = formatFilesCreatedAt(similarFiles);
    } else {
      data.errCode = 1;
      data.message = "Không có file tương tự";
      data.data = [];
    }
    return data;
  } catch (error) {
    console.error("Lỗi khi lấy file tương tự:", error);
    throw error;
  }
};
// Lấy tất cả các file mà người dùng đã tạo
const getAllFilesOfUserService = async (userID) => {
  try {
    const data = {};
    const userFiles = await db.file.findAll({
      where: { creatorID: userID },
      attributes: [
        "fileID",
        "fileName",
        "visibility",
        "createdAt",
        "totalWords",
        "creatorID",
      ],
      order: [["createdAt", "DESC"]],
      raw: true,
    });
    data.errCode = 0;
    data.message = "Lấy tất cả các file của người dùng thành công";
    data.data = formatFilesCreatedAt(userFiles);
    return data;
  } catch (error) {
    console.error("Lỗi khi lấy tất cả các file của người dùng:", error);
    throw error;
  }
};

module.exports = {
  getDetailFileService: getDetailFileService,
  getRecentlyFiles: getRecentlyFiles,
  searchFilesService: searchFilesService,
  getTopFilesService: getTopFilesService,
  getSimilarFilesService: getSimilarFilesService,
  getAllFilesOfUserService: getAllFilesOfUserService,
};
