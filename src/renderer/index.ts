import { WebGLRenderer } from "three/src/renderers/WebGLRenderer";

import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass";
import { CopyShader } from "three/examples/jsm/shaders/CopyShader";

import colorifyPass, { setFrameFlashColor } from "./flashShader";

const ShakeShader = {
    uniforms: {
        time: { value: 0 },
        tDiffuse: { value: null },
    },
    vertexShader: `
        varying vec2 vUv;
		void main() {
    		vUv = uv;
			gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
		}
    `,
    fragmentShader: `
        float rand(float n){return fract(sin(n) * 43758.5453123);}
        uniform float time;
        uniform sampler2D tDiffuse;

        varying vec2 vUv;

        void main() {
            vec2 shakeOffset = vec2(rand(time * 2.0) / 250.0);
            vec4 texel = texture2D(tDiffuse, vUv + shakeOffset);
            gl_FragColor = texel;
        }
    `
};



import { Scene, Camera, Vector2, Color, Vector3 } from "three";

const canvasElement = document.querySelector("#three-canvas");

if (canvasElement === null) {
    throw new Error("Document needs #three-canvas.");
}

const renderer = new WebGLRenderer({
    canvas: canvasElement,
    antialias: true
});

const composer = new EffectComposer(renderer);

renderer.setSize(canvasElement.clientWidth, canvasElement.clientHeight);
composer.setSize(canvasElement.clientWidth, canvasElement.clientHeight);

renderer.setClearColor(0x000000);

const screenRes = new Vector2(canvasElement.clientWidth, canvasElement.clientHeight);

const bloomPass = new UnrealBloomPass(screenRes, 0.2, 0.02, 0.7);
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

export const renderLoop = (scene: Scene, camera: Camera, onLoop: (dt: number) => void) => {

    const renderPass = new RenderPass(scene, camera);

    composer.addPass(renderPass);
    composer.addPass(bloomPass);
    composer.addPass(colorifyPass);
    composer.addPass(shakePass);
    composer.addPass(copyPass);

    const internalLoop = (deltaTime: number) => {
        shakePass.uniforms.time.value = Math.random();
        setFrameFlashColor();
        window.requestAnimationFrame(internalLoop);
        onLoop(deltaTime);
        composer.render(deltaTime);
    };
    window.requestAnimationFrame(internalLoop);

};

export default renderer;