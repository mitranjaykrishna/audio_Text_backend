const fs = require("fs");
const OpenAI = require("openai");

const openai = new OpenAI({
  apiKey: "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",
});

async function main() {
  const transcription = await openai.audio.transcriptions.create({
    file: fs.createReadStream("Recording.m4a"),
    model: "whisper-1",
  });

  console.log(transcription.text);
}
main();
