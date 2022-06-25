import { TextureLoader, Mesh, PlaneGeometry, MeshBasicMaterial, Vector3, Texture, Material, BufferGeometry, Color } from "three";

const textureLoaderCache: { [url: string]: Texture } = {};

const _red = new Color(1, 0, 0);
const _white = new Color(1, 1, 1);

class TexturedPlane {

    texture: Texture;
    mesh: Mesh;
    flipped: boolean;
    mat: MeshBasicMaterial;

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

        this.texture = textureLoaderCache[textureUrl].clone();

        this.mat = new MeshBasicMaterial({ map: this.texture, alphaTest: 0.1 });

        this.mesh = new Mesh(
            new PlaneGeometry(width, height),
            this.mat
        );

        this.setFlipped(true);
        this.lastFrame = -1;
        this.lastFrameTime = -1;

        // Face overhead.
        this.mesh.rotateOnAxis(new Vector3(1, 0, 0), -Math.PI / 2);
        this.mesh.rotateOnAxis(new Vector3(1, 0, 0), Math.PI / 8);

        this.mesh.position.y = distanceFromFloor;
    }

    public flashRed() {
        this.mat.color.set(_red);
        setTimeout(() => {
            this.mat.color.set(_white);
        }, 500);
    }

    private setFlipped(f: boolean) {
        if (this.currentlyAppliedFlip === f) return;
        this.currentlyAppliedFlip = f;
        this.flipped = f;

        this.texture.repeat.set(
            (1 / (this.frameAmount)) * (this.flipped ? -1 : 1), // x
            1 // y
        );

        this.resetPlay();

    }

    private resetPlay() {
        this.lastFrameTime = -1;
        this.lastFrame = -1;
    }

    private setFrame(nthFrame: number, flipped: boolean) {
        this.texture.offset.x = (1 / this.frameAmount) * nthFrame + (flipped ? (1 / this.frameAmount) : 0);
    }

    update(dt: number, flipped: boolean, playing: boolean) {

        this.setFlipped(flipped);

        if (!playing) {
            this.resetPlay();
        } else {
            if (dt - this.lastFrameTime > this.animationSpeed) {
                this.lastFrameTime = dt;
                this.lastFrame = this.lastFrame + 1;
                this.setFrame(this.lastFrame, flipped);
                if (this.lastFrame === this.frameAmount - 1) {
                    this.lastFrame = -1;
                }
            }
        }

    }

}

export default TexturedPlane;