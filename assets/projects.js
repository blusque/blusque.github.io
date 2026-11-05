/* ============================================================
   项目数据：首页「Selected Work」与详情页 project.html?id=… 都从这里渲染
   ------------------------------------------------------------
   新增项目：在 PROJECTS 里追加一个对象即可，顺序 = 展示顺序。
     id        唯一 id，详情页地址为 project.html?id=<id>
     title     英文标题（大字）
     kind      类别（列表右侧小字）
     year      年份（可留空）
     featured  true → 首页以大卡展示（建议只开一个）
     summary   一句话简介
     cover     预览视频（首页悬停 / 大卡），poster 可选
     live      可选，{ label, href } 在线可玩入口
     meta      详情页元信息 [[标签, 内容], …]
     blocks    详情页正文块，type 可选：
               lead     { text }                      大号导语
               text     { title, paras[] }     段落
               steps    { title, items[{h, p}] }  编号步骤
               metrics  { title, items[{label, from, to, unit, note}] }  前后指标
               figure   { title, src, caption, video? }  图片 / 视频
               compare  { title, before, after, beforeLabel, afterLabel }  对比滑块（两段同步视频或两张图）
   ============================================================ */
window.PROJECTS = [
  {
    id: "motion-studio",
    title: "Motion Studio",
    kind: "Realtime · WebAssembly",
    year: "",
    summary: "Motion Matching 驱动的 YBot 与篮球物理，编译到 WebAssembly，直接在网页里用键盘操作。",
    cover: "demo/motion-studio-live.mp4",
    live: { label: "在浏览器中试玩", href: "demo/index.html" },
    meta: [
      ["类型", "交互式 Demo"],
      ["平台", "Web · WebAssembly"],
      ["场景", "Motion Matching ×4 风格 / 篮球落球 / 连续运球"],
      ["操作", "WASD 移动 · Shift 跑 · Tab 切换风格"]
    ],
    blocks: [
      { type: "lead", text: "把离线研究里的动画系统搬进浏览器：不装任何东西，打开网页就能用键盘驱动角色，在 4 种 100STYLE 风格之间切换。" },
      {
        type: "steps", title: "三个场景",
        items: [
          { h: "Motion Matching · 4 个风格", p: "YBot 在 Aeroplane、Zombie、Akimbo、FlickLegs 四种行走风格之间实时检索与切换，WASD 控制方向，Shift 切换跑步。" },
          { h: "篮球 · 落球轨迹", p: "固定子步的 PBD 模拟重力与地面反弹，可暂停、重置、切换物理步长观察差异。" },
          { h: "篮球 · 连续运球物理", p: "运球动作与球的物理耦合，手部接触窗口内对球做方向纠偏。" }
        ]
      },
      {
        type: "text", title: "实现",
        paras: [
          "渲染框架基于 GenoView（C++ / raylib），整体用 Emscripten 编译为 WebAssembly，针对 WebGL2 修复了阴影贴图帧缓冲与深度纹理格式。",
          "动作资源按需从服务器拉取并写入虚拟文件系统，首屏只加载当前场景所需的数据。"
        ]
      }
    ]
  },
  {
    id: "motion-matching",
    title: "Motion Matching",
    kind: "Runtime Animation",
    year: "",
    summary: "让角色在连续运球中自然切换动作，消除模板切换瞬间的躯干扭动。",
    cover: "demo/motion-matching.mp4",
    meta: [
      ["方向", "实时动画生成"],
      ["关键问题", "模板切换扭动"],
      ["方法", "候选入口评分 + 缓变转向"],
      ["运行", "CPU 工作线程异步生成"]
    ],
    blocks: [
      { type: "lead", text: "基于 Motion Matching 的实时动画生成，让角色在连续运球中自然切换动作。" },
      {
        type: "metrics", title: "结果",
        items: [
          { label: "切换窗口内脊柱转角 · P95", from: 3.58, to: 2.54, unit: "°", note: "越低越平滑。消除了切换瞬间的卡顿与扭动。" }
        ]
      },
      {
        type: "steps", title: "解决了什么",
        items: [
          { h: "模板切换扭动", p: "动作切换时角色躯干会出现瞬间扭动。通过候选入口评分（根相对手脚 / 肘 / 躯干位置、末端速度与双手相位）与缓变转向（最多 35°、24 帧）来约束切换。" },
          { h: "实时性", p: "CPU 工作线程异步生成下一段动画，主线程保持蒙皮、输入与渲染，实现可交互的实时播放。" }
        ]
      }
    ]
  },
  {
    id: "basketball-motion-generation",
    title: "Basketball Motion Generation",
    kind: "Motion Generation · Physics",
    year: "",
    summary: "用扩散模型（CAMDM）实时生成篮球角色动画，配合 PBD 物理模拟球的运动。",
    cover: "demo/basketball-retargeting.mp4",
    meta: [
      ["方向", "动作生成 · 物理"],
      ["角色", "YBot"],
      ["模型", "CAMDM 扩散模型"],
      ["物理", "PBD 球体模拟"]
    ],
    blocks: [
      { type: "lead", text: "用扩散模型实时生成篮球角色动画——从轨迹、朝向与双手相位出发，配合 PBD 物理模拟球的运动。" },
      {
        type: "metrics", title: "结果",
        items: [
          { label: "模板接缝第一步平均速度差 · 10 个接缝", from: 1.296, to: 0, unit: "m/s", note: "18 帧五次 Hermite 衰减过渡，球不再在接缝处突变。" }
        ]
      },
      {
        type: "steps", title: "实现了什么",
        items: [
          { h: "动作生成", p: "CAMDM 扩散模型从用户画的轨迹、朝向与双手相位生成角色动画；4 步 DDIM 采样，接触相位以 inpainting 注入。" },
          { h: "球物理", p: "固定子步 PBD 模拟重力与地面反弹，接触窗口内对手部与球做方向纠偏，让球贴合手部。" },
          { h: "终止技能", p: "投篮与上篮：用篮筐方向约束双手，出手后按篮筐目标求解初速度，球独立延续弹道。" },
          { h: "接缝过渡", p: "模板衔接处用 18 帧五次 Hermite 衰减过渡，消除球位置 / 速度的瞬间跳变。" }
        ]
      }
    ]
  },
  {
    id: "run-cycle",
    title: "Run Cycle",
    kind: "Rigging · Keyframe",
    year: "",
    summary: "AutoRig Pro 绑定、逐帧关键姿势、Blender 布光渲染的一段循环跑步动画。",
    cover: "demo/run-cycle.mp4",
    poster: "demo/run-cycle-making.png",
    meta: [
      ["课程", "COMP7508 数据驱动动画"],
      ["工具", "Blender · AutoRig Pro"],
      ["流程", "绑定 → 关键帧 → 渲染"],
      ["类型", "角色动画练习"]
    ],
    blocks: [
      { type: "lead", text: "一段循环跑步动画，来自《数据驱动动画》课程（COMP7508）的角色动画练习。" },
      {
        type: "steps", title: "制作流程",
        items: [
          { h: "绑定", p: "使用 AutoRig Pro 为角色建立完整的骨骼与控制器，并完成蒙皮。" },
          { h: "动画", p: "参照跑步参考，逐帧摆出接触、蹬地、腾空、缓冲等关键姿势，再补齐中间帧形成循环。" },
          { h: "渲染", p: "在 Blender 中布光、设定相机后渲染输出。" }
        ]
      },
      { type: "figure", title: "制作过程", src: "demo/run-cycle-making.png", caption: "Blender 中的骨骼绑定与关键帧" },
      { type: "figure", title: "循环", src: "demo/run-cycle-loop.mp4", video: true, caption: "循环片段" }
    ]
  }
];
