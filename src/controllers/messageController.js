import ProjectMember from '../models/ProjectMember.js';
import * as messageService from '../service/messageService.js';

export const getMessages = async (req, res) => {
  try {
    const { projectId, limit, offset } = req.query;

    // Check Memerbership (Admin Can Check All message)
    if (!req.user.isAdmin) {
      const member = await ProjectMember.findOne({
        projectId,
        userId: req.user.id,
      });

      if (!member) {
        return res.status(403).json({
          message: 'Access Denied : You are not a member of this project',
        });
      }
    }

    if (!projectId) {
      return res.status(400).json({ message: 'Project ID is required' });
    }

    const data = await messageService.getProjectMessages(
      projectId,
      limit,
      offset,
    );

    res.status(200).json({
      success: true,
      data: data.messages,
      pagination: data.pagination,
    });
  } catch (error) {
    console.error('Error in getMessages controller:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const editMessage = async (req, res) => {
  try {
    const { id } = req.params; // Message Id
    const { content } = req.body;
    const userId = req.user.id; 

    if (!content) {
      return res.status(400).json({ message: 'Content is required' });
    }

    const message = await messageService.editMessage(id, userId, content);

    if (!message) {
      return res
        .status(404)
        .json({ message: 'Message not found or unauthorized to edit' });
    }

    res.status(200).json({
      success: true,
      message: 'Message updated successfully',
      data: message,
    });
  } catch (error) {
    console.error('Error in editMessage controller:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const deleteMessage = async (req, res) => {
  try {
    const { id } = req.params; // Message Id
    const userId = req.user.id;
    const isAdmin = req.user.isAdmin;

    const message = await messageService.deleteMessage(id, userId, isAdmin);

    if (!message) {
      return res
        .status(404)
        .json({ message: 'Message not found or unauthorized to delete' });
    }

    res.status(200).json({
      success: true,
      message: 'Message deleted successfully',
    });
  } catch (error) {
    console.error('Error in deleteMessage controller:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
