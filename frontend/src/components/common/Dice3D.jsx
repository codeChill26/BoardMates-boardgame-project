'use client';

import React from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useReducedMotion } from 'framer-motion';

// Mau lay tu bang mau "Quan co" (globals.css): --color-tertiary + --color-on-surface.
// Canvas o duoi anh sang manh (ambient 1.15 + directional 2.4) nen texture phai ve
// dam hon mot bac so voi --color-tertiary, an sang vao moi ra dung sac vang nghe.
const VANG = '#d9980a';
const VANG_SANG = '#ffc531';
const MUC = '#1e1a15';

// Bo cuc cham chuan, luoi 3x3, toa do [cot, hang] 0..2
const PIPS = {
  1: [[1, 1]],
  2: [[0, 0], [2, 2]],
  3: [[0, 0], [1, 1], [2, 2]],
  4: [[0, 0], [2, 0], [0, 2], [2, 2]],
  5: [[0, 0], [2, 0], [1, 1], [0, 2], [2, 2]],
  6: [[0, 0], [2, 0], [0, 1], [2, 1], [0, 2], [2, 2]],
};

// Ve mat xuc xac ra canvas roi dung lam texture. Ve bang canvas chu khong dung anh:
// sac net o moi kich thuoc, doi theo palette duoc, va khong ton byte tai ve.
function taoTextureMat(so) {
  const S = 256;
  const cv = document.createElement('canvas');
  cv.width = S;
  cv.height = S;
  const ctx = cv.getContext('2d');

  // Nen vang, sang o goc tren trai cho ra khoi
  const g = ctx.createLinearGradient(0, 0, S, S);
  g.addColorStop(0, VANG_SANG);
  g.addColorStop(1, VANG);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, S, S);

  // Vien toi quanh mep: dung BoxGeometry nen goc that su sac. Ve bong vien vao
  // texture de mat nhin nhu duoc vat canh, bu cho viec khong bo goc that duoc
  // (drei RoundedBox la extrudeGeometry, chi co 2 nhom material chu khong phai 6).
  const vien = ctx.createRadialGradient(S / 2, S / 2, S * 0.28, S / 2, S / 2, S * 0.72);
  vien.addColorStop(0, 'rgba(0,0,0,0)');
  vien.addColorStop(1, 'rgba(30,26,21,0.42)');
  ctx.fillStyle = vien;
  ctx.fillRect(0, 0, S, S);

  // Cham, co bong nho cho lom xuong
  for (const [c, h] of PIPS[so]) {
    const x = S * (0.25 + c * 0.25);
    const y = S * (0.25 + h * 0.25);
    const r = S * 0.072;

    ctx.beginPath();
    ctx.arc(x + 1.5, y + 2, r, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0,0,0,0.18)';
    ctx.fill();

    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = MUC;
    ctx.fill();
  }

  const tex = new THREE.CanvasTexture(cv);
  tex.anisotropy = 4;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// BoxGeometry xep nhom material theo thu tu: +X, -X, +Y, -Y, +Z, -Z.
// Xuc xac that: hai mat doi nhau cong bang 7 -> 3+4, 2+5, 1+6. Mat 1 quay ve +Z
// (huong camera) khi khoi chua xoay.
const THU_TU_MAT = [3, 4, 2, 5, 1, 6];

// Goc phai xoay khoi de dua mat N huong ve camera (+Z)
const GOC_MAT = {
  1: [0, 0],
  2: [Math.PI / 2, 0],
  3: [0, -Math.PI / 2],
  4: [0, Math.PI / 2],
  5: [-Math.PI / 2, 0],
  6: [0, Math.PI],
};

function KhoiXucXac({ face, reducedMotion }) {
  const ref = React.useRef();

  const materials = React.useMemo(
    () =>
      THU_TU_MAT.map(
        (so) =>
          new THREE.MeshStandardMaterial({
            map: taoTextureMat(so),
            roughness: 0.42,
            metalness: 0.08,
          })
      ),
    []
  );

  // three khong tu giai phong bo nho GPU -> phai tu dispose khi thao component
  React.useEffect(
    () => () => {
      for (const m of materials) {
        m.map?.dispose();
        m.dispose();
      }
    },
    [materials]
  );

  const dich = React.useRef(new THREE.Quaternion());

  React.useEffect(() => {
    const [x, y] = GOC_MAT[face] ?? GOC_MAT[1];
    // Nghieng san mot chut o truc X va Z -> luc dung yen van thay 3 mat, ra dang
    // khoi nam tren ban chu khong phai hinh vuong phang.
    dich.current.setFromEuler(new THREE.Euler(x - 0.32, y + 0.42, 0.06));
  }, [face]);

  useFrame((state, delta) => {
    if (!ref.current) return;

    if (reducedMotion) {
      ref.current.quaternion.copy(dich.current);
      return;
    }

    // slerp = duong xoay ngan nhat trong khong gian 3D, muot hon noi suy tung truc
    ref.current.quaternion.slerp(dich.current, Math.min(1, delta * 3.2));

    const t = state.clock.elapsedTime;
    ref.current.position.y = Math.sin(t * 1.5) * 0.05;
  });

  return (
    <mesh ref={ref} material={materials} castShadow receiveShadow>
      <boxGeometry args={[2.1, 2.1, 2.1]} />
    </mesh>
  );
}

/**
 * Xuc xac 3D that bang three.js. Cham ve bang canvas texture theo bang mau,
 * khong dung anh: net o moi kich thuoc, khong ton byte tai ve, khong dinh ban quyen.
 *
 * Props:
 *  - face: mat can hien (1..6)
 *  - className: lop cho khung ngoai
 */
export default function Dice3D({ face, className }) {
  const reducedMotion = useReducedMotion();

  return (
    <div className={className}>
      <Canvas
        dpr={[1, 2]}
        camera={{ position: [0, 0, 5], fov: 40 }}
        gl={{ alpha: true, antialias: true }}
        style={{ background: 'transparent' }}
      >
        <ambientLight intensity={1.15} />
        <directionalLight position={[4, 5, 6]} intensity={2.4} />
        <directionalLight position={[-4, -2, -3]} intensity={0.6} />

        <KhoiXucXac face={face} reducedMotion={reducedMotion} />
      </Canvas>
    </div>
  );
}
