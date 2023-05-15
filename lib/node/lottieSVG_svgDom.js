'use strict';

/**
 * FFLottie - Lottie-node is an API for runnig Lottie with the canvas renderer in Node.js, with the help of node-canvas.
 * This is intended for rendering Lottie animations to images or video.
 *
 * #### Example:
 *
 *    const flottie = new FFLottie({ file, loop, width: 600, height: 500 });
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

const FFImage = require('./image');
const fs = require('fs');

const { JSDOM, VirtualConsole } = require("jsdom");
const CanvasUtil = require('../utils/canvas');
const TimelineUpdate = require('../timeline/update');
const { Canvas, Image, Texture } = require('inkpaint');

class FFLottieSVG extends FFImage {
  constructor(conf = {}) {
    super({ type: 'lottieSVG', ...conf });

    const { data = null, file, filepath, loop = false } = this.conf;
    this.data = data;
    this.loop = loop;
    this.file = file || filepath;

   this.updateCallback = this.updateCallback.bind(this);
    this.initLottie();
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

  //  const canvas = new Canvas(width, height);

    let newData = data

    if(!newData){
      newData = JSON.parse(fs.readFileSync(file))
    }

    const htmlBody = `
    <!DOCTYPE html>
    <head>
    <link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@600;700&display=swap" rel="stylesheet">
   <style type="text/css">
    @font-face {
        font-family: "MontserratBold";
        src: url('https://storage.googleapis.com/lumen5-site-css/Montserrat-Bold.ttf');
    }
</style>
</head>
    <body></body>
    `

   // CanvasUtil.setFont('./assets/lottie/Montserrat-Bold.ttf', function(){})

    //NEW
    const { window } = new JSDOM(htmlBody, {
      pretendToBeVisual: true,
      globalize: true,
      console: true,
      useEach: false,
      skipWindowCheck: false,
        beforeParse(window) {
          window.Element.prototype.getComputedTextLength = function () {
            return 100
          }
        }
    });


    const { createSVGWindow } = require('svgdom')
    const windowSVG = createSVGWindow()
    const documentSVG = windowSVG.document
    const { SVG, registerWindow } = require('@svgdotjs/svg.js')

    registerWindow(windowSVG, documentSVG)

    // create canvas
    const canvasSVG = SVG(documentSVG.documentElement)

    const { document, navigator } = window;

    const virtualConsole = new VirtualConsole();
    virtualConsole.sendTo(console);


    // have to trick lottie into thinking it's running in a browser
    global.window = window;
    global.navigator = navigator;
    global.document = document;


        const container = documentSVG.createElement("div");
       // documentSVG.body.append(container);


    const lottie = require('lottie-web');

        const ani = await lottie.loadAnimation({
          container: container,
          renderer: "svg",
          loop: false,
          autoplay: false,
          animationData: newData,

          // rendererSettings: {
          //   context: canvas.getContext("2d"), // the canvas context, only support "2d" context
          //   preserveAspectRatio: 'xMinYMin slice', // Supports the same options as the svg element's preserveAspectRatio property
          //   clearCanvas: true,
          //   progressiveLoad: false, // Boolean, only svg renderer, loads dom elements when needed. Might speed up initialization for large number of elements.
          //   hideOnTransparent: true, //Boolean, only svg renderer, hides elements when opacity reaches 0 (defaults to true)
          // }
        });

        //console.log('ani', ani, newData)

    ani.addEventListener('error', (err) => {
      console.log('err', err)
      })

    ani.addEventListener('data_failed', (err) => {
      console.log('err data_failed', err)
    })

    ani.addEventListener('loaded_images', (err) => {
      console.log('loaded_images ', err)
    })

    ani.addEventListener('DOMLoaded', (err) => {
      console.log('DOMLoaded ', err)
    })

    ani.addEventListener('data_ready', (err) => {
      console.log('data ready ', err)
    })

    ani.addEventListener('config_ready', (err) => {
      console.log('config ready ', err)
    })

    this.fps = newData.fr

    ani.addEventListener("DOMLoaded", () => {
      console.log('here dom')
      this.firstTime = null
      let that = this
      TimelineUpdate.addFrameCallback(function(time, delta){

        if(!that.firstTime){
          console.log('here once')
          that.firstTime = time;
        }


        that.currentFrame =  Math.floor((time - that.firstTime) / that.fps)
        ani.goToAndStop(that.currentFrame, true);

        const imgPath = `myanim_${that.currentFrame}.svg`
        fs.writeFile(imgPath, container.innerHTML,(err) => {
          if (err) {
            console.log('make file error', err);
          } else {
            console.log('i', imgPath)
            that.display.texture = Texture.fromImage(fs.readFileSync(imgPath), undefined, undefined, 1.0)
            fs.unlinkSync(imgPath)
          }
        });
         //that.display.texture = Texture.fromImage(fs.readFileSync(`myanim_${that.currentFrame}.svg`), undefined, undefined, 1.0)
       // fs.unlinkSync(`myanim_${that.currentFrame}.svg`)
       //  that.display.texture = Texture.fromImage(container.innerHTML, undefined, undefined, 1.0)
      })

        });

      //END NEW

    this.ani = ani;
  //  this.canvas = canvas;
  }

  /**
   * Start rendering
   * @public
   */
  start() {
    console.log('start called')
    this.initTexture();
   // this.ani.loadNow();
    this.animations.start();
   // TimelineUpdate.addFrameCallback(this.updateCallback);
  }

  initTexture() {
    const { canvas, display } = this;

    const scale = display.scale.clone();
   // display.texture = Texture.fromCanvas(canvas);
    this.setDisplaySize();
    display.scale.copy(scale);
    display.setScaleToInit();
  }

  updateCallback(time, delta) {
    const { canvas, display } = this;
    const ctx = this.canvas.getContext("2d")
    this.ani.render(delta);
  }

  destroy() {
    TimelineUpdate.removeFrameCallback(this.updateCallback);
    super.destroy();
    if (this.ani) this.ani.destroy();

    this.updateCallback = null;
    this.canvas = null;
    this.ani = null;
    this.data = null;
    this.file = null;
  }
}

module.exports = FFLottieSVG;
