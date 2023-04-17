'use strict';

/**
 * FFLottie - Lottie-node is an API for runnig Lottie with the canvas renderer in Node.js, with the help of node-canvas.
 * This is intended for rendering Lottie animations to images or video.
 *
 * #### Example:
 *
 *    const sklottie = new FFSkottie({ file, loop, width: 600, height: 500 });
 *    flottie.goToAndStop(15);
 *    flottie.replaceAsset(17, path.join(__dirname, 'xx.jpg'));
 *
 *
 * #### Note
 *     https://github.com/drawcall/lottie-node
 *
 * @class
 *
 */
// git test
const CanvasKitInit = require('canvaskit-wasm/bin/full/canvaskit');
const fs = require('fs');

const FFImage = require('./image');
const CanvasUtil = require('../utils/canvas');
const TimelineUpdate = require('../timeline/update');
const { Canvas, Image, Texture } = require('inkpaint');

class FFSkottie extends FFImage {
  constructor(conf = {}) {
    super({ type: 'skottie', ...conf });

    const { data = null, file, filepath, loop = false } = this.conf;
    this.data = data;
    this.loop = loop;
    this.file = file || filepath;

    this.initLottie();

    this.updateCallback = this.updateCallback.bind(this);

  }

  /**
   * Get the width and height of the chart component
   * @return {array} [width, height] array
   * @public
   */
  getWH() {
    const { width = 500, height = 500 } = this.conf;
    return [width, height];
  }

  /**
   * Set text font file path
   * @param {string} font - text font file path
   * @public
   */
  setFont(font) {
    CanvasUtil.setFont(font, fontFamily => (this.ctx.font = fontFamily));
  }

  /**
   * Modify the Image in the lottie json data.
   * @param {number|string} id - id of the material
   * @param {string} path - new material path
   * @param {boolean} absolute - absolute path or relative path
   * @public
   */
  replaceAsset(id, path, absolute = true) {
    this.ani.replaceAsset(id, path, absolute);
  }

  /**
   * Modify the Text in the lottie json data.
   * @param {string} target - the target value
   * @param {string} path - new txt value
   * @public
   */
  replaceText(target, txt) {
    this.ani.replaceText(target, txt);
  }

  /**
   * Find a specific layer element
   * @param {string} key - the key value
   * @public
   */
  findElements(key) {
    return this.ani.findElements(key);
  }

  /**
   * get lottie-api instance
   * @public
   */
  getApi() {
    return this.ani.api;
  }

  /**
   * Initialize the Lottie instance
   * @private
   */
  async initLottie() {
    const { loop, data, file } = this;
    const [width, height] = this.getWH();

    let newData = data

    console.log('w h ', width, height)

    if(!newData){
      newData = JSON.parse(fs.readFileSync(file))
    }

    //todo figure out loop ??

    const CanvasKit = await CanvasKitInit()

    const json = JSON.stringify(newData);

    // let img = fs.readFileSync('img_0.jpg')
    // let font1 = fs.readFileSync('Montserrat-Bold.ttf')
    // const assets = {
    //   // "img_0.jpg": img,
    //   "Montserrat-Bold": font1,
    // }

    let assets = {}

    const ani = CanvasKit.MakeManagedAnimation(json, assets);
    const totalFrames = newData.op;

    const surface = CanvasKit.MakeSurface(width, height);
    const imageInfo = surface.imageInfo();
    const skCanvas = surface.getCanvas();
    const bounds = CanvasKit.XYWHRect(0, 0, width, height);

    this.ani = ani;
    this.canvas = skCanvas;
    this.CanvasKit = CanvasKit;
    this.currentFrame = 0;
    this.bounds = bounds;
    this.surface = surface;
    this.imageInfo = imageInfo;
  }

  /**
   * Start rendering
   * @public
   */
  start() {
    this.initTexture();
    // this.ani.loadNow();
    this.animations.start(); // <-- todo not sure what this is
    TimelineUpdate.addFrameCallback(this.updateCallback);
  }

  initTexture() {
    const { canvas, display } = this;

    const scale = display.scale.clone();
    display.texture = Texture.fromCanvas(canvas);
    this.setDisplaySize();
    display.scale.copy(scale);
    display.setScaleToInit();
  }

  updateCallback(time, delta) {
    //todo needs to take into account frame from fps and delta etc
    this.currentFrame++
    this.canvas.clear(this.CanvasKit.TRANSPARENT);
    this.ani.seekFrame(this.currentFrame);
    this.ani.render(this.canvas, this.bounds);
    // const pixels = this.canvas.readPixels(0, 0, this.imageInfo);
    this.surface.flush();
  }

  destroy() {
    TimelineUpdate.removeFrameCallback(this.updateCallback);
    super.destroy();
    if (this.ani) this.ani.delete();
    if (this.surface) this.surface.delete();

    this.updateCallback = null;
    this.canvas = null;
    this.ani = null;
    this.data = null;
    this.file = null;

    this.CanvasKit = null;
    this.currentFrame = 0;
    this.bounds = null;
    this.surface = null;
    this.imageInfo = null;
  }
}

module.exports = FFSkottie;
