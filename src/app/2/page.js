"use client"

import React, { useRef, useMemo, useEffect, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { BiSolidPlanet } from "react-icons/bi";
import { LuAxis3D, LuGrid } from "react-icons/lu";

import { EffectComposer, UnrealBloomPass, Bloom, GodRays } from "@react-three/postprocessing";
import { GodraysPass } from 'three-good-godrays';

import { FaSun } from "react-icons/fa";
import { FaCircle } from "react-icons/fa";


const G = -6.67 * 10 ** -11;

const gravity = (position, origin, mass, radius_object) => {

    //you divid by r^2, fewer computations
    const dist = (position[0] - origin[0]) ** 2 + (position[1] - origin[1]) ** 2 + (position[2] - origin[2]) ** 2
    let m
    if (dist >= radius_object ** 2 || radius_object == undefined) {
        m = mass
    } else {
        m = mass * (Math.sqrt(dist) ** 3) / (radius_object ** 3)
    }
    const s = -G * m / dist
    let dir = [position[0] - origin[0], position[1] - origin[1], position[2] - origin[2]]
    dir = [dir[0] / Math.sqrt(dist), dir[1] / Math.sqrt(dist), dir[2] / Math.sqrt(dist)]


    return (
        [s * dir[0], s * dir[1], s * dir[2]]
    )
}

const DynamicLine = ({ initialPoints, color, planetPositions, view }) => {

    const lineRef = useRef();
    const points = useMemo(() => initialPoints.map(p => new THREE.Vector3(...p)), [initialPoints]);
    if (planetPositions != undefined) {
        useFrame(() => {

            points.forEach((point, index) => {


                let xVector
                let yVector
                let zVector

                let [x, y, z] = initialPoints[index]

                const GRAVITY_CONSTANT = 4 * 10 ** 11;
                const ANOTHER_CONSTANT = 3;

                xVector = 0
                yVector = 0
                zVector = 0

                for (let i of planetPositions) {
                    let grav = gravity([x, y, z], i[0], GRAVITY_CONSTANT, ANOTHER_CONSTANT);
                    xVector += grav[0]
                    yVector += grav[1]
                    zVector += grav[2]

                }

                //looks cool but is definitely wrong

                point.y = view == '3D' ? initialPoints[index][1] - yVector : 0
                point.x = initialPoints[index][0] - xVector
                point.z = initialPoints[index][2] - zVector

            })

            lineRef.current.geometry.setFromPoints(points);
        });
    }

    return (
        <line ref={lineRef}>
            <bufferGeometry attach="geometry" />
            <lineBasicMaterial attach="material" color={color} />
        </line>
    );
};

function Update({ pos, setOrigin }) {

    useFrame(() => {
        const time = new Date().getTime() / 1000

        let newPos = [Math.sin(time) * 3 + 5, Math.cos(time) * 3 + 5, Math.cos(time) * 3 + 5]
        setOrigin(newPos)
    })

    return (

        <mesh position={pos}>
            <sphereGeometry attach='geometry' />
            <meshBasicMaterial color={'yellow'} attach={'material'} />
        </mesh>

    )

}

const gp = () => {
    let cube = []
    const origin = [-5, -5, -5]
    for (let i = -10; i <= 10; i += 5) {
        let plane = []
        for (let j = -10; j <= 10; j += 5) {
            let line = []
            for (let k = -10; k < 10; k += .1) {
                line.push([i, j, k])
            }
            plane.push(line)
        }
        cube.push(plane)
    }
    for (let i = -10; i <= 10; i += 5) {
        let plane = []
        for (let j = -10; j <= 10; j += 5) {
            let line = []
            for (let k = -10; k < 10; k += .1) {
                line.push([k, i, j])
            }
            plane.push(line)
        }
        cube.push(plane)
    }
    for (let i = -10; i <= 10; i += 5) {
        let plane = []
        for (let j = -10; j <= 10; j += 5) {
            let line = []
            for (let k = -10; k < 10; k += .1) {
                line.push([i, k, j])
            }
            plane.push(line)
        }
        cube.push(plane)
    }




    return cube
}

function Planets({ planetPositions }) {
    return (
        <instancedMesh>
            {planetPositions.map((p, i) => (

                <mesh position={planetPositions[i][0]}>
                    <sphereGeometry attach='geometry' />
                    <meshBasicMaterial color={'yellow'} attach={'material'} />
                </mesh>
            ))}
        </instancedMesh>
    )
}

function UpdatePlanets({ planetPositions, setPlanetPositions, view, sunRef }) {
    useFrame(() => {
        let newPositions = []
        for (let i of planetPositions) {


            let allAspects = [...i]
            // const GRAVITY_CONSTANT = 4 * 10 ** 11;
            // const ANOTHER_CONSTANT = 3;


            let xVector = 0
            let yVector = 0
            let zVector = 0

            for (let k of planetPositions) {
                const GRAVITY_CONSTANT = k[2][0]
                const ANOTHER_CONSTANT = k[2][1]
                if (Math.abs(k[0][0] - allAspects[0][0]) > .001 && Math.abs(k[0][1] - allAspects[0][1]) > .001 && Math.abs(k[0][2] - allAspects[0][2]) > .001) {
                    let grav = gravity(allAspects[0], k[0], GRAVITY_CONSTANT, ANOTHER_CONSTANT);
                    xVector += grav[0]
                    yVector += grav[1]
                    zVector += grav[2]
                }

            }

            //I'm pretty sure this is incorrect, but otherwise the speed is too much...
            //f = ma, so here we calculate a
            allAspects[1][0] -= xVector/allAspects[2][0]
            allAspects[1][1] -= yVector/allAspects[2][0]
            allAspects[1][2] -= zVector/allAspects[2][0]

            allAspects[0][0] += allAspects[1][0]
            allAspects[0][1] += allAspects[1][1]
            allAspects[0][2] += allAspects[1][2]
            newPositions.push(allAspects)
        }
        setPlanetPositions(newPositions)
    })
    return (

        <group>
            {planetPositions.map((p, i) => (
            <mesh ref={i == 0? sunRef : undefined} position={[p[0][0],view == '3D' ? p[0][1]: 0,p[0][2]]}>
                <sphereGeometry attach='geometry' args={[p[2][1]]} />
                <meshBasicMaterial color={i == 0? 'yellow' : 'orange'} attach={'material'} />
            </mesh>
        ))}
        </group>
    )
}


export default function Home() {

    const sunRef = useRef()

    const [[a, b, c], setOrigin] = useState([0, 0, 0])

    const [planets, setPlanets] = useState([
        [[0,0,0],[0,0,0],[4*10**20,1]]
        // [[0,0,0],[0,0,0]],
        // [[1,1,1],[1,0,0]],
        // [[2,2,2],[0,1,1]]
    ])

    const [view, setView] = useState('3D')
    const [godrays, setGodrays] = useState(true)

    const initialPoints = gp()

    return (
        <div className='h-screen relative'>
            <Canvas className='!h-screen bg-black !absolute' shadows>
            

                <UpdatePlanets sunRef={sunRef} planetPositions={planets} setPlanetPositions={setPlanets} view = {view} />
                <instancedMesh shadows>
                    {initialPoints.map((plane, planeIndex) => (
                        <group key={planeIndex}>
                            {plane.map((line) => (
                                <DynamicLine initialPoints={line} color={"white"} planetPositions={planets} view={view} />
                            ))}
                        </group>
                    ))}
                </instancedMesh>


                <DynamicLine initialPoints={[
                    [0, 0, 0], [10, 0, 0], [0, 0, 0], [0, 10, 0], [0, 0, 0], [0, 0, 10]
                ]} color={'red'} />
                <OrbitControls />


                {godrays && 
                <EffectComposer fallback={null}>
              {sunRef.current && 
            <GodRays sun={sunRef}/>
              }
          </EffectComposer>
                }

            </Canvas>
            <div className='absolute bottom-4 w-full flex place-content-center justify-center items-center group overflow-clip'>
                <div className='transition-all ease-out duration-500 w-fit max-w-full p-4 rounded-2xl text-white bg-slate-100/10 backdrop-blur-md translate-y-0 opacity-100 flex flex-wrap'>
                    <div className='cursor-pointer transition-all ease-out from-slate-50/20 to-slate-100/20 hover:scale-110 bg-gradient-to-br w-10 h-10 text-center rounded-md flex place-content-center justify-center items-center mr-2'
                        onClick={() => {
                            let old = [...planets]
                            old.push([[Math.random() * 10 - 5, Math.random() * 10 - 5, Math.random() * 10 - 5], [Math.random() / 10 - .05, Math.random() / 10 - .05, Math.random() / 10 - .05],[4*10**11,.1]])
                            setPlanets(old)
                        }}
                    >
                        <BiSolidPlanet />
                    </div>
                    <div className='cursor-pointer transition-all ease-out from-slate-50/20 to-slate-100/20 hover:scale-110 bg-gradient-to-br w-10 h-10 text-center rounded-md flex place-content-center justify-center items-center mr-2'
                    onClick={()=>{
                        if(view == '3D') setView('2D')
                        else setView('3D')
                    }}
                    >
                        {view != '3D' && <LuAxis3D />}
                        {view == '3D' && <LuGrid />}
                    </div>
                    <div className='cursor-pointer transition-all ease-out from-slate-50/20 to-slate-100/20 hover:scale-110 bg-gradient-to-br w-10 h-10 text-center rounded-md flex place-content-center justify-center items-center'
                    onClick={()=>{
                        if(godrays == true) setGodrays(false)
                        else setGodrays(true)
                    }}
                    >
                        {godrays != true && <FaSun />}
                        {godrays == true && <FaCircle />}
                    </div>
                </div>


            </div>
        </div>
    );
}