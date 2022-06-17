import { Vector3, MathUtils, Color } from "three";

import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass";

class FlashCollection {

    private lastUsedId: number = 0;
    private flashes: { [id: number]: Vector3 } = {};
    private outputVector: Vector3 = new Vector3();

    addNewFlash(currentColor: Vector3) {
        const id = this.lastUsedId + 1;
        this.lastUsedId = id;
        this.flashes[id] = currentColor;
        return id;
    }

    setFlashValue(id: number, value: Vector3) {
        if (this.flashes[id]) {
            this.flashes[id].copy(value);
        } else {
            throw new Error(`Bad id given ${id}`);
        }
    }

    removeFlash(id: number) {
        delete this.flashes[id];
    }

    getAllFlashesColor(): Vector3 {
        const o = this.outputVector;
        o.set(0, 0, 0);
        Object.values(this.flashes).forEach(f => {
            o.set(o.x + f.x, o.y + f.y, o.z + f.z);
        });
        o.set(this.clampFlashValue(o.x), this.clampFlashValue(o.y), this.clampFlashValue(o.z));
        return o;
    }

    private clampFlashValue(v: number) {
        return MathUtils.clamp(v, 0, 0.15);
    }

}
const flashCollection = new FlashCollection();
export const flash = (baseColor: number[], initialLevel: number = 0.25, degrade: number = 0.003) => {

    let flashLevel = initialLevel;

    const colorV = new Vector3();
    colorV.set(baseColor[0], baseColor[1], baseColor[2]);
    colorV.multiplyScalar(flashLevel);

    const flashId = flashCollection.addNewFlash(colorV);

    const interval = setInterval(() => {
        colorV.set(baseColor[0], baseColor[1], baseColor[2]);
        colorV.multiplyScalar(flashLevel);
        flashCollection.setFlashValue(flashId, colorV);
        flashLevel = flashLevel - degrade;
        if (flashLevel <= 0) {
            if (interval) {
                flashCollection.removeFlash(flashId);
                clearInterval(interval);
            }
        }
    }, 16);

};

const ColorifyShader = {
    uniforms: {
        'tDiffuse': { value: null },
        'color': { value: new Color(0xffffff) }
    },
    vertexShader: /* glsl */`
		varying vec2 vUv;
		void main() {
    		vUv = uv;
			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
		}`,
    fragmentShader: /* glsl */`
		uniform vec3 color;
		uniform sampler2D tDiffuse;
		varying vec2 vUv;
		void main() {
			vec4 texel = texture2D( tDiffuse, vUv );
			// vec3 luma = vec3( 0.299, 0.587, 0.114 );
			// float v = dot( texel.xyz, luma );
			gl_FragColor = vec4(vec3(texel) + color, texel.w);
		}`
};

const colorifyPass = new ShaderPass(ColorifyShader);

export const setFrameFlashColor = () => {
    const { x, y, z } = flashCollection.getAllFlashesColor();
    colorifyPass.uniforms.color.value.setRGB(x, y, z);
};

export default colorifyPass;
