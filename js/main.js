function init() {
	var scene = new THREE.Scene();
	var gui = new dat.GUI();
	var gridSize = 14;
	//grid is a global variable
	grid = geoGrid(gridSize);
	
	var min = 2;
	var max = gridSize-2;
	var randomValues = parseInt(getRandomInt(1, (Math.pow(gridSize,3)))/4);
	var pointLight = getPtLight(1);
	var pointLight2 = getPtLight(1);

	var guiFunctions = {
		MinimumSpread: 2,
		MaximumSpread: Math.cbrt(grid.children.length)-2,
		Size: gridSize,
		Random: randomValues,
		Iterate: function(){
			testPt(grid);
			},
		ClearCanvas: function(){
			scene.remove(grid);
			},
		Populate: function(){
			var size = guiFunctions.Size;
			grid = geoGrid(size); 
			scene.add(grid);
			var randomValues = guiFunctions.Random;
			randStartCoord(this.MinimumSpread, this.MaximumSpread, randomValues, grid);
			colorGeo(grid);
			}
		};

	pointLight.position.y = 60;
	pointLight.position.x = 60;
	pointLight.position.z = 60;
	pointLight2.position.y = -60;
	pointLight2.position.x = -60;
	pointLight2.position.z = -60;

	var camera = new THREE.PerspectiveCamera(50, window.innerWidth/window.innerHeight, 1, 1000);
	camera.position.z = 25;
	camera.position.x = 25;
	camera.position.y = 25;
	camera.lookAt(new THREE.Vector3(0,0,0));

	var renderer = new THREE.WebGLRenderer();
	renderer.setSize(window.innerWidth, window.innerHeight);
	document.getElementById('webgl').appendChild(renderer.domElement);

	var controls = new THREE.OrbitControls(camera, renderer.domElement);

	scene.add(grid);
	scene.add(pointLight);
	scene.add(pointLight2);

	randStartCoord(min, max, randomValues, grid);
	colorGeo(grid);

	update(renderer, scene, camera, controls);

	gui.add(guiFunctions, 'Iterate');
	gui.add(guiFunctions, 'ClearCanvas');
	gui.add(guiFunctions, 'Populate');
	gui.add(guiFunctions, 'Random', 1, grid.children.length).step(1);
	gui.add(guiFunctions, 'MinimumSpread', 0, Math.cbrt(grid.children.length)).step(1);
	gui.add(guiFunctions, 'MaximumSpread', 0, Math.cbrt(grid.children.length)).step(1);
	gui.add(guiFunctions, 'Size', 3, 16).step(1);

	return scene;
	};

function getRandomInt(min, max){
	min = Math.ceil(min);
	max = Math.floor(max);
	return Math.floor(Math.random() * (max - min)) + min;
	}

function geoGrid(gridSize){
	var group = new THREE.Group();
	group.name = '3D_GeoGrid';
	for (var i = 0; i < gridSize; i++){
		for (var m = 0; m < gridSize; m++){
			for (var n = 0; n < gridSize; n++){
				var obj = getBox(1,1,1);
				obj.position.x = i;
				obj.position.y = m;
				obj.position.z = n;
				obj.material.opacity = 0.0;
				obj.name = 'Object_' + i.toString() + '_' + m.toString() + '_' + n.toString();
				group.add(obj);
				}
			}
		}
	return group;
	}

//search group for child object by child object's position
function findBox(grid, position){
	var xTest, yTest, zTest;
	for (var i = 0; i < grid.children.length; i++){
		xTest = grid.children[i].position.x;
		yTest = grid.children[i].position.y;
		zTest = grid.children[i].position.z;
		if (xTest == position.x && yTest == position.y && zTest == position.z){
			return grid.children[i];
			}
		}
	return undefined;
	}

function randStartCoord(min, max, randomValues, grid){
	var rX = 0;
	var rY = 0;
	var rZ = 0;
	var onList = [];
	var vec;
	for (var b = 0; b < randomValues; b++){
		rX = getRandomInt(min, max);
		rY = getRandomInt(min, max);
		rZ = getRandomInt(min, max);
		vec = new THREE.Vector3(rX, rY, rZ);
		var obj = findBox(grid,vec);
		if (obj != undefined){
			obj.material.opacity = 1.0;
			onList.push(obj);
			}
		}
	}

//count number of visible neighbors, input a single geo object to evaluate at a time
function neighborSum(grid, geo){
	var neighborSum = 0;
	var x, y, z;
	var vec;
	if (geo.material.opacity == 1.0){
		neighborSum -= 1;
	}
	//Check x and y coordinates of +1 and -1
	for (var n = -1; n < 2; n++){
		x = geo.position.x + n;
		for (var m = -1; m < 2; m++){
			y = geo.position.y + m;
			for (var b = -1; b < 2; b++){
				z = geo.position.z + b;
				vec = new THREE.Vector3(x,y,z);
				var checkCur = findBox(grid, vec);
				if (checkCur != undefined && checkCur.material.opacity == 1.0){
					neighborSum += 1;
					}
				}
			}
		}
	return neighborSum;
	}

function testPt(grid){
	var currentOff = [];
	var currentOn = [];
	//define next life of each cell
	for (var i = 0; i < grid.children.length; i++){
		var current = grid.children[i];
		var nS = neighborSum(grid, current);
		if (current.material.opacity == 1.0){
			var on = true;
		}else{
			var on = false;
		}

		if (on && nS < 5){
			currentOff.push(current);
		}else if (on && 5 <= nS <=7){
			currentOn.push(current);
		}else if (on && nS > 7){
			currentoff.push(current);
		}else if (on == false && nS == 6){
			currentOn.push(current);
		}else {
			currentOff.push(current);
		}
		}
	//run visibility update
	for (var m = 0; m < currentOff.length; m++){
		if (currentOff[m].material.opacity > 0.0){
			currentOff[m].material.opacity -= 0.25;
			}
		}
	for (var n = 0; n < currentOn.length; n++){
		currentOn[n].material.opacity = 1.0;
		}
	}

function colorGeo(grid){
	var obj = grid;
	var mult = parseInt(255/(Math.cbrt(obj.children.length)))-2;
	for (var i = 0; i < obj.children.length; i++){
		var r = Math.abs(obj.children[i].position.x * mult);
		var g = Math.abs(obj.children[i].position.y * mult);
		var b = Math.abs(obj.children[i].position.z * mult);
		var newColor =  new THREE.Color('rgb(' + r.toString() + ',' + g.toString() + ',' + b.toString() + ')');
		obj.children[i].material.color = newColor;
		}
	}
	
//recieves mesh object, adds line outlines
function addLines(scene){
	for (var i = 0; i < scene.children[0].children.length; i++){
		var geometry = scene.children[0].children[i].geometry;
		var edges = new THREE.EdgesGeometry(geometry);
		var color = new THREE.Color({color:'rgb(200,200,200)'});
		var line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({color: color}));
		scene.add(line);
		}
	}

function getPtLight(intensity){
	var light = new THREE.PointLight(0xffffff, intensity);
	return light;
	}

function getBox(w,h,d){
	var geometry = new THREE.BoxGeometry(w,h,d);
	var material = new THREE.MeshPhongMaterial({color: 'rgb(180,180,200)', wireframe: false});
	material.flatShading = true;
	material.shininess = 80;
	material.opacity = 1;
	material.transparent = true;
	var mesh = new THREE.Mesh(geometry, material);
	return mesh;
	};

function getSphere(r,w,h){
	var geometry = new THREE.SphereGeometry(r,w,h);
	var material = new THREE.MeshPhongMaterial({color: 'rgb(180,180,200)', wireframe: false});
	material.shininess = 80;
	material.opacity = 1;
	material.transparent = true;
	var mesh = new THREE.Mesh(geometry, material);
	return mesh;
	};

function update(renderer, scene, camera, controls){
	renderer.render(scene, camera);
	controls.update();
	requestAnimationFrame(function(){
		update(renderer, scene, camera, controls);
		})
	};

var scene = init();