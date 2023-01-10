/*
Projectile scene object, for use by client
*/
var Projectile = function (scene_, position, r) {

  var scene = scene_;
  var radius = r;
  var destroyed = false;
  var mesh;

  // make geometry smoother for larger spheres
  var geometry;
  if(radius < 0.5){
    geometry = new THREE.SphereBufferGeometry(radius, 8, 5);
  }else if(radius < 1){
    geometry = new THREE.SphereBufferGeometry(radius, 10, 7);
  }else if(radius < 2){
    geometry = new THREE.SphereBufferGeometry(radius, 12, 9);
  }else{
    geometry = new THREE.SphereBufferGeometry(radius, 20, 13);
  }
  
  var material = new THREE.MeshLambertMaterial({
    color: 0xaaaaaa,
  });
  mesh = new THREE.Mesh(geometry, material);

  mesh.position.set(...position.toArray());

  scene.add(mesh);

  this.getPosition = function(){
    return mesh.position.clone();
  }

  this.setPosition = function(p){
    mesh.position.set(...p.toArray());
  }

  this.getRadius = function(){
    return radius;
  }

  this.destroy = function(){
    this.destroyed = true;
    mesh.material.color.setHex(0xffaa22);
    (async () => {
      await sleep(2000);
      scene.remove(mesh);
    })();
  }

  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

};

Projectile.prototype.constructor = Projectile;


export { Projectile };