import { WebGLRenderer } from "three/src/renderers/WebGLRenderer";

import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass";
import { CopyShader } from "three/examples/jsm/shaders/CopyShader";

import colorifyPass, { setFrameFlashColor } from "./flashShader";

import ShakeShader from "./shakeShader";

import { Scene, Camera, Vector2, Color, Vector3 } from "three";

const container = document.querySelector("#three-canvas-container");
if (container === null) {
    throw new Error("Document needs #three-canvas-container");
}

const canvasElement = document.querySelector("#three-canvas");
if (canvasElement === null) {
    throw new Error("Document needs #three-canvas.");
}

const renderer = new WebGLRenderer({
    canvas: canvasElement,
    antialias: true
});

const composer = new EffectComposer(renderer);

const resizeScreen = () => {
    renderer.setSize(container.clientWidth, container.clientHeight);
    composer.setSize(container.clientWidth, container.clientHeight);
};
window.addEventListener("resize", () => {
    resizeScreen();
});

renderer.setClearColor(0x000000);

resizeScreen();

const screenRes = new Vector2(canvasElement.clientWidth, canvasElement.clientHeight);

const bloomPass = new UnrealBloomPass(screenRes, 0.1, 0.002, 0.7);
const shakePass = new ShaderPass(ShakeShader);
shakePass.enabled = false;

const copyPass = new ShaderPass(CopyShader);
copyPass.renderToScreen = true;

let shakingEnder: number | null = null;
export const shake = (duration: number) => {
    if (shakingEnder) return;
    shakePass.enabled = true;
    shakingEnder = setTimeout(() => {
        shakePass.enabled = false;
        shakingEnder = null;
    }, duration);
};

let renderPaused = false;
let runDuringPause: Function | null = null;
let deltaTimePaused: number | null = null;
let deltaTimePauseOffset = 0;
export const pauseRendering = (pause: boolean = true, fn?: Function) => {
    renderPaused = pause;
    if (pause === false) {
        runDuringPause = null
    } else if (pause === true && fn) {
        runDuringPause = fn;
    }
};

export const resumeRendering = () => {
    pauseRendering(false);
};

let lastDrawnFrameDt = 0;

export const renderLoop = (scene: Scene, camera: Camera, onLoop: (dt: number, elapsed: number) => void) => {

    const renderPass = new RenderPass(scene, camera);

    composer.addPass(renderPass);
    composer.addPass(bloomPass);
    composer.addPass(colorifyPass);
    composer.addPass(shakePass);
    composer.addPass(copyPass);

    const internalLoop = (absoluteCurrentTime: number) => {
        if (!renderPaused) {

            if (deltaTimePaused !== null) {
                deltaTimePauseOffset += absoluteCurrentTime - deltaTimePaused;
                deltaTimePaused = null;
            }

            if (shakePass.enabled) {
                shakePass.uniforms.time.value = Math.random();
            }

            setFrameFlashColor();

            const thisFrameDt = absoluteCurrentTime - deltaTimePauseOffset;
            const timeElapsedSinceLastFrame = thisFrameDt - lastDrawnFrameDt;

            // Handling frame drop. This is important because of weapon collisions.
            // Especially weapons like II hammer.
            if (timeElapsedSinceLastFrame > 500) {
                // Adding this offset should factor heavy frame drops as being in pause state.
                deltaTimePauseOffset += timeElapsedSinceLastFrame;
            }

            lastDrawnFrameDt = thisFrameDt;

            onLoop(absoluteCurrentTime - deltaTimePauseOffset, timeElapsedSinceLastFrame);
            composer.render();

        } else {
            if (deltaTimePaused === null) {
                deltaTimePaused = absoluteCurrentTime;
            }
            if (runDuringPause) {
                runDuringPause(absoluteCurrentTime);
            }
        }

        window.requestAnimationFrame(internalLoop);

    };

    window.requestAnimationFrame(internalLoop);

};

export default renderer;