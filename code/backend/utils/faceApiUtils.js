const path = require("path");
const faceapi = require("@vladmandic/face-api");
const canvas = require("canvas");
const { Canvas, Image, ImageData } = canvas;
faceapi.env.monkeyPatch({ Canvas, Image, ImageData });

let modelsLoaded = false;

const getModelPath = () => {
  try {
    const modelPath = path.join(
      require.resolve("@vladmandic/face-api"),
      "../../model"
    );
    console.log("Using models from:", modelPath);
    return modelPath;
  } catch (error) {
    console.error("Error finding model path:", error);
    throw error;
  }
};

const loadModels = async () => {
  if (modelsLoaded) {
    console.log("Models already loaded, skipping...");
    return;
  }

  try {
    const modelPath = getModelPath();
    console.log("Loading face detection model...");
    await faceapi.nets.ssdMobilenetv1.loadFromDisk(modelPath);
    console.log("Face detection model loaded");

    console.log("Loading face landmark model...");
    await faceapi.nets.faceLandmark68Net.loadFromDisk(modelPath);
    console.log("Face landmark model loaded");

    console.log("Loading face recognition model...");
    await faceapi.nets.faceRecognitionNet.loadFromDisk(modelPath);
    console.log("Face recognition model loaded");

    modelsLoaded = true;
    console.log("All models loaded successfully");
  } catch (error) {
    console.error("Error loading models:", error);
    throw error;
  }
};

module.exports = {
  faceapi,
  canvas,
  loadModels,
  getModelPath,
};
