import request from 'supertest';
import mongoose from 'mongoose';
import app from '../app'; // Ensure this points to your Express app
import { Job } from '../models/jobSchema.js';
import { User } from '../models/userSchema.js'; // Assuming you have a user schema

describe('Job Endpoints', () => {
  let employerToken;
  let jobSeekerToken;
  let jobId;

  beforeAll(async () => {
    // Connect to the test database
    const mongoURI = 'mongodb+srv://japankaj282:pankaj7272@cluster0.nzuhe0x.mongodb.net/tests?retryWrites=true&w=majority&appName=Cluster0';
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

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
  //console.log(res.body)
  });

  afterAll(async () => {
    await Job.deleteMany({});
    await User.deleteMany({});
    await mongoose.connection.close();
  });

  it('should allow an employer to post a job', async () => {
    const res = await request(app)
      .post('/api/v1/job/post')
      .set('Cookie', [`token=${employerToken}`])
      .send({
        title: 'Software Engineer',
        description: 'Job description',
        category: 'IT',
        country: 'Country',
        city: 'City',
        location: 'Remote.....Remote....Remote.....Remote...RemoteRemote.....Remote',
        fixedSalary: 50000,
      });
      //console.log('Response:', res.body); // Log the response for debugging
      //console.error('Error Response:', res.body)
    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
    expect(res.body.job).toHaveProperty('_id');
    jobId = res.body.job._id;
  });

  it('should not allow a job seeker to post a job', async () => {
    const res = await request(app)
      .post('/api/v1/job/post')
      .set('Cookie', [`token=${jobSeekerToken}`])
      .send({
        title: 'Software Engineer',
        description: 'Job description',
        category: 'IT',
        country: 'Country',
        city: 'City',
        location: 'Remote.....Remote.Remote.....Remote.Remote.....Remote...Remote.....Remote',
        fixedSalary: 50000,
      });

    expect(res.statusCode).toEqual(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Job Seeker not allowed to access this resource.');
  });

  it('should allow an employer to get all their jobs', async () => {
    const res = await request(app)
      .get('/api/v1/job/getmyjobs')
      .set('Cookie', [`token=${employerToken}`])

    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
    expect(res.body.myJobs).toBeInstanceOf(Array);
    expect(res.body.myJobs[0]).toHaveProperty('_id', jobId);
  });

  it('should allow anyone to get all jobs', async () => {
    const res = await request(app)
      .get('/api/v1/job/getall');

    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
    expect(res.body.jobs).toBeInstanceOf(Array);
    expect(res.body.jobs[0]).toHaveProperty('_id', jobId);
  });

  it('should allow an employer to update a job', async () => {
    const res = await request(app)
      .put(`/api/v1/job/update/${jobId}`)
      .set('Cookie',[`token=${employerToken}`])
      .send({ title: 'Updated Software Engineer' });

    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe('Job Updated!');
  });

  it('should not allow a job seeker to update a job', async () => {
    const res = await request(app)
      .put(`/api/v1/job/update/${jobId}`)
      .set('Cookie', [`token=${jobSeekerToken}`]);
    //   .send({ title: 'Updated Software Engineer' });

    expect(res.statusCode).toEqual(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Job Seeker not allowed to access this resource.');
  });

  it('should allow an employer to delete a job', async () => {
    const res = await request(app)
      .delete(`/api/v1/job/delete/${jobId}`)
      .set('Cookie', [`token=${employerToken}`])

    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe('Job Deleted!');
  });

  it('should not allow a job seeker to delete a job', async () => {
    // Post a new job to delete
    const job = await Job.create({
      title: 'Another Job',
      description: 'Job description',
      category: 'IT',
      country: 'Country',
      city: 'City',
      location: 'Remote....Remote....Remote....Remote....Remote.....RemoteRemote.....Remote',
      fixedSalary: 50000,
      postedBy: new mongoose.Types.ObjectId(),
    });

    const res = await request(app)
      .delete(`/api/v1/job/delete/${job._id}`)
      .set('Cookie', [`token=${jobSeekerToken}`]);

    expect(res.statusCode).toEqual(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Job Seeker not allowed to access this resource.');
  });

  it('should return 404 for invalid job ID', async () => {
    const invalidId = 'invalid_id';
    const res = await request(app)
    .get(`/api/v1/job/${invalidId}`)
    .set('Cookie', [`token=${jobSeekerToken}`]);

    expect(res.statusCode).toEqual(404);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Invalid ID / CastError');
  });
});
