const path = require('path');
const colors = require('colors');
const startAndListen = require('./listen');
const { FFCreatorCenter, FFScene, FFImage, FFLottie, FFCreator, FFSkottie, FFVideo } = require('../');

const createFFTask = () => {
  const logo2 = path.join(__dirname, './assets/imgs/logo/logo2.png');
  const img1 = path.join(__dirname, './assets/lottie/images/img1.png');
  const img2 = path.join(__dirname, './assets/lottie/images/img2.png');
  const file1 = path.join(__dirname, './assets/lottie/intro1.json');
  const file2 = path.join(__dirname, './assets/lottie/data2.json');
  const outputDir = path.join(__dirname, './output/');
  const cacheDir = path.join(__dirname, './cache/');

  // create creator instance
  const width = 1920;
  const height = 1080;
  const creator = new FFCreator({
    cacheDir,
    outputDir,
    width,
    height,
    highWaterMark: '6mb',
    parallel: 1,
    fps: 30,
    clarity: 'high',
    transparent: true
  });

  // create FFScene
  const scene = new FFScene();
 // scene.setBgColor('#6ab7b0');

  const video = new FFVideo({
    path: './assets/bg.mp4',
    x: width / 2,
    y: height / 2,
    width: 1920,
    height: 1080,
  });
  //video.setEndTime(1)
  video.setAudio(true); // Is there music
  // video.addBlend('screen')
  scene.addChild(video);

  // add lottie comp
  const flottie1 = new FFSkottie({
    x: width / 2,
    y: height / 2,
    width,
    height,
    file: file1,
    loop: false,
  });

  flottie1.addBlend('screen')
  scene.addChild(flottie1);



  const ftitle = new FFImage({ path: logo2, x: width / 2, y: height / 2 });
  ftitle.addEffect(['blurIn', 'zoomIn'], 0.4, 0.5);
 //  ftitle.addAnimate({
 //    from: { x:2000, alpha: 0 },
 //    to: { x:400, alpha: 1},
 //    time: 1.8,
 //    delay: 0.4,
 //    ease: 'Exponential.InOut',
 //  });
 // scene.addChild(ftitle);
  scene.setDuration(7);
   creator.addChild(scene);

  const scene2 = new FFScene();
  // scene2.setBgColor('red');

  // const ftitle2 = new FFImage({ path: logo2, x: 400, y: 200 });
  //
  // //stretch,CircleCrop,fastswitch,magnifier,moveleft,oblique,shake
  //
   scene.setTransition('waterwave', 0.2)
  //
  // scene2.addChild(ftitle2);
  scene2.setDuration(3);
  creator.addChild(scene2);



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
