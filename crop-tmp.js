const sharp = require('sharp');
(async () => {
  await sharp('public/images/Wing-17.png')
    .extract({ left: 20, top: 420, width: 210, height: 262 })
    .resize({ width: 260 })
    .jpeg({ quality: 50 })
    .toFile('/tmp/t1.jpg');
  await sharp('public/images/Wing-17-top.png')
    .resize({ width: 260 })
    .jpeg({ quality: 50 })
    .toFile('/tmp/t2.jpg');
  await sharp('public/images/Wing-17.png')
    .extract({ left: 330, top: 400, width: 200, height: 282 })
    .resize({ width: 260 })
    .jpeg({ quality: 50 })
    .toFile('/tmp/t3.jpg');
  console.log('ok');
})();
