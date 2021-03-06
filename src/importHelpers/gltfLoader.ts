import { GLTFLoader, GLTF } from "three/examples/jsm/loaders/GLTFLoader";
const sweetBabyLoader = new GLTFLoader();

import clockNumsUrl from "../../assets/clockNumbers.glb";

const modelUrls = [clockNumsUrl];

const loadOneModel = (url: string) => {
    return new Promise<GLTF>((resolvePromise, rejectPromise) => {
        sweetBabyLoader.load(url, (towerGlb) => {
            resolvePromise(towerGlb);
        }, () => { }, (err) => {
            rejectPromise(err);
        });
    });
};

const loadAllModels = async (): Promise<GLTF[]> => {
    return await Promise.all(modelUrls.map(loadOneModel));
};

export default loadAllModels;