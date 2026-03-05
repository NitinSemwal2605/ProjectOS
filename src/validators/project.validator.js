import Joi from "joi";

export const createProjectSchema = Joi.object({
  title: Joi.string().min(3).required(),
  description: Joi.string().min(5).required(),
  location : Joi.object({
    lat : Joi.number().required(),
    lng : Joi.number().required()
  }).optional()
});

export const updateProjectSchema = Joi.object({
  title: Joi.string().min(3).optional(),
  description: Joi.string().min(5).optional(),
  location : Joi.object({
    lat : Joi.number().required(),
    lng : Joi.number().required()
  }).optional()
});
