import {Loadout} from './loadout.js';

/*
this is the client class that the server uses
to keep track of clints - different from Client
in client/client.js (sorry for any confusion here)
*/

var Client = function (id_, conn_) {
  this.id = id_;
  this.conn = conn_;
  this.name = "username";
  this.goldenTag = false;
  this.color = "#AA0000";
  this.position = new THREE.Vector3();
  this.direction = new THREE.Quaternion();
  this.removed = false;
  this.isTeleporting = false;
  this.loadoutIDX = 0;
  this.loadout = new Loadout(Loadout.SCOUT);


  this.assailants = []; // other clients, or strings: ie "fell"
  this.victims = []; // other clients

  this.sendAnnouncement = function(text){
    this.conn.send({message:{from:'server', text:text}});
  }

  var cylinderCenterOffset = (1.75/2) - 1.5; // add to this.position to get center point
  var cylinderHeight = 1.75;
  var cylinderRadius = 0.375;
  this.hitBy = function(projectile){
    // check large bounding sphere
    if(this.position.clone().sub(projectile.getPosition()).length() < projectile.getRadius() + 2){
      // they are close.. but do they touch?
      let mycenter = this.position.clone().setY(this.position.y + cylinderCenterOffset);
      return intersecting(mycenter, cylinderHeight, cylinderRadius, projectile.getPosition(), projectile.getRadius());
    }
    return false;
  }
};

function intersecting(cycenter, cyheight, cyradius, spcenter, spradius){
  // top and bottom y coordinates of cylinder
  let bottomy = cycenter.y - cyheight/2;
  let topy = cycenter.y + cyheight/2;

  // positions flattened to the XZ plane
  let cyflat = cycenter.clone().setY(0);
  let spflat = spcenter.clone().setY(0);

  // case 1: sphere center is "next to" (or within) cylinder
  if(spcenter.y >= bottomy && spcenter.y <= topy){
    return cyflat.distanceTo(spflat) <= (cyradius + spradius);
  }

  // case 2: sphere center is directly above or below cylinder
  if(cyflat.distanceTo(spflat) <= cyradius){
    let intersectAbove = spcenter.y >= topy && spcenter.y < (topy + spradius);
    let intersectBelow = spcenter.y <= bottomy && spcenter.y > (bottomy - spradius);
    return intersectAbove || intersectBelow;
  }

  // case 3: spehere center is diagonally above or below cylinder
  let xzdirection = spflat.clone().sub(cyflat).normalize();
  let closestTopPoint = cycenter.clone().setY(topy).add(xzdirection.multiplyScalar(cyradius));
  let closestBottomPoint = cycenter.clone().setY(bottomy).add(xzdirection.multiplyScalar(cyradius));

  let intersectingBelow = closestBottomPoint.distanceTo(spcenter) <= spradius;
  let intersectingAbove = closestTopPoint.distanceTo(spcenter) <= spradius;

  return intersectingAbove || intersectingBelow;
}

Client.prototype.constructor = Client;

export { Client };