import request from 'supertest';
import mongoose from 'mongoose';
import app from '../app.js';
import { User } from '../models/userSchema.js';
import { Application } from '../models/applicationSchema.js';
import { Job } from '../models/jobSchema.js';
import { dbConnection } from '../database/dbConnection.js';
import cloudinary from 'cloudinary';

jest.setTimeout(30000); // Set a global timeout of 30 seconds for the test suite

let jobSeekerToken, employerToken, jobId;

beforeAll(async () => {
  console.log('Environment Variables:', {
    mongoURI: process.env.TEST_MONGODB_URI,
    cloudinaryCloudName: process.env.CLOUDINARY_CLIENT_NAME,
    cloudinaryApiKey: process.env.CLOUDINARY_CLIENT_API,
    cloudinaryApiSecret: process.env.CLOUDINARY_CLIENT_SECRET
  });

  const mongoURI = process.env.TEST_MONGODB_URI;
  await dbConnection(mongoURI);
  await cloudinary.v2.config({
    cloud_name: process.env.CLOUDINARY_CLIENT_NAME,
    api_key: process.env.CLOUDINARY_CLIENT_API,
    api_secret: process.env.CLOUDINARY_CLIENT_SECRET,
  });

  // Create users and jobs before running tests
  await request(app)
    .post('/api/v1/user/register')
    .send({
      name: 'jobSeeker',
      email: 'jobseeker@example.com',
      phone: '999999999',
      role: 'Job Seeker',
      password: 'testpassword',
    });

  await request(app)
    .post('/api/v1/user/register')
    .send({
      name: 'employer',
      email: 'employer@example.com',
      phone: '999999999',
      role: 'Employer',
      password: 'testpassword',
    });

  // Login job seeker and employer to get tokens
  let res = await request(app)
    .post('/api/v1/user/login')
    .send({
      email: 'jobseeker@example.com',
      password: 'testpassword',
      role: 'Job Seeker',
    });
  jobSeekerToken = res.body.token;

  res = await request(app)
    .post('/api/v1/user/login')
    .send({
      email: 'employer@example.com',
      password: 'testpassword',
      role: 'Employer',
    });
  employerToken = res.body.token;

  // Create a job as an employer
  res = await request(app)
    .post('/api/v1/job/post')
    .set('Cookie', [`token=${employerToken}`])
    .send({
      title: 'Test Job',
      description: 'Job Description',
      category: 'Category',
      country: 'Country',
      city: 'City',
      location: 'Location......Location.....Location.....Location.....',
      fixedSalary: 50000,
    });

  jobId = res.body.job._id;
});

afterAll(async () => {
  await User.deleteMany({});
  await Application.deleteMany({});
  await Job.deleteMany({});
  await mongoose.connection.close();
});

describe('Application Endpoints', () => {
  it('should allow job seeker to post an application', async () => {
    const res = await request(app)
      .post('/api/v1/application/post')
      .set('Cookie', [`token=${jobSeekerToken}`])
      .field('name', 'Test Applicant')
      .field('email', 'applicant@example.com')
      .field('coverLetter', 'Cover Letter')
      .field('phone', '1234567890')
      .field('address', 'Applicant Address')
      .field('jobId', jobId)
      .attach('resume', '__tests__/files/test_resume.jpg');

    if (res.statusCode !== 200) {
      console.error('Error:', res.body.error);
    }

    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('application');
    expect(res.body.application).toHaveProperty('resume');
  });

  it('should not allow job seeker to post an application without a resume', async () => {
    const res = await request(app)
      .post('/api/v1/application/post')
      .set('Cookie', [`token=${jobSeekerToken}`])
      .send({
        name: 'Test Applicant',
        email: 'applicant@example.com',
        coverLetter: 'Cover Letter',
        phone: '1234567890',
        address: 'Applicant Address',
        jobId: jobId,
      });

    expect(res.statusCode).toEqual(400);
    expect(res.body).toHaveProperty('message', 'Resume file required');
  });

  it('should allow job seeker to get all applications', async () => {
    const res = await request(app)
      .get('/api/v1/application/jobseeker/getall')
      .set('Cookie', [`token=${jobSeekerToken}`]);

    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('applications');
  });

  it('should allow job seeker to delete an application', async () => {
    let res = await request(app)
      .post('/api/v1/application/post')
      .set('Cookie', [`token=${jobSeekerToken}`])
      .field('name', 'Test Applicant')
      .field('email', 'applicant@example.com')
      .field('coverLetter', 'Cover Letter')
      .field('phone', '1234567890')
      .field('address', 'Applicant Address')
      .field('jobId', jobId)
      .attach('resume', '__tests__/files/test_resume.jpg');

    const applicationId = res.body.application._id;

    res = await request(app)
      .delete(`/api/v1/application/delete/${applicationId}`)
      .set('Cookie', [`token=${jobSeekerToken}`]);

    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('message', 'Application deleted successfully!');
  });

  it('should not allow employer to post an application', async () => {
    const res = await request(app)
      .post('/api/v1/application/post')
      .set('Cookie', [`token=${employerToken}`])
      .field('name', 'Test Applicant')
      .field('email', 'applicant@example.com')
      .field('coverLetter', 'Cover Letter')
      .field('phone', '1234567890')
      .field('address', 'Applicant Address')
      .field('jobId', jobId)
      .attach('resume', '__tests__/files/test_resume.jpg');

    expect(res.statusCode).toEqual(400);
    expect(res.body).toHaveProperty('message', 'Employer is not allowed to access this resource!');
  });

  it('should allow employer to get all applications', async () => {
    const res = await request(app)
      .get('/api/v1/application/employer/getall')
      .set('Cookie', [`token=${employerToken}`]);

    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('applications');
  });

  it('should not allow employer to delete an application', async () => {
    let res = await request(app)
      .post('/api/v1/application/post')
      .set('Cookie', [`token=${jobSeekerToken}`])
      .field('name', 'Test Applicant')
      .field('email', 'applicant@example.com')
      .field('coverLetter', 'Cover Letter')
      .field('phone', '1234567890')
      .field('address', 'Applicant Address')
      .field('jobId', jobId)
      .attach('resume', '__tests__/files/test_resume.jpg');

    const applicationId = res.body.application._id;

    res = await request(app)
      .delete(`/api/v1/application/delete/${applicationId}`)
      .set('Cookie', [`token=${employerToken}`]);

    expect(res.statusCode).toEqual(400);
    expect(res.body).toHaveProperty('message', 'Employer is not allowed to access this resource!');
  });
});

