import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import GUI from "lil-gui";
import earthVertexShader from "./shaders/earth/vertex.glsl";
import earthFragmentShader from "./shaders/earth/fragment.glsl";
import atmosphereVertexShader from "./shaders/atmosphere/vertex.glsl";
import atmosphereFragmentShader from "./shaders/atmosphere/fragment.glsl";
import { GLTFLoader } from "three/examples/jsm/Addons.js";
import { FontLoader } from "three/examples/jsm/Addons.js";
import { TextGeometry } from "three/examples/jsm/Addons.js";

export default function init() {
  console.log('initialised')

  /**
   * Base
   */
  const canvas = document.getElementById('myCanvas');
  canvas.style.display = 'block';
  // Debug
  const gui = new GUI();
  gui.show( false ); 

  // Canvas


  // Scene
  const scene = new THREE.Scene();

  // Loaders
  const textureLoader = new THREE.TextureLoader();
  const gltfLoader = new GLTFLoader();
  const fontLoader = new FontLoader();

  const events = new EventTarget()

  // Axes helper

  // const axesHelper = new THREE.AxesHelper(20);
  // scene.add(axesHelper);

  /**
   * Earth
   */
  const earthParameters = {};
  earthParameters.atmosphereDayColor = "#00aaff";
  earthParameters.atmosphereTwilightColor = "#ff6600";

  gui.addColor(earthParameters, "atmosphereDayColor").onChange(() => {
    earthMaterial.uniforms.uAtmosphereDayColor.value.set(
      earthParameters.atmosphereDayColor
    );
    atmosphereMaterial.uniforms.uAtmosphereDayColor.value.set(
      earthParameters.atmosphereDayColor
    );
  });

  gui.addColor(earthParameters, "atmosphereTwilightColor").onChange(() => {
    earthMaterial.uniforms.uAtmosphereTwilightColor.value.set(
      earthParameters.atmosphereTwilightColor
    );
    atmosphereMaterial.uniforms.uAtmosphereTwilightColor.value.set(
      earthParameters.atmosphereTwilightColor
    );
  });

  // Textures
  const earthDayTexture = textureLoader.load("./earth/day.jpg");
  earthDayTexture.colorSpace = THREE.SRGBColorSpace;
  earthDayTexture.anisotropy = 8;

  const earthNightTexture = textureLoader.load("./earth/night.jpg");
  earthNightTexture.colorSpace = THREE.SRGBColorSpace;
  earthNightTexture.anisotropy = 8;

  const earthSpecularCloudsTexture = textureLoader.load(
    "./earth/specularClouds.jpg"
  );
  earthSpecularCloudsTexture.anisotropy = 8;

  // Mesh
  const earthGeometry = new THREE.SphereGeometry(2, 64, 64);
  const earthMaterial = new THREE.ShaderMaterial({
    vertexShader: earthVertexShader,
    fragmentShader: earthFragmentShader,
    uniforms: {
      uDayTexture: new THREE.Uniform(earthDayTexture),
      uNightTexture: new THREE.Uniform(earthNightTexture),
      uSpecularCloudsTexture: new THREE.Uniform(earthSpecularCloudsTexture),
      uSunDirection: new THREE.Uniform(new THREE.Vector3(0, 0, 1)),
      uAtmosphereDayColor: new THREE.Uniform(
        new THREE.Color(earthParameters.atmosphereDayColor)
      ),
      uAtmosphereTwilightColor: new THREE.Uniform(
        new THREE.Color(earthParameters.atmosphereTwilightColor)
      ),
    },
  });
  const earth = new THREE.Mesh(earthGeometry, earthMaterial);
  scene.add(earth);

  // Atmosphere
  const atmosphereMaterial = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    transparent: true,
    vertexShader: atmosphereVertexShader,
    fragmentShader: atmosphereFragmentShader,
    uniforms: {
      uSunDirection: new THREE.Uniform(new THREE.Vector3(0, 0, 1)),
      uAtmosphereDayColor: new THREE.Uniform(
        new THREE.Color(earthParameters.atmosphereDayColor)
      ),
      uAtmosphereTwilightColor: new THREE.Uniform(
        new THREE.Color(earthParameters.atmosphereTwilightColor)
      ),
    },
  });

  const atmosphere = new THREE.Mesh(earthGeometry, atmosphereMaterial);
  atmosphere.scale.set(1.04, 1.04, 1.04);
  scene.add(atmosphere);

  /**
   * Sun
   */
  // Coordinates
  const sunSpherical = new THREE.Spherical(1, Math.PI * 0.5, 0.5);
  const sunDirection = new THREE.Vector3();


  // Font
  const user = window.user
  let text
  let name
  fontLoader.load(
    '/fonts/Catrinity_Regular.json',
    (font) => {
      const fontOptions =         {
        font: font,
        size: 0.5,
        depth: 0.2,
        curveSegments: 5,
        bevelEnabled: true,
        bevelThickness: 0.03,
        bevelSize: 0.02,
        bevelOffset: 0,
        bevelSegments: 3
    
      }
      const textGeometry = new TextGeometry(
        'Recycle!',
        fontOptions
      )
      const userGeometry = new TextGeometry(
        user,
        fontOptions
      )
      const textMaterial = new THREE.MeshNormalMaterial()
      const nameMaterial = new THREE.MeshToonMaterial({color : "purple"})
      const textMesh = new THREE.Mesh(textGeometry, textMaterial)
      const nameMesh = new THREE.Mesh(userGeometry, nameMaterial)
      textMesh.position.set(4,2.5,2)
      nameMesh.position.set(2,2.5,2)
      textMesh.rotation.y = Math.PI * 0.4
      nameMesh.rotation.y = Math.PI * 0.4
      text = textMesh
      name = nameMesh
      
      
      events.dispatchEvent(new Event('textLoaded'));
    }
  )
  events.addEventListener('textLoaded', () => {
    console.log('Text loaded and ready');
  });


  // // Hand
  let hand;
  let hand2
  gltfLoader.load("./gltf/hand/hand.glb", function (glb) {
    hand = glb.scene;
    

    // Add a material to all meshes in the hand model
    hand.traverse((child) => {
      const skin = new THREE.MeshToonMaterial()

      skin.color = new THREE.Color(0xffd6d5) 
      
      if (child.isMesh) {
        child.material.dispose();
        child.material = skin
      }
    });
    hand2 = hand.clone()
    
    // Initial scale and position
    hand.scale.set(0.1, 0.1, 0.1);
    hand.position.set(3, 0, 0);
    hand2.scale.set(0.1, 0.1, 0.1);
    hand2.position.set(3, 0, 3);

    events.dispatchEvent(new Event('handLoaded'));

    // GUI controls for hand
    // const handFolder = gui.addFolder("Hand Controls");

    // // Scale control
    // handFolder
    //   .add(hand.scale, "x", 0.01, 1)
    //   .name("Scale")
    //   .onChange((value) => {
    //     hand.scale.set(value, value, value);
    //   });

    // // Rotation control
    // handFolder.add(hand.rotation, "y", -Math.PI, Math.PI).name("Rotate Y");
  });
  // Light for hand

  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.9)
  directionalLight.position.x = 2
  directionalLight.position.y = 3
  directionalLight.position.z = 4
  directionalLight.lookAt(3, 0, 0)
  scene.add(directionalLight)

  // Debug


  const debugSun = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.1, 2),
    new THREE.MeshBasicMaterial()
  );
  scene.add(debugSun);

  // Update
  const updateSun = () => {
    // Sun direction
    sunDirection.setFromSpherical(sunSpherical);

    // Debug
    debugSun.position.copy(sunDirection).multiplyScalar(5);

    // Uniforms
    earthMaterial.uniforms.uSunDirection.value.copy(sunDirection);
    atmosphereMaterial.uniforms.uSunDirection.value.copy(sunDirection);
  };

 

  // Tweaks
  gui.add(sunSpherical, "phi").min(0).max(Math.PI).onChange(updateSun);

  gui.add(sunSpherical, "theta").min(-Math.PI).max(Math.PI).onChange(updateSun);

  // Particles

  const particleGeometry = new THREE.BufferGeometry()
  const count = 500

  const positions = new Float32Array(count*3)

  for(let i = 0; i < count*3; i++){
    positions[i] = (Math.random() - 0.5) * 10
  }

  particleGeometry.setAttribute(
    'position',
    new THREE.BufferAttribute(positions, 3)
  )

  // const particleTexture = textureLoader.load('/textures/particles/10.png')
  // const particleMaterial = new THREE.PointsMaterial({
  //   size: 0.8,
  //   sizeAttenuation: true,
  //   color: "pink",
  //   transparent: true,
  //   alphaMap: particleTexture,
  //   alphaTest: 0.001,

  // })

  const material = new THREE.RawShaderMaterial({
    vertexShader: `

    `,
    fragmentShader: `

    `
  })

  const particles = new THREE.Points(particleGeometry, material)
  scene.add(particles)


  /**
   * Sizes
   */
  const sizes = {
    width: window.innerWidth,
    height: window.innerHeight,
    pixelRatio: Math.min(window.devicePixelRatio, 2),
  };

  window.addEventListener("resize", () => {
    // Update sizes
    sizes.width = window.innerWidth;
    sizes.height = window.innerHeight;
    sizes.pixelRatio = Math.min(window.devicePixelRatio, 2);

    // Update camera
    camera.aspect = sizes.width / sizes.height;
    camera.updateProjectionMatrix();

    // Update renderer
    renderer.setSize(sizes.width, sizes.height);
    renderer.setPixelRatio(sizes.pixelRatio);
  });

  /**
   * Camera
   */
  // Base camera
  const camera = new THREE.PerspectiveCamera(
    25,
    sizes.width / sizes.height,
    0.1,
    100
  );
  camera.position.x = 12;
  camera.position.y = 5;
  camera.position.z = 4;

  scene.add(camera);


  // Controls
  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;

  // Mouse

  // const mouse = new THREE.Vector2();
  // const raycaster = new THREE.Raycaster();

  // // Longitude & Latitude 

  // window.addEventListener("mousemove", (event) => {
  //   mouse.x = (event.clientX / sizes.width) * 2 - 1;
  //   mouse.y = -(event.clientY / sizes.height) * 2 + 1;
  // });



  // const clickFolder = gui.addFolder("Click Information");
  // const clickInfo = {
  //   longitude: "Click on Earth",
  //   latitude: "Click on Earth",
  // };
  // clickFolder.add(clickInfo, "longitude").name("Longitude").listen();
  // clickFolder.add(clickInfo, "latitude").name("Latitude").listen();


  // window.addEventListener("click", () => {
  //   raycaster.setFromCamera(mouse, camera);
  //   const intersects = raycaster.intersectObject(earth);

  //   if (intersects.length > 0) {
  //     const uv = intersects[0].uv;

  //     // Convert UV to longitude and latitude
  //     const longitude = (uv.x - 0.5) * 360;
  //     const latitude = (0.5 - uv.y) * 180;

  //     // Update GUI with longitude and latitude
  //     clickInfo.longitude = longitude.toFixed(2) + "°";
  //     clickInfo.latitude = latitude.toFixed(2) + "°";

  //     console.log(
  //       `Longitude: ${longitude.toFixed(2)}°, Latitude: ${latitude.toFixed(2)}°`
  //     );
  //   } else {
  //     clickInfo.longitude = "No intersection";
  //     clickInfo.latitude = "No intersection";
  //   }
  // });

  /**
   * Renderer
   */
  const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true,
  });
  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(sizes.pixelRatio);
  renderer.setClearColor("#000011");



  /**
   * Animate
   */
  const clock = new THREE.Clock();
  const audio = document.getElementById('ambience')
  let elapsedTime



  const tick = () => {
    
    elapsedTime = audio.currentTime;
    
    earth.rotation.y = elapsedTime * 0.1;

    if(elapsedTime > 9){
    updateSunWithAudio(elapsedTime);}
    if (text && elapsedTime > 14.2 && elapsedTime < 56) {
      scene.add(name)
      rotateXYZ(name, 'xy')
      text.rotation.y = - elapsedTime * 0.8;
    }
    if(elapsedTime > 56){
      rotateXYZ(text, 'y')
      rotateAroundOrigin(name)
      scene.add(text)
      scene.add(hand2)
      animateParticles()
      rotateAroundOrigin(hand2)
    }
    if (hand && elapsedTime > 24.7) {
      scene.add(hand)
      // scene.add(particles)
      particles.rotation.y = elapsedTime * 0.2
      
      hand.rotation.y = elapsedTime * 1.2
      hand.rotation.y = - elapsedTime * 1.2

      if(hand.scale.x < 10 && elapsedTime > 10.0){
        hand.scale.x = elapsedTime * 0.01
        hand.scale.y = elapsedTime * 0.01
        hand.scale.z = elapsedTime * 0.01
        hand.rotation.x = elapsedTime * 4;
        hand.rotation.y = 0.5 + Math.abs(Math.sin(elapsedTime * 3)) * 2;
        hand.rotation.z = Math.cos(elapsedTime) * 4
   
      }
      if(elapsedTime > 97.8){
        rotateXYZ(text, 'x')
      }
      
      else if(elapsedTime > 120.0){
        hand.scale.x = elapsedTime *-0.5
        hand.scale.y = elapsedTime * -0.5
        hand.scale.z = elapsedTime * -0.5
    
      }
    }
    
    // Update controls
    controls.update();

    // Render
    renderer.render(scene, camera);

    // Call tick again on the next frame
    window.requestAnimationFrame(tick);
  };

  tick();

  function animateParticles(){
    for(let i=0; i< count; i++){
      const i3 = i*3
      const x = particleGeometry.attributes.position.array[i3]
      particleGeometry.attributes.position.array[i3 +1] = Math.sin(elapsedTime + x)
    }
    particleGeometry.attributes.position.needsUpdate = true
  }

  function rotateXYZ(object, axis){
    const values = axis.split("")


    const quaternionX = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1,0,0), 0.1) 
    const quaternionY = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0), 0.1)
    const quaternionZ = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,0,1), 0.1)
    const lookUp = {
      x: quaternionX,
      y: quaternionY,
      z: quaternionZ
    }
    for(let i=0; i< values.length;i++){
      object.applyQuaternion(lookUp[values[i]])
    }

  }
  function rotateAroundOrigin(satellite) {
    const quaternion0 = new THREE.Quaternion()
    .setFromAxisAngle(new THREE.Vector3(1,0,0), 0.01)
    satellite.position.applyQuaternion(quaternion0)
  }
 
  function updateSunWithAudio(elapsedTime) {
    

    const theta = ((elapsedTime % 8) / 8) * 2 * Math.PI - Math.PI;
  
    
    sunSpherical.theta = theta;
  
    
    updateSun();
  }



}
  
