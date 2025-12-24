import db from "../../models/index";
// Helper function để format createdAt
const formatCreatedAt = (dateString) => {
  if (!dateString) return null;
  const date = new Date(dateString);
  const month = date.getMonth() + 1;
  const year = date.getFullYear();
  return `THÁNG ${month} NĂM ${year}`;
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
// Lấy tối thiểu 12 file người dùng đã truy cập, sắp xếp lần truy cập đầu tiên ở đầu danh sách
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
      include: [
        {
          model: db.users,
          attributes: ["username", "avatar"],
        },
      ],
      raw: true,
      nest: true,
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
        ownerName: fileInfo?.user?.username || null,
        ownerAvatar: fileInfo?.user?.avatar || null,
        openedAt: formatCreatedAt(item.openedAt),
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
      include: [
        {
          model: db.users,
          attributes: ["username", "avatar"],
        },
      ],
      order: [["createdAt", "DESC"]],
      offset: (currentPage - 1) * pageSize,
      limit: pageSize,
      raw: true,
      nest: true,
    });

    // Format data với thông tin user
    const formattedRows = rows.map((file) => ({
      fileID: file.fileID,
      fileName: file.fileName,
      visibility: file.visibility,
      createdAt: formatCreatedAt(file.createdAt),
      totalWords: file.totalWords,
      creatorID: file.creatorID,
      ownerName: file.user?.username || null,
      ownerAvatar: file.user?.avatar || null,
    }));

    return {
      errCode: 0,
      message: "Lấy dữ liệu thành công",
      data: formattedRows,
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
const getTopFilesService = async (userID) => {
  try {
    const data = {};
    const topFiles = await db.file.findAll({
      subQuery: false,
      where: {
        visibility: "public",
        // Không lấy file của người dùng hiện tại
        ...(userID && { creatorID: { [db.Sequelize.Op.ne]: userID } }),
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
        {
          model: db.users,
          attributes: ["username", "avatar"],
        },
      ],
      group: ["file.fileID", "user.userID"],
      order: [[db.sequelize.literal("accessCount"), "DESC"]],
      limit: 6,
      raw: true,
      nest: true,
    });
    if (topFiles && topFiles.length > 0) {
      data.errCode = 0;
      data.message = "Lấy top file thành công";
      data.data = topFiles.map((file) => ({
        fileID: file.fileID,
        fileName: file.fileName,
        visibility: file.visibility,
        createdAt: formatCreatedAt(file.createdAt),
        totalWords: file.totalWords,
        creatorID: file.creatorID,
        accessCount: file.accessCount,
        ownerName: file.user?.username || null,
        ownerAvatar: file.user?.avatar || null,
      }));
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
// Lấy các file tương tự dựa trên tiêu đề file người dùng hay truy cập
const getSimilarFilesService = async (userID) => {
  try {
    const data = {};

    // Lấy danh sách file đã truy cập, sắp xếp theo thời gian gần nhất
    const userHistories = await db.user_file_history.findAll({
      where: { userID },
      attributes: ["fileID"],
      order: [["openedAt", "DESC"]],
      raw: true,
    });

    if (userHistories.length === 0) {
      data.errCode = 1;
      data.message = "Người dùng chưa truy cập file nào";
      data.data = [];
      return data;
    }

    const accessedFileIDs = userHistories.map((h) => h.fileID);

    // Lấy thông tin fileName của các file đã truy cập
    const accessedFiles = await db.file.findAll({
      where: { fileID: accessedFileIDs },
      attributes: ["fileID", "fileName"],
      raw: true,
    });

    // Tạo map fileID -> fileName
    const fileNameMap = {};
    accessedFiles.forEach((f) => {
      fileNameMap[f.fileID] = f.fileName;
    });

    // Sắp xếp lại theo thứ tự truy cập gần nhất, kèm theo index (0 = gần nhất)
    const orderedFiles = userHistories
      .map((h, index) => ({
        fileName: fileNameMap[h.fileID],
        recencyIndex: index, // 0 = gần nhất, 1 = thứ 2, ...
      }))
      .filter((f) => f.fileName);

    // Hàm tách từ khóa từ fileName
    const extractKeywords = (fileName) => {
      if (!fileName) return [];
      // Loại bỏ các ký tự đặc biệt, tách thành các từ
      return fileName
        .toLowerCase()
        .split(/[\s\-_,.:;!?()[\]{}]+/)
        .filter((word) => word.length >= 2);
    };

    // Tạo danh sách từ khóa với recencyIndex (index của file đã truy cập)
    const keywordsByRecency = [];
    orderedFiles.forEach(({ fileName, recencyIndex }) => {
      const keywords = extractKeywords(fileName);
      keywords.forEach((keyword) => {
        keywordsByRecency.push({ keyword, recencyIndex });
      });
    });

    if (keywordsByRecency.length === 0) {
      data.errCode = 1;
      data.message = "Không có từ khóa để tìm kiếm";
      data.data = [];
      return data;
    }

    // Lấy danh sách từ khóa unique
    const uniqueKeywords = [
      ...new Set(keywordsByRecency.map((k) => k.keyword)),
    ];

    // Tạo điều kiện tìm kiếm với các từ khóa
    const searchConditions = uniqueKeywords.map((keyword) => ({
      fileName: { [db.Sequelize.Op.like]: `%${keyword}%` },
    }));

    // Tìm các file tương tự dựa trên từ khóa
    const similarFiles = await db.file.findAll({
      subQuery: false,
      where: {
        fileID: { [db.Sequelize.Op.notIn]: accessedFileIDs },
        visibility: "public",
        [db.Sequelize.Op.or]: searchConditions,
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
        {
          model: db.users,
          attributes: ["username", "avatar"],
        },
      ],
      group: ["file.fileID", "user.userID"],
      raw: true,
      nest: true,
    });

    // Tính điểm cho mỗi file: đếm số từ khóa khớp với từng file đã truy cập
    const filesWithScore = similarFiles.map((file) => {
      const fileKeywords = extractKeywords(file.fileName);

      // Đếm số từ khóa khớp với từng file đã truy cập (theo recencyIndex)
      const matchCountByRecency = {};

      keywordsByRecency.forEach(({ keyword, recencyIndex }) => {
        if (fileKeywords.includes(keyword)) {
          if (!matchCountByRecency[recencyIndex]) {
            matchCountByRecency[recencyIndex] = 0;
          }
          matchCountByRecency[recencyIndex]++;
        }
      });

      // Tìm recencyIndex nhỏ nhất có match
      const matchedIndices = Object.keys(matchCountByRecency).map(Number);
      const bestRecencyIndex =
        matchedIndices.length > 0 ? Math.min(...matchedIndices) : 9999;

      // Số từ khóa khớp với file gần nhất (recencyIndex = bestRecencyIndex)
      const matchCountWithBest = matchCountByRecency[bestRecencyIndex] || 0;

      return {
        ...file,
        bestRecencyIndex,
        matchCountWithBest, // Số từ khóa khớp với file gần nhất mà file này match
      };
    });

    // Sắp xếp theo:
    // 1. bestRecencyIndex tăng dần (file khớp với file gần nhất lên trước)
    // 2. matchCountWithBest giảm dần (trong cùng nhóm recency, file khớp nhiều từ khóa hơn lên trước)
    // 3. accessCount giảm dần (cùng số từ khóa khớp, lượt truy cập cao lên trước)
    filesWithScore.sort((a, b) => {
      if (a.bestRecencyIndex !== b.bestRecencyIndex) {
        return a.bestRecencyIndex - b.bestRecencyIndex;
      }
      if (a.matchCountWithBest !== b.matchCountWithBest) {
        return b.matchCountWithBest - a.matchCountWithBest;
      }
      return (parseInt(b.accessCount) || 0) - (parseInt(a.accessCount) || 0);
    });

    // Lấy tối đa 6 file
    const topFiles = filesWithScore.slice(0, 6);

    if (topFiles && topFiles.length > 0) {
      data.errCode = 0;
      data.message = "Lấy file tương tự thành công";
      data.data = topFiles.map((file) => ({
        fileID: file.fileID,
        fileName: file.fileName,
        visibility: file.visibility,
        createdAt: formatCreatedAt(file.createdAt),
        totalWords: file.totalWords,
        creatorID: file.creatorID,
        accessCount: file.accessCount,
        ownerName: file.user?.username || null,
        ownerAvatar: file.user?.avatar || null,
      }));
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
      include: [
        {
          model: db.users,
          attributes: ["username", "avatar"],
        },
      ],
      order: [["createdAt", "DESC"]],
      raw: true,
      nest: true,
    });
    data.errCode = 0;
    data.message = "Lấy tất cả các file của người dùng thành công";
    data.data = userFiles.map((file) => ({
      fileID: file.fileID,
      fileName: file.fileName,
      visibility: file.visibility,
      createdAt: formatCreatedAt(file.createdAt),
      totalWords: file.totalWords,
      creatorID: file.creatorID,
      ownerName: file.user?.username || null,
      ownerAvatar: file.user?.avatar || null,
    }));
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
