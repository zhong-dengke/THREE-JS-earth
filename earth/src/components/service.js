/**
* 获取position
* @param lng 经度
* @param lat 维度
* @param alt 半径
* @returns {x: x, y: y, z: z} 经纬度转换的坐标
*/
export function getPosition(lng, lat, alt) {
    let phi = (90 - lat) * (Math.PI / 180);
    let	theta = (lng + 180) * (Math.PI / 180);
    let	radius = alt + 30;
    let	x = -(radius * Math.sin(phi) * Math.cos(theta));
    let	z = (radius * Math.sin(phi) * Math.sin(theta));
    let	y = (radius * Math.cos(phi));
    return {x: x, y: y, z: z};
}
/**
 * 转换中国地图坐标数据
 * @param {*} data 中国地图坐标数据
 * @returns [] 省坐标数据
 */
export function transformData(data) {
    let provinceData = [];  // 存储省坐标数据
    // 取数据放进provinceData里
    for(let i=0;i<data.features.length;i++) {
        let pointList = data.features[i].geometry.coordinates;  // 绘制全省轮廓的点的数组
        for(let i=0;i<pointList.length;i++) {
            let lngLat = [];  // 存储省的经纬度坐标
            let provinceList = pointList[i];  // 绘制各省轮廓的点的数组
            for(let j=0;j<provinceList.length;j++) {
                let provincePoint = provinceList[j];
                provincePoint.forEach(item => {
                    let o = {'lng': item[0], 'lat': item[1]};
                    lngLat.push(o);
                })
            }
            provinceData.push(lngLat);
        }
    };
    return provinceData;
}
/**
 * 绘制矩形
 * @param {*} ctx canvas对象
 */
export function roundRect(ctx) {
    ctx.fillStyle = "#55F8F8";
    ctx.fillRect(0, 0, 4, 40);
    ctx.fillStyle = "rgba(14,38,56,0.8)";
    ctx.fillRect(4, 0, 175, 40);
    ctx.lineWidth = 1;
    ctx.strokeStyle = "#55F8F8";
    ctx.strokeRect(4, 0, 175, 39);
}
/**
 * 创建字体精灵
 * @param {*} message 文字信息
 * @param {*} parameters 文字样式
 * @returns sprite 字体精灵
 */
export function makeTextSprite(message, mes) {
    /* 创建画布 */
    let canvas = document.createElement('canvas');
    let context = canvas.getContext('2d');
    /* 绘制矩形 */
    roundRect(context);
    /* 字体 */
    context.font = "16px Georgia";
    context.fillStyle = "#ffffff";
    context.fillText(message, 19, 25);
    context.font="24px Georgia";
    context.fillStyle = '#55F9FA';
    context.fillText(mes, 152, 24);
    /* 画布内容用于纹理贴图 */
    let texture = new THREE.Texture(canvas);
    texture.needsUpdate = true;
    let spriteMaterial = new THREE.SpriteMaterial({ map: texture });
    let sprite = new THREE.Sprite(spriteMaterial);
    /* 缩放比例 */
    sprite.scale.set(4, 2, 1);
    return sprite;
}