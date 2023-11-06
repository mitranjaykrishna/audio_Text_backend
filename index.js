const express = require("express");
const cors = require("cors");
const multer = require("multer");
const fs = require("fs");
const OpenAI = require("openai");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});
const path = require("path");

const app = express();
const port = 8000;

app.use(cors());
app.use(express.json());

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const uploadDir = path.join(__dirname, "uploads");
fs.existsSync(uploadDir) || fs.mkdirSync(uploadDir);

app.post("/api/upload", upload.single("audio"), async (req, res) => {
  try {
    const audioBuffer = req.file.buffer;

    //Save
    const fileName = Date.now() + "_" + req.file.originalname;
    const filePath = path.join(uploadDir, fileName);
    console.log(fileName);
    fs.writeFileSync(filePath, audioBuffer);

    //transcription
    const transcriptionResult = await openAiTranscript("./uploads/" + fileName);

    res.json({ transcript: transcriptionResult });
  } catch (error) {
    console.error("Error processing audio file:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});
app.post("/api/summary", async (req, res) => {
  try {
    const { text } = req.body;

    //summarization
    const summaryResult = await openAiPoint(text);

    res.json({ summary: summaryResult });
  } catch (error) {
    console.error("Error processing text for summarization:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.listen(port, () => {
  console.log(`Server is listening at http://localhost:${port}`);
});

async function openAiTranscript(filePath) {
  const transcription = await openai.audio.transcriptions.create({
    file: fs.createReadStream(filePath),
    model: "whisper-1",
  });

  return transcription.text;
}
async function openAiPoint(transcriptionResult) {
  const response = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages: [
      {
        role: "system",
        content: "Create summarise point from this text" + transcriptionResult,
      },
    ],
  });

  return response.choices[0].message;
}
