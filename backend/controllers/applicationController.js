import { catchAsyncError } from "../middlewares/catchAsyncError.js";
import ErrorHandler from "../middlewares/error.js";
import { Application } from "../models/applicationSchema.js";
import cloudinary from "cloudinary";
import { Job } from "../models/jobSchema.js";
import logger from '../logger.js'; // Import the logger

export const employerGetAllApplications = catchAsyncError(async (req, res, next) => {
  const { role } = req.user;
  if (role == "Job Seeker") {
    logger.warn('Job Seeker attempted to access employer applications');
    return next(
      new ErrorHandler(
        "Job Seeker is not allowed to access this resource!",
        400
      )
    );
  }
  const { _id } = req.user;
  const applications = await Application.find({ 'employerID.user': _id });
  logger.info(`Employer ${_id} fetched all applications`);
  res.status(200).json({
    success: true,
    applications
  });
});

export const jobseekerGetAllApplication = catchAsyncError(async (req, res, next) => {
  const { role } = req.user;
  if (role === "Employer") {
    logger.warn('Employer attempted to access job seeker applications');
    return next(new ErrorHandler(
      "Employer is not allowed to access this resource!",
      400
    ));
  }
  const { _id } = req.user;
  const applications = await Application.find({ 'applicantID.user': _id });
  logger.info(`Job Seeker ${_id} fetched their applications`);
  res.status(200).json({
    success: true,
    applications
  });
});

export const jobSeekerDeleteApplication = catchAsyncError(async (req, res, next) => {
  const { role } = req.user;
  if (role === "Employer") {
    logger.warn('Employer attempted to delete a job seeker application');
    return next(new ErrorHandler(
      "Employer is not allowed to access this resource!",
      400
    ));
  }
  const { id } = req.params;
  const application = await Application.findById(id);
  if (!application) {
    logger.warn(`Application not found: ${id}`);
    return next(new ErrorHandler("Oops, application not found!", 404));
  }
  await application.deleteOne();
  logger.info(`Job Seeker ${req.user._id} deleted application ${id}`);
  res.status(200).json({
    success: true,
    message: "Application deleted successfully!"
  });
});

export const postApplication = catchAsyncError(async (req, res, next) => {
  const { role } = req.user;
  if (role === "Employer") {
    logger.warn('Employer attempted to post an application');
    return next(new ErrorHandler(
      "Employer is not allowed to access this resource!",
      400
    ));
  }
  if (!req.files || Object.keys(req.files).length === 0) {
    logger.warn('No resume file uploaded');
    return next(new ErrorHandler("Resume file required", 400));
  }
  const { resume } = req.files;
  const allowedFormats = ["image/png", "image/jpg", "image/webp", "image/jpeg"];
  if (!allowedFormats.includes(resume.mimetype)) {
    logger.warn('Invalid resume file type');
    return next(new ErrorHandler("Invalid file type. Please upload your resume in PNG, JPG, or WEBP format", 400));
  }
  const cloudinaryResponse = await cloudinary.uploader.upload(resume.tempFilePath);
  if (!cloudinaryResponse || cloudinaryResponse.error) {
    logger.error(`Cloudinary error: ${cloudinaryResponse.error || "Unknown cloudinary error"}`);
    return next(new ErrorHandler("Failed to upload resume.", 500));
  }
  const { name, email, coverLetter, phone, address, jobId } = req.body;
  const applicantID = {
    user: req.user._id,
    role: "Job Seeker",
  };
  if (!jobId) {
    logger.warn('Job ID not provided');
    return next(new ErrorHandler("Job not found!", 404));
  }
  const jobDetails = await Job.findById(jobId);
  if (!jobDetails) {
    logger.warn(`Job not found: ${jobId}`);
    return next(new ErrorHandler("Job not found!", 404));
  }
  const employerID = {
    user: jobDetails.postedBy,
    role: "Employer",
  };
  if (!name || !email || !coverLetter || !phone || !address || !applicantID || !employerID || !resume) {
    logger.warn('Incomplete application details');
    return next(new ErrorHandler("Please fill all fields", 400));
  }
  const application = await Application.create({
    name, email, coverLetter, phone, address, applicantID, employerID, resume: {
      public_id: cloudinaryResponse.public_id,
      url: cloudinaryResponse.secure_url,
    }
  });
  logger.info(`Application submitted by Job Seeker ${req.user._id} for job ${jobId}`);
  res.status(200).json({
    success: true,
    message: "Application submitted!",
    application,
  });
});
