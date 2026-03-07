import Joi from 'joi';

export const createTaskSchema = Joi.object({
  projectId: Joi.string().required(),
  title: Joi.string().min(3).required(),
  description: Joi.string().min(5).optional(),
  status: Joi.string().valid('TODO', 'IN_PROGRESS', 'DONE').optional(),
  assigneeId: Joi.string().optional(),
  deadline: Joi.date().optional(),
});

export const updateTaskSchema = Joi.object({
  title: Joi.string().min(3).optional(),
  description: Joi.string().min(5).optional(),
  status: Joi.string().valid('TODO', 'IN_PROGRESS', 'DONE').optional(),
  assigneeId: Joi.string().optional(),
  deadline: Joi.date().optional(),
});

export const updateStatusSchema = Joi.object({
  status: Joi.string().valid('TODO', 'IN_PROGRESS', 'DONE').required(),
});
