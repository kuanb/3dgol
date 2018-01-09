function init() {
	var gridSize = 14;	

	// Grid is a global variable
	grid = geoGrid(gridSize);
	scene = new THREE.Scene();

	var camera = new THREE.PerspectiveCamera(50, window.innerWidth/window.innerHeight, 1, 1000);
	camera.position.z = 25;
	camera.position.x = 25;
	camera.position.y = 25;
	camera.lookAt(new THREE.Vector3(0,0,0));

	var renderer = new THREE.WebGLRenderer();
	renderer.setSize(window.innerWidth, window.innerHeight);
	document.getElementById('webgl').appendChild(renderer.domElement);

	var controls = new THREE.OrbitControls(camera, renderer.domElement);

	var randomValues = parseInt(getRandomInt(1, (Math.pow(gridSize,3)))/4);
	randStartCoord(2, gridSize - 2, randomValues, grid);

	// TODO: Understand what is being updated and why...
	update(renderer, scene, camera, controls);

	return scene;
};

function getRandomInt(min, max){
	min = Math.ceil(min);
	max = Math.floor(max);
	return Math.floor(Math.random() * (max - min)) + min;
}

function geoGrid(gridSize) {
	gridList = []
	for (var i = 0; i < gridSize; i++){
		for (var m = 0; m < gridSize; m++){
			for (var n = 0; n < gridSize; n++){
				var obj = makeFreshBox(1,1,1, i, m, n);
				obj.lifespan = 0;
				obj.active = true;
				gridList.push(obj);
				}
			}
		}
	return colorGeo(gridList);;
}

//search group for child object by child object's position
function findBox(grid, position){
	var xTest, yTest, zTest;

	for (var i = 0; i < grid.length; i++){
		xTest = grid[i].position.x;
		yTest = grid[i].position.y;
		zTest = grid[i].position.z;

		var check1 = xTest == position.x;
		var check2 = yTest == position.y;
		var check3 = zTest == position.z;
		if (check1 && check2 && check3) {
			return grid[i];
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
		var obj = findBox(grid, vec);
		if (obj != undefined){
			obj.visible = true;
			onList.push(obj);
			}
		}
	}

//count number of visible neighbors, input a single geo object to evaluate at a time
function neighborSum(grid, geo){
	var neighborSum = 0;
	var x, y, z;
	var vec;
	if (geo.visible){
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
				if (checkCur != undefined && checkCur.visible){
					neighborSum += 1;
				}
			}
		}
	}
	return neighborSum;
	}

function testPt(grid) {
	var currentOff = [];
	var currentOn = [];
	
	// Define next life of each cell
	for (var i = 0; i < grid.length; i++) {
		var current = grid[i];
		var nsum = neighborSum(grid, current);

		var on = current.active;
		var sweetSpotNbors = false;

		if (4 < nsum < 8) sweetSpotNbors = true;
		if (nsum == 6) on = true;

		var makeOn = false;
		if (on && sweetSpotNbors) {
			makeOn = true;
		}
		if (current.lifespan > 2) {
			makeOn = false;
		}

		if (makeOn) {
			currentOn.push(current);
		} else {
			currentOff.push(current);
		}
	}
	
	// Run visibility update
	for (var m = 0; m < currentOff.length; m++){
		if (currentOff[m].active) {
			currentOff[m].active = false;
			currentOff[m].lifespan = 0;

			console.log('Removing...')
			currentOff[m].parent.remove(currentOff[m]);
		}
	}

	for (var n = 0; n < currentOn.length; n++) {
		currentOn[n].active = true;
		currentOn[n].lifespan += 1;
	}

	// Actually add as group to scene
	var newGroup = new THREE.Group()
	for (var n = 0; n < currentOn.length; n++) {
		currentOn[n].active = true;
		currentOn[n].lifespan += 1;
		newGroup.add(currentOn[n])
	}
}

function colorGeo(grid) {
	var mult = parseInt(255/(Math.cbrt(grid.length)))-2;

	for (var i = 0; i < grid.length; i++){
		var r = Math.abs(grid[i].position.x * mult);
		var g = Math.abs(grid[i].position.y * mult);
		var b = Math.abs(grid[i].position.z * mult);
		var newColor =  new THREE.Color('rgb(' + r.toString() + ',' + g.toString() + ',' + b.toString() + ')');
		
		var box = grid[i];
		box.material.color = newColor;
		box.material.emissive = newColor;
	}

	return grid;
}

function makeFreshBox(i, m, n) {
	var geometry = new THREE.BoxGeometry(1,1,1);

	opts = {color: 'rgb(180,180,200)', wireframe: false}
	var material = new THREE.MeshPhongMaterial(opts);

	// Rendering options
	material.flatShading = true;
	material.opacity = 1;
	material.transparent = false;
			
	var mesh = new THREE.Mesh(geometry, material);
	mesh.position.x = i;
	mesh.position.y = m;
	mesh.position.z = n;

	mesh.visible = true;
	mesh.name = `o_${i}_${m}_${n}`;

	return mesh
}

function update(renderer, scene, camera, controls){
	renderer.render(scene, camera);
	controls.update();
	requestAnimationFrame(function() {
		update(renderer, scene, camera, controls);
	})
};