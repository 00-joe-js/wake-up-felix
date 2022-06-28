import { TextureLoader, Mesh, PlaneGeometry, MeshBasicMaterial, Vector3, Texture, Material, BufferGeometry, Color, DoubleSide, ShaderMaterial } from "three";

const textureLoaderCache: { [url: string]: Texture } = {};

const _red = new Color(1, 0, 0);
const _white = new Color(1, 1, 1);

class TexturedPlane {

    texture: Texture;
    mesh: Mesh;
    flipped: boolean;
    mat: ShaderMaterial;

    private animationSpeed: number;
    private frameAmount: number;
    private currentlyAppliedFlip: boolean;
    private lastFrame: number;
    private lastFrameTime: number;

    constructor(textureUrl: string, width: number, height: number, distanceFromFloor: number = 5, frameAmount: number = 5, animationSpeed: number = 50) {

        this.frameAmount = frameAmount;
        this.animationSpeed = animationSpeed;

        this.flipped = false;
        this.currentlyAppliedFlip = false;

        if (!textureLoaderCache[textureUrl]) {
            textureLoaderCache[textureUrl] = new TextureLoader().load(textureUrl);
        }

        this.texture = textureLoaderCache[textureUrl];

        this.mat = new ShaderMaterial({
            uniforms: {
                uTex: { value: this.texture },
                uTexWidth: { value: 0 },
                uBlendColor: { value: new Color(1, 1, 1) },
                uFrameAmount: { value: frameAmount },
                uCurrentFrame: { value: 0 },
                uFlipped: { value: 0 },
            },
            vertexShader: `
                varying vec2 vUv;
                void main() {
                    vUv = uv;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
                }
            `,
            fragmentShader: `
                uniform sampler2D uTex;
                uniform float uFlipped;
                uniform float uFrameAmount;
                uniform float uCurrentFrame;
                uniform float uTexWidth;
                uniform vec3 uBlendColor;
                varying vec2 vUv;
                void main() {

                    float windowSize = 1.0 / uFrameAmount;

                    vec2 viewedRange = vec2(windowSize * uCurrentFrame, windowSize * (uCurrentFrame + 1.0));

                    vec2 adjustedUv = (vUv / vec2(uFrameAmount, 1.0)) + vec2(1.0 / uFrameAmount * uCurrentFrame, 0.0);

                    vec2 orientedUv = uFlipped == 0.0 ? adjustedUv : vec2(viewedRange.x + (viewedRange.y - adjustedUv.x), adjustedUv.y);

                    vec4 texel = texture2D(
                        uTex, 
                        orientedUv
                    );

                    gl_FragColor = vec4(texel) * vec4(uBlendColor, 1.0);

                    if (gl_FragColor.a < 0.1) {
                        discard;
                    }

                }
            `,
        });

        this.mesh = new Mesh(
            new PlaneGeometry(width, height),
            this.mat
        );

        this.setFlipped(true);
        this.lastFrame = -1;
        this.lastFrameTime = -1;

        // Face overhead.
        this.mesh.rotateOnAxis(new Vector3(1, 0, 0), -Math.PI / 2);
        this.mesh.rotateOnAxis(new Vector3(1, 0, 0), Math.PI / 5);

        this.mesh.position.y = distanceFromFloor;
    }

    public flashRed() {
        this.mat.uniforms.uBlendColor.value = _red;
        setTimeout(() => {
            this.mat.uniforms.uBlendColor.value = _white;
        }, 500);
    }

    private setFlipped(f: boolean) {
        if (this.currentlyAppliedFlip === f) return;
        this.currentlyAppliedFlip = f;
        this.flipped = f;

        this.mat.uniforms.uFlipped.value = f ? 1.0 : 0.0;

        this.resetPlay();

    }

    private resetPlay() {
        this.lastFrameTime = -1;
        this.lastFrame = -1;
    }

    private setFrame(nthFrame: number) {
        this.mat.uniforms.uCurrentFrame.value = nthFrame;
    }

    update(dt: number, flipped: boolean, playing: boolean) {

        this.setFlipped(flipped);

        if (this.texture.image && this.mat.uniforms.uTexWidth.value === 0) {
            this.mat.uniforms.uTexWidth.value = this.texture.image.width;
        }

        if (!playing) {
            this.resetPlay();
        } else {
            if (dt - this.lastFrameTime > this.animationSpeed) {
                this.lastFrameTime = dt;
                this.lastFrame = this.lastFrame + 1;
                this.setFrame(this.lastFrame);
                if (this.lastFrame === this.frameAmount - 1) {
                    this.lastFrame = -1;
                }
            }
        }

    }

}

export default TexturedPlane;