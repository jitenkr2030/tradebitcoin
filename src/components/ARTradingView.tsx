import React, { useRef, useEffect, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text, Box, Sphere } from '@react-three/drei';
import { useTrading } from '../contexts/TradingContext';
import { Eye, Maximize, Settings } from 'lucide-react';

interface ARTradingViewProps {
  isVRMode?: boolean;
}

function PriceNode({ position, price, symbol, color }: any) {
  const meshRef = useRef<any>();
  const [hovered, setHovered] = useState(false);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.01;
      meshRef.current.scale.setScalar(hovered ? 1.2 : 1);
    }
  });

  return (
    <group position={position}>
      <Sphere
        ref={meshRef}
        args={[0.5, 32, 32]}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <meshStandardMaterial color={color} transparent opacity={0.8} />
      </Sphere>
      <Text
        position={[0, 1, 0]}
        fontSize={0.3}
        color="white"
        anchorX="center"
        anchorY="middle"
      >
        {symbol}
      </Text>
      <Text
        position={[0, -1, 0]}
        fontSize={0.2}
        color={color}
        anchorX="center"
        anchorY="middle"
      >
        ${price.toLocaleString()}
      </Text>
    </group>
  );
}

function TradingFloor() {
  const { tradingState } = useTrading();
  
  const cryptoData = [
    { symbol: 'BTC', price: 67500, position: [0, 0, 0], color: '#F59E0B' },
    { symbol: 'ETH', price: 3200, position: [-3, 0, 0], color: '#627EEA' },
    { symbol: 'BNB', price: 540, position: [3, 0, 0], color: '#F3BA2F' },
    { symbol: 'ADA', price: 0.45, position: [0, 0, -3], color: '#0033AD' },
    { symbol: 'DOT', price: 6.8, position: [0, 0, 3], color: '#E6007A' }
  ];

  return (
    <>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} />
      <pointLight position={[-10, -10, -10]} color="#3B82F6" />
      
      {/* Trading Floor */}
      <Box args={[20, 0.1, 20]} position={[0, -2, 0]}>
        <meshStandardMaterial color="#1F2937" transparent opacity={0.3} />
      </Box>
      
      {/* Price Nodes */}
      {cryptoData.map((crypto, index) => (
        <PriceNode
          key={crypto.symbol}
          position={crypto.position}
          price={crypto.price}
          symbol={crypto.symbol}
          color={crypto.color}
        />
      ))}
      
      {/* Portfolio Visualization */}
      {tradingState.portfolio.map((asset, index) => (
        <Box
          key={asset.asset}
          args={[0.5, asset.allocation / 10, 0.5]}
          position={[index * 2 - 4, asset.allocation / 20, 5]}
        >
          <meshStandardMaterial 
            color={asset.profitLoss > 0 ? '#10B981' : '#EF4444'} 
            transparent 
            opacity={0.7} 
          />
        </Box>
      ))}
      
      <OrbitControls enablePan={true} enableZoom={true} enableRotate={true} />
    </>
  );
}

function ARTradingView({ isVRMode = false }: ARTradingViewProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  return (
    <div className={`bg-gray-800 rounded-lg overflow-hidden ${
      isFullscreen ? 'fixed inset-0 z-50' : 'h-96'
    }`}>
      <div className="flex items-center justify-between p-4 bg-gray-900">
        <div className="flex items-center space-x-2">
          <Eye className="w-5 h-5 text-purple-400" />
          <h3 className="text-lg font-bold">AR Trading View</h3>
          {isVRMode && (
            <span className="px-2 py-1 bg-purple-500/20 text-purple-400 rounded text-xs">
              VR Mode
            </span>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <Settings className="w-4 h-4" />
          </button>
          <button
            onClick={toggleFullscreen}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <Maximize className="w-4 h-4" />
          </button>
        </div>
      </div>

      {showSettings && (
        <div className="absolute top-16 right-4 bg-gray-900 border border-gray-700 rounded-lg p-4 z-10">
          <h4 className="font-semibold mb-3">AR Settings</h4>
          <div className="space-y-2">
            <label className="flex items-center space-x-2">
              <input type="checkbox" className="rounded" />
              <span className="text-sm">Show Price History</span>
            </label>
            <label className="flex items-center space-x-2">
              <input type="checkbox" className="rounded" />
              <span className="text-sm">Enable Animations</span>
            </label>
            <label className="flex items-center space-x-2">
              <input type="checkbox" className="rounded" />
              <span className="text-sm">Show Volume Bars</span>
            </label>
          </div>
        </div>
      )}

      <div className="h-full">
        <Canvas camera={{ position: [0, 5, 10], fov: 60 }}>
          <TradingFloor />
        </Canvas>
      </div>

      {!isFullscreen && (
        <div className="absolute bottom-4 left-4 bg-black/50 backdrop-blur-sm rounded-lg p-3">
          <p className="text-sm text-white">
            🎮 Use mouse to navigate • 🔍 Scroll to zoom • 👆 Click nodes for details
          </p>
        </div>
      )}
    </div>
  );
}

export default ARTradingView;