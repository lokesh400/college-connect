const express = require('express');
const router = express.Router();
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');
const Resource = require('../models/Resource');
require('dotenv').config();

const upload = multer({ dest: 'uploads/' });

// Middleware to check Zenodo token
const checkZenodoToken = (req, res, next) => {
  if (!process.env.ZENODO_TOKEN) {
    return res.status(500).render('error', { 
      message: 'Zenodo token is not configured' 
    });
  }
  next();
};

const Year = require('../models/Year');
const Department = require('../models/Department');
const Branch = require('../models/Branch');
const Subject = require('../models/Subject');


router.get('/add/details', async (req,res)=>{
  try{
      const departments = await Department.find({})
      const branches = await Branch.find({})
      const years = ["1","2","3","4"];
      res.render('resource/edit.ejs',{years,departments,branches})
  } catch(error){
    console.log(error)
    res.send(error)
  }
})

router.post('/add-department', async (req, res) => {
  try {
    const { name } = req.body; // Get yearId and department name from the form
    const newDepartment = new Department({ name });
    await newDepartment.save();
    res.redirect('/add/details'); // Redirect after adding the department
  } catch (error) {
    console.error('Error adding department:', error);
    res.status(500).send('Internal Server Error');
  }
});

router.post('/add-branch', async (req, res) => {
  try {
    const { year,department,name } = req.body;
    const newBranch = new Branch({ name:name,year:year,department:department });
    await newBranch.save();
    res.redirect('/add/details');
  } catch (error) {
    console.error('Error adding branch:', error);
    res.status(500).send('Internal Server Error');
  }
});

router.post('/add-subject', async (req, res) => {
    try {
        const { year, department, branch, name, } = req.body;
        const newSubject = new Subject({
            year,
            department,
            branch,
            name,
        });
        await newSubject.save();
        res.redirect('/add/details');
    } catch (err) {
        console.error(err);
        res.status(500).send('Error adding subject');
    }
});

router.get('/upload', async (req, res) => {
  try {
    // Fetch all the years from the database
    const years = await Year.find();
    // Render the page with the fetched years
    res.render('resource/upload', { years });
  } catch (error) {
    console.error('Error fetching years:', error);
    res.status(500).send('Internal Server Error');
  }
});

router.get('/departments/:yearId', async (req, res) => {
  const departments = await Department.find();
  res.json(departments);
});

router.get('/branches/:yearId/:deptId', async (req, res) => {
  const branches = await Branch.find({ department: req.params.deptId });
  res.json(branches);
});

router.get('/subjects/:yearId/:deptId/:branchId', async (req, res) => {
  const subjects = await Subject.find({
    year: req.params.yearId,
    department: req.params.deptId,
    branch: req.params.branchId
  });
  res.json(subjects);
});

// router.post('/view-docs', (req, res) => {
//   const { year, department, branch, subject } = req.body;
//   res.redirect(`/view/docs/${year}/${department}/${branch}/${subject}`);
// });


// select year
router.get('/view/docs', async (req, res) => {
  try {
    const years = await Department.find();
    res.render('resource/select.ejs', { years });
  } catch (err) {
    console.error('Error fetching resources:', err);
    res.status(500).render('error', { 
      message: 'Failed to load resources' 
    });
  }
});


//select branch
router.post('/view-docs', async (req, res) => {
  try {
     const {department} = req.body;
     const years = await Branch.find({ department: department });
     res.render('resource/selectBranch.ejs',{department,years});
  } catch (err) {
    console.error('Error fetching resources:', err.message);
    res.status(500).render('error', { message: 'Failed to fetch documents' });
  }
});

//select year
router.post('/view-docs/select/branch/:department', async (req,res)=>{
  const {branch} = req.body;
  const department = req.params.department;
  res.render('resource/selectYear.ejs',{department,branch})
})

//select branch
router.post('/view-docs/select/year/:department/:branch', async(req,res)=>{
  const { year } = req.body;
  const department = req.params.department;
  const branch = req.params.branch;
  const years = await Subject.find({department:department,branch:branch,year:year});
  res.render('resource/selectSubject.ejs',{department,branch,year,years})
})

//select subject
router.post('/view-docs/select/subject/:department/:branch/:year', async(req,res)=>{
  const { subject } = req.body;
  const department = req.params.department;
  const branch = req.params.branch;
  const year = req.params.year;
  const resources = await Resource.find({department:department,branch:branch,year:year,subject:subject});
  res.render('resource/index.ejs',{resources})
})

router.get('/upload', (req, res) => {
  res.render('resource/upload');
});

router.post('/upload', checkZenodoToken, upload.single('pdf'), async (req, res) => {
  const { title, description, type, branch, year, subject,department } = req.body;
  
  if (!req.file) {
    return res.status(400).render('error', { 
      message: 'No file uploaded' 
    });
  }

  const filePath = req.file.path;
  const fileName = req.file.originalname;

  try {
    // Step 1: Create deposition
    const createRes = await axios.post(
      'https://zenodo.org/api/deposit/depositions',
      {},
      {
        headers: {
          Authorization: `Bearer ${process.env.ZENODO_TOKEN}`,
          'Content-Type': 'application/json'
        },
      }
    );

    const depositionId = createRes.data.id;

    // Step 2: Upload file
    const form = new FormData();
    form.append('file', fs.createReadStream(filePath), fileName);

    const uploadRes = await axios.post(
      `https://zenodo.org/api/deposit/depositions/${depositionId}/files`,
      form,
      {
        headers: {
          ...form.getHeaders(),
          Authorization: `Bearer ${process.env.ZENODO_TOKEN}`,
        },
        maxContentLength: Infinity,
        maxBodyLength: Infinity
      }
    );

    // Step 3: Add metadata
    await axios.put(
      `https://zenodo.org/api/deposit/depositions/${depositionId}`,
      {
        metadata: {
          title: title,
          upload_type: 'publication',
          publication_type: 'article',
          description: description || 'Uploaded via TechScribe',
          creators: [{ name: 'TechScribe User' }],
        },
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.ZENODO_TOKEN}`,
          'Content-Type': 'application/json'
        },
      }
    );

    // Step 4: Publish
    const publishRes = await axios.post(
      `https://zenodo.org/api/deposit/depositions/${depositionId}/actions/publish`,
      {},
      {
        headers: {
          Authorization: `Bearer ${process.env.ZENODO_TOKEN}`,
          'Content-Type': 'application/json'
        },
      }
    );

    // Step 5: Save to DB
    const resource = new Resource({
      title,
      description,
      type,
      branch,
      year,
      department,
      subject,
      zenodoLink: `https://zenodo.org/record/${publishRes.data.record_id}/files/${publishRes.data.files[0].filename}?download=1`, // Make sure `fileLink` is correctly assigned
    });

    await resource.save();
    fs.unlinkSync(filePath); // remove temp file
    res.redirect('/view/docs');
  } catch (err) {
    console.error('Upload error:', err.response?.data || err.message);
    
    // Clean up uploaded file if error occurred
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    
    res.status(500).render('error', { 
      message: 'Upload failed: ' + (err.response?.data?.message || err.message) 
    });
  }
});


module.exports = router;