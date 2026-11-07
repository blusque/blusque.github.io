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
   故事与落款是基于文件名与色调推断的，请按真实情况校对、修改。
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
          story: "把决定交给骰子，是最轻松的一件事。落地之前，谁也不知道会滚出几点。",
          place: "摄于 澳门",
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
          story: "天将亮未亮，东京的街灯还醒着。我站在空荡的路口，听这座城市翻了个身。",
          place: "摄于 东京",
          accent: "#5C7B99", lum: 132, w: 1706, h: 1279
        },
        {
          src: "images/城市/kyoto.jpg", title: "京都",
          story: "屋檐把天空裁成窄窄的一条，时间在这里走得很慢。我站了很久，久到忘了自己只是路过。",
          place: "摄于 京都",
          accent: "#3E7E7E", lum: 128, w: 1708, h: 1282
        },
        {
          src: "images/城市/osaka.jpg", title: "大阪",
          story: "黄昏把大阪染成了暖色。我们并排站在桥上，谁也没有说话，却都觉得这一刻很好。",
          place: "摄于 大阪 · 黄昏",
          accent: "#A65A48", lum: 101, w: 1707, h: 1279
        },
        {
          src: "images/城市/gas_station.jpg", title: "加油站",
          story: "加满油的瞬间，仪表盘归零，前面的路又长了起来。天蓝得不像真的。",
          place: "摄于 旅途",
          accent: "#6E8FC0", lum: 134, w: 1707, h: 1280
        },
        {
          src: "images/城市/no_parking.jpg", title: "禁止停车",
          story: "蓝天下，一块禁止停车的牌子立得端端正正。我们总想越过这些线，又总在最后停在线外。",
          place: "摄于 街头",
          accent: "#5C86B8", lum: 142, w: 1707, h: 1280
        },
        {
          src: "images/城市/hongkong.jpg", title: "香港",
          story: "香港的夜把每个人都照成了故事里的人。霓虹落下来，整条街像在下彩色的雨。",
          place: "摄于 香港 · 夜",
          accent: "#8E4038", lum: 91, w: 5712, h: 4284
        },
        {
          src: "images/城市/macau.jpg", title: "澳门",
          story: "澳门是红的，那红一路烧进夜里，像一场不肯散场的宴席。",
          place: "摄于 澳门 · 夜",
          accent: "#C04038", lum: 106, w: 1086, h: 1448
        },
        {
          src: "images/城市/valentine's_day_in_shenzhenbei.jpg", title: "情人节",
          story: "情人节的高铁站，聚散在同一刻发生。有人重逢，就有人在月台上悄悄红了眼睛。",
          place: "摄于 深圳北站",
          accent: "#8A8A90", lum: 125, w: 1280, h: 1568
        },
        {
          src: "images/城市/steps.jpg", title: "台阶",
          story: "台阶一级一级向上，把影子拉得很长。我数着数着，就像数进了自己的过去。",
          place: "摄于 城市",
          accent: "#A9B8C6", lum: 143, w: 1280, h: 1707
        },
        {
          src: "images/城市/love.jpg", title: "爱",
          story: "爱是街上最寻常的样子——两个人并排走，谁也没有看镜头。",
          place: "摄于 街头",
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
          place: "摄于 草原",
          accent: "#6E8FBF", lum: 112, w: 4032, h: 3024
        },
        {
          src: "images/天空/sunset_in_shenzhen.jpg", title: "深圳的日落",
          story: "深圳的日落很短，短到还没看够，天就黑了下来。",
          place: "摄于 深圳 · 黄昏",
          accent: "#B07838", lum: 109, w: 5712, h: 4284
        },
        {
          src: "images/天空/mirror.jpg", title: "镜",
          story: "镜子把天空收进去，又把天空还回来。我分不清，哪一边更接近真实。",
          place: "摄于 户外",
          accent: "#666B73", lum: 116, w: 5712, h: 4284
        },
        {
          src: "images/天空/get_some_fries.jpg", title: "薯条",
          story: "举着薯条，薯条举着蓝天。那一刻，我们都很轻。",
          place: "摄于 街头",
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
          story: "2022年的国庆，和朋友在七宝刚吃完烤肉出来，在商场附近闲逛。走到一处喷泉旁，遇到了这个举着手机，仰望着紫色的霓虹的女孩。",
          place: "2022年10月 摄于七宝，上海",
          accent: "#6E5E80", lum: 89, w: 1687, h: 1279
        },
        {
          src: "images/孩子们/meeting.jpg", title: "相遇",
          story: "相遇总是没有预告的。它就那样发生，在你还来不及准备好的时候。",
          place: "摄于 街头",
          accent: "#B8A888", lum: 128, w: 4032, h: 3024
        },
        {
          src: "images/孩子们/national_day.jpg", title: "国庆",
          story: "国庆那晚，焰火把天空烧亮了一角。孩子们仰着头，眼睛比焰火还要亮。",
          place: "摄于 国庆夜",
          accent: "#8A6A38", lum: 76, w: 1706, h: 1279
        },
        {
          src: "images/孩子们/pigeon.jpg", title: "鸽子",
          story: "广场上的鸽子一点都不怕人。孩子追着它们跑，它们也只是慢悠悠地让开半步。",
          place: "摄于 广场",
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
          place: "摄于 某个午后",
          accent: "#7A5A40", lum: 108, w: 4032, h: 3024
        },
        {
          src: "images/光与影/boatman.jpg", title: "船夫",
          story: "船夫划进雾里，水面把天和船叠在一起。他要去的地方，我看不见。",
          place: "摄于 水上",
          accent: "#9FAEBC", lum: 131, w: 4032, h: 3024
        },
        {
          src: "images/光与影/building.jpg", title: "楼",
          story: "楼很高，高到把天空分成几块。我站在下面，觉得人很小，小得很安心。",
          place: "摄于 城市",
          accent: "#556A7E", lum: 110, w: 1279, h: 1706
        },
        {
          src: "images/光与影/dream.jpg", title: "梦",
          story: "深蓝的夜里，梦像水一样漫上来，把白天的喧嚣都淹没了。",
          place: "摄于 深夜",
          accent: "#3448B8", lum: 19, w: 1279, h: 1706
        },
        {
          src: "images/光与影/infinity.jpg", title: "无限",
          story: "有些东西一眼望不到头。望得久了，人会忘记自己也在其中。",
          place: "摄于 城市",
          accent: "#5A6A80", lum: 84, w: 1279, h: 1707
        },
        {
          src: "images/光与影/jellyfish.jpg", title: "水母",
          story: "水母在暗蓝里一开一合，像深海里无人认领的呼吸。",
          place: "摄于 水族馆",
          accent: "#6A3EA8", lum: 58, w: 4032, h: 3024
        },
        {
          src: "images/光与影/night.jpg", title: "夜",
          story: "夜里，城市把灯一盏一盏点起来。那些光，是它没能睡着的心事。",
          place: "摄于 夜",
          accent: "#7A5A40", lum: 86, w: 1706, h: 1279
        },
        {
          src: "images/光与影/shadow_and_light.jpg", title: "光与影",
          story: "阴影不是黑暗，是光在休息。",
          place: "摄于 光影之间",
          accent: "#93A5B8", lum: 133, w: 1279, h: 1706
        },
        {
          src: "images/光与影/speed.jpg", title: "速度",
          story: "深夜，快门被拉得很长，速度就留在了光里。世界模糊成一条线，只有目的地是清楚的。",
          place: "摄于 深夜",
          accent: "#33363A", lum: 33, w: 4032, h: 3024
        },
        {
          src: "images/光与影/yutaka_wing.jpg", title: "羽翼",
          story: "风从背后鼓起来，翅膀就张开了。它还没有飞，只是准备好了要飞。",
          place: "摄于 天空",
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
