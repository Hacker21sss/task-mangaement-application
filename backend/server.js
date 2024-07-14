const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(cors());
app.use('/uploads', express.static(path.join(__dirname, 'uploads'))); // Serve static files

mongoose.connect('mongodb://localhost:27017/taskdb', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

const taskSchema = new mongoose.Schema({
    title: String,
    description: String,
    dueDate: Date,
    fileUrl: String,
});

const Task = mongoose.model('Task', taskSchema);

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    },
});

const upload = multer({ storage: storage });

app.get('/tasks', async (req, res) => {
    const tasks = await Task.find();
    res.json(tasks);
});

app.post('/tasks', upload.single('file'), async (req, res) => {
    const { title, description, dueDate } = req.body;
    const fileUrl = req.file ? `/uploads/${req.file.filename}` : null;
    const task = new Task({ title, description, dueDate, fileUrl });
    await task.save();
    res.status(201).json(task);
});

app.get('/tasks/:id', async (req, res) => {
    const task = await Task.findById(req.params.id);
    if (task) {
        res.json(task);
    } else {
        res.status(404).json({ error: 'Task not found' });
    }
});

app.put('/tasks/:id', upload.single('file'), async (req, res) => {
    const { title, description, dueDate } = req.body;
    const fileUrl = req.file ? `/uploads/${req.file.filename}` : null;
    const update = { title, description, dueDate };
    if (fileUrl) {
        update.fileUrl = fileUrl;
    }
    const task = await Task.findByIdAndUpdate(req.params.id, update, { new: true });
    res.json(task);
});

app.delete('/tasks/:id', async (req, res) => {
    const task = await Task.findById(req.params.id);
    if (task.fileUrl) {
        const filePath = path.join(__dirname, task.fileUrl);
        fs.unlink(filePath, (err) => {
            if (err) {
                console.error('Error deleting file:', err);
            }
        });
    }
    await Task.findByIdAndDelete(req.params.id);
    res.status(204).send();
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
