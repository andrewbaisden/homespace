"use client";

import { Environment, OrbitControls, Text } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Suspense, useMemo } from "react";
import { Shape } from "three";
import type { FloorPlanGeometryV1 } from "@/features/floor-plan/domain/geometry";
import { buildSceneGraph } from "@/features/floor-plan/domain/scene-builder";
import { useEditorStore } from "@/features/floor-plan/store";

type RoomMeta = { id: string; name: string };

function SceneContent({
  geometry,
  rooms,
}: {
  geometry: FloorPlanGeometryV1;
  rooms: RoomMeta[];
}) {
  const selectedRoomId = useEditorStore((s) => s.selectedRoomId);
  const setSelectedRoomId = useEditorStore((s) => s.setSelectedRoomId);
  const scene = useMemo(
    () => buildSceneGraph(geometry, rooms),
    [geometry, rooms],
  );

  const cx = (scene.bounds.minX + scene.bounds.maxX) / 2;
  const cz = (scene.bounds.minZ + scene.bounds.maxZ) / 2;

  return (
    <>
      <color attach="background" args={["#ebe4d8"]} />
      <ambientLight intensity={0.65} />
      <directionalLight position={[8, 12, 6]} intensity={1.1} castShadow />
      <Environment preset="apartment" />

      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[cx, -0.01, cz]}
        receiveShadow
      >
        <planeGeometry args={[40, 40]} />
        <meshStandardMaterial color="#d8d0c2" />
      </mesh>

      {scene.floors.map((floor) => {
        const shapePoints = floor.points;
        if (shapePoints.length < 3) return null;
        const selected = selectedRoomId === floor.roomId;
        return (
          <mesh
            key={floor.roomId}
            rotation={[-Math.PI / 2, 0, 0]}
            position={[0, 0.02, 0]}
            onClick={(e) => {
              e.stopPropagation();
              setSelectedRoomId(floor.roomId);
            }}
            userData={{ roomId: floor.roomId }}
          >
            <shapeGeometry
              args={[
                (() => {
                  // ShapeGeometry is built in XY. Mesh rotation -90° about X maps
                  // shape Y → -world Z, but walls/labels use plan Y → +Z. Negate Y
                  // to align; reverse winding so the floor normal still faces up.
                  const shape = new Shape();
                  const [x0, y0] = shapePoints[0];
                  shape.moveTo(x0, -y0);
                  for (let i = shapePoints.length - 1; i >= 1; i--) {
                    const [x, y] = shapePoints[i];
                    shape.lineTo(x, -y);
                  }
                  shape.closePath();
                  return shape;
                })(),
              ]}
            />
            <meshStandardMaterial
              color={selected ? "#5f8a72" : "#9fb5a6"}
              transparent
              opacity={0.9}
            />
          </mesh>
        );
      })}

      {scene.walls.map((wall) => (
        <mesh
          key={wall.id}
          position={wall.position}
          rotation={[0, wall.rotationY, 0]}
          castShadow
          receiveShadow
        >
          <boxGeometry args={wall.size} />
          <meshStandardMaterial color="#f4efe6" roughness={0.85} />
        </mesh>
      ))}

      {scene.openings.map((opening) => (
        <mesh
          key={opening.id}
          position={opening.position}
          rotation={[0, opening.rotationY, 0]}
        >
          <boxGeometry args={opening.size} />
          <meshStandardMaterial
            color={opening.kind === "door" ? "#8b5a2b" : "#7ea0c0"}
            transparent
            opacity={0.7}
          />
        </mesh>
      ))}

      {scene.labels.map((label) => (
        <Text
          key={label.roomId}
          position={[label.position[0], 0.15, label.position[2]]}
          rotation={[-Math.PI / 2, 0, 0]}
          fontSize={0.35}
          color="#1f2a24"
          anchorX="center"
          anchorY="middle"
          onClick={(e) => {
            e.stopPropagation();
            setSelectedRoomId(label.roomId);
          }}
        >
          {label.name}
        </Text>
      ))}

      <OrbitControls
        makeDefault
        target={[cx, 0, cz]}
        maxPolarAngle={Math.PI / 2.1}
        minDistance={3}
        maxDistance={40}
      />
    </>
  );
}

export function PropertyViewer3D({
  geometry,
  rooms,
}: {
  geometry: FloorPlanGeometryV1;
  rooms: RoomMeta[];
}) {
  return (
    <div className="relative h-[560px] w-full overflow-hidden rounded-xl border border-border">
      <p className="pointer-events-none absolute left-1/2 top-3 z-10 w-[min(90%,18rem)] -translate-x-1/2 rounded-md border border-border/70 bg-background/95 px-3 py-2 text-center text-xs leading-snug text-muted-foreground shadow-sm sm:w-auto sm:whitespace-nowrap sm:px-4">
        Click a room floor to select
      </p>
      <Canvas camera={{ position: [8, 10, 10], fov: 45 }} shadows>
        <Suspense fallback={null}>
          <SceneContent geometry={geometry} rooms={rooms} />
        </Suspense>
      </Canvas>
    </div>
  );
}
