var parseMagicaVoxel = require('parse-magica-voxel');

module.exports = function parseMagicaVoxelFile(buffer) {
  return JSON.stringify(parseMagicaVoxel(buffer));
};