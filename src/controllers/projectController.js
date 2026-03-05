import { invalidateCache } from "../middlewares/cache.middleware.js";
import ActivityLog from "../models/ActivityLog.js";
import Notification from "../models/Notification.js";
import Project from "../models/Project.js";
import ProjectMember from "../models/ProjectMember.js";

export const addProject = async (req, res) => {
    const {title,description} = req.body;
    const userId = req.user.id;
    
    try{
        const project = await Project.create({
            title,
            description,
            createdBy: userId
        });

        // Make him OWNER
        await ProjectMember.create({
            projectId: project._id,
            userId: userId,
            role: "OWNER",
        });

        // Notification to Him Only
        await Notification.create({
            userId: userId,
            projectId: project._id,
            message: "You have created a new project."
        });

        await ActivityLog.create({
            userId,
            projectId: project._id,
            action: "PROJECT_CREATED",
            entityType: "PROJECT",
            entityId: project._id,
        });

        // Invalidate Project List Cache
        await invalidateCache(userId, "project");

        res.status(201).json({message : "Project created Successfully", project});
    }
    catch(error){
        console.log("Error Occured While Adding Projects");
        res.status(500).json({ message: "Internal server error while creating project" });
    }
}

// Anyone Can List
export const listAllProjects = async (req, res) => {
    try{
        const userId = req.user.id;
        const memberships = await ProjectMember.find({userId}).select("projectId");
        const projectIds = memberships.map(m => m.projectId);
        const projects = await Project.find({_id: {$in: projectIds}, isDeleted: false});
        res.json(projects);
    } catch(error){
        console.log("Error Occured While Listing Projects");
        res.status(500).json({ message: "Internal server error while listing All Project" });
    }
}

// Only members can view project details.
export const listProjectById = async (req, res) => {
    try{
        const userId = req.user.id;
        const {id} = req.params; // Project ID

        const member = await ProjectMember.findOne({userId, projectId: id});
        if(!member){
            return res.status(403).json({message: "Access Denied"});
        }

        const project = await Project.findById(id);
        if(!project || project.isDeleted){
            return res.status(404).json({message: "Project not found"});
        }

        res.json(project);
    } catch(error){
        console.log("Error Occured While Fetching Project by ID");
        res.status(500).json({ message: "Internal server error while listing this project" });
    }
}

// Only owners can update projects.
export const updateProject = async (req, res) => {
    const {title, description} = req.body;
    try{
        // Membership Check
        const userId = req.user.id;
        const {id} = req.params; // Project ID

        // If project is deleted , return 404
        const project = await Project.findById(id);
        if(!project || project.isDeleted){
            return res.status(404).json({message: "Project not found"});
        }


        const member = await ProjectMember.findOne({userId, projectId: id});
        if(!member || member.role !== "OWNER"){
            return res.status(403).json({message: "Only project owners can update the project"});
        }


        if(title) project.title = title;
        if(description) project.description = description;
        
        await project.save();

        // Notification to All Members
        const members = await ProjectMember.find({projectId: id});
        const notifications = members.map(m =>({
            userId: m.userId,
            projectId: id,
            message: `Project "${project.title}" has been updated.`
        }))
        await Notification.insertMany(notifications);

        await ActivityLog.create({
            userId: req.user.id,
            projectId: project._id,
            action: "PROJECT_UPDATED",
            entityType: "PROJECT",
            entityId: project._id,
        });

        const invalidationPromises = members.map(m => [
            invalidateCache(m.userId, "project"),
            invalidateCache(m.userId, "project", id),
            invalidateCache(m.userId, "members", id)
        ]).flat();
        await Promise.all(invalidationPromises);

        res.json({message: "Project updated successfully", project});
    }
    catch(error){
        console.log("Error Occured While Updating Project");
        res.status(500).json({ message: "Internal server error while updating project" });
    }
}


// Only owners can delete projects (soft delete).
export const deleteProject = async (req, res) => {
    try{
        // Membership Check
        const userId = req.user.id;
        const {id} = req.params; // Project ID
        
        const member = await ProjectMember.findOne({userId, projectId: id});
        if(!member || member.role !== "OWNER"){
            return res.status(403).json({message: "Only project owners can delete the project"});
        }

        const project = await Project.findById(id);
        if(!project || project.isDeleted){
            return res.status(404).json({message: "Project not found"});
        }

        project.isDeleted = true;
        await project.save();

        // Notification to All Members
        const members = await ProjectMember.find({projectId: id});
        const notifications = members.map(m =>({
            userId: m.userId,
            projectId: id,
            message: `Project "${project.title}" has been deleted.`
        }))
        await Notification.insertMany(notifications);

        await ActivityLog.create({
            userId: req.user.id,
            projectId: project._id,
            action: "PROJECT_DELETED",
            entityType: "PROJECT",
            entityId: project._id,
        });

        // Invalidate Cache for All Members
        const invalidationPromises = members.map(m => [
            invalidateCache(m.userId, "project"),
            invalidateCache(m.userId, "project", id),
            invalidateCache(m.userId, "members", id)
        ]).flat();
        await Promise.all(invalidationPromises);

        res.json({message: "Project deleted successfully"});
    }
    catch(error){
        console.log("Error Occured While Deleting Project");
        res.status(500).json({ message: "Internal server error while deleting project" });
    }
}


export const getMembers = async (req, res) => {
    const { id: projectId } = req.params;
    try {

        const members = await ProjectMember.find({ projectId }).populate("userId", "username email");
        if (!members || members.length === 0) {
            return res.status(404).json({ message: "No members found for this project" });
        }

        res.json(members);
    } catch (error) {
        console.error("Get Members Error:", error);
        res.status(500).json({ message: "Internal server error while fetching members" });
    }
}

export const addMember = async (req, res) => {
    const {id : projectId} = req.params;
    const {userId, role} = req.body;

    try{
        // Membership Check
        const requestingUserId = req.user.id;
        const member = await ProjectMember.findOne({userId: requestingUserId, projectId});
        if(!member || member.role !== "OWNER"){
            return res.status(403).json({message: "Only project owners can add members"});
        }

        const existingMember = await ProjectMember.findOne({ projectId, userId });

        if (existingMember && !existingMember.isDeleted) {
        return res.status(400).json({ message: "User is already a member" });
        }

        if (existingMember && existingMember.isDeleted) {
        existingMember.isDeleted = false;
        existingMember.role = role || "MEMBER";
        await existingMember.save();

        return res.json({
            message: "Member re-added successfully",
            member: existingMember
        });
        }

        const newMember = await ProjectMember.create({
            projectId,
            userId,
            role: role || "MEMBER"
        });

        await ActivityLog.create({
            userId: req.user.id,
            projectId,
            action: "MEMBER_ADDED",
            entityType: "MEMBER",
            entityId: userId,
        });

        // Save Notification
        const project = await Project.findById(projectId);
        await Notification.create({
            userId,
            message: `You have been added to project: ${project?.title || "New Project"} as a ${role || "MEMBER"}`
        });

        // Invalidate Cache for added user and the project member list
        await invalidateCache(userId, "project");
        await invalidateCache(requestingUserId, "members", projectId);

        res.status(201).json({message: "Member added successfully", member: newMember});
    }

    catch(error){
        console.log("Error Occured While Adding Member : ", error);
        res.status(500).json({message: "Internal server error while adding member"});
    }
}


export const removeMember = async (req, res) => {
    const {id: projectId, userId} = req.params;
    try{
        // Membership Check
        const requestingUserId = req.user.id;
        const member = await ProjectMember.findOne({userId: requestingUserId, projectId});
        if(!member || member.role !== "OWNER"){
            return res.status(403).json({message: "Only project owners can remove members"});
        }

        // Not Removing Himself
        if (userId === requestingUserId) {
            return res.status(400).json({
                message: "Owner cannot remove themselves"
            });
        }

        const removedMember = await ProjectMember.findOneAndDelete({projectId, userId});

        if(!removedMember){
            return res.status(404).json({message: "Member not found in this project"});
        }
        
        await ActivityLog.create({
            userId: req.user.id,
            projectId,
            action: "MEMBER_REMOVED",
            entityType: "MEMBER",
            entityId: userId,
        });

        // Save Notification to that Member Only
        const project = await Project.findById(projectId);
        await Notification.create({
            userId,
            message: `You have been removed from project: ${project?.title || "Project"}`
        });

        // Invalidate Cache for removed user and the project member list
        await invalidateCache(userId, "project"); 
        await invalidateCache(requestingUserId, "members", projectId);

        res.json({message: "Member removed successfully"});
    }
    catch(error){
        console.log("Error Occured While Removing Member : ", error);
        res.status(500).json({message: "Internal server error while removing member"});
    }
}

// Only owners can update member roles.
// URL : http://localhost:5001/api/projects/updateMemberRole/:id/:userId
export const updateMemberRole = async (req, res) => {
    const {id: projectId, userId} = req.params;
    const {role} = req.body;
    
    try{
        const requestingUserId = req.user.id;

        const allowedRoles = ["OWNER", "MEMBER"];
        if(!allowedRoles.includes(role)){
            return res.status(400).json({message: "Invalid role. Allowed roles are OWNER and MEMBER"});
        }

        const requestingMember = await ProjectMember.findOne({
            userId: requestingUserId,
            projectId
        });
        // console.log(requestingMember);
        if(!requestingMember || requestingMember.role !== "OWNER"){
            return res.status(403).json({message: "Only project owners can update member roles"});
        }

        // Member to Update
        const member = await ProjectMember.findOne({
            userId,
            projectId
        });

        if(!member){
            return res.status(404).json({message: "Member not found in this project"});
        }

        // No Owner Demote
        if(userId === requestingUserId && role !== "OWNER"){
            return res.status(400).json({message: "Owner cannot demote themselves"});
        }

        // Update Role
        member.role = role;
        await member.save();

        await ActivityLog.create({
            userId: req.user.id,
            projectId,
            action: "MEMBER_ROLE_UPDATED",
            entityType: "MEMBER",
            entityId: userId,
        });

        // Save Notification to that Member Only
        const project = await Project.findById(projectId);
        await Notification.create({
            userId,
            message: `Your role in project "${project?.title || "Project"}" has been updated to ${role}.`
        });

        // Invalidate member list cache
        await invalidateCache(requestingUserId, "members", projectId);

        res.json({message: "Member role updated successfully", member});
    }
    catch(error){
        console.log("Error Occured While Updating Member Role : ", error);
        res.status(500).json({message: "Internal server error while updating member role"});
    }
}