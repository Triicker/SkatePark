import * as THREE from 'three';

/** CPU projection of the same Three.js geometry when a GPU context is unavailable. */
export class SoftwareRenderer {
  domElement = document.createElement('canvas');
  private context = this.domElement.getContext('2d', { alpha: false })!;
  private width = 1;
  private height = 1;
  private ratio = 1;
  setPixelRatio(ratio: number) { this.ratio = Math.min(ratio, 1.25); }
  setSize(width: number, height: number) {
    this.width = width; this.height = height;
    this.domElement.width = Math.round(width * this.ratio);
    this.domElement.height = Math.round(height * this.ratio);
    this.domElement.style.width = `${width}px`; this.domElement.style.height = `${height}px`;
  }
  render(scene: THREE.Scene, camera: THREE.Camera) {
    const ctx = this.context, w = this.width, h = this.height;
    ctx.setTransform(this.ratio, 0, 0, this.ratio, 0, 0);
    const background = ctx.createLinearGradient(0, 0, 0, h);
    background.addColorStop(0, '#19272d'); background.addColorStop(1, '#0e191d');
    ctx.fillStyle = background; ctx.fillRect(0, 0, w, h);
    scene.updateMatrixWorld(); camera.updateMatrixWorld();
    const view = new THREE.Matrix4().multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
    const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3();
    const edge1 = new THREE.Vector3(), edge2 = new THREE.Vector3(), normal = new THREE.Vector3();
    const light = new THREE.Vector3(-.5, 1, .6).normalize();
    const transform = new THREE.Matrix4(); const normalMatrix = new THREE.Matrix3();
    const faces: {p:number[]; depth:number; color:string; alpha:number;order:number}[] = [];
    scene.traverseVisible(object => {
      if (!(object instanceof THREE.Mesh) || object.userData.gpuOnly) return;
      const geometry = object.geometry, position = geometry.getAttribute('position');
      if (!position) return;
      const material = (Array.isArray(object.material) ? object.material[0] : object.material) as THREE.MeshStandardMaterial;
      if (!material.visible || material.opacity <= 0) return;
      transform.multiplyMatrices(view, object.matrixWorld);
      normalMatrix.getNormalMatrix(object.matrixWorld);
      const index = geometry.index; const length = index ? index.count : position.count;
      for (let i=0; i<length; i+=3) {
        const ia=index?index.getX(i):i, ib=index?index.getX(i+1):i+1, ic=index?index.getX(i+2):i+2;
        a.fromBufferAttribute(position,ia); b.fromBufferAttribute(position,ib); c.fromBufferAttribute(position,ic);
        edge1.subVectors(b,a);edge2.subVectors(c,a);normal.crossVectors(edge1,edge2).applyNormalMatrix(normalMatrix);
        const brightness = material instanceof THREE.MeshBasicMaterial ? 1 : .52 + Math.max(0,normal.dot(light))*.48;
        a.applyMatrix4(transform);b.applyMatrix4(transform);c.applyMatrix4(transform);
        if ((a.z>1&&b.z>1&&c.z>1)||(a.z< -1&&b.z< -1&&c.z< -1)) continue;
        const p=[(a.x+1)*w/2,(1-a.y)*h/2,(b.x+1)*w/2,(1-b.y)*h/2,(c.x+1)*w/2,(1-c.y)*h/2];
        if ((p[0]<0&&p[2]<0&&p[4]<0)||(p[0]>w&&p[2]>w&&p[4]>w)||(p[1]<0&&p[3]<0&&p[5]<0)||(p[1]>h&&p[3]>h&&p[5]>h)) continue;
        const winding=(p[2]-p[0])*(p[5]-p[1])-(p[3]-p[1])*(p[4]-p[0]);
        if (material.side!==THREE.DoubleSide && winding>=0) continue;
        const color=(material.color??new THREE.Color(0xffffff)).clone().multiplyScalar(brightness);
        faces.push({p,depth:(a.z+b.z+c.z)/3,color:color.getStyle(THREE.SRGBColorSpace),alpha:material.opacity,order:object.renderOrder});
      }
    });
    faces.sort((a,b)=>a.order-b.order||b.depth-a.depth);
    for (const f of faces) {
      ctx.globalAlpha=f.alpha;ctx.fillStyle=f.color;ctx.strokeStyle=f.color;ctx.lineWidth=.55;
      ctx.beginPath();ctx.moveTo(f.p[0],f.p[1]);ctx.lineTo(f.p[2],f.p[3]);ctx.lineTo(f.p[4],f.p[5]);ctx.closePath();ctx.fill();if(f.alpha>.9)ctx.stroke();
    }
    ctx.globalAlpha=1;
  }
  dispose() { this.domElement.width=1;this.domElement.height=1; }
}
