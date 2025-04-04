import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

let scene, camera, renderer, controls, clock;
let directionalLight, ambientLight, hemisphereLight;
const cityObjects = new THREE.Group(); 
const animatedObjects = [];
const lampposts = [];
function init() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87ceeb); 
    scene.fog = new THREE.Fog(0x87ceeb, 50, 250);

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(30, 40, 50);
    camera.lookAt(0, 0, 0);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap; // Softer shadows
    document.body.appendChild(renderer.domElement);

    clock = new THREE.Clock();

    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.screenSpacePanning = false;
    controls.maxPolarAngle = Math.PI / 2 - 0.05; 
    controls.minDistance = 10;
    controls.maxDistance = 200;

    ambientLight = new THREE.AmbientLight(0xffffff, 0.2); // Soft white light
    scene.add(ambientLight);

    hemisphereLight = new THREE.HemisphereLight(0xDDEEFF, 0x0f0e0d, 0.1); // Sky, Ground, Intensity
    scene.add(hemisphereLight);

    directionalLight = new THREE.DirectionalLight(0xffffff, 1.0); 
    directionalLight.position.set(50, 100, 50);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 500;
    directionalLight.shadow.camera.left = -100;
    directionalLight.shadow.camera.right = 100;
    directionalLight.shadow.camera.top = 100;
    directionalLight.shadow.camera.bottom = -100;
    directionalLight.shadow.bias = -0.001; 
    scene.add(directionalLight);
    scene.add(directionalLight.target); 

    const groundGeo = new THREE.PlaneGeometry(300, 300);
    const groundMat = new THREE.MeshStandardMaterial({ color: 0x555555, side: THREE.DoubleSide });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2; 
    ground.receiveShadow = true;
    scene.add(ground);

    createCityLayout();
    scene.add(cityObjects);
    window.addEventListener('resize', onWindowResize, false);

    animate();
}

function createBuilding(x, z, width, depth, height, color) {
    const buildingGeo = new THREE.BoxGeometry(width, height, depth);
    const buildingMat = new THREE.MeshStandardMaterial({ color: color });
    const building = new THREE.Mesh(buildingGeo, buildingMat);
    building.position.set(x, height / 2, z); 
    building.castShadow = true;
    building.receiveShadow = true;
    cityObjects.add(building); 
}

function createRoad(x, z, width, length, rotationY = 0) {
    const roadGeo = new THREE.PlaneGeometry(width, length);
    const roadMat = new THREE.MeshStandardMaterial({ color: 0x333333, side: THREE.DoubleSide });
    const road = new THREE.Mesh(roadGeo, roadMat);
    road.rotation.x = -Math.PI / 2;
    road.rotation.z = rotationY; 
    road.position.set(x, 0.01, z); 
    road.receiveShadow = true;
    cityObjects.add(road); 
}

function createSidewalk(x, z, width, length) {
     const sidewalkGeo = new THREE.PlaneGeometry(width, length);
    const sidewalkMat = new THREE.MeshStandardMaterial({ color: 0xaaaaaa, side: THREE.DoubleSide });
    const sidewalk = new THREE.Mesh(sidewalkGeo, sidewalkMat);
    sidewalk.rotation.x = -Math.PI / 2;
    sidewalk.position.set(x, 0.02, z); 
    sidewalk.receiveShadow = true;
    cityObjects.add(sidewalk);
}

function createCrossing(x, z, width, length) {
    const crossingGroup = new THREE.Group();
    const stripeWidth = width / 8;
    const stripeLength = length;
    const stripeGeo = new THREE.PlaneGeometry(stripeWidth, stripeLength);
    const stripeMat = new THREE.MeshStandardMaterial({ color: 0xffffff, side: THREE.DoubleSide });

    for (let i = 0; i < 4; i++) {
        const stripe = new THREE.Mesh(stripeGeo, stripeMat);
        stripe.rotation.x = -Math.PI / 2;
        stripe.position.set(x - width / 2 + stripeWidth / 2 + i * stripeWidth * 2 , 0.015, z);
        stripe.receiveShadow = true;
        crossingGroup.add(stripe);
    }
     cityObjects.add(crossingGroup);
}

function createLamppost(x, z) {
    const postHeight = 5;
    const lightIntensity = 5; 
    const lightDistance = 10;
    const lightColor = 0xffffee;

    const postGeo = new THREE.CylinderGeometry(0.1, 0.15, postHeight, 8);
    const postMat = new THREE.MeshStandardMaterial({ color: 0x444444 });
    const post = new THREE.Mesh(postGeo, postMat);
    post.position.set(x, postHeight / 2 + 0.02, z);
    post.castShadow = true;
    cityObjects.add(post);

    const lightBulbGeo = new THREE.SphereGeometry(0.2, 8, 8);
    const lightBulbMat = new THREE.MeshStandardMaterial({ color: lightColor, emissive: lightColor, emissiveIntensity: 0 });
    const lightBulb = new THREE.Mesh(lightBulbGeo, lightBulbMat);
    lightBulb.position.set(x, postHeight + 0.02, z);
    cityObjects.add(lightBulb);

    const pointLight = new THREE.PointLight(lightColor, 0, lightDistance, 1); // Intensity 0 initially
    pointLight.position.set(x, postHeight - 0.1, z);
    pointLight.castShadow = false; 
    cityObjects.add(pointLight);

    lampposts.push({ mesh: lightBulb, light: pointLight, baseIntensity: lightIntensity });
}

function createTree(x, z) {
    const trunkHeight = 2;
    const trunkRadius = 0.2;
    const leavesHeight = 3;
    const leavesRadius = 1.5;

    const trunkGeo = new THREE.CylinderGeometry(trunkRadius * 0.8, trunkRadius, trunkHeight, 8);
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x8B4513 }); // Brown
    const trunk = new THREE.Mesh(trunkGeo, trunkMat);
    trunk.position.set(x, trunkHeight / 2 + 0.02, z);
    trunk.castShadow = true;
    cityObjects.add(trunk);

    const leavesGeo = new THREE.ConeGeometry(leavesRadius, leavesHeight, 8);
    const leavesMat = new THREE.MeshStandardMaterial({ color: 0x228B22 }); // ForestGreen
    const leaves = new THREE.Mesh(leavesGeo, leavesMat);
    leaves.position.set(x, trunkHeight + leavesHeight / 2 + 0.02, z);
    leaves.castShadow = true;
    leaves.receiveShadow = true;
    cityObjects.add(leaves);
}

function createBench(x, z, rotationY = 0) {
    const benchWidth = 1.5;
    const benchDepth = 0.4;
    const legHeight = 0.4;
    const seatHeight = 0.1;

    const benchGroup = new THREE.Group();

    const seatGeo = new THREE.BoxGeometry(benchWidth, seatHeight, benchDepth);
    const legGeo = new THREE.BoxGeometry(0.1, legHeight, 0.1);
    const woodMat = new THREE.MeshStandardMaterial({ color: 0x8B4513 }); // Brown
    const metalMat = new THREE.MeshStandardMaterial({ color: 0x555555 }); // Dark metal

    const seat = new THREE.Mesh(seatGeo, woodMat);
    seat.position.y = legHeight + seatHeight / 2;
    seat.castShadow = true;
    benchGroup.add(seat);

    const leg1 = new THREE.Mesh(legGeo, metalMat);
    leg1.position.set(-benchWidth / 2 + 0.1, legHeight / 2, -benchDepth / 2 + 0.1);
    leg1.castShadow = true;
    benchGroup.add(leg1);

    const leg2 = new THREE.Mesh(legGeo, metalMat);
    leg2.position.set(benchWidth / 2 - 0.1, legHeight / 2, -benchDepth / 2 + 0.1);
    leg2.castShadow = true;
    benchGroup.add(leg2);

    const leg3 = new THREE.Mesh(legGeo, metalMat);
    leg3.position.set(-benchWidth / 2 + 0.1, legHeight / 2, benchDepth / 2 - 0.1);
    leg3.castShadow = true;
    benchGroup.add(leg3);

    const leg4 = new THREE.Mesh(legGeo, metalMat);
    leg4.position.set(benchWidth / 2 - 0.1, legHeight / 2, benchDepth / 2 - 0.1);
    leg4.castShadow = true;
    benchGroup.add(leg4);

    benchGroup.position.set(x, 0.02, z);
    benchGroup.rotation.y = rotationY;
    cityObjects.add(benchGroup);
}

function createTrafficLight(x, z, rotationY = 0) {
    const lightGroup = new THREE.Group();
    const postHeight = 4;
    const boxWidth = 0.5;
    const boxHeight = 1.2;
    const lightRadius = 0.15;

    const postGeo = new THREE.CylinderGeometry(0.1, 0.1, postHeight, 8);
    const postMat = new THREE.MeshStandardMaterial({ color: 0x555555 });
    const post = new THREE.Mesh(postGeo, postMat);
    post.position.y = postHeight / 2;
    post.castShadow = true;
    lightGroup.add(post);

    const boxGeo = new THREE.BoxGeometry(boxWidth, boxHeight, 0.3);
    const boxMat = new THREE.MeshStandardMaterial({ color: 0x333333 });
    const box = new THREE.Mesh(boxGeo, boxMat);
    box.position.y = postHeight - boxHeight / 2;
    box.position.z = 0.15; 
    box.castShadow = true;
    lightGroup.add(box);

    const redLightGeo = new THREE.CircleGeometry(lightRadius, 16);
    const redLightMat = new THREE.MeshBasicMaterial({ color: 0xff0000, side: THREE.DoubleSide });
    const redLight = new THREE.Mesh(redLightGeo, redLightMat);
    redLight.position.set(0, postHeight - boxHeight * 0.15, 0.31);
    lightGroup.add(redLight);

    const yellowLightGeo = new THREE.CircleGeometry(lightRadius, 16);
    const yellowLightMat = new THREE.MeshBasicMaterial({ color: 0xffff00, side: THREE.DoubleSide });
    const yellowLight = new THREE.Mesh(yellowLightGeo, yellowLightMat);
    yellowLight.position.set(0, postHeight - boxHeight * 0.5, 0.31);
    lightGroup.add(yellowLight);

    const greenLightGeo = new THREE.CircleGeometry(lightRadius, 16);
    const greenLightMat = new THREE.MeshBasicMaterial({ color: 0x00ff00, side: THREE.DoubleSide });
    const greenLight = new THREE.Mesh(greenLightGeo, greenLightMat);
    greenLight.position.set(0, postHeight - boxHeight * 0.85, 0.31);
    lightGroup.add(greenLight);

    lightGroup.position.set(x, 0.02, z);
    lightGroup.rotation.y = rotationY;
    cityObjects.add(lightGroup);
}



function createCar(color, pathPoints, speed = 5) {
    const carWidth = 1.2;
    const carHeight = 0.8;
    const carLength = 2.5;

    const carGroup = new THREE.Group();

    const bodyGeo = new THREE.BoxGeometry(carWidth, carHeight * 0.6, carLength);
    const bodyMat = new THREE.MeshStandardMaterial({ color: color });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = carHeight * 0.3 + 0.1;
    body.castShadow = true;
    carGroup.add(body);

    const cabinGeo = new THREE.BoxGeometry(carWidth * 0.8, carHeight * 0.4, carLength * 0.6);
    const cabinMat = new THREE.MeshStandardMaterial({ color: 0xcccccc, transparent: true, opacity: 0.7 });
    const cabin = new THREE.Mesh(cabinGeo, cabinMat);
    cabin.position.y = carHeight * 0.8 + 0.1; 
    cabin.position.z = -carLength * 0.1;
    cabin.castShadow = true;
    carGroup.add(cabin);

    const wheelRadius = carHeight * 0.2;
    const wheelGeo = new THREE.CylinderGeometry(wheelRadius, wheelRadius, 0.2, 16);
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x111111 });

    const wheelPositions = [
        { x: -carWidth / 2, y: wheelRadius + 0.1, z: carLength / 2 - wheelRadius * 1.5 },
        { x: carWidth / 2, y: wheelRadius + 0.1, z: carLength / 2 - wheelRadius * 1.5 },
        { x: -carWidth / 2, y: wheelRadius + 0.1, z: -carLength / 2 + wheelRadius * 1.5 },
        { x: carWidth / 2, y: wheelRadius + 0.1, z: -carLength / 2 + wheelRadius * 1.5 },
    ];

    wheelPositions.forEach(pos => {
        const wheel = new THREE.Mesh(wheelGeo, wheelMat);
        wheel.rotation.z = Math.PI / 2; // Rotate to align with car body
        wheel.position.set(pos.x, pos.y, pos.z);
        carGroup.add(wheel);
    });

    const carData = {
        mesh: carGroup,
        path: new THREE.CatmullRomCurve3(pathPoints, true), // Closed loop path
        speed: speed,
        progress: Math.random(), // Start at random points on path
        update: function(deltaTime) {
            this.progress += this.speed * deltaTime / this.path.getLength();
            if (this.progress >= 1) {
                this.progress -= 1; // Loop
            }
            const point = this.path.getPointAt(this.progress);
            const tangent = this.path.getTangentAt(this.progress).normalize();
            this.mesh.position.copy(point);

            const lookAtPos = new THREE.Vector3().copy(point).add(tangent);
            this.mesh.lookAt(lookAtPos);
        }
    };

    scene.add(carGroup); 
    animatedObjects.push(carData);
}

function createPedestrian(pathPoints, speed = 1.5) {
     const pedHeight = 1.8;
     const pedRadius = 0.2;
     const pedGeo = new THREE.CapsuleGeometry(pedRadius, pedHeight - pedRadius * 2, 4, 8);
     const pedMat = new THREE.MeshStandardMaterial({ color: new THREE.Color(Math.random() * 0xffffff)});
     const pedestrian = new THREE.Mesh(pedGeo, pedMat);
     pedestrian.castShadow = true;

     const pedData = {
         mesh: pedestrian,
         path: new THREE.CatmullRomCurve3(pathPoints, true), // Closed loop path for sidewalks
         speed: speed * 0.5,
         progress: Math.random(),
         update: function(deltaTime) {
             this.progress += this.speed * deltaTime / this.path.getLength();
             if (this.progress >= 1) {
                 this.progress -= 1; // Loop
             }
             const point = this.path.getPointAt(this.progress);
             this.mesh.position.set(point.x, pedHeight / 2 + 0.02, point.z);
             
         }
     };

     scene.add(pedestrian);
     animatedObjects.push(pedData);
}

function createCityLayout() {
    const blockSize = 25; 
    const streetWidth = 5;
    const sidewalkWidth = 2;
    const buildingPadding = 1; 
    const citySize = 4; 

    for (let i = -citySize; i <= citySize; i++) {
        const pos = i * blockSize;
        createRoad(pos, 0, streetWidth, (citySize * 2 + 1) * blockSize);
        createRoad(0, pos, (citySize * 2 + 1) * blockSize, streetWidth);

        createSidewalk(pos + streetWidth / 2 + sidewalkWidth/2, 0, sidewalkWidth, (citySize * 2 + 1) * blockSize);
        createSidewalk(pos - streetWidth / 2 - sidewalkWidth/2, 0, sidewalkWidth, (citySize * 2 + 1) * blockSize);
        createSidewalk(0, pos + streetWidth / 2 + sidewalkWidth/2, (citySize * 2 + 1) * blockSize - streetWidth, sidewalkWidth);
        createSidewalk(0, pos - streetWidth / 2 - sidewalkWidth/2, (citySize * 2 + 1) * blockSize - streetWidth, sidewalkWidth);
    }

    for (let i = -citySize; i < citySize; i++) {
        for (let j = -citySize; j < citySize; j++) {
            const blockCenterX = (i + 0.5) * blockSize;
            const blockCenterZ = (j + 0.5) * blockSize;
            const blockInnerSize = blockSize - streetWidth - sidewalkWidth * 2;

            const numBuildings = Math.floor(Math.random() * 3) + 1; 
            for (let k = 0; k < numBuildings; k++) {
                const buildingWidth = Math.random() * (blockInnerSize / numBuildings * 0.8) + (blockInnerSize / numBuildings * 0.2);
                const buildingDepth = Math.random() * (blockInnerSize * 0.8) + (blockInnerSize * 0.2);
                const buildingHeight = Math.random() * 30 + 10; // Random height (10 to 40)
                const buildingColor = new THREE.Color(Math.random() * 0.5 + 0.3, Math.random() * 0.5 + 0.3, Math.random() * 0.5 + 0.3); // Muted random colors

                // Random position within the block (simplified placement)
                const buildingX = blockCenterX - blockInnerSize/2 + buildingPadding + Math.random() * (blockInnerSize - buildingWidth - 2 * buildingPadding);
                const buildingZ = blockCenterZ - blockInnerSize/2 + buildingPadding + Math.random() * (blockInnerSize - buildingDepth - 2 * buildingPadding);

                createBuilding(buildingX + buildingWidth/2, buildingZ + buildingDepth/2, buildingWidth, buildingDepth, buildingHeight, buildingColor);
            }

             const sidewalkX1 = blockCenterX - blockInnerSize/2 - sidewalkWidth/2;
             const sidewalkZ1 = blockCenterZ - blockInnerSize/2 - sidewalkWidth/2;
             const sidewalkX2 = blockCenterX + blockInnerSize/2 + sidewalkWidth/2;
             const sidewalkZ2 = blockCenterZ + blockInnerSize/2 + sidewalkWidth/2;

             if (Math.random() < 0.5) createLamppost(sidewalkX1, blockCenterZ);
             if (Math.random() < 0.5) createLamppost(sidewalkX2, blockCenterZ);
             if (Math.random() < 0.5) createLamppost(blockCenterX, sidewalkZ1);
             if (Math.random() < 0.5) createLamppost(blockCenterX, sidewalkZ2);

             if (Math.random() < 0.3) createTree(sidewalkX1, blockCenterZ + Math.random() * blockInnerSize - blockInnerSize / 2);
             if (Math.random() < 0.3) createTree(sidewalkX2, blockCenterZ + Math.random() * blockInnerSize - blockInnerSize / 2);
             if (Math.random() < 0.3) createTree(blockCenterX + Math.random() * blockInnerSize - blockInnerSize / 2, sidewalkZ1);
             if (Math.random() < 0.3) createTree(blockCenterX + Math.random() * blockInnerSize - blockInnerSize / 2, sidewalkZ2);

            if (Math.random() < 0.2) createBench(sidewalkX1, blockCenterZ + Math.random() * blockInnerSize - blockInnerSize / 2, Math.PI / 2);
            if (Math.random() < 0.2) createBench(sidewalkX2, blockCenterZ + Math.random() * blockInnerSize - blockInnerSize / 2, -Math.PI / 2);
            if (Math.random() < 0.2) createBench(blockCenterX + Math.random() * blockInnerSize - blockInnerSize / 2, sidewalkZ1, 0);
            if (Math.random() < 0.2) createBench(blockCenterX + Math.random() * blockInnerSize - blockInnerSize / 2, sidewalkZ2, Math.PI);

             const intersectionX = i * blockSize;
             const intersectionZ = j * blockSize;
             if (i > -citySize && j > -citySize) { // Avoid edges for crossings/lights
                createCrossing(intersectionX, intersectionZ + streetWidth/2 + 0.1, streetWidth, streetWidth);
                createCrossing(intersectionX + streetWidth/2 + 0.1, intersectionZ, streetWidth, streetWidth);
                createCrossing(intersectionX, intersectionZ - streetWidth/2 - 0.1, streetWidth, streetWidth);
                createCrossing(intersectionX - streetWidth/2 - 0.1, intersectionZ, streetWidth, streetWidth);

                createTrafficLight(intersectionX + streetWidth/2 + 0.5, intersectionZ + streetWidth/2 + 0.5, -Math.PI / 4);
                createTrafficLight(intersectionX - streetWidth/2 - 0.5, intersectionZ - streetWidth/2 - 0.5, Math.PI * 3 / 4);
                createTrafficLight(intersectionX + streetWidth/2 + 0.5, intersectionZ - streetWidth/2 - 0.5, -Math.PI * 3 / 4);
                createTrafficLight(intersectionX - streetWidth/2 - 0.5, intersectionZ + streetWidth/2 + 0.5, Math.PI / 4);
             }
        }
    }

    const outerLoopDist = citySize * blockSize - streetWidth / 2;
    const innerLoopDist = (citySize - 1) * blockSize - streetWidth / 2;

    const carPath1 = [
        new THREE.Vector3(-outerLoopDist, 0.1, -outerLoopDist),
        new THREE.Vector3( outerLoopDist, 0.1, -outerLoopDist),
        new THREE.Vector3( outerLoopDist, 0.1,  outerLoopDist),
        new THREE.Vector3(-outerLoopDist, 0.1,  outerLoopDist),
    ];
    const carPath2 = [ // Inner loop, opposite direction
        new THREE.Vector3( innerLoopDist, 0.1,  innerLoopDist),
        new THREE.Vector3(-innerLoopDist, 0.1,  innerLoopDist),
        new THREE.Vector3(-innerLoopDist, 0.1, -innerLoopDist),
        new THREE.Vector3( innerLoopDist, 0.1, -innerLoopDist),
    ];

    for(let i=0; i<15; i++) createCar(new THREE.Color(Math.random() * 0xffffff), carPath1, 8 + Math.random() * 5);
    for(let i=0; i<10; i++) createCar(new THREE.Color(Math.random() * 0xffffff), carPath2, 7 + Math.random() * 4);

    const sidewalkOffset = streetWidth/2 + sidewalkWidth/2;
    const pedPathDist = citySize * blockSize - blockSize/2; 

    const pedPath1 = [
        new THREE.Vector3(-pedPathDist, 0.1, -sidewalkOffset),
        new THREE.Vector3( pedPathDist, 0.1, -sidewalkOffset),
    ];
     const pedPath2 = [
        new THREE.Vector3( sidewalkOffset, 0.1, -pedPathDist),
        new THREE.Vector3( sidewalkOffset, 0.1,  pedPathDist),
    ];
     const pedPath3 = [
        new THREE.Vector3( pedPathDist, 0.1,  sidewalkOffset),
        new THREE.Vector3(-pedPathDist, 0.1,  sidewalkOffset),
    ];
     const pedPath4 = [
        new THREE.Vector3(-sidewalkOffset, 0.1,  pedPathDist),
        new THREE.Vector3(-sidewalkOffset, 0.1, -pedPathDist),
    ];

     const pedLoop1 = [
         new THREE.Vector3(-pedPathDist, 0.1, sidewalkOffset), // Sidewalk 1
         new THREE.Vector3( pedPathDist, 0.1, sidewalkOffset),
         new THREE.Vector3( pedPathDist, 0.1, -sidewalkOffset),// Sidewalk 2 (opposite side)
         new THREE.Vector3(-pedPathDist, 0.1, -sidewalkOffset),
     ];
     const pedLoop2 = [
         new THREE.Vector3(sidewalkOffset, 0.1, -pedPathDist), // Sidewalk 3
         new THREE.Vector3(sidewalkOffset, 0.1,  pedPathDist),
         new THREE.Vector3(-sidewalkOffset, 0.1, pedPathDist), // Sidewalk 4 (opposite side)
         new THREE.Vector3(-sidewalkOffset, 0.1, -pedPathDist),
     ];

    for(let i=0; i<10; i++) createPedestrian(pedLoop1, 1 + Math.random());
    for(let i=0; i<10; i++) createPedestrian(pedLoop2, 1 + Math.random());

}



function animate() {
    requestAnimationFrame(animate);

    const deltaTime = clock.getDelta();
    const elapsedTime = clock.getElapsedTime();

    controls.update();

    animatedObjects.forEach(obj => obj.update(deltaTime));

    const cycleDuration = 60; // Duration of one full day/night cycle in seconds
    const timeOfDay = (elapsedTime % cycleDuration) / cycleDuration; // Normalize time (0 to 1)

    const sunAngle = timeOfDay * Math.PI * 2;
    directionalLight.position.x = 80 * Math.cos(sunAngle);
    directionalLight.position.y = 80 * Math.sin(sunAngle); // Peak at midday
    directionalLight.position.z = 50 * Math.cos(sunAngle - Math.PI / 4); // Add some variation
    directionalLight.target.position.set(0, 0, 0); // Keep looking at the center


    let sunIntensity, ambientIntensity, hemiIntensity, skyColor, fogColor;
    let lamppostLightIntensity = 0;
    let lamppostEmissiveIntensity = 0;

    if (directionalLight.position.y > 0) { // Daytime
        const dayFactor = directionalLight.position.y / 100; 
        sunIntensity = Math.max(0.1, dayFactor * 1.2); 
        ambientIntensity = Math.max(0.1, dayFactor * 0.4);
        hemiIntensity = Math.max(0.05, dayFactor * 0.2);

        const sunriseColor = new THREE.Color(0xffa500); // Orange
        const middayColor = new THREE.Color(0x87ceeb); // Sky Blue 
        skyColor = new THREE.Color().lerpColors(sunriseColor, middayColor, Math.min(1, dayFactor * 1.5));
        fogColor = skyColor;

    } else {
        const nightFactor = Math.abs(directionalLight.position.y / 80); 
        sunIntensity = 0.05; 
        ambientIntensity = 0.05 + Math.min(0.1, nightFactor * 0.1); 
        hemiIntensity = 0.05;
        const sunsetColor = new THREE.Color(0xffa500);
        const nightColor = new THREE.Color(0x000033); 
        skyColor = new THREE.Color().lerpColors(sunsetColor, nightColor, Math.min(1, nightFactor * 1.5));
        fogColor = new THREE.Color().lerpColors(sunsetColor, nightColor, Math.min(1, nightFactor * 2.0)); 

        lamppostLightIntensity = Math.min(1, nightFactor * 3.0); // Ramp up intensity
        lamppostEmissiveIntensity = Math.min(1, nightFactor * 4.0);
    }

    
    directionalLight.intensity = sunIntensity;
    ambientLight.intensity = ambientIntensity;
    hemisphereLight.intensity = hemiIntensity;
    scene.background = skyColor;
    scene.fog.color = fogColor;
    scene.fog.near = 50 + Math.max(0, 1 - sunIntensity * 2) * 100; 
    scene.fog.far = 250 + Math.max(0, 1 - sunIntensity * 2) * 200;

    lampposts.forEach(lp => {
        lp.light.intensity = lp.baseIntensity * lamppostLightIntensity;
        lp.mesh.material.emissiveIntensity = lamppostEmissiveIntensity;
    });

    
    renderer.render(scene, camera);
}



function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}


init();
