// import folderService from '../services/folderService'
// // hàm lấy dữ liệu folder của 1 người
// let handleGetAllFoldersUser = async(req,res)=>{
//     if (!req.query.userID) {
//         return res.status(500).json({
//             errCode: 1,
//             data:[]
//         })
//     }
//     let data = await folderService.getAllFoldersServiceUser(req.query.userID)
//     return res.status(200).json({
//         errCode: data.errCode,
//         data:data.data
//     })
// }
// // hàm lấy dữ liệu folder trừ 1 người
// let handleGetAllFoldersExceptUser = async(req,res)=>{
//     if (!req.query.userID) {
//         return res.status(500).json({
//             errCode: 0,
//             data:[]
//         })
//     }
//     let data = await folderService.getAllFoldersExceptUserService(req.query.userID)
//     return res.status(200).json({
//         errCode: data.errCode,
//         data:data.data
//     })
// }
// // hàm tạo folder
// let handleCreateFolder = async(req,res)=>{
//     let data = await folderService.createFolderService(req.body)
//     return res.status(200).json({
//         errCode:data.errCode,
//         message:data.message,
//         data:data.data
//     }) 
// }
// // hàm lấy dữ liệu chi tiết folder
// let handleGetFolderDetail = async(req,res)=>{``
//     if (!req.query.folderID||!req.query.userID) {
//         return res.status(500).json({
//             errCode:1,
//             data:[]
//         })
//     }
//     let data = await folderService.getFolderDetailService(req.query.folderID,req.query.userID)
//     return res.status(200).json({
//         errCode:data.errCode,
//         data:data.data.files,
//         folderName:data.data.folderName,
//         folderID:data.data.folderID
//     })
// }
// module.exports={
//     handleGetAllFoldersUser:handleGetAllFoldersUser,
//     handleGetAllFoldersExceptUser:handleGetAllFoldersExceptUser,
//     handleCreateFolder:handleCreateFolder,
//     handleGetFolderDetail:handleGetFolderDetail
// }