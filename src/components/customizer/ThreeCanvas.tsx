"use client";

import { Component, Suspense, useEffect, useMemo, useState, type ReactNode } from "react";
import { Canvas, createPortal, useThree } from "@react-three/fiber";
import { Bounds, Decal, OrbitControls, useGLTF } from "@react-three/drei";
import * as THREE from "three";
import type { CustomizerConfig } from "@/lib/validations/product";
import type { CaptureRef } from "@/hooks/use3DSnapshot";

export type FontKey = "sans" | "serif" | "mono" | "display";
export interface PreviewState {
  primaryColor: string;
  secondaryColor?: string;
  text?: string;
  font: FontKey;
  logoUrl?: string | null; // object URL lokal dari file yang dipilih
}
export interface InspectInfo { materials: string[]; meshes: string[] }

interface Props {
  modelUrl: string | null;
  config: CustomizerConfig;
  state: PreviewState;
  onInspect?: (info: InspectInfo) => void;
  captureRef?: CaptureRef;
  className?: string;
}

const FONT_FAMILY: Record<FontKey, string> = {
  sans: "system-ui, sans-serif",
  serif: "Georgia, serif",
  mono: "ui-monospace, Menlo, monospace",
  display: "Impact, 'Arial Black', sans-serif",
};

function contrastColor(hexColor: string) {
  const c = new THREE.Color(hexColor);
  const lum = 0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b;
  return lum > 0.5 ? "#111111" : "#ffffff";
}

/** Tekstur kanvas 512x512 untuk dekal: logo (atas) + teks (bawah). */
function useDecalTexture(text: string | undefined, font: FontKey, textColor: string, logoUrl: string | null | undefined) {
  const [texture] = useState(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 512; canvas.height = 512;
    const t = new THREE.CanvasTexture(canvas);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 8;
    return t;
  });

  useEffect(() => {
    const canvas = texture.image as HTMLCanvasElement;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let cancelled = false;

    const draw = (img?: HTMLImageElement) => {
      ctx.clearRect(0, 0, 512, 512);
      const hasText = !!text;
      if (img) {
        const box = hasText ? { w: 460, h: 320, y: 20 } : { w: 460, h: 460, y: 26 };
        const s = Math.min(box.w / img.width, box.h / img.height);
        const w = img.width * s, h = img.height * s;
        ctx.drawImage(img, (512 - w) / 2, box.y + (box.h - h) / 2, w, h);
      }
      if (hasText) {
        ctx.fillStyle = textColor;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        let size = 120;
        do {
          ctx.font = `${size}px ${FONT_FAMILY[font]}`;
          size -= 4;
        } while (ctx.measureText(text).width > 460 && size > 24);
        ctx.fillText(text, 256, img ? 430 : 256);
      }
      texture.needsUpdate = true;
    };

    if (logoUrl) {
      const img = new Image();
      img.onload = () => { if (!cancelled) draw(img); };
      img.onerror = () => { if (!cancelled) draw(); };
      img.src = logoUrl;
    } else {
      draw();
    }
    return () => { cancelled = true; };
  }, [texture, text, font, textColor, logoUrl]);

  useEffect(() => () => texture.dispose(), [texture]);
  return texture;
}

function ModelBody({ scene, config, state, onInspect }: {
  scene: THREE.Object3D; config: CustomizerConfig; state: PreviewState; onInspect?: (i: InspectInfo) => void;
}) {
  const showText = config.text.enabled && !!state.text;
  const showLogo = config.logo.enabled && !!state.logoUrl;
  const textColor = config.secondary.enabled && state.secondaryColor
    ? state.secondaryColor : contrastColor(state.primaryColor);
  const texture = useDecalTexture(showText ? state.text : undefined, state.font, textColor, showLogo ? state.logoUrl : null);

  // Laporkan nama mesh & material (dipakai form admin untuk mengisi konfigurasi)
  useEffect(() => {
    if (!onInspect) return;
    const materials = new Set<string>(), meshes = new Set<string>();
    scene.traverse((o) => {
      const m = o as THREE.Mesh;
      if (!m.isMesh) return;
      if (m.name) meshes.add(m.name);
      (Array.isArray(m.material) ? m.material : [m.material]).forEach((x) => x.name && materials.add(x.name));
    });
    onInspect({ materials: [...materials].sort(), meshes: [...meshes].sort() });
  }, [scene, onInspect]);

  // Terapkan warna ke material yang dipetakan
  const primaryKey = config.primary.materials.join("|");
  const secondaryKey = config.secondary.materials.join("|");
  useEffect(() => {
    const paint = (names: string[], color: string) => {
      if (names.length === 0) return;
      scene.traverse((o) => {
        const m = o as THREE.Mesh;
        if (!m.isMesh) return;
        (Array.isArray(m.material) ? m.material : [m.material]).forEach((mat) => {
          if (names.includes(mat.name) && "color" in mat) (mat as THREE.MeshStandardMaterial).color.set(color);
        });
      });
    };
    if (config.primary.enabled) paint(primaryKey ? primaryKey.split("|") : [], state.primaryColor);
    if (config.secondary.enabled) {
      paint(secondaryKey ? secondaryKey.split("|") : [], state.secondaryColor ?? config.secondary.defaultColor);
    }
  }, [scene, config.primary.enabled, config.secondary.enabled, config.secondary.defaultColor,
      primaryKey, secondaryKey, state.primaryColor, state.secondaryColor]);

  const target = useMemo(() => {
    let found = null as THREE.Mesh | null;
    if (!config.decal.mesh) return found;
    scene.traverse((o) => {
      if ((o as THREE.Mesh).isMesh && o.name === config.decal.mesh && !found) found = o as THREE.Mesh;
    });
    return found;
  }, [scene, config.decal.mesh]);

  const { position, rotation, scale } = config.decal;
  const pos = useMemo(() => position, [position]);
  const rot = useMemo(() => rotation, [rotation]);
  const scl = useMemo(() => scale, [scale]);

  return (
    <>
      <primitive object={scene} />
      {(showText || showLogo) && target &&
        createPortal(
          <Decal position={pos} rotation={rot} scale={scl}>
            <meshStandardMaterial map={texture} transparent polygonOffset polygonOffsetFactor={-4} depthWrite={false} />
          </Decal>,
          target,
        )}
    </>
  );
}

function GltfModel({ url, ...rest }: { url: string; config: CustomizerConfig; state: PreviewState; onInspect?: (i: InspectInfo) => void }) {
  const gltf = useGLTF(url);
  // Klon scene + material agar warna tidak bocor ke cache bersama antar instance
  const scene = useMemo(() => {
    const clone = gltf.scene.clone(true);
    clone.traverse((o) => {
      const m = o as THREE.Mesh;
      if (m.isMesh) m.material = Array.isArray(m.material) ? m.material.map((x) => x.clone()) : m.material.clone();
    });
    return clone;
  }, [gltf.scene]);
  return <ModelBody scene={scene} {...rest} />;
}

/** Model bawaan (balok) saat produk belum punya file .glb. */
function FallbackModel(props: { config: CustomizerConfig; state: PreviewState; onInspect?: (i: InspectInfo) => void }) {
  const bodyName = props.config.primary.materials[0] ?? "Body";
  const topName = props.config.secondary.enabled ? (props.config.secondary.materials[0] ?? "Top") : bodyName;
  const scene = useMemo(() => {
    const group = new THREE.Group();
    const bodyMat = new THREE.MeshStandardMaterial({ color: "#cccccc", roughness: 0.5 });
    bodyMat.name = bodyName;
    const body = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.5, 1.4), bodyMat);
    body.name = "Body";
    const topMat = new THREE.MeshStandardMaterial({ color: "#eeeeee", roughness: 0.5 });
    topMat.name = topName;
    const top = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.12, 1.0), topMat);
    top.name = "Top";
    top.position.y = 0.31;
    group.add(body, top);
    return group;
  }, [bodyName, topName]);
  return <ModelBody scene={scene} {...props} />;
}

function SnapshotBridge({ captureRef }: { captureRef?: CaptureRef }) {
  const { gl, scene, camera } = useThree();
  useEffect(() => {
    if (!captureRef) return;
    captureRef.current = () => {
      gl.render(scene, camera); // render segera sebelum toDataURL agar buffer tidak kosong
      return gl.domElement.toDataURL("image/png");
    };
    return () => { captureRef.current = null; };
  }, [gl, scene, camera, captureRef]);
  return null;
}

class ModelErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(error: unknown) { console.error("3D model error:", error); }
  render() {
    return this.state.failed ? (
      <div className="flex h-full items-center justify-center p-4 text-center text-sm text-red-600">
        Model 3D gagal dimuat. Pastikan file .glb valid.
      </div>
    ) : this.props.children;
  }
}

export default function ThreeCanvas({ modelUrl, config, state, onInspect, captureRef, className }: Props) {
  return (
    <div className={className}>
      <ModelErrorBoundary key={modelUrl ?? "fallback"}>
        <Canvas camera={{ position: [0, 0.8, 3], fov: 40 }} dpr={[1, 2]}>
          <hemisphereLight args={["#ffffff", "#888888", 1.1]} />
          <directionalLight position={[3, 5, 4]} intensity={1.6} />
          <directionalLight position={[-4, 2, -3]} intensity={0.6} />
          <Suspense fallback={null}>
            <Bounds fit clip observe margin={1.3}>
              {modelUrl
                ? <GltfModel url={modelUrl} config={config} state={state} onInspect={onInspect} />
                : <FallbackModel config={config} state={state} onInspect={onInspect} />}
            </Bounds>
          </Suspense>
          <OrbitControls makeDefault enablePan={false} minDistance={0.5} maxDistance={12} />
          <SnapshotBridge captureRef={captureRef} />
        </Canvas>
      </ModelErrorBoundary>
    </div>
  );
}
