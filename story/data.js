/* ============================================================
   故事分组与文案（可自由编辑）
   ------------------------------------------------------------
   · chapters[] 每章：
       id      章节 id
       no      完整章节号（如「第一章」，序章为「序」）
       short   顶栏导航短标签
       title   章节名
       titleEn 英文名
       labelEn 小字眉标
       intro   章节引言
       photos  本章照片
   · photos[] 每张：
       src     图片路径（相对本文件）
       title   照片标题
       story   故事文案（两三句，第一人称）
       place   「摄于…」落款
       accent  兜底主色调（file:// 下无法读像素时使用）
       lum     整图平均亮度 0~255（决定该页背景偏黑/偏白）
       w / h   原始像素尺寸（预排版、防抖动）
   ------------------------------------------------------------
   运行时 app.js 会动态重算主色调与画幅，这里的 accent/lum 仅作兜底。
   故事与落款是根据文件名与色调推断的，请按真实情况校对、修改。
   ============================================================ */
window.GALLERY_DATA = {
  title: "故事",
  titleEn: "STORY",
  subtitle: "每一帧，都是一个故事里的瞬间",
  chapters: [
    {
      id: "prologue",
      no: "序",
      short: "序",
      title: "偶然",
      titleEn: "Prologue",
      labelEn: "Prologue",
      intro: "所有的故事，都始于一次偶然——就像掷出的骰子，落地之前，谁也不知道会是几点。",
      photos: [
        {
          src: "images/dices.jpg", title: "骰子",
          story: "在一场 DND 的冒险旅程中，冒险者用骰子堆出的一座塔楼。在推倒这座骰子塔楼之前，我们永远都不知道命运的定数。",
          place: "2025年摄于香港",
          accent: "#9A7A28", lum: 150, w: 1080, h: 1920
        }
      ]
    },
    {
      id: "city",
      no: "第一章",
      short: "一",
      title: "城市",
      titleEn: "City",
      labelEn: "Chapter I · City",
      intro: "我们在城市里行走。街道、车站、霓虹与告别，都是这座城市没说出口的话。",
      photos: [
        {
          src: "images/城市/tokyo.jpg", title: "东京",
          story: "品川车站外，躺在地上的流浪汉和行色匆匆的白领都是花白的头发。",
          place: "2024年摄于东京",
          accent: "#5C7B99", lum: 132, w: 1706, h: 1279
        },
        {
          src: "images/城市/kyoto.jpg", title: "京都",
          story: "枯藤老树昏鸦，小桥流水人家。",
          place: "2024年摄于京都",
          accent: "#3E7E7E", lum: 128, w: 1708, h: 1282
        },
        {
          src: "images/城市/osaka.jpg", title: "大阪",
          story: "刚从街角的松屋吃完猪排饭出来，天色已经全黑了，远处的车灯和霓虹灯模糊了镜头，几个下班的社会人并肩走着，是不是在商量一会要去哪家居酒屋呢。",
          place: "2024年摄于大阪",
          accent: "#A65A48", lum: 101, w: 1707, h: 1279
        },
        {
          src: "images/城市/gas_station.jpg", title: "加油站",
          story: "从威尼斯人赌场出来，过一个天桥，再稍微向前走一段路，就能看到这个色彩明快的加油站。在炎热的夏日里路过时，只消瞥一眼它的招牌，便能让心情愉快不少。",
          place: "2026年摄于澳门",
          accent: "#6E8FC0", lum: 134, w: 1707, h: 1280
        },
        {
          src: "images/城市/no_parking.jpg", title: "禁止停车",
          story: "一户人家门前，一辆破旧的电瓶车停在写着“严禁停车”的院墙下。",
          place: "2026年摄于上海",
          accent: "#5C86B8", lum: 142, w: 1707, h: 1280
        },
        {
          src: "images/城市/hongkong.jpg", title: "香港",
          story: "坚尼地城的一个十字路口。两旁是香港标志性的、狭窄逼仄的人行道，人群熙熙攘攘地从一边走到另一边。在同样不宽敞的街道上，一辆白色的轿车在等红灯。",
          place: "2025年摄于香港",
          accent: "#8E4038", lum: 91, w: 5712, h: 4284
        },
        {
          src: "images/城市/macau.jpg", title: "澳门",
          story: "红黑配色的迷你，白色头盔的机车骑手还有远处的佛龛。就像是离开赌场之后，澳门这座慵懒、明亮又原始的城市的压缩包。",
          place: "2026年摄于澳门",
          accent: "#C04038", lum: 106, w: 1086, h: 1448
        },
        {
          src: "images/城市/valentine's_day_in_shenzhenbei.jpg", title: "情人节",
          story: "情人节的第二天，深圳北站的地面上一枝被人踩过的白玫瑰。",
          place: "2026年摄于深圳",
          accent: "#8A8A90", lum: 125, w: 1280, h: 1568
        },
        {
          src: "images/城市/steps.jpg", title: "台阶",
          story: "小区里的一处水塔，通向水塔顶的楼梯已经生锈了，锈痕一直扩散到塔上，渗透进了石头里。这是一座建在油田上的城市，城市的每一处都充满了粗犷又锈迹斑斑的工业风，这里是活的798艺术园。",
          place: "2022年摄于东营",
          accent: "#A9B8C6", lum: 143, w: 1280, h: 1707
        },
        {
          src: "images/城市/love.jpg", title: "爱",
          story: "在这趟日本的旅程中，我每到一个地方都一定要去登高，到这座城市的最高处俯瞰城市的全景。在横滨地标塔的观景层，观景时偶遇三对情侣并排坐在全景玻璃前。",
          place: "2024年摄于横滨",
          accent: "#B08A5A", lum: 104, w: 1707, h: 1280
        }
      ]
    },
    {
      id: "sky",
      no: "第二章",
      short: "二",
      title: "天空",
      titleEn: "Sky",
      labelEn: "Chapter II · Sky",
      intro: "抬头的时候，人才会想起自己有多小，天空有多大。",
      photos: [
        {
          src: "images/天空/pe_and_clouds.jpg", title: "云与风",
          story: "那天的云很低，低得好像一伸手，就能扯下一角来。",
          place: "摄于 云下",
          accent: "#6E8FC0", lum: 114, w: 1706, h: 1279
        },
        {
          src: "images/天空/grassland.jpg", title: "草原",
          story: "风从草原那头吹过来，我按下快门的手停了一下，怕惊动这整片安静。",
          place: "2023年摄于新疆",
          accent: "#6E8FBF", lum: 112, w: 4032, h: 3024
        },
        {
          src: "images/天空/sunset_in_shenzhen.jpg", title: "深圳的日落",
          story: "从西丽地铁站外的天桥欣赏一个完美的日落。",
          place: "2026年摄于深圳",
          accent: "#B07838", lum: 109, w: 5712, h: 4284
        },
        {
          src: "images/天空/mirror.jpg", title: "镜",
          story: "湖面像一面镜子，映着模糊的夕阳。",
          place: "2026年摄于深圳",
          accent: "#666B73", lum: 116, w: 5712, h: 4284
        },
        {
          src: "images/天空/get_some_fries.jpg", title: "薯条",
          story: "老大，一起去码头整点薯条吧。",
          place: "2024年摄于大连",
          accent: "#6E9FD8", lum: 122, w: 4032, h: 3024
        }
      ]
    },
    {
      id: "children",
      no: "第三章",
      short: "三",
      title: "孩子们",
      titleEn: "Children",
      labelEn: "Chapter III · Children",
      intro: "孩子的眼睛里装着的世界，比我们的大，也比我们的亮。",
      photos: [
        {
          src: "images/孩子们/little_girl_safari_the_world.jpg", title: "看世界的女孩",
          story: "国庆回到上海，和朋友在七宝刚吃完烤肉出来，在商场附近闲逛。走到一处喷泉旁，遇到了这个举着手机，仰望着紫色的霓虹的女孩。",
          place: "2022年10月 摄于上海",
          accent: "#6E5E80", lum: 89, w: 1687, h: 1279
        },
        {
          src: "images/孩子们/meeting.jpg", title: "相遇",
          story: "三猫会谈！",
          place: "2022年摄于东营",
          accent: "#B8A888", lum: 128, w: 4032, h: 3024
        },
        {
          src: "images/孩子们/national_day.jpg", title: "国庆",
          story: "每到国庆节，中环都会放烟花来庆祝。为了不被前面的人群挡住，一位父亲让儿子骑在肩头。",
          place: "2024年摄于香港",
          accent: "#8A6A38", lum: 76, w: 1706, h: 1279
        },
        {
          src: "images/孩子们/pigeon.jpg", title: "鸽子",
          story: "西湖边的树影下，一个追逐鸽子的女孩和拍摄她的母亲，以及一只刚刚起飞的白鸽。",
          place: "2024年摄于杭州",
          accent: "#64707E", lum: 97, w: 1706, h: 1279
        }
      ]
    },
    {
      id: "light",
      no: "第四章",
      short: "四",
      title: "光与影",
      titleEn: "Light & Shadow",
      labelEn: "Chapter IV · Light & Shadow",
      intro: "光落下来，故事就有了轮廓；影留下来，故事就有了重量。",
      photos: [
        {
          src: "images/光与影/afternoon.jpg", title: "午后",
          story: "午后三点，光斜斜地切进来，把房间分成一半暖、一半凉。",
          place: "2025年摄于深圳",
          accent: "#7A5A40", lum: 108, w: 4032, h: 3024
        },
        {
          src: "images/光与影/boatman.jpg", title: "船夫",
          story: "船夫划进雾里，水面把天和船叠在一起。他要去的地方，我看不见。",
          place: "2024年摄于杭州",
          accent: "#9FAEBC", lum: 131, w: 4032, h: 3024
        },
        {
          src: "images/光与影/building.jpg", title: "楼",
          story: "楼很高，高到把天空分成几块。我站在下面，觉得人很小，小得很安心。",
          place: "2025年摄于香港",
          accent: "#556A7E", lum: 110, w: 1279, h: 1706
        },
        {
          src: "images/光与影/dream.jpg", title: "梦",
          story: "深蓝的夜里，梦像水一样漫上来，把白天的喧嚣都淹没了。",
          place: "2024年摄于香港",
          accent: "#3448B8", lum: 19, w: 1279, h: 1706
        },
        {
          src: "images/光与影/infinity.jpg", title: "无限",
          story: "有些东西一眼望不到头。望得久了，人会忘记自己也在其中。",
          place: "2025年摄于香港",
          accent: "#5A6A80", lum: 84, w: 1279, h: 1707
        },
        {
          src: "images/光与影/jellyfish.jpg", title: "水母",
          story: "水母在暗蓝里一开一合，像深海里无人认领的呼吸。",
          place: "2026年摄于珠海",
          accent: "#6A3EA8", lum: 58, w: 4032, h: 3024
        },
        {
          src: "images/光与影/night.jpg", title: "夜",
          story: "夜里，城市把灯一盏一盏点起来。那些光，是它没能睡着的心事。",
          place: "2025年摄于香港",
          accent: "#7A5A40", lum: 86, w: 1706, h: 1279
        },
        {
          src: "images/光与影/shadow_and_light.jpg", title: "光与影",
          story: "阴影不是黑暗，是光在休息。",
          place: "2024年摄于香港",
          accent: "#93A5B8", lum: 133, w: 1279, h: 1706
        },
        {
          src: "images/光与影/speed.jpg", title: "速度",
          story: "深夜，快门被拉得很长，速度就留在了光里。世界模糊成一条线，只有目的地是清楚的。",
          place: "2026年摄于旅途中",
          accent: "#33363A", lum: 33, w: 4032, h: 3024
        },
        {
          src: "images/光与影/yutaka_wing.jpg", title: "羽翼",
          story: "风从背后鼓起来，翅膀就张开了。它还没有飞，只是准备好了要飞。",
          place: "2019年摄于大阪",
          accent: "#8FA2B4", lum: 132, w: 1279, h: 1706
        }
      ]
    }
  ],
  end: {
    mark: "— 完 · THE END —",
    line: "故事没有讲完。剩下的部分，等你来续写。",
    back: "回到封面",
    backEn: "BACK TO COVER"
  }
};
