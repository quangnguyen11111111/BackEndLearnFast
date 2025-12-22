import db from "../models/index";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";
const salt = bcrypt.genSaltSync(10);
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
// Create account
const createNewUsers = async (dataBody) => {
  try {
    const data = {};
    const checkAccount = await checkAccountTrueFalse(dataBody.email);

    if (checkAccount) {
      const passwordHash = await hashPassword(dataBody.password);
      const createAccount = await db.users.create({
        email: dataBody.email,
        password: passwordHash,
        username: dataBody.username,
        avatar: `https://api.dicebear.com/7.x/initials/png?seed=${dataBody.username}`
      });

      if (createAccount) {
        data.errCode = 0;
        data.message = "Đăng kí thành công!!";
      } else {
        data.errCode = 1;
        data.message = "Đăng kí không thành công!!";
      }
    } else {
      data.errCode = 1;
      data.message = "Tài khoản đã tồn tại";
    }

    return data;
  } catch (e) {
    throw e;
  }
};
// Nếu có tài khoản trả về false ngược lại là true
const checkAccountTrueFalse = async (account) => {
  try {
    const check = await db.users.findOne({
      where: { email: account },
      raw: true,
    });
    return !check; // trả về true nếu không tồn tại tài khoản
  } catch (e) {
    throw e;
  }
};
const hashPassword = async (password) => {
  try {
    const hashpassword = bcrypt.hashSync(password, salt);
    return hashpassword;
  } catch (e) {
    throw e;
  }
};
// Login app
const LoginServices = async (dataBody) => {
  try {
    const data = {};
    const checkAccount = await checkAccountTrueFalse(dataBody.email);

    if (checkAccount) {
      const user = await db.users.findOne({
        where: { email: dataBody.email },
        raw: true,
      });

      if (!user) {
        data.errCode = 1;
        data.message = "Tài khoản không tồn tại";
        data.data = [];
        return data;
      }

      const checkPassword = bcrypt.compareSync(
        dataBody.password,
        user.password
      );

      if (!checkPassword) {
        data.errCode = 1;
        data.message = "Mật khẩu không đúng";
        data.data = [];
      } else {
        const accessToken = generateAccessToken(user);
        const refreshToken = generateRefreshToken(user);

        await db.users.update(
          { refreshToken },
          { where: { userID: user.userID }, raw: true }
        );

        data.errCode = 0;
        data.message = "Đăng nhập thành công";
        delete user.password;
        delete user.refreshToken;
        data.data = user;
        data.accessToken = accessToken;
        data.refreshToken = refreshToken;
      }
    } else {
      data.errCode = 1;
      data.message = "Tài khoản không tồn tại";
      data.data = [];
    }

    return data;
  } catch (e) {
    throw e;
  }
};
//generateAccessToken
const generateAccessToken = (user) => {
  return jwt.sign(
    {
      userID: user.userID,
      username: user.username,
      email: user.email,
      phone: user.phone || "",
    },
    process.env.SECRET_KEY,
    { expiresIn: "5h" }
  );
};
// //generateRefreshToken
const generateRefreshToken = (user) => {
  return jwt.sign(
    {
      userID: user.userID,
      username: user.username,
      email: user.email,
      phone: user.phone || "",
    },
    process.env.REFRESH_SECRET,
    { expiresIn: "7d" }
  );
};
// Làm mới Access Token
const refreshTokenService = async (tokenData) => {
  try {
    const data = {};
    let decoded;

    try {
      decoded = jwt.verify(tokenData, process.env.REFRESH_SECRET);
    } catch (error) {
      if (error.name === "TokenExpiredError") {
        return { errCode: 2, message: "Token đã hết hạn!" };
      }
      if (error.name === "JsonWebTokenError") {
        return { errCode: 3, message: "Token không hợp lệ!" };
      }
      throw error;
    }

    const user = await db.users.findOne({
      where: { userID: decoded.userID },
    });

    if (!user) {
      data.errCode = 4;
      data.message = "Token không hợp lệ";
    } else {
      const newAccessToken = generateAccessToken(user);
      data.errCode = 0;
      data.message = "Token làm mới thành công";
      data.newAccessToken = newAccessToken;
      delete user.password;
      data.data = user;
    }

    return data;
  } catch (e) {
    throw e;
  }
};
// Hàm xử lí đăng nhập bằng google
const loginWithGoogleService = async (idToken) => {
  try {
    const dataBody = await verifyGoogleToken(idToken);
    console.log('kiểm tra đường dẫn ảnh',dataBody.picture);
    
    const data = {};

    // Tìm user đã tồn tại
    let user = await db.users.findOne({
      where: { email: dataBody.email },
      raw: true,
    });

    if (user) {
      // Cập nhật refresh token cho user hiện tại
      const accessToken = generateAccessToken(user);
      const refreshToken = generateRefreshToken(user);

      await db.users.update(
        { refreshToken },
        { where: { userID: user.userID }, raw: true }
      );

      data.errCode = 0;
      data.message = "Đăng nhập thành công";
      delete user.password;
      delete user.refreshToken;
      data.data = user;
      data.accessToken = accessToken;
      data.refreshToken = refreshToken;
    } else {
      // Tạo user mới
      const newUser = await db.users.create({
        username: dataBody.username,
        email: dataBody.email,
        phone: dataBody.phone,
        authType: "google",
        password: "",
        avatar: dataBody.picture,
      });

      const accessToken = generateAccessToken(newUser);
      const refreshToken = generateRefreshToken(newUser);

      await db.users.update(
        { refreshToken },
        { where: { userID: newUser.userID }, raw: true }
      );

      const responseUser = newUser.dataValues || newUser;
      delete responseUser.password;
      delete responseUser.refreshToken;

      data.errCode = 0;
      data.message = "Đăng nhập thành công";
      data.data = responseUser;
      data.accessToken = accessToken;
      data.refreshToken = refreshToken;
    }

    return data;
  } catch (e) {
    throw e;
  }
};
const verifyGoogleToken = async (idToken) => {
  const ticket = await client.verifyIdToken({
    idToken,
    audience: process.env.GOOGLE_CLIENT_ID,
  });

  const payload = ticket.getPayload();
  return {
    email: payload?.email,
    username: payload?.email?.split("@")[0] || payload?.name,
    phone: payload?.phone || "",
    picture: payload?.picture,
    googleId: payload?.sub,
  };
};
module.exports = {
  createNewUsers,
  LoginServices,
  refreshTokenService,
  loginWithGoogleService,
};
