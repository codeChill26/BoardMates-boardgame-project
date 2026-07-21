'use client';

import React from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useReducedMotion } from 'framer-motion';

// Palette logo
const NAVY = '#182d45';
const AMBER = '#cd8a30';
const KEM = '#f5ede2';
const KEM_DAM = '#e8ddcc';

// Vai quan co dat san tren ban. [cot, hang] tren luoi 8x8 (0..7), mau, cao.
const QUAN_CO = [
  { pos: [1, 1], mau: NAVY, cao: 0.9 },
  { pos: [3, 2], mau: AMBER, cao: 1.1 },
  { pos: [5, 4], mau: NAVY, cao: 0.7 },
  { pos: [2, 5], mau: AMBER, cao: 0.9 },
  { pos: [6, 6], mau: NAVY, cao: 1.0 },
  { pos: [4, 0], mau: AMBER, cao: 0.7 },
];

// Quan co: hinh non + cau tren dinh, dung dang quan tot
function QuanCo({ pos, mau, cao }) {
  const [c, h] = pos;
  const x = c - 3.5;
  const z = h - 3.5;

  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, cao * 0.35, 0]} castShadow>
        <cylinderGeometry args={[0.14, 0.32, cao * 0.7, 20]} />
        <meshStandardMaterial color={mau} roughness={0.4} metalness={0.15} />
      </mesh>
      <mesh position={[0, cao * 0.7 + 0.12, 0]} castShadow>
        <sphereGeometry args={[0.2, 20, 20]} />
        <meshStandardMaterial color={mau} roughness={0.4} metalness={0.15} />
      </mesh>
    </group>
  );
}

function BanCo() {
  // Mat ban 8x8 xen ke kem sang / kem dam
  const o = [];
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      o.push(
        <mesh key={`${r}-${c}`} position={[c - 3.5, 0, r - 3.5]} receiveShadow>
          <boxGeometry args={[1, 0.2, 1]} />
          <meshStandardMaterial color={(r + c) % 2 === 0 ? KEM : KEM_DAM} roughness={0.7} />
        </mesh>
      );
    }
  }

  return (
    <group>
      {/* Vien ban navy */}
      <mesh position={[0, -0.12, 0]} receiveShadow>
        <boxGeometry args={[8.6, 0.24, 8.6]} />
        <meshStandardMaterial color={NAVY} roughness={0.6} />
      </mesh>
      {o}
      {QUAN_CO.map((q, i) => (
        <QuanCo key={i} {...q} />
      ))}
    </group>
  );
}

// Xoay ban theo chuot; khi khong ro chuot thi xoay cham deu.
function Canh({ reducedMotion }) {
  const ref = React.useRef();
  const { pointer } = useThree();

  useFrame((state, delta) => {
    if (!ref.current) return;

    if (reducedMotion) {
      ref.current.rotation.y = -0.5;
      return;
    }

    // Muc tieu: xoay theo chuot quanh goc nghieng san. Lerp cho muot.
    const dichY = -0.5 + pointer.x * 0.5;
    const dichX = 0.9 + pointer.y * -0.15;
    ref.current.rotation.y += (dichY - ref.current.rotation.y) * Math.min(1, delta * 2.5);
    ref.current.rotation.x += (dichX - ref.current.rotation.x) * Math.min(1, delta * 2.5);
  });

  // rotation.x ban dau nghieng cho thay mat ban
  return (
    <group ref={ref} rotation={[0.9, -0.5, 0]} scale={0.62}>
      <BanCo />
    </group>
  );
}

/**
 * Ban co 3D cho hero. Xoay theo chuot, quan co dat san. three.js chi tai o trang
 * co dung no (qua next/dynamic ssr:false o cho goi).
 */
export default function ChessBoard3D({ className }) {
  const reducedMotion = useReducedMotion();

  return (
    <div className={className}>
      <Canvas
        shadows
        dpr={[1, 2]}
        camera={{ position: [0, 3.2, 6.5], fov: 42 }}
        gl={{ alpha: true, antialias: true }}
        style={{ background: 'transparent' }}
      >
        <ambientLight intensity={1.0} />
        <directionalLight
          position={[5, 8, 5]}
          intensity={2.2}
          castShadow
          shadow-mapSize={[1024, 1024]}
        />
        <directionalLight position={[-4, 3, -4]} intensity={0.5} />
        <Canh reducedMotion={reducedMotion} />
      </Canvas>
    </div>
  );
}
