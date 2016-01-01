load('./src/utils.js')
load('./src/geom.js')
load('./src/actor.js')
load('./src/scene.js')
load('./src/tilemap.js')
load('./src/planmap.js')
load('./src/planrunner.js')
load('./src/app.js')
log = print;

function run()
{
  log("unittest");
  var r1=new Rectangle(0,0,1,1);
  var r2=new Rectangle(1,1,1,1);
  log(r1.contact(new Vec2(0,0), r2));
  log(r1.contact(new Vec2(0,1), r2));
  log(r1.contact(new Vec2(1,0), r2));
  log(r1.contact(new Vec2(1,1), r2));
  var b1=new Box(new Vec3(0,0,0),new Vec3(1,1,1));
  var b2=new Box(new Vec3(1,1,0),new Vec3(1,1,1));
  log(b1.contact(new Vec3(0,0,0), b2));
  log(b1.contact(new Vec3(0,1,0), b2));
  log(b1.contact(new Vec3(1,0,0), b2));
  log(b1.contact(new Vec3(1,1,0), b2));
}

run();
