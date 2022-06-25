import { TextureLoader, Mesh, PlaneGeometry, MeshBasicMaterial, Vector3, Texture } from "three";

const textureLoaderCache: { [url: string]: Texture } = {};

class TexturedPlane {

    texture: Texture;
    mesh: Mesh;
    flipped: boolean;

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

        this.mesh = new Mesh(
            new PlaneGeometry(width, height),
            new MeshBasicMaterial({ map: this.texture, transparent: true })
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
        console.log(this.mesh.material);
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