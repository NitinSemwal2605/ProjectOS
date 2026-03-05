import ProjectMember from "../models/ProjectMember.js";

export const isProjectOwner = async (req,res,next) =>{
    try{
        const userId = req.user.id;
        const projectId = req.params.projectId || req.params.id;

        if(!projectId){
            return res.status(400).json({ message: "Project ID is Required" })
        }

        const member = await ProjectMember.findOne({
            projectId,
            userId
        });

        if(!member || member.role != "OWNER"){
            return res.status(403).json({ message: "Access denied: Owner required" });
        }

        next();
    } catch(error){
        console.error("RBAC Middleware Error:", error);
        res.status(403).json({ message: "Error Occured While Checking isProjectOwner" });
    }
}

export const isProjectMember = async (req,res,next) =>{
    try{
        const userId = req.user.id;
        const projectId = req.params.projectId || req.params.id;

        if(!projectId){
            return res.status(400).json({ message: "Project ID is Required" })
        }
        
        const member = await ProjectMember.findOne({
            projectId,
            userId
        });

        if(!member){
            return res.status(403).json({ message: "Access Denied : You are not a member of this project" })
        }

        req.projectMember = member;
        next();
        
    } catch(error){
        console.log("Error Occured while Checking isProjectMember: ", error);
        res.status(403).json({ message: "Error Occured While Checking isProjectMember" });
    }
}