import db from "../../models/index";
import OpenAI from "openai";
const aiGenerateFlashcardsService = async (
  topic,
  count,
  sourceLang,
  targetLang,
  userID
) => {
  const data = {};
  try {
    // Validate input
    if (!topic || !sourceLang || !targetLang || !userID) {
      data.errCode = 1;
      data.message = "Thiếu thông tin chủ đề, ngôn ngữ hoặc userID";
      return data;
    }

    const numberOfCards = parseInt(count) || 10;
    if (numberOfCards < 1 || numberOfCards > 50) {
      data.errCode = 1;
      data.message = "Số lượng thẻ phải từ 1 đến 50";
      return data;
    }

    // Initialize OpenAI client
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY || "",
    });

    // Thu thập các từ đã có của user theo topic + ngôn ngữ để tránh trùng
    const userFiles = await db.file.findAll({
      where: {
        creatorID: userID,
        sourceLang,
        targetLang,
        topic,
        type: "AI",
      },
      attributes: ["fileID"],
      raw: true,
    });
    // Lấy tất cả từ đã có trong các file này
    const fileIDs = userFiles.map((f) => f.fileID);
    const previousWords =
      fileIDs.length > 0
        ? await db.file_detail.findAll({
            where: { fileID: fileIDs },
            attributes: ["source"],
            raw: true,
          })
        : [];
    // Tạo danh sách từ loại trừ
    const excludeList = Array.from(
      new Set(
        previousWords
          .map((w) => (w.source ? String(w.source).trim() : ""))
          .filter((w) => w.length > 0)
      )
    );
    console.log("kiểm tra các từ đã có", excludeList, userFiles);

    // Tạo token biến thiên để khuyến khích kết quả khác nhau mỗi lần gọi
    const variationToken = Math.random().toString(36).substring(2, 8);

    // Tạo prompt cho AI
    const prompt = `
Generate exactly ${numberOfCards} vocabulary flashcards about the topic "${topic}".

STRICT RULES:
- Each "source" MUST be a SINGLE WORD (one word only).
- NO phrases, NO sentences.
- NO duplicated words.
- Avoid repeating words from earlier responses for the same topic; pick different, still-relevant words.
- "source" language: ${sourceLang}
- "target" language: ${targetLang}
- Topic relevance is mandatory.
  - Use diverse, less obvious words; prioritize variety.
  - Diversity token: ${variationToken}
${
  excludeList.length > 0
    ? `- DO NOT USE any of these words: ${excludeList.join(", ")}`
    : ""
}

Output constraints:
- ONLY raw JSON
- NO markdown
- NO comments
- NO explanations
- NO extra characters before or after JSON

Required JSON format:
[
  {
    "source": "dog",
    "target": "chó"
  }
]
`;

    //  Gọi OpenAI API
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are a helpful assistant that generates educational flashcards. Always return valid JSON array only, without any markdown formatting or additional text.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.7,
    });

    // Xử lý phản hồi
    const responseText = completion.choices[0]?.message?.content?.trim();
    if (!responseText) {
      data.errCode = 1;
      data.message = "Không nhận được phản hồi từ AI";
      return data;
    }

    // Loại bỏ các phần không phải JSON (nếu có)
    let jsonText = responseText;
    if (jsonText.startsWith("```json")) {
      jsonText = jsonText.replace(/```json\n?/g, "").replace(/```\n?/g, "");
    } else if (jsonText.startsWith("```")) {
      jsonText = jsonText.replace(/```\n?/g, "");
    }

    // Phân tích JSON
    const flashcards = JSON.parse(jsonText);

    // Lọc các thẻ đã có trong lịch sử
    const usedSet = new Set(excludeList.map((w) => w.toLowerCase().trim()));
    // Loại bỏ thẻ trùng lặp trong cùng một lần tạo
    const seen = new Set();
    // Lọc flashcards
    const filtered = flashcards.filter((card) => {
      if (!card?.source || !card?.target) return false;
      const key = String(card.source).toLowerCase().trim();
      if (!key || usedSet.has(key) || seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    // Validate format
    if (!Array.isArray(flashcards) || flashcards.length === 0) {
      data.errCode = 1;
      data.message = "Định dạng dữ liệu không hợp lệ";
      return data;
    }

    // Validate each flashcard
    const validFlashcards = filtered.filter(
      (card) =>
        card.source &&
        card.target &&
        typeof card.source === "string" &&
        typeof card.target === "string"
    );

    if (validFlashcards.length === 0) {
      data.errCode = 1;
      data.message = "Không có flashcard hợp lệ hoặc toàn bộ trùng với lịch sử";
      return data;
    }

    data.errCode = 0;
    data.message = "Tạo flashcards thành công";
    data.data = validFlashcards;
    return data;
  } catch (error) {
    console.error("Lỗi khi tạo flashcards bằng AI:", error);
    data.errCode = 1;
    data.message = error.message || "Lỗi server khi tạo flashcards bằng AI";
    return data;
  }
};
module.exports = {
  aiGenerateFlashcardsService,
};
