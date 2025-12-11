// import fileService from '../services/fileService'
// let handleGetAllDetailFile = async(req,res)=>{
//     let fileID = req.query.fileID
//     let fileName = req.query.fileName
//     if (!fileID) {
//         return res.status(500).json({
//             errCode:2,
//             message:"vui lòng truyền fileID"
//         })
//     }
//     let data = await fileService.getAllDetailFileService(fileID)
//     return res.status(200).json({
//         errCode:data.errCode,
//         data:data.data,
//         fileName:fileName
//     })
// }

// //hàm tạo file
// let handleCreateFile = async(req,res)=>{
//     let data = await fileService.createFileService(req.body)
//     return res.status(200).json({
//         errCode:data.errCode,
//         message:data.message,
//         data:data.data
//     }) 
// }

// module.exports={
//     handleGetAllDetailFile:handleGetAllDetailFile,
//     handleCreateFile:handleCreateFile
// }