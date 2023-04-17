const path = require('path');
const colors = require('colors');
const startAndListen = require('./listen');
const { FFCreatorCenter, FFScene, FFImage, FFLottie, FFCreator, FFSkottie } = require('../');

const createFFTask = () => {
  const logo2 = path.join(__dirname, './assets/imgs/logo/logo2.png');
  const img1 = path.join(__dirname, './assets/lottie/images/img1.png');
  const img2 = path.join(__dirname, './assets/lottie/images/img2.png');
  const file1 = path.join(__dirname, './assets/lottie/data1.json');
  const file2 = path.join(__dirname, './assets/lottie/data2.json');
  const outputDir = path.join(__dirname, './output/');
  const cacheDir = path.join(__dirname, './cache/');

  // create creator instance
  const width = 700;
  const height = 1000;
  const creator = new FFCreator({
    cacheDir,
    outputDir,
    width,
    height,
    highWaterMark: '3mb',
    parallel: 8,
    fps: 30,
  });

  // create FFScene
  const scene = new FFScene();
  scene.setBgColor('#6ab7b0');

  // add lottie comp
  const flottie1 = new FFSkottie({
    x: width / 2,
    y: height / 2,
    width,
    height,
    file: file1,
    loop: false,
  });
  scene.addChild(flottie1);


  scene.setDuration(5);
  creator.addChild(scene);
  creator.start();

  creator.on('start', () => {
    console.log(`FFCreator start`);
  });

  creator.on('error', e => {
    console.log(colors.red(`FFCreator error: ${e.error}`));
  });

  creator.on('progress', e => {
    console.log(colors.yellow(`FFCreator progress: ${(e.percent * 100) >> 0}%`));
  });

  creator.on('complete', e => {
    console.log(
      colors.magenta(`FFCreator completed: \n USEAGE: ${e.useage} \n PATH: ${e.output} `),
    );

    console.log(colors.green(`\n --- You can press the s key or the w key to restart! --- \n`));
  });

  return creator;
};

createFFTask()

module.exports = () => startAndListen(() => FFCreatorCenter.addTask(createFFTask));
