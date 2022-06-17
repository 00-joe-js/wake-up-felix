export const withinDistance2D = (distance: number, u1: number, u2: number, v1: number, v2: number) => {
    if (Math.abs(u1 - u2) > distance) return false;
    if (Math.abs(v1 - v2) > distance) return false;
    return true;
};