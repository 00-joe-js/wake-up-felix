import { BoxGeometry, Mesh, MeshStandardMaterial, Scene, Vector2, Vector3 } from "three";
import { withinDistance2D } from "../utils";

export default class Baggie {
  scene: Scene;
  constructor(scene: Scene) {
    this.scene = scene;
  }

  getPickupMesh() {
    // Todo: there will be an imported model forwarded here.
    const m = new Mesh(
      new BoxGeometry(10, 10, 10),
      new MeshStandardMaterial({
        color: 0xffff00,
      })
    );
    return m;
  }

  dropBagForPickup(pos: Vector3) {
    const m = this.getPickupMesh();
    this.scene.add(m);
    m.position.copy(pos);
    return m;
  }

  detectPickups(bags: Mesh[], pos: Vector2) {

    return bags.filter(bag => {
        return withinDistance2D(20, 
            bag.position.x, pos.x,
            bag.position.z, pos.y
        );
    });

  }

}
