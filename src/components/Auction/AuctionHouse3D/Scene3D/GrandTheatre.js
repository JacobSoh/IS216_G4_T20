'use client'

import { Box, Cylinder, Plane, Ring, Torus } from '@react-three/drei'

// Helper to get CSS color
const getCSSColor = (varName) => {
  if (typeof window === 'undefined') return '#000000'
  return getComputedStyle(document.documentElement).getPropertyValue(varName).trim() || '#000000'
}

export default function GrandTheatre() {
  // User sits at (0, 7, 27) - Simple box enclosure that works
  return (
    <group>
      {/* Club Floor with Neon Pattern */}
      <group>
        <Plane
          args={[120, 120]}
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, -4, 5]}
        >
          <meshStandardMaterial
            color="#0a0414"
            roughness={0.3}
            metalness={0.4}
          />
        </Plane>

        {/* Neon Floor Pattern Rings */}
        {[15, 25, 35, 45].map((radius, i) => (
          <Ring
            key={i}
            args={[radius - 0.2, radius + 0.2, 64]}
            rotation={[-Math.PI / 2, 0, 0]}
            position={[0, -3.98, 5]}
          >
            <meshStandardMaterial
              color={getCSSColor('--theme-secondary')}
              roughness={0.1}
              metalness={0.6}
              emissive={getCSSColor('--theme-secondary')}
              emissiveIntensity={0.3 + i * 0.1}
            />
          </Ring>
        ))}

        {/* Center Neon Medallion */}
        <Cylinder
          args={[8, 8, 0.1]}
          rotation={[0, 0, 0]}
          position={[0, -3.95, 5]}
        >
          <meshStandardMaterial
            color={getCSSColor('--theme-secondary')}
            roughness={0.1}
            metalness={0.7}
            emissive={getCSSColor('--theme-secondary')}
            emissiveIntensity={0.5}
          />
        </Cylinder>
      </group>

      {/* Dark Club Ceiling */}
      <Plane
        args={[120, 120]}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 30, 5]}
      >
        <meshStandardMaterial
          color="#000000"
          roughness={0.9}
          metalness={0.05}
        />
      </Plane>

      {/* Club Side Walls with Neon Accents */}
      {[-1, 1].map((side) => (
        <group key={side}>
          {/* Main Wall */}
          <Plane
            args={[120, 35]}
            rotation={[0, Math.PI / 2 * side, 0]}
            position={[60 * side, 12.5, 5]}
          >
            <meshStandardMaterial
              color="#0d0518"
              roughness={0.7}
              metalness={0.2}
            />
          </Plane>

          {/* Neon Columns - Better Positioned */}
          {[-30, -10, 10, 30, 50].map((z) => (
            <group key={z}>
              <Cylinder
                args={[1.2, 1, 25]}
                position={[58 * side, 12.5, z + 5]}
              >
                <meshStandardMaterial
                  color={getCSSColor('--theme-primary')}
                  roughness={0.3}
                  metalness={0.4}
                  emissive={getCSSColor('--theme-secondary')}
                  emissiveIntensity={0.2}
                />
              </Cylinder>
              {/* Gold Column Capital */}
              <Cylinder
                args={[1.8, 1.2, 2]}
                position={[58 * side, 24, z + 5]}
              >
                <meshStandardMaterial
                  color={getCSSColor('--theme-gold')}
                  roughness={0.1}
                  metalness={0.9}
                  emissive={getCSSColor('--theme-gold')}
                  emissiveIntensity={0.3}
                />
              </Cylinder>
            </group>
          ))}

          {/* Neon Wall Strips - Better Spaced */}
          {[-20, 0, 20, 40].map((z) => (
            <Box
              key={z}
              args={[0.3, 20, 12]}
              position={[59.5 * side, 10, z + 5]}
            >
              <meshStandardMaterial
                color={getCSSColor('--theme-secondary')}
                roughness={0.2}
                metalness={0.6}
                emissive={getCSSColor('--theme-secondary')}
                emissiveIntensity={0.4}
              />
            </Box>
          ))}
        </group>
      ))}

      {/* Rear Wall with Club Entrance */}
      <group position={[0, 12.5, 65]}>
        <Plane args={[120, 35]}>
          <meshStandardMaterial
            color="#0d0518"
            roughness={0.7}
            metalness={0.2}
          />
        </Plane>

        {/* Neon Entrance Arch */}
        <Torus
          args={[8, 1.5, 16, 32]}
          position={[0, -5, -0.5]}
        >
          <meshStandardMaterial
            color={getCSSColor('--theme-secondary')}
            roughness={0.1}
            metalness={0.8}
            emissive={getCSSColor('--theme-secondary')}
            emissiveIntensity={0.6}
          />
        </Torus>

        {/* Club Entrance Doors */}
        <Box args={[12, 18, 0.5]} position={[0, -8, -0.3]}>
          <meshStandardMaterial
            color={getCSSColor('--theme-primary')}
            roughness={0.3}
            metalness={0.5}
            emissive={getCSSColor('--theme-secondary')}
            emissiveIntensity={0.2}
          />
        </Box>
      </group>

      {/* Front Wall Behind Stage */}
      <group position={[0, 12.5, -30]}>
        <Plane args={[120, 35]}>
          <meshStandardMaterial
            color="#0d0518"
            roughness={0.7}
            metalness={0.2}
          />
        </Plane>

      </group>
    </group>
  )
}
