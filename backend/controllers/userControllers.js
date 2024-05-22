import { catchAsyncError } from "../middlewares/catchAsyncError.js";
import ErrorHandler from "../middlewares/error.js";
import { User } from "../models/userSchema.js";
import { sendToken } from '../utils/jwtToken.js';
import logger from '../logger.js'; // Import the logger

export const register = catchAsyncError(async (req, res, next) => {
  const { name, email, phone, role, password } = req.body;
  
  if (!name || !email || !phone || !role || !password) {
    logger.warn('Registration failed: Incomplete form submission');
    return next(new ErrorHandler("Please fill full registration form!"));
  }

  const isEmail = await User.findOne({ email });
  if (isEmail) {
    logger.warn('Registration failed: Email already exists');
    return next(new ErrorHandler("Email is Already Exist"));
  }

  const user = await User.create({
    name,
    email,
    phone,
    role,
    password,
  });

  logger.info(`User registered successfully: ${user.email}`);
  sendToken(user, 200, res, "User Register Successfully!");
});

export const login = catchAsyncError(async (req, res, next) => {
  const { email, password, role } = req.body;
  
  if (!email || !password || !role) {
    logger.warn('Login failed: Incomplete credentials provided');
    return next(new ErrorHandler("Please provide email, password and role..", 400));
  }

  const user = await User.findOne({ email }).select("+password");
  if (!user) {
    logger.warn(`Login failed: Invalid email (${email})`);
    return next(new ErrorHandler("Invalid Email or Password", 400));
  }

  const isPasswordMatched = await user.comparedPassword(password);
  if (!isPasswordMatched) {
    logger.warn('Login failed: Invalid password');
    return next(new ErrorHandler("Invalid Email or Password", 400));
  }

  if (user.role !== role) {
    logger.warn(`Login failed: Role mismatch for user ${email}`);
    return next(new ErrorHandler("User with this role is not found!", 400));
  }

  logger.info(`User logged in successfully: ${user.email}`);
  sendToken(user, 200, res, "User Logged in Successfully!");
});

export const logout = catchAsyncError(async (req, res, next) => {
  res.status(201).cookie("token", "", {
    httpOnly: true,
    expires: new Date(Date.now()),
  }).json({
    success: true,
    message: "User logged out Successfully!",
  });

  logger.info(`User logged out successfully`);
});

export const getUser = catchAsyncError((req, res, next) => {
  const user = req.user;
  res.status(200).json({
    success: true,
    user,
  });

  logger.info(`Fetched user details: ${user.email}`);
});
