// import { Op } from "sequelize";
// import db from "../models/index";
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
// //Hàm kiểm tra file tồn tại
// let checkFile = (fileName, folderID) => {
//   return new Promise(async (resolve, reject) => {
//     try {
//       let file = await db.file.findOne({
//         where: { fileName, folderID },
//       });
//       if (file) {
//         resolve(false);
//       } else {
//         resolve(true);
//       }
//     } catch (e) {
//       reject(e);
//     }
//   });
// };
// //hàm tạo file
// let createFileService = (dataBody) => {
//   return new Promise(async (resolve, reject) => {
//     try {
//       let data = {};
//       let checkFileIn = await checkFile(
//         dataBody.fileName,
//         dataBody.folderID
//       );
//       if (checkFileIn) {
//         let createFile = await db.file.create({
//           fileName: dataBody.fileName,
//           folderID: dataBody.folderID,
//         });
//         if (createFile) {
//             console.log(dataBody.arrDataDetail,Array.isArray(dataBody.arrDataDetail));
            
//             await addDetailFile(dataBody.arrDataDetail, createFile.fileID)
//           data.errCode = 0;
//           data.message = "Tạo thư mục thành công";
//           data.data = createFile;
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
// // hàm thêm chi tiết file
// let addDetailFile = async (dataBody, fileID) => {
//     try {
//       const dataWithFileID = dataBody.map(item => ({
//         ...item,
//         fileID
//       }));
  
//       await db.fileDetail.bulkCreate(dataWithFileID);
//     } catch (error) {
//       console.error("Lỗi khi thêm chi tiết file:", error);
//     }
//   };
  
// module.exports={
//     getAllDetailFileService:getAllDetailFileService, 
//     createFileService:createFileService
// }