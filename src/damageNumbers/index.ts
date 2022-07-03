import { MathUtils } from "three";



const CONTAINER_WIDTH = 1680;
const CONTAINER_HEIGHT = 945;

class DamagePlane {

    element: HTMLElement;
    animations: Array<{ entryTime: number, fn: Function, el: HTMLSpanElement }>;

    constructor() {
        const damagePlane = window.getDOMOne("#damage-numbers-plane");
        this.element = damagePlane;
        this.animations = [];

        this.runAnimations();

    }

    private convertViewportXYToDOMOffset(vx: number, vy: number, containerWidth: number, containerHeight: number) {
        // x - 0 is 1680 / 2 (840)
        return {
            left: (containerWidth / 2) + (containerWidth / 2 * vx),
            top: (containerHeight / 2) - (containerHeight / 2 * vy)
        };
    }

    private addToLoop(onAnimate: (dt: number) => void, el: HTMLSpanElement) {
        this.animations.push({
            entryTime: Date.now(),
            fn: onAnimate,
            el,
        });
    }

    private runAnimations() {
        const now = Date.now();
        this.animations.forEach(({ entryTime, fn, el }) => {
            const elapsed = now - entryTime;
            fn(elapsed);
            if (elapsed > 2000) {
                this.animations = this.animations.filter(a => a.fn !== fn);
                el.remove();
            }
        });
        window.requestAnimationFrame(() => this.runAnimations());
    }

    showNumber(v: number, vx: number, vy: number) {

        const newElement = document.createElement("span");
        newElement.classList.add("damage-number");
        newElement.innerText = v.toString();

        const planeWidth = this.element.clientWidth;
        const planeHeight = this.element.clientHeight;

        const domPosition = this.convertViewportXYToDOMOffset(vx, vy, planeWidth, planeHeight);

        domPosition.left += MathUtils.randInt(-30, 30);

        domPosition.left = MathUtils.clamp(domPosition.left, 0, planeWidth);
        domPosition.top = MathUtils.clamp(domPosition.top, 0, planeHeight);

        newElement.style.opacity = "1";
        newElement.style.top = `${domPosition.top}px`;
        newElement.style.left = `${domPosition.left}px`;

        this.addToLoop((elapsed: number) => {
            newElement.style.top = `${domPosition.top - (elapsed) * 0.2}px`;
            newElement.style.left = `${domPosition.left - (Math.sin(elapsed / 40) * 10)}px`;
            newElement.style.opacity = Math.cos(elapsed / 1000).toString();
        }, newElement);

        this.element.appendChild(newElement);

    }

}

export default DamagePlane;