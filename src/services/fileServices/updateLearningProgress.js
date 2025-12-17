import db from "../../models/index";

const updateLearningProgressService = async (dataBody) => {
  const data = {};
  const { userID, fileID, detailID, flashcardState, quizState } = dataBody;

  try {
    // Kiểm tra xem learning_progress record đã tồn tại chưa
    let progressRecord = await db.learning_progress.findOne({
      where: { userID, fileID, detailID },
      raw: false,
    });

    if (!progressRecord) {
      // Nếu chưa tồn tại, tạo mới
      progressRecord = await db.learning_progress.create({
        userID,
        fileID,
        detailID,
        flashcardState: flashcardState !== undefined ? flashcardState : 0,
        quizState: quizState !== undefined ? quizState : 0,
      });

      data.errCode = 0;
      data.message = "Tạo mới tiến độ học tập thành công";
    } else {
      // Nếu đã tồn tại, cập nhật
      const updateData = {};

      if (flashcardState !== undefined) {
        updateData.flashcardState = flashcardState;
      }
      if (quizState !== undefined) {
        updateData.quizState = quizState;
      }

      // Nếu có dữ liệu cần cập nhật
      if (Object.keys(updateData).length > 0) {
        await progressRecord.update(updateData);
      }

      data.errCode = 0;
      data.message = "Cập nhật tiến độ học tập thành công";
    }

    data.data = {
      userID: progressRecord.userID,
      fileID: progressRecord.fileID,
      detailID: progressRecord.detailID,
      flashcardState: progressRecord.flashcardState,
      quizState: progressRecord.quizState,
    };

    return data;
  } catch (error) {
    console.error("Lỗi khi cập nhật tiến độ học tập:", error);
    data.errCode = 2;
    data.message = "Lỗi server khi cập nhật tiến độ học tập";
    data.error = error.message;
    return data;
  }
};

module.exports = {
  updateLearningProgressService,
};
