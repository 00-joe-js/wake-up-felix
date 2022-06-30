export default {
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