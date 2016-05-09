_isModelLoaded = false;
window.requestAnimFrame = (function(){
  return  window.requestAnimationFrame       ||
          window.webkitRequestAnimationFrame ||
          window.mozRequestAnimationFrame    ||
          function( callback ){
            window.setTimeout(callback, 1000 / 60);
          };
})();

function setCamera(){
    camera = new THREE.PerspectiveCamera( 40, WIDTH/HEIGHT, 1, 2000 );
    scene.add(camera);
    moveCamera();
}

function setLights(){
    scene.add( new THREE.AmbientLight( 0x222222 ) );
    var directionalLight = new THREE.DirectionalLight( 0xffffff, 1);
    directionalLight.position.set( 1, 1, 1 ).normalize();
    scene.add( directionalLight );
    pointLight = new THREE.PointLight( 0xffffff, 2, 800 );
    scene.add( pointLight );
    moveLight();
}

$(document).ready(function(){
    _activeModel = getActiveModel();
    loadScene();
    loadModel();
});

function loadScene(){
    WIDTH = $("#viewer-container").width();
    HEIGHT = 0.80*($(window).height());
    $container = $('#viewer-container');
    renderer = new THREE.WebGLRenderer({antialiasing:true});
    scene = new THREE.Scene();
    renderer.setSize(WIDTH, HEIGHT);
    setCamera();
    setLights();
    renderer.setClearColor(0xDEDEDE);
    renderer.render(scene, camera);
    $("#viewer-container").append(renderer.domElement);
}

function loadModel(){
    $("#load-status").css("visibility","visible");
    _isModelLoaded = false;
    loader = new THREE.JSONLoader();
    loader.load( "/static/"+_activeModel, callback );
}

function getActiveModel(){
    modelsNodeList = document.querySelectorAll(".model-btn");
    for(var i=0 ; i<modelsNodeList.length ; i++){
        if($(modelsNodeList[i]).hasClass("active")){
            return ($(modelsNodeList[i]).text()+".js");
        }
    }
}

function getActiveModelBtn(){
    modelsNodeList = document.querySelectorAll(".model-btn");
    for(var i=0 ; i<modelsNodeList.length ; i++){
        if($(modelsNodeList[i]).hasClass("active")){
            return $(modelsNodeList[i]);
        }
    }
}

function clearScene(){
    for(var i=scene.children.length-1 ; i>=0 ; i--){
        scene.remove(scene.children[i]);
    }
    setLights();
    setCamera();
}

var callback = function ( geometry, materials ) {
    $("#load-status").css("visibility","hidden");
    clearScene();
    mesh = new THREE.Mesh(geometry,getMaterial());
    mesh.geometry.computeVertexNormals();
    setMeshColor();
    geometry.computeBoundingBox();
    scaleCenterMesh(mesh);
    var pivot = new THREE.Object3D();
    scene.add(mesh);
    moveCamera();
    moveLight();
    _isModelLoaded = true;
};

function getMaterial(){
    var imgTexture = new THREE.TextureLoader().load( "http://threejs.org/examples/textures/planets/moon_1024.jpg" );
    imgTexture.wrapS = imgTexture.wrapT = THREE.RepeatWrapping;
    imgTexture.anisotropy = 16;
    imgTexture = null;

    var path = "static/cubemap/";
    var format = '.jpg';
    var urls = [
    path + 'px' + format, path + 'nx' + format,
    path + 'py' + format, path + 'ny' + format,
    path + 'pz' + format, path + 'nz' + format
    ];
    var reflectionCube = new THREE.CubeTextureLoader().load( urls );
    reflectionCube.format = THREE.RGBFormat;

    var shininess = 50, specular = 0x333333, bumpScale = 1, shading = THREE.SmoothShading;

    metalness = 0.4;
    roughness = -1.0;

    var diffuseColor = new THREE.Color( 1.0, 0, 0 ).multiplyScalar( 1 - 0.08 );
    var material = new THREE.MeshStandardMaterial( { map: imgTexture, bumpMap: imgTexture, bumpScale: bumpScale, color: diffuseColor, metalness: metalness, roughness: roughness, shading: THREE.SmoothShading, envMap: reflectionCube } )
    //var material = new THREE.MeshStandardMaterial( { shading: THREE.SmoothShading, color: diffuseColor, metalness: metalness, bumpScale: bumpScale, bumpMap: imgTexture, envMap: reflectionCube } );
    return material;
}

function render(){
    renderer.render(scene, camera);
}

function setCameraRanges(maxVal){
    $("#camera-distance").attr("max",maxVal.toString());
    $("#camera-height").attr("max",maxVal.toString());

    $("#camera-distance").val(maxVal*0.50);
    $("#camera-height").val(maxVal*0.20);
}

function scaleCenterMesh(mesh){
    var bbox = mesh.geometry.boundingBox.clone();

    var yLength = bbox.max.y - bbox.min.y;
    var xLength = bbox.max.x - bbox.min.x;
    var zLength = bbox.max.z - bbox.min.z;

    var maxLength = Math.max(xLength,yLength,zLength);

    console.log(bbox.min.x + " " + bbox.max.x);
    console.log(bbox.min.y + " " + bbox.max.y);
    console.log(bbox.min.z + " " + bbox.max.z);

    mesh.position.y = -yLength/2;

    setCameraRanges(maxLength*3.5);
}

function moveCamera(){
    cameraDistance = $("#camera-distance").val();
    cameraHeight = $("#camera-height").val();
    cameraDegree = $("#camera-degree").val();

    console.log("moveCamera: "+cameraDistance+" "+cameraHeight+" "+cameraDegree);

    camera.position.y = cameraHeight;
    radians = ((2*Math.PI)/360)*cameraDegree;
    camera.position.x = cameraDistance*Math.cos(radians);
    camera.position.z = cameraDistance*Math.sin(radians);

    camera.lookAt(scene.position);
}

function moveLight(){
    pointLight.position.x = $("#pointLight-x").val();
    pointLight.position.y = $("#pointLight-y").val();
    pointLight.position.z = $("#pointLight-z").val();
}

var isMoveMeshDown = false;

document.onmouseup = function(){ isMoveMeshDown = false; }

function moveMeshStart(DIR){
    isMoveMeshDown = true;
    moveMesh(DIR);
}

function moveMesh(DIR){
    switch(DIR){
        case "UP": mesh.position.y+=0.01;
                   break;
        case "DOWN": mesh.position.y-=0.01;
                   break;
        case "LEFT": mesh.position.x-=0.01;
                   break;
        case "RIGHT": mesh.position.x+=0.01;
                   break;
        case "FRONT": mesh.position.z+=0.01;
                   break;
        case "BACK": mesh.position.z-=0.01;
                   break;
    }
    if(isMoveMeshDown) setTimeout(function(){ moveMesh(DIR)},10);
}

function setMeshColor(){
    mesh.material.color.setHex("0x"+$("#hex-color").val());
    return false;
}

function makeSampleMaterial(){
    	var diffuseColor = new THREE.Color( gamma, 0, 0 ).multiplyScalar( 1 - 0.08 );
}

function changeModel(e){
    var currentModelBtn = getActiveModelBtn();
    nextModelBtn = $(e);
    currentModelBtn.removeClass("active");
    nextModelBtn.addClass("active");
    _activeModel = getActiveModel();
    loadModel();
}

(function animloop(){
  requestAnimFrame(animloop);

  if(mesh!=null)
  {
    moveCamera();
    moveLight();
    render();
  }
})();








