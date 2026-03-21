import { useRef, useMemo, useEffect, Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { useGLTF, useAnimations } from "@react-three/drei";
import type { Group, MeshStandardMaterial, Mesh } from "three";
import { Color, LoopOnce } from "three";
import { clone as cloneSkeleton } from "three/examples/jsm/utils/SkeletonUtils.js";
import type { BotSkill } from "@nlc-darts/engine";
import { getBotCharacter } from "@nlc-darts/engine";

const MODEL_PATH = "/models/robot.glb";

function Robot({
  skill,
  animation = "StaticIdle",
  animKey = 0,
}: {
  skill: BotSkill;
  animation?: string;
  animKey?: number;
}) {
  const groupRef = useRef<Group>(null);
  const { scene, animations } = useGLTF(MODEL_PATH);
  const character = getBotCharacter(skill);

  // SkeletonUtils.clone preserves bone bindings for skinned meshes
  const clonedScene = useMemo(() => cloneSkeleton(scene), [scene]);

  const { actions } = useAnimations(animations, groupRef);

  // Play the requested animation (animKey forces re-trigger for repeated animations)
  useEffect(() => {
    const action = actions[animation] ?? actions["StaticIdle"];
    if (!action) return;

    const isOneShot = animation === "BasicAttack" || animation === "Death" || animation === "GetHit" || animation === "Jump_Air" || animation === "Jump_Start" || animation === "Jump_Landing";

    action.reset().fadeIn(0.2).play();

    if (isOneShot) {
      action.setLoop(LoopOnce, 1);
      action.clampWhenFinished = true;
    }

    return () => {
      action.fadeOut(0.2);
    };
  }, [actions, animation, animKey]);

  // Color the robot like the reference: vibrant body color, gray joints, glowing eyes
  useMemo(() => {
    const botColor = new Color(character.color);
    clonedScene.traverse((child) => {
      if ((child as Mesh).isMesh) {
        const mesh = child as Mesh;
        if (Array.isArray(mesh.material)) {
          mesh.material = mesh.material.map((mat) => {
            const m = (mat as MeshStandardMaterial).clone();
            if (m.name === "M_Atlas2") {
              m.color = botColor;
              m.map = null;
            } else if (m.name === "M_AtlasEmissive") {
              m.color = new Color(0xffffff);
              m.emissive = botColor;
              m.emissiveIntensity = 5;
              m.map = null;
            }
            return m;
          });
        } else {
          const m = (mesh.material as MeshStandardMaterial).clone();
          if (m.name === "M_Atlas2") {
            m.color = botColor;
            m.map = null;
          } else if (m.name === "M_AtlasEmissive") {
            m.color = botColor;
            m.emissive = botColor;
            m.emissiveIntensity = 2;
            m.map = null;
          }
          mesh.material = m;
        }
      }
    });
  }, [clonedScene, character.color]);

  return (
    <group ref={groupRef} scale={0.01} position={[0, -0.85, 0]}>
      <primitive object={clonedScene} />
    </group>
  );
}

interface RobotModelProps {
  skill: BotSkill;
  size?: number | string;
  animation?: string;
  animKey?: number;
  className?: string;
}

export function RobotModel({
  skill,
  size = 80,
  animation = "StaticIdle",
  animKey = 0,
  className,
}: RobotModelProps) {
  return (
    <div
      className={className}
      style={{
        width: typeof size === "number" ? `${size}px` : size,
        height: typeof size === "number" ? `${size}px` : size,
      }}
    >
      <Canvas
        camera={{ position: [0, 0.8, 2.2], fov: 40 }}
        style={{ pointerEvents: "none" }}
      >
        <ambientLight intensity={0.7} />
        <directionalLight position={[2, 3, 2]} intensity={1.2} />
        <Suspense fallback={null}>
          <Robot skill={skill} animation={animation} animKey={animKey} />
        </Suspense>
      </Canvas>
    </div>
  );
}

// Preload the model
useGLTF.preload(MODEL_PATH);
