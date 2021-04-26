<template>
  <div class="box" style="position: relative">
    <div id="starry-frame"></div>
	<canvas id="canvas"></canvas>
  </div>
</template>

<script>
import { getPosition, transformData, roundRect, makeTextSprite} from './service'
import { MAPDATA, LOCATIONURL} from './const.js'
export default {
  	data() {
    	return {
			// 渲染器
			renderer : null,
			// 相机
			camera : null,
			// 场景
			scene : null,
			// 中心球体（地球）
			centerBall : null,
			// 中心球体轨道组合体（行星）
			starLites : [],
			// 包裹画布dom
			dom : null,
			// orbitcontrols对象参数
			orbitcontrols : null,
			// 地图组合体
			group: null,
			// 计数
			count: 0,
			num: 15,
    	};
  	},
  	methods: {
		/**
		* 返回行星轨道的组合体
		* @param starLiteSize 行星的大小
		* @param starLiteRadius 行星的旋转半径
		* @param rotation 行星组合体的x,y,z三个方向的旋转角度
		* @param speed 行星运动速度
		* @param imgUrl 行星的贴图
		* @returns {{satellite: THREE.Mesh, speed: *}} 卫星组合对象;速度
		*/
		initSatellite(starLiteSize, starLiteRadius, rotation, speed, imgUrl){
			// 卫星的轨道
			// side: 定义将要渲染哪一面 - 正面，背面或两者。 默认为THREE.FrontSide。其他选项有THREE.BackSide和THREE.DoubleSide。
			let track = new THREE.Mesh(new THREE.RingGeometry(starLiteRadius, starLiteRadius + 0.05, 100, 50), new THREE.MeshBasicMaterial({ color: 0xffff00, side: THREE.DoubleSide }));
			// 新建球体作为卫星
			let centerMesh = new THREE.Mesh(new THREE.SphereGeometry(1, 1, 1), new THREE.MeshLambertMaterial()); 
			// 材质设定
			let starLite = new THREE.Sprite(new THREE.SpriteMaterial({
				map: THREE.ImageUtils.loadTexture(imgUrl)
			}));
			// 进行缩放
			starLite.scale.x = starLite.scale.y = starLite.scale.z = starLiteSize;
			// 根据半径对卫星位置进行放置
			starLite.position.set(starLiteRadius, 0, 0);
			let pivotPoint = new THREE.Object3D();
			pivotPoint.add(starLite);
			pivotPoint.add(track);
			centerMesh.add(pivotPoint);
			centerMesh.rotation.set(rotation.x, rotation.y, rotation.z);
			this.group.add(centerMesh);
			return {starLite: centerMesh, speed: speed};
		},
		/**
		* 执行函数  用于球体,地图以及行星的旋转
		*/
		render(){
			this.renderer.render(this.scene, this.camera);
			// 地球的旋转以及放大 详细算法之后再说
			if(this.count < 260){
				this.count ++;  //  260
				this.group.rotation.y += 0.02;  // group整体组合旋转
			}
			if(this.count === 260){
				if(this.num > 0){
					this.num --;
					this.group.rotation.y -= 0.05;
					this.group.position.y -= 0.87;
					this.camera.fov -= 0.36;
					this.camera.updateProjectionMatrix();
				}
				this.renderer.render(this.scene, this.camera);
			}
			for (let i = 0; i < this.starLites.length; i++) {
					this.starLites[i].starLite.rotation.z -= this.starLites[i].speed;
			}
			this.orbitcontrols.update();
			requestAnimationFrame(this.render);
		},
		/**
		 * 绘制轨迹
		 * @param {*} data 坐标数据
		 * @returns 中国地图
		 */
		drawTrack() {
			let provinceData = transformData(MAPDATA);
			// 轨迹线质
			let trackMaterial = new THREE.LineBasicMaterial({color : '#0B1531'});
			// 绘制轨迹
			provinceData.forEach(data => {
				let dLength = data.length;
				let trackCoordArr = [];
				for(let i=0; i<dLength; i++) {
					if(data[i].lng && data[i].lat) {
						trackCoordArr.push({lng: data[i].lng, lat: data[i].lat});
					}
				}
				let tcaLength = trackCoordArr.length;
				let tcaHalfLength = Math.ceil(tcaLength/2);
				let	tcaRemainLength = tcaLength-tcaHalfLength;
				let vertexArr = [];
				// 所有点
				for(let j=0; j<tcaHalfLength; j++) {
					let p1 = getPosition(trackCoordArr[j].lng, trackCoordArr[j].lat, 0);
					vertexArr.push(new THREE.Vector3(p1.x, p1.y, p1.z));    
				}
				for(let k=tcaRemainLength; k>0; k--) {
					let p2 = getPosition(trackCoordArr[tcaLength-k].lng, trackCoordArr[tcaLength-k].lat, 0);
					vertexArr.push(new THREE.Vector3(p2.x, p2.y, p2.z));    
				}
				let trackCurve = new THREE.CatmullRomCurve3(vertexArr);
				let trackGeometry = new THREE.Geometry();
				let	verticesArr = trackCurve.getPoints(tcaLength);
				trackGeometry.vertices = verticesArr;
				let trackLine = new THREE.Line(trackGeometry, trackMaterial);
				this.group.add(trackLine);
			})
		},
		/**
		 * 添加定位图标
		 * @param {*} data 坐标数据
		 * @param {*} url 图片地址
		 */
		addLocation(data, url) {
			// 定位
			data.forEach(item => {
				// 定位图标材质
				let locationIcon = new THREE.Sprite(new THREE.SpriteMaterial({
					map: THREE.ImageUtils.loadTexture(url)
				}));
				// 定位
				let position = getPosition(item[0], item[1], 0.1);
				locationIcon.position.set(position.x, position.y, position.z);
				this.group.add(locationIcon);
			})
		},
		/**
		 * 添加标签
		 * @param {*} data 标签文字信息和坐标数据
		 */
		addLabel(data) {
			data.forEach(item => {
				let spriteLabel = makeTextSprite(item[0], item[1]);
				spriteLabel.center = new THREE.Vector2(0, 0);
				// 定位
				let position = getPosition(item[2]+0.8, item[3]-3, 0.1);
				spriteLabel.position.set(position.x, position.y, position.z);
				this.group.add(spriteLabel);
			})
		},
		/**
		 * 绘制弧线
		 * @param {*} data 省会坐标点
		 */
		drawArc(data) {
			let pointData = [];
			data.forEach(item => {
				let position = getPosition(item.lng, item.lat, 0);
				let p = [position.x, position.y, position.z];
				pointData.push(p);
			})
			// 设置控制点
			let intermediatePoint = [(pointData[0][0]+pointData[1][0])/2-3, (pointData[0][1]+pointData[1][1])/2+4, -30];
			pointData.splice(1, 0, intermediatePoint);
			
			let geometry = new THREE.Geometry(); //声明一个几何体对象Geometry
			// 三维二次贝赛尔曲线
			let curve = new THREE.QuadraticBezierCurve3(
				new THREE.Vector3(pointData[0][0], pointData[0][1], pointData[0][2]),
				new THREE.Vector3(pointData[1][0], pointData[1][1], pointData[1][2]),
				new THREE.Vector3(pointData[2][0], pointData[2][1], pointData[2][2]),
			);
			// getPoints是基类Curve的方法，返回一个vector3对象作为元素组成的数组
			let length = 50;
			let points = curve.getPoints(length); //分段数50，返回51个顶点
			// setFromPoints方法从points中提取数据改变几何体的顶点属性vertices
			geometry.setFromPoints(points);
			// 材质对象
			// let material = new THREE.LineBasicMaterial({color: '#FFFFFF'});
			// 线条模型对象
			// let line = new THREE.Line(geometry, material);
			// this.group.add(line); //线条对象添加到场景中
			// 创建线动画
			this.addLineAnimation(length, points);
		},
		/**
		 * 设置线动画
		 * @param {*} coordsNum 长度
		 * @param {*} verArr 点对象
		 */
		addLineAnimation(coordsNum ,verArr) {
			// 随机颜色
			let colors = [
				'#F7B500', '#CD9286', '#16CE82', '#FF7400', '#FFFF00', '#CD0074', '#00CC00'
        	];
			let color = colors[Math.floor(Math.random()*colors.length)];
			
			// 设置带状网格
			let meshGeometry = new THREE.Geometry();
			let meshData = new THREE.CatmullRomCurve3(verArr);
			meshGeometry.setFromPoints(meshData.getPoints(100));
			let meshLineGeometry = new MeshLine();
			meshLineGeometry.setGeometry(meshGeometry);
			let meshLineMaterial = new MeshLineMaterial({transparent: true, color: color, linewidth: 4, dashArray: 2, dashOffset: 0, dashRatio: 0.5});
			let meshLine = new THREE.Mesh(meshLineGeometry.geometry, meshLineMaterial);
			meshLine.renderOrder = -1;
			meshLine.material.depthTest=false;
			this.group.add(meshLine);

			function update() {
				// Check if the dash is out to stop animate it.
				if (meshLine.material.uniforms.dashOffset.value < -1){
					setTimeout(() => {
						meshLine.material.uniforms.dashOffset.value = 0;
					}, 2000)
				}else{
					meshLine.material.uniforms.dashOffset.value -= 0.01;
				}
				// Decrement the dashOffset value to animate the path with the dash.
				requestAnimationFrame(update);
			}
			setTimeout(() => {
				update();
			}, 3550)
			
			
			//设置线
			// let curveGeometry = new THREE.Geometry(); 
			// let curveData = new THREE.CatmullRomCurve3(verArr.slice(0, 10));  
			// curveGeometry.vertices = curveData.getPoints(10);
			// let curveMaterial = new THREE.LineBasicMaterial({color: color});
			// let curveLine = new THREE.Line(curveGeometry, curveMaterial);
			// console.log(curveLine);
			// this.group.add(curveLine);
			
			// 设置线动画
			// let index = 0;
			// function lineAnimate() {
			// 	index ++;
			// 	if(index > coordsNum-2) {
			// 		index = 0;
			// 	}
			// 	let offsetData = verArr.slice(0, 10+index);
			// 	if(offsetData.length > 0) {
			// 		curveData = new THREE.CatmullRomCurve3(offsetData);  
			// 		curveLine.geometry.vertices = curveData.getPoints(10);
			// 		curveLine.geometry.verticesNeedUpdate = true;
			// 	}
			// 	// console.log(requestAnimationFrame)
			// 	setTimeout(()=>{
			// 		requestAnimationFrame(lineAnimate);
			// 	}, 25)
			// }
			// lineAnimate();
		},
    	//初始化场景
		init() { // 初始化地图
			// 初始化组合
			this.group = new THREE.Group;
			// 初始化场景
			this.scene = new THREE.Scene();
			this.dom = document.getElementById("starry-frame");
			// 初始化相机
			this.camera = new THREE.PerspectiveCamera(8, this.dom.clientWidth / this.dom.clientHeight, 1, 12000);
			// 设置相机位置
			this.camera.position.set(-50, 30, 500);
			this.renderer = new THREE.WebGLRenderer({
				alpha: true,
				antialias: true
			});
			// 设置窗口尺寸
			this.renderer.setSize(this.dom.clientWidth, this.dom.clientHeight);
			// 初始化控制器
			this.orbitcontrols = new THREE.OrbitControls(this.camera,this.renderer.domElement);
			//禁止旋转
			// this.orbitcontrols.enableRotate = false;  
			this.dom.appendChild(this.renderer.domElement);
			// 定义地球材质
			let earthTexture = THREE.ImageUtils.loadTexture('../../static/earth.jpg', {},()=> {
				this.renderer.render(this.group, this.camera);
			});
			// 地球以及地球材质设定
			this.centerBall = new THREE.Mesh(new THREE.SphereGeometry(30, 30, 30), new THREE.MeshBasicMaterial({
				map: earthTexture
			}));
			this.group.rotation.y = -1.7
			this.group.add(this.centerBall);
			// 添加卫星
			this.starLites.push(this.initSatellite(2, 45, {x: -Math.PI * 0.5, y: Math.PI , z: 0}, 0.005, '../../static/moon.png'));
			// 添加卫星
			this.starLites.push(this.initSatellite(3, 38, {x: -Math.PI * 0.5, y: Math.PI, z: 0}, 0.008, '../../static/earth_bg.png'));
			
			this.scene.add(this.group);
			// 加载
			this.render();
			// 绘制轨迹
			this.drawTrack();
			// 定位坐标
			let locationData = [
				[104.065735, 30.659462], 
				[118.767413, 32.041544], 
				[120.153576, 30.287459], 
				[113.280637, 23.125178], 
				[106.713478, 26.578343], 
				[116.405285, 39.904989],
				[111.670801, 40.818311],
				[114.298572, 30.584355]
			];
			// 添加定位
			this.addLocation(locationData, LOCATIONURL);
			// 标签文字信息和坐标数据
			let labelData = [
				['四川项目总个数', '3', 104.065735, 30.659462], 
				['浙江项目总个数', '4', 120.153576, 30.287459], 
				['江苏项目总个数', '6', 118.767413, 32.041544],
				['广东项目总个数', '5', 113.280637, 23.125178],
				['贵州项目总个数', '3', 106.713478, 26.578343],
				['北京项目总个数', '4', 116.405285, 39.904989],
				['内蒙古项目总个数', '2', 111.670801, 40.818311],
				['湖北项目总个数', '4', 114.298572, 30.584355],
			];
			this.addLabel(labelData);
			// 连接省会坐标并绘制线动画
			let provincedata1 = [{'省': '江苏', lng: 118.767413, lat: 32.041544}, {'省': '四川', lng: 104.065735, lat: 30.659462}];
			let provincedata2 = [{'省': '江苏', lng: 118.767413, lat: 32.041544}, {'省': '浙江', lng: 120.153576, lat: 30.287459}];
			let provincedata3 = [{'省': '江苏', lng: 118.767413, lat: 32.041544}, {'省': '广东', lng: 113.280637, lat: 23.125178}];
			let provincedata4 = [{'省': '江苏', lng: 118.767413, lat: 32.041544}, {'省': '贵州', lng: 106.713478, lat: 26.578343}];
			let provincedata5 = [{'省': '江苏', lng: 118.767413, lat: 32.041544}, {'市': '北京', lng: 116.405285, lat: 39.904989}];
			let provincedata6 = [{'省': '江苏', lng: 118.767413, lat: 32.041544}, {'省': '湖北', lng: 114.298572, lat: 30.584355}];
			let provincedata7 = [{'省': '江苏', lng: 118.767413, lat: 32.041544}, {'自治区': '内蒙古', lng: 111.670801, lat: 40.818311}];
			// 设置每条线延时出发
			setTimeout(() => {
				this.drawArc(provincedata1);
			}, 2000);
			setTimeout(() => {
				this.drawArc(provincedata2);
			}, 2000);
			setTimeout(() => {
				this.drawArc(provincedata3);
			}, 2000);
			setTimeout(() => {
				this.drawArc(provincedata4);
			}, 2000);
			setTimeout(() => {
				this.drawArc(provincedata5);
			}, 2000);
			setTimeout(() => {
				this.drawArc(provincedata6);
			}, 2000);
			setTimeout(() => {
				this.drawArc(provincedata7);
			}, 2000);
		}
  	},
  	mounted() {
		this.$nextTick(()=>{
			this.init()
		});
  	},
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.box {
    width: 100vw;
    height: 100vh;
    background: #000 url(../assets/image/background.png) no-repeat center center;
    overflow: hidden;
}
#starry-frame{
	width: 100vw;
	height: 100vh;
}
</style>
