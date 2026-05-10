/**
 * Model3DViewer.jsx — v2.1 (Optimized for Production/Vercel)
 * تم تحسين الكود لضمان استقرار التحميل ومنع خطأ Unexpected end of JSON
 */

import { useRef, useState, useEffect, Suspense, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { useGLTF, Environment, ContactShadows, Float } from "@react-three/drei";
import * as THREE from "three";

// المكون المسئول عن الموديل نفسه (تم فصله لضمان استقرار الـ Reference)
function Model({ modelScene, isHovered, mousePos }) {
  const groupRef = useRef();
  
  // عمل Clone للمشهد لضمان عدم حدوث مشاكل في حال إعادة الرندر
  const clonedScene = useMemo(() => modelScene.clone(), [modelScene]);

  useFrame((state, delta) => {
    if (!groupRef.current) return;

    // دوران تلقائي مستمر
    groupRef.current.rotation.y += delta * 0.4;
    groupRef.current.rotation.x += delta * 0.15;

    // تأثير حركة الماوس عند الـ Hover
    if (isHovered) {
      const targetX = mousePos.y * 0.4;
      const targetY = mousePos.x * 0.4;
      groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, targetX, 0.12);
      groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, targetY, 0.12);
    }
  });

  return (
    <group ref={groupRef} dispose={null}>
      <primitive object={clonedScene} scale={[1, 1, 1]} position={[0, -0.3, 0]} />
    </group>
  );
}

// إضاءة المشهد
function Lighting({ transparent }) {
  return (
    <>
      <directionalLight position={[5, 8, 5]} intensity={transparent ? 3.5 : 2.5} castShadow color="#ffffff" />
      <directionalLight position={[-4, 4, -4]} intensity={0.8} color="#c8d8ff" />
      <directionalLight position={[0, -2, -6]} intensity={transparent ? 2.0 : 1.2} color="#ff9060" />
      <ambientLight intensity={transparent ? 0.6 : 0.4} />
    </>
  );
}

// المكون الداخلي الذي يتعامل مع تحميل الملف
function SceneContent({ modelPath, isHovered, mousePos, transparent, setIsLoaded, showShadow, floatEffect }) {
  // تحميل الموديل مرة واحدة فقط هنا لمنع تكرار الطلبات للسيرفر
  const { scene } = useGLTF(modelPath);

  useEffect(() => {
    if (scene) {
      setIsLoaded(true);
      scene.traverse((child) => {
        if (child.isMesh && child.material) {
          child.material.metalness = 0.7;
          child.material.roughness = 0.3;
          child.material.envMapIntensity = 1.5;
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });
    }
  }, [scene, setIsLoaded]);

  const modelElement = <Model modelScene={scene} isHovered={isHovered} mousePos={mousePos} />;

  return (
    <>
      <Lighting transparent={transparent} />
      <Environment preset="city" />
      {floatEffect ? (
        <Float speed={1.5} rotationIntensity={0} floatIntensity={0.4} floatingRange={[-0.05, 0.05]}>
          {modelElement}
        </Float>
      ) : modelElement}
      
      {showShadow && (
        <ContactShadows position={[0, -1.0, 0]} opacity={0.5} scale={3} blur={2.5} far={2} color="#000000" />
      )}
    </>
  );
}

export default function Model3DViewer({
  modelPath = "/model_optimized.glb", 
  height = "600px",
  width = "100%",
  backgroundColor = "#0a0a0f",
  transparent = false,
  showShadow = true,
  floatEffect = true,
}) {
  const containerRef = useRef();
  const [isHovered, setIsHovered] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isLoaded, setIsLoaded] = useState(false);

  const handleMouseMove = (e) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    setMousePos({ x, y });
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => { setIsHovered(false); setMousePos({ x: 0, y: 0 }); }}
      style={{
        width, height,
        position: "relative",
        backgroundColor: transparent ? "transparent" : backgroundColor,
        borderRadius: transparent ? "0" : "16px",
        overflow: "hidden",
        filter: isHovered && transparent ? "drop-shadow(0 0 30px hsl(43 100% 75% / 0.25))" : "none",
        transition: "filter 0.4s ease, box-shadow 0.4s ease",
        boxShadow: !transparent
          ? (isHovered ? "0 0 60px rgba(255,144,96,0.15), 0 0 120px rgba(255,144,96,0.05)" : "0 0 40px rgba(0,0,0,0.4)")
          : "none",
      }}
    >
      {!transparent && (
        <div style={{
          position: "absolute", inset: 0,
          background: `radial-gradient(ellipse at 30% 20%, rgba(255,144,96,0.06) 0%, transparent 60%), radial-gradient(ellipse at 70% 80%, rgba(100,150,255,0.06) 0%, transparent 60%)`,
          pointerEvents: "none", zIndex: 1,
        }} />
      )}

      <Canvas
        style={{ position: "absolute", inset: 0 }}
        camera={{ position: [0, 0.2, 2.2], fov: 45 }}
        shadows
        gl={{
          antialias: true,
          alpha: transparent,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.2,
          outputColorSpace: THREE.SRGBColorSpace,
        }}
      >
        <Suspense fallback={null}>
          <SceneContent
            modelPath={modelPath}
            isHovered={isHovered}
            mousePos={mousePos}
            transparent={transparent}
            setIsLoaded={setIsLoaded}
            showShadow={showShadow}
            floatEffect={floatEffect}
          />
        </Suspense>
      </Canvas>

      {isLoaded && !transparent && (
        <div style={{
          position: "absolute", bottom: "16px", left: "50%", transform: "translateX(-50%)",
          color: "rgba(255,255,255,0.25)", fontSize: "11px", letterSpacing: "2px",
          fontFamily: "monospace", pointerEvents: "none", zIndex: 2,
          transition: "opacity 0.3s", opacity: isHovered ? 0 : 1,
        }}>
          HOVER TO INTERACT
        </div>
      )}
    </div>
  );
}

// سطر مهم جداً لتحميل الموديل مسبقاً في الـ Cache
useGLTF.preload("/model_optimized.glb");
