import db from "../../models/index";
const updateUserFilePointsService = async (dataBody) => {
  try {
    const data = {};
    const { userID, fileID, mode, point } = dataBody;
    if (!userID || !fileID) {
      data.errCode = 1;
      data.message = "Vui lòng truyền userID và fileID";
      return data;
    }
    // Tìm bản ghi user_file_history
    let userFileHistory = await db.user_file_history.findOne({
      where: { userID, fileID },
        raw: false,
    });
    if (!userFileHistory) {
      // Nếu chưa có bản ghi
      data.errCode = 2;
      data.message = "file history không tồn tại cho user này";
      return data;
    }
    // Cập nhật điểm dựa trên chế độ chơi
    if (mode === "pointCardMatching") {
      userFileHistory.pointCardMatching = point;
    } else if (mode === "pointBlockGame") {
      userFileHistory.pointBlockGame = point;
    } else {
      data.errCode = 2;
      data.message = "Chế độ chơi không hợp lệ";
      return data;
    }
    await userFileHistory.save();
    data.errCode = 0;
    data.message = "Cập nhật điểm thành công";
    return data;
  } catch (error) {
    return {
      errCode: 3,
      message: "Lỗi server",
      error: error.message,
    };
  }
};

export default { updateUserFilePointsService:updateUserFilePointsService };