"use client"

import React, { useRef, useMemo, useEffect, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';

import * as THREE from 'three';
import { create, all } from 'mathjs';
let math = require('mathjs')


let originalFunction = math.parse('10*e^(-((x-a)^2+(y-b)^2+(z-c)^2)) + 30*e^(-((x+3)^2+(y+2)^2+(z+2)^2))');
const [dx, dy, dz] = [math.derivative(originalFunction, 'x'), math.derivative(originalFunction, 'y'), math.derivative(originalFunction, 'z')]
const [gx, gy, gz] = [dx.compile(), dy.compile(), dz.compile()]




const DynamicLine = ({ initialPoints,color, a,b,c }) => {

  const lineRef = useRef();
  const points = useMemo(() => initialPoints.map(p => new THREE.Vector3(...p)), [initialPoints]);

  useFrame(() => {
    // Update the points here as needed
    /*points.forEach((point, index) => {
      point.y += 0.01; // Example of updating the y-coordinate
    });*/


    lineRef.current.geometry.setFromPoints(points);
  });

  return (
    <line ref={lineRef}>
      <bufferGeometry attach="geometry" />
      <lineBasicMaterial attach="material" color={color} />
    </line>
  );
};


function FakeOrbit({pos, points, setPoints}){


  let p = [0,0,0]

/*  useFrame(()=>{
    const newCube = cube(-5,-5,-5,p)
    setPoints(newCube)
  })
  */
  //
  return(
    <line>
      <bufferGeometry attach="geometry" />
      <lineBasicMaterial attach="material" />
    </line>
  )
}

function line(startX, startY, startZ, dir,pos) {
  const line = []
  for (let i = 0; i <= 16; i += .1) {
    let x = startX + (i) * dir
    let y = startY + (1 - dir) * i
    let z = startZ

    let gX = gx.evaluate({x:x,y:y,z:z,a:pos[0],b:pos[1],c:pos[2]})
    let gY = gy.evaluate({x:x,y:y,z:z,a:pos[0],b:pos[1],c:pos[2]})
    let gZ = gz.evaluate({x:x,y:y,z:z,a:pos[0],b:pos[1],c:pos[2]})

    if(Math.abs(gX) > Math.abs(x))
    line.push([x+gx.evaluate({x:x,y:y,z:z,a:pos[0],b:pos[1],c:pos[2]}),y+gy.evaluate({x:x,y:y,z:z,a:pos[0],b:pos[1],c:pos[2]}),z+gz.evaluate({x:x,y:y,z:z,a:pos[0],b:pos[1],c:pos[2]})])
    
  }
  return line
}

function plane(startX, startY, startZ, dir,pos) {
  const plane = []
  for (let i = 0; i <= 16; i+=4) {
    plane.push(line(startX + (1 - dir) * i, startY + i * dir, startZ, dir,pos))
  }
  return plane
}

function cube(startX, startY, startZ,pos) {
  const cube = []
  for (let dir = 0; dir <= 1; dir++) {
    for (let i = 0; i <= 16; i+=2) {
      cube.push(plane(startX, startY, startZ + i, dir,pos))
    }
  }
  return cube
}

const App = () => {

  const [[a,b,c], setABC] = useState([2,0,2])
  const [initialPoints, setInitialPoints] = useState([])

  const [time, setTime] = useState(0)

  useEffect(() => {
    let asdf = cube(-8, -8, -8, [a,b,c])
    
    setInitialPoints(asdf)
  }, [])


  return (
    <div className='h-screen'>
      <Canvas className='!h-screen bg-black'>
      <instancedMesh>
        {initialPoints.map((plane, planeIndex) => (
          <group key={planeIndex}>
            {plane.map((line) => (
              <DynamicLine initialPoints={line} color={"white"} a={0} b={0} c={0}/>
            ))}
          </group>
        ))}
        </instancedMesh>

        <DynamicLine initialPoints={[
          [0, 0, 0], [10, 0, 0], [0, 0, 0], [0, 10, 0], [0, 0, 0], [0, 0, 10]
        ]} color={'red'} />
        <FakeOrbit pos={[a,b,c]} points={initialPoints} setPoints={setInitialPoints} />
        <OrbitControls />
      </Canvas>
    </div>
  );
};

export default App;
