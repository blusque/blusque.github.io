/* ============================================================
   Hero：YBot 粒子人物（GPU 蒙皮 + 100STYLE 循环动作）
   ------------------------------------------------------------
   数据 assets/hero/ybot.bin 由 demo/motion 的 YBot 网格与动作截取打包：
     'YBH1' | nv nt nb nclips (i32)
     pos f32[nv*3] | normal i8[nv*3] | boneIdx u8[nv*4] | weight u8[nv*4]
     index u16[nt*3] (+2 对齐) | bind f32[nb*7] (世界空间 pos + quat xyzw)
     每个 clip：name[16] | frames i32 | pos i16[f*nb*3] /16000 | quat i16[f*nb*4] /32767
   交互：鼠标视差 · 拖拽环绕摄像机 · 轻点切换风格 · 滚动消散
   ============================================================ */
import * as THREE from 'three';

const FPS = 30;
const CYCLE = 6;          // 自动切换风格的间隔（秒）
const BLEND = 0.45;         // 风格之间的姿势过渡（秒）

/* ---------- 数据解析 ---------- */
async function fetchWithProgress(url, onProgress) {
  const res = await fetch(url);
  if (!res.ok) throw new Error('hero data ' + res.status);
  const total = 433850; // 未压缩体积；Content-Length 在 gzip 下不可靠
  if (!res.body || !res.body.getReader) { const b = await res.arrayBuffer(); onProgress(1); return b; }
  const reader = res.body.getReader();
  const chunks = []; let got = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value); got += value.length;
    onProgress(Math.min(1, got / total));
  }
  const out = new Uint8Array(got); let o = 0;
  for (const c of chunks) { out.set(c, o); o += c.length; }
  return out.buffer;
}

function parse(buf) {
  const dv = new DataView(buf);
  let o = 4;
  const nv = dv.getInt32(o, true), nt = dv.getInt32(o + 4, true), nb = dv.getInt32(o + 8, true), nc = dv.getInt32(o + 12, true);
  o += 16;
  const take = (Ctor, n) => { const bytes = n * Ctor.BYTES_PER_ELEMENT; const a = new Ctor(buf.slice(o, o + bytes)); o += bytes; return a; };
  const pos = take(Float32Array, nv * 3);
  const nrm = take(Int8Array, nv * 3);
  const bi = take(Uint8Array, nv * 4);
  const bw = take(Uint8Array, nv * 4);
  const idx = take(Uint16Array, nt * 3);
  if ((nt * 3) % 2) o += 2;
  const bind = take(Float32Array, nb * 7);
  const clips = [];
  for (let c = 0; c < nc; c++) {
    const name = new TextDecoder().decode(new Uint8Array(buf, o, 16)).replace(/\0+$/, ''); o += 16;
    const frames = dv.getInt32(o, true); o += 4;
    const p = take(Int16Array, frames * nb * 3);
    const q = take(Int16Array, frames * nb * 4);
    clips.push({ name, frames, p, q });
  }
  return { nv, nt, nb, pos, nrm, bi, bw, idx, bind, clips };
}

/* ---------- 表面均匀采样 ---------- */
function mulberry(seed) {
  return function () {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

function samplePoints(d, count) {
  const rnd = mulberry(7);
  const { pos, nrm, bi, bw, idx, nt } = d;
  const cdf = new Float32Array(nt);
  let acc = 0;
  for (let t = 0; t < nt; t++) {
    const a = idx[t * 3] * 3, b = idx[t * 3 + 1] * 3, c = idx[t * 3 + 2] * 3;
    const ux = pos[b] - pos[a], uy = pos[b + 1] - pos[a + 1], uz = pos[b + 2] - pos[a + 2];
    const vx = pos[c] - pos[a], vy = pos[c + 1] - pos[a + 1], vz = pos[c + 2] - pos[a + 2];
    const cx = uy * vz - uz * vy, cy = uz * vx - ux * vz, cz = ux * vy - uy * vx;
    acc += Math.sqrt(cx * cx + cy * cy + cz * cz) * 0.5;
    cdf[t] = acc;
  }
  const P = new Float32Array(count * 3), N = new Float32Array(count * 3);
  const SI = new Float32Array(count * 4), SW = new Float32Array(count * 4), R = new Float32Array(count * 4);
  for (let i = 0; i < count; i++) {
    const r = rnd() * acc;
    let lo = 0, hi = nt - 1;
    while (lo < hi) { const m = (lo + hi) >> 1; if (cdf[m] < r) lo = m + 1; else hi = m; }
    let u = rnd(), v = rnd();
    if (u + v > 1) { u = 1 - u; v = 1 - v; }
    const w = 1 - u - v;
    const ids = [idx[lo * 3], idx[lo * 3 + 1], idx[lo * 3 + 2]], ws = [w, u, v];
    for (let k = 0; k < 3; k++) {
      P[i * 3 + k] = pos[ids[0] * 3 + k] * ws[0] + pos[ids[1] * 3 + k] * ws[1] + pos[ids[2] * 3 + k] * ws[2];
      N[i * 3 + k] = (nrm[ids[0] * 3 + k] * ws[0] + nrm[ids[1] * 3 + k] * ws[1] + nrm[ids[2] * 3 + k] * ws[2]) / 127;
    }
    // 蒙皮权重取重心坐标最大的顶点
    const dom = ids[ws[0] >= ws[1] && ws[0] >= ws[2] ? 0 : ws[1] >= ws[2] ? 1 : 2];
    for (let k = 0; k < 4; k++) { SI[i * 4 + k] = bi[dom * 4 + k]; SW[i * 4 + k] = bw[dom * 4 + k] / 255; }
    // 随机方向（单位球内）+ 随机标量
    let x, y, z;
    do { x = rnd() * 2 - 1; y = rnd() * 2 - 1; z = rnd() * 2 - 1; } while (x * x + y * y + z * z > 1);
    R[i * 4] = x; R[i * 4 + 1] = y; R[i * 4 + 2] = z; R[i * 4 + 3] = rnd();
  }
  return { P, N, SI, SW, R };
}

/* ---------- 四元数小工具 ---------- */
function qmul(a, b, out) {
  const ax = a[0], ay = a[1], az = a[2], aw = a[3], bx = b[0], by = b[1], bz = b[2], bw = b[3];
  out[0] = aw * bx + ax * bw + ay * bz - az * by;
  out[1] = aw * by - ax * bz + ay * bw + az * bx;
  out[2] = aw * bz + ax * by - ay * bx + az * bw;
  out[3] = aw * bw - ax * bx - ay * by - az * bz;
  return out;
}

const VERT = /* glsl */`
  uniform sampler2D uBones;
  uniform float uTime, uScatter, uScroll, uSize, uPR;
  attribute vec4 skinIndex, skinWeight, aRand;
  varying float vLight, vRim, vSeed;

  mat4 bone(float i) {
    int y = int(i);
    vec4 r0 = texelFetch(uBones, ivec2(0, y), 0);
    vec4 r1 = texelFetch(uBones, ivec2(1, y), 0);
    vec4 r2 = texelFetch(uBones, ivec2(2, y), 0);
    return mat4(r0.x, r1.x, r2.x, 0.0, r0.y, r1.y, r2.y, 0.0, r0.z, r1.z, r2.z, 0.0, r0.w, r1.w, r2.w, 1.0);
  }

  void main() {
    mat4 S = bone(skinIndex.x) * skinWeight.x + bone(skinIndex.y) * skinWeight.y
           + bone(skinIndex.z) * skinWeight.z + bone(skinIndex.w) * skinWeight.w;
    vec3 wp = (modelMatrix * S * vec4(position, 1.0)).xyz;
    vec3 wn = normalize(mat3(modelMatrix) * mat3(S) * normal);

    // 切换风格：沿法线 + 随机方向膨胀，再收拢
    float sc = uScatter * (0.5 + aRand.w);
    wp += (wn * 0.22 + aRand.xyz * 0.5) * sc;
    wp.y += sin(uTime * 3.0 + aRand.w * 40.0) * 0.04 * uScatter;

    // 滚动：粒子向上飘散
    float s = smoothstep(0.0, 1.0, uScroll * (0.55 + aRand.w * 0.9));
    wp += vec3(aRand.x * 1.6, 0.9 + aRand.y * 0.8 + aRand.w, aRand.z * 1.6) * s;

    vec4 mv = viewMatrix * vec4(wp, 1.0);
    gl_Position = projectionMatrix * mv;

    vec3 V = normalize(cameraPosition - wp);
    float facing = dot(wn, V);
    vLight = (0.16 + 0.84 * max(dot(wn, normalize(vec3(-0.45, 0.75, 0.55))), 0.0)) * (facing < 0.0 ? 0.28 : 1.0);
    vRim = facing > 0.0 ? smoothstep(0.38, 0.0, facing) : 0.0; // 只在正面轮廓处描边
    vSeed = aRand.w;
    gl_PointSize = uSize * uPR * (0.65 + aRand.w * 0.7) * (1.0 - s) / -mv.z;
  }
`;

const FRAG = /* glsl */`
  uniform vec3 uInk, uAccent;
  uniform float uTime;
  varying float vLight, vRim, vSeed;
  void main() {
    vec2 c = gl_PointCoord - 0.5;
    if (dot(c, c) > 0.25) discard;
    vec3 col = uInk * vLight;
    col = mix(col, mix(uAccent, vec3(1.0), 0.28), vRim * 0.9);
    // 少量粒子做闪烁高光
    float spark = step(0.985, vSeed) * (0.5 + 0.5 * sin(uTime * 4.0 + vSeed * 300.0));
    col += spark * 0.6;
    gl_FragColor = vec4(col, 1.0);
  }
`;

const FLOOR_VERT = /* glsl */`
  uniform float uPR, uScroll;
  varying float vA;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mv;
    float r = length(position.xz);
    vA = smoothstep(2.6, 0.2, r) * 0.55 * (1.0 - uScroll);
    gl_PointSize = 2.2 * uPR * 3.0 / -mv.z;
  }
`;
const FLOOR_FRAG = /* glsl */`
  varying float vA;
  void main() {
    vec2 c = gl_PointCoord - 0.5;
    if (dot(c, c) > 0.25) discard;
    gl_FragColor = vec4(vec3(0.93), vA);
  }
`;

export async function initHero({ canvas, onProgress = () => {}, onStyle = () => {}, onCycle = () => {} }) {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const small = window.matchMedia('(max-width: 900px)').matches;

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: true, powerPreference: 'high-performance' });
  if (!renderer.capabilities.isWebGL2) throw new Error('WebGL2 required');
  const PR = Math.min(window.devicePixelRatio || 1, 2);
  renderer.setPixelRatio(PR);
  renderer.setClearColor(0x000000, 0);

  const buf = await fetchWithProgress(new URL('hero/ybot.bin', import.meta.url), onProgress);
  const d = parse(buf);
  const nb = d.nb;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(28, 1, 0.1, 50);

  /* 骨骼矩阵纹理：每根骨骼 3 个 RGBA texel（3x4 矩阵） */
  const boneData = new Float32Array(3 * nb * 4);
  const boneTex = new THREE.DataTexture(boneData, 3, nb, THREE.RGBAFormat, THREE.FloatType);
  boneTex.needsUpdate = true;

  const count = small ? 14000 : 26000;
  const s = samplePoints(d, count);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(s.P, 3));
  geo.setAttribute('normal', new THREE.BufferAttribute(s.N, 3));
  geo.setAttribute('skinIndex', new THREE.BufferAttribute(s.SI, 4));
  geo.setAttribute('skinWeight', new THREE.BufferAttribute(s.SW, 4));
  geo.setAttribute('aRand', new THREE.BufferAttribute(s.R, 4));
  geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 1, 0), 4);

  const uniforms = {
    uBones: { value: boneTex },
    uTime: { value: 0 }, uScatter: { value: 0 }, uScroll: { value: 0 },
    uSize: { value: small ? 10 : 8.5 }, uPR: { value: PR },
    uInk: { value: new THREE.Color('#e9ebf1') }, uAccent: { value: new THREE.Color(getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#3a5bd0') }
  };
  const mat = new THREE.ShaderMaterial({ vertexShader: VERT, fragmentShader: FRAG, uniforms });
  const points = new THREE.Points(geo, mat);
  points.frustumCulled = false;

  const rig = new THREE.Group();
  rig.add(points);
  scene.add(rig);

  /* 地面点阵 */
  const fp = [];
  for (let x = -26; x <= 26; x++) for (let z = -26; z <= 26; z++) fp.push(x * 0.1, 0, z * 0.1);
  const floorGeo = new THREE.BufferGeometry();
  floorGeo.setAttribute('position', new THREE.Float32BufferAttribute(fp, 3));
  const floorU = { uPR: { value: PR }, uScroll: uniforms.uScroll };
  const floor = new THREE.Points(floorGeo, new THREE.ShaderMaterial({
    vertexShader: FLOOR_VERT, fragmentShader: FLOOR_FRAG, uniforms: floorU, transparent: true, depthWrite: false
  }));
  rig.add(floor);

  /* ---------- 动作采样 ---------- */
  const bindQ = [], bindP = [];
  for (let j = 0; j < nb; j++) {
    const b = d.bind.subarray(j * 7, j * 7 + 7);
    bindP.push([b[0], b[1], b[2]]);
    bindQ.push([-b[3], -b[4], -b[5], b[6]]); // 共轭 = 逆旋转
  }
  const poseA = new Float32Array(nb * 7), poseB = new Float32Array(nb * 7);

  function samplePose(clip, t, out) {
    const f = (t * FPS) % clip.frames;
    const f0 = Math.floor(f), f1 = (f0 + 1) % clip.frames, a = f - f0;
    for (let j = 0; j < nb; j++) {
      const p0 = (f0 * nb + j) * 3, p1 = (f1 * nb + j) * 3;
      for (let k = 0; k < 3; k++) out[j * 7 + k] = (clip.p[p0 + k] * (1 - a) + clip.p[p1 + k] * a) / 16000;
      const q0 = (f0 * nb + j) * 4, q1 = (f1 * nb + j) * 4;
      const sg = (clip.q[q0] * clip.q[q1] + clip.q[q0 + 1] * clip.q[q1 + 1] + clip.q[q0 + 2] * clip.q[q1 + 2] + clip.q[q0 + 3] * clip.q[q1 + 3]) < 0 ? -1 : 1;
      let x = clip.q[q0] * (1 - a) + clip.q[q1] * a * sg, y = clip.q[q0 + 1] * (1 - a) + clip.q[q1 + 1] * a * sg;
      let z = clip.q[q0 + 2] * (1 - a) + clip.q[q1 + 2] * a * sg, w = clip.q[q0 + 3] * (1 - a) + clip.q[q1 + 3] * a * sg;
      const n = Math.hypot(x, y, z, w) || 1;
      out[j * 7 + 3] = x / n; out[j * 7 + 4] = y / n; out[j * 7 + 5] = z / n; out[j * 7 + 6] = w / n;
    }
  }

  const qa = [0, 0, 0, 1], qr = [0, 0, 0, 1];
  function writeBones(pose, other, k) {
    for (let j = 0; j < nb; j++) {
      const o = j * 7;
      let px = pose[o], py = pose[o + 1], pz = pose[o + 2];
      qa[0] = pose[o + 3]; qa[1] = pose[o + 4]; qa[2] = pose[o + 5]; qa[3] = pose[o + 6];
      if (other && k > 0) {
        px += (other[o] - px) * k; py += (other[o + 1] - py) * k; pz += (other[o + 2] - pz) * k;
        const sg = qa[0] * other[o + 3] + qa[1] * other[o + 4] + qa[2] * other[o + 5] + qa[3] * other[o + 6] < 0 ? -1 : 1;
        for (let c = 0; c < 4; c++) qa[c] += (other[o + 3 + c] * sg - qa[c]) * k;
        const n = Math.hypot(qa[0], qa[1], qa[2], qa[3]); for (let c = 0; c < 4; c++) qa[c] /= n;
      }
      qmul(qa, bindQ[j], qr);
      const [x, y, z, w] = qr;
      const m00 = 1 - 2 * (y * y + z * z), m01 = 2 * (x * y - z * w), m02 = 2 * (x * z + y * w);
      const m10 = 2 * (x * y + z * w), m11 = 1 - 2 * (x * x + z * z), m12 = 2 * (y * z - x * w);
      const m20 = 2 * (x * z - y * w), m21 = 2 * (y * z + x * w), m22 = 1 - 2 * (x * x + y * y);
      const b = bindP[j];
      const tx = px - (m00 * b[0] + m01 * b[1] + m02 * b[2]);
      const ty = py - (m10 * b[0] + m11 * b[1] + m12 * b[2]);
      const tz = pz - (m20 * b[0] + m21 * b[1] + m22 * b[2]);
      const r = j * 12;
      boneData[r] = m00; boneData[r + 1] = m01; boneData[r + 2] = m02; boneData[r + 3] = tx;
      boneData[r + 4] = m10; boneData[r + 5] = m11; boneData[r + 6] = m12; boneData[r + 7] = ty;
      boneData[r + 8] = m20; boneData[r + 9] = m21; boneData[r + 10] = m22; boneData[r + 11] = tz;
    }
    boneTex.needsUpdate = true;
  }

  /* ---------- 状态 ---------- */
  let current = 0, prev = -1, switchAt = -10, cycleStart = 0;
  // 拖拽 = 绕角色环绕摄像机（带惯性，松手后缓慢回到导演机位）
  let orbitYaw = 0, orbitPitch = 0, velYaw = 0, velPitch = 0, dragging = false, lastX = 0, lastY = 0, dragDist = 0, releasedAt = -10;
  const par = new THREE.Vector2(); // 鼠标视差（平滑后）
  const mouseT = new THREE.Vector2();
  let scrollK = 0, visible = true, running = true;
  const clock = new THREE.Clock();

  function setStyle(i, now) {
    if (i === current) return;
    prev = current; current = i; switchAt = now; cycleStart = now;
    nextShot(now);
    onStyle(i, d.clips[i].name, d.clips.length);
  }
  onStyle(0, d.clips[0].name, d.clips.length);

  /* ---------- 机位：每次切换风格推到下一个镜头，镜头内缓慢推进 + 轻微手持 ---------- */
  // pos / look 以角色为原点（米），fov 为竖直视角
  const SHOTS = [
    { pos: [1.9, 1.05, 5.2], look: [0, 0.95, 0], fov: 28 },   // 3/4 全景
    { pos: [-1.5, 0.32, 3.4], look: [0, 1.15, 0], fov: 34 },  // 低机位仰拍
    { pos: [4.6, 1.35, 0.9], look: [0, 0.95, 0], fov: 20 },   // 侧面长焦
    { pos: [0.9, 2.9, 4.0], look: [0, 0.7, 0], fov: 30 },     // 高机位俯拍
    { pos: [-0.5, 1.5, 2.5], look: [0, 1.35, 0], fov: 24 }    // 半身特写
  ];
  const SHOT_T = 2.2; // 转场时长（秒）
  let shot = 0, shotFrom = 0, shotAt = -SHOT_T;
  const cam = { pos: new THREE.Vector3(), look: new THREE.Vector3(), fov: 28 };
  const tmpA = new THREE.Vector3(), tmpB = new THREE.Vector3(), tmpL = new THREE.Vector3();
  const ease = t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  let narrow = false;

  function nextShot(now) { shotFrom = shot; shot = (shot + 1) % SHOTS.length; shotAt = now; }

  function updateCamera(now) {
    const k = ease(Math.min(1, (now - shotAt) / SHOT_T));
    const A = SHOTS[shotFrom], B = SHOTS[shot];
    // 位置走弧线：在球坐标里插值，避免穿过角色
    tmpA.fromArray(A.pos); tmpB.fromArray(B.pos);
    const ra = Math.hypot(tmpA.x, tmpA.z), rb = Math.hypot(tmpB.x, tmpB.z);
    let aa = Math.atan2(tmpA.x, tmpA.z), ab = Math.atan2(tmpB.x, tmpB.z);
    if (ab - aa > Math.PI) ab -= Math.PI * 2; else if (aa - ab > Math.PI) ab += Math.PI * 2;
    const ang = aa + (ab - aa) * k, rad = ra + (rb - ra) * k;
    cam.pos.set(Math.sin(ang) * rad, tmpA.y + (tmpB.y - tmpA.y) * k, Math.cos(ang) * rad);
    cam.look.fromArray(A.look).lerp(tmpL.fromArray(B.look), k);
    cam.fov = A.fov + (B.fov - A.fov) * k;

    // 镜头内缓慢推进
    const hold = Math.min(1, Math.max(0, now - shotAt) / (CYCLE + SHOT_T));
    const push = reduce ? 0 : hold * 0.09;
    cam.pos.lerp(cam.look, push);

    // 手持感：低频多正弦叠加
    const n = reduce ? 0 : 1;
    cam.pos.x += n * (Math.sin(now * 0.53) * 0.018 + Math.sin(now * 1.31) * 0.006);
    cam.pos.y += n * (Math.sin(now * 0.71 + 1.3) * 0.012 + Math.sin(now * 1.7) * 0.004);

    // 拖拽环绕：绕视点转 yaw / pitch
    tmpA.copy(cam.pos).sub(cam.look);
    const r = tmpA.length();
    let th = Math.atan2(tmpA.x, tmpA.z) + orbitYaw;
    let ph = Math.asin(Math.max(-0.99, Math.min(0.99, tmpA.y / r))) + orbitPitch;
    ph = Math.max(-0.2, Math.min(1.1, ph));
    cam.pos.set(Math.sin(th) * Math.cos(ph) * r, Math.sin(ph) * r, Math.cos(th) * Math.cos(ph) * r).add(cam.look);

    // 鼠标视差：摄像机沿自身右 / 上方向平移，视点反向少量平移 → 空间纵深感
    if (!reduce) {
      tmpB.set(cam.pos.z - cam.look.z, 0, cam.look.x - cam.pos.x).normalize(); // 右向量（水平）
      cam.pos.addScaledVector(tmpB, -par.x * 0.32);
      cam.pos.y += -par.y * 0.18;
      cam.look.addScaledVector(tmpB, par.x * 0.06);
      cam.look.y += par.y * 0.04;
    }

    if (narrow) cam.pos.sub(cam.look).multiplyScalar(1.18).add(cam.look);
    camera.position.copy(cam.pos);
    camera.lookAt(cam.look);
    camera.rotateZ(n * Math.sin(now * 0.37) * 0.006);
    camera.fov = cam.fov;
    camera.updateProjectionMatrix();
  }

  /* ---------- 布局 ---------- */
  function resize() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    narrow = w < 900;
    // 宽屏时把人物推到画面右侧，给左侧标题留位置
    camera.filmOffset = narrow ? 0 : -Math.min(7, 2.6 * camera.aspect);
  }
  resize();
  window.addEventListener('resize', resize);

  /* ---------- 输入 ---------- */
  canvas.addEventListener('pointerdown', e => { dragging = true; dragDist = 0; lastX = e.clientX; lastY = e.clientY; canvas.setPointerCapture(e.pointerId); });
  canvas.addEventListener('pointerup', () => {
    if (dragging && dragDist < 4) setStyle((current + 1) % d.clips.length, clock.elapsedTime); // 轻点 = 切换风格
    dragging = false; releasedAt = clock.elapsedTime;
  });
  canvas.addEventListener('pointercancel', () => { dragging = false; releasedAt = clock.elapsedTime; });
  window.addEventListener('pointermove', e => {
    const r = canvas.getBoundingClientRect();
    mouseT.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    if (dragging) {
      const dx = e.clientX - lastX, dy = e.clientY - lastY;
      lastX = e.clientX; lastY = e.clientY; dragDist += Math.abs(dx) + Math.abs(dy);
      velYaw = -dx * 0.006; velPitch = dy * 0.004;
      orbitYaw += velYaw; orbitPitch = Math.max(-0.35, Math.min(0.6, orbitPitch + velPitch));
    }
  }, { passive: true });

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([en]) => { visible = en.isIntersecting; }).observe(canvas);
  }
  document.addEventListener('visibilitychange', () => { running = !document.hidden; });

  /* ---------- 渲染循环 ---------- */
  function frame() {
    requestAnimationFrame(frame);
    const dt = Math.min(clock.getDelta(), 0.05);
    const now = clock.elapsedTime;
    if (!visible || !running) return;

    if (!reduce && now - cycleStart > CYCLE) setStyle((current + 1) % d.clips.length, now);
    onCycle(reduce ? 0 : (now - cycleStart) / CYCLE);

    const since = now - switchAt;
    samplePose(d.clips[current], now, poseA);
    if (prev >= 0 && since < BLEND) {
      samplePose(d.clips[prev], now, poseB);
      const k = since / BLEND;
      writeBones(poseB, poseA, k * k * (3 - 2 * k));
    } else writeBones(poseA, null, 0);

    // 切换脉冲：快起慢收
    const pulse = since < 1.4 ? Math.sin(Math.min(1, since / 1.4) * Math.PI) * Math.exp(-since * 1.2) : 0;
    uniforms.uScatter.value = reduce ? 0 : pulse * 0.9;

    if (!dragging) {
      velYaw *= 0.93; velPitch *= 0.93;
      orbitYaw += velYaw; orbitPitch = Math.max(-0.35, Math.min(0.6, orbitPitch + velPitch));
      if (now - releasedAt > 3) { orbitYaw *= 0.985; orbitPitch *= 0.985; } // 3 秒后回到导演机位
    }

    if (Math.abs(mouseT.x) <= 1.5) par.lerp(mouseT, 0.05);

    const target = Math.min(1, Math.max(0, window.scrollY / (window.innerHeight * 0.9)));
    scrollK += (target - scrollK) * 0.12;
    uniforms.uScroll.value = reduce ? 0 : scrollK;
    uniforms.uTime.value = now;

    updateCamera(now);
    renderer.render(scene, camera);
  }
  frame();

  return {
    next() { setStyle((current + 1) % d.clips.length, clock.elapsedTime); },
    stats: { verts: d.nv, joints: nb, points: count, styles: d.clips.map(c => c.name) }
  };
}
