// import { Op } from "sequelize";
// import db from "../models/index";
// // hàm lấy dữ liệu tất cả folder của 1 người
// let getAllFoldersServiceUser = (userID) => {
//   return new Promise(async (resolve, reject) => {
//     try {
//       let data = {};
//       let folders = await db.folder.findAll({
//         where: { userID },
//         order: [["dateRecomment", "DESC"]],
//         include: [
//           {
//             model: db.users,
//             attributes: ['userName'] ,
//           },
//         ],
//         raw:false
//       });
//       if (folders) {
//         data.errCode = 0;
//         data.data = folders;
//       } else {
//         data.errCode = 1;
//         data.data = [];
//       }
//       resolve(data);
//     } catch (e) {
//       reject(e);
//     }
//   });
// };
// // hàm lấy dữ liệu tất cả các folder trừ của người dùng
// let getAllFoldersExceptUserService = (userID) => {
//   return new Promise(async (resolve, reject) => {
//     try {
//       let data = {};
//       let folders = await db.folder.findAll({
//         where: { userID: { [Op.ne]: userID } },
//         order: [["numberOfVisits", "DESC"]],
//         include: [
//           {
//             model: db.users,
//             attributes: ['userName'] ,
//           },
//         ],
//         raw:false
//       });
//       if (folders) {
//         data.errCode = 1;
//         data.data = folders;
//       } else {
//         data.errCode = 0;
//         data.data = [];
//       }
//       resolve(data);
//     } catch (e) {
//       reject(e);
//     }
//   });
// };
// //Hàm kiểm tra folder tồn tại
// let checkFolder = (folderName, userID) => {
//   return new Promise(async (resolve, reject) => {
//     try {
//       let folder = await db.folder.findOne({
//         where: { folderName, userID },
//       });
//       if (folder) {
//         resolve(false);
//       } else {
//         resolve(true);
//       }
//     } catch (e) {
//       reject(e);
//     }
//   });
// };
// // hàm tạo folder
// let createFolderService = (dataBody) => {
//   return new Promise(async (resolve, reject) => {
//     try {
//       let data = {};
//       let checkFolderIn = await checkFolder(
//         dataBody.folderName,
//         dataBody.userID
//       );
//       if (checkFolderIn) {
//         let createFolder = await db.folder.create({
//           folderName: dataBody.folderName,
//           userID: dataBody.userID,
//         });
//         if (createFolder) {
//           data.errCode = 0;
//           data.message = "Tạo thư mục thành công";
//           data.data = createFolder;
//         }
//       } else {
//         data.errCode = 1;
//         data.message = "Thư mục đã tồn tại";
//         data.data = [];
//       }
//       resolve(data);
//     } catch (e) {
//       reject(e);
//     }
//   });
// };
// //hàm cập nhật thời gian
// const updateFolderTimestamp = async (folderID) => {
//   await db.folder.update(
//     {
//       dateRecomment: new Date(),
//     },
//     {
//       where: { folderID },
//     }
//   );
// };
// //hàm lấy dữ liệu chi tiết của từng folder
// let getFolderDetailService = (folderID,userID)=>{
//     return new Promise(async(resolve, reject) => {
//         try {
//             let data={}
//             let folderDetail = await db.folder.findOne({
//                 where: { folderID },
//                 attributes: ['folderName','userID','folderID'], 
//                 include: [
//                   {
//                     model: db.file,
//                     attributes: ['fileName','fileID'] ,
//                   },
//                 ],
//                 raw:false
//               });
//             if (folderDetail) {
                
//                 if (folderDetail.userID == userID) {
//                     await updateFolderTimestamp(folderID)
//                 }else{
//                     await db.folder.increment('numberOfVisits',{
//                         by:1,
//                         where:{folderID}
//                     })
//                 }
//                 data.errCode=0
//                 data.data = folderDetail
//             } else{
//                 data.errCode=1
//                 data.data = []
//             }
//             resolve(data)
//         } catch (e) {
//             reject(e)
//         }
//     })
// }
// module.exports = {
//   getAllFoldersServiceUser: getAllFoldersServiceUser,
//   getAllFoldersExceptUserService: getAllFoldersExceptUserService,
//   createFolderService: createFolderService,
//   getFolderDetailService:getFolderDetailService
// };
