// ============================================================
// 个性化配置：以后修改姓名、日期、文案和示例照片，主要改这个文件即可。
// 日期统一使用“年-月-日”格式，例如：2023-05-20。
// 图片放在 public/images 文件夹中，填写路径时以 /images/ 开头。
// ============================================================

export const siteConfig = {
  siteName: 'YG嘻嘻站',
  siteSubtitle: 'Our little world Record & Remember',
  couple: {
    personOne: { name: '果咪', avatar: '/images/avatar-one.png' },
    personTwo: { name: '咪', avatar: '/images/avatar-two.png' },
    relationshipStart: '2024-12-24',
  },
  home: {
    heroPhoto: '/images/cover.png',
    quote: '人间有风有雨，也有你把普通日子变成小小的庆典。',
    photoCaption: '我们的第一张认真合照',
  },
  footerText: '愿每一个今天，都值得我们好好收藏。',
}

// 首次打开网站时写入浏览器的示例内容。
// 一旦你在网站里保存了新内容，浏览器会优先使用已保存的数据。
export const initialContent = {
  timeline: [
    {
      id: 'timeline-1',
      date: '2023-03-12',
      title: '初次见面',
      description: '那天的咖啡有一点苦，聊天却比想象中更自然。后来才知道，故事就是从这里开始的。',
      image: '/images/first-meeting.png',
    },
    {
      id: 'timeline-2',
      date: '2023-05-20',
      title: '我们在一起啦',
      description: '晚风很轻，你说出那句话的时候，我听见了自己的心跳。',
      image: '/images/confession.png',
    },
    {
      id: 'timeline-3',
      date: '2023-10-03',
      title: '第一次一起旅行',
      description: '一起看海、迷路、分一杯热饮，也第一次发现旅行最好的风景是身边的人。',
      image: '/images/trip.png',
    },
    {
      id: 'timeline-4',
      date: '2024-02-16',
      title: '第一次陪你过生日',
      description: '蜡烛亮起来的那一刻，偷偷许愿以后每一年都能陪你吹灭它。',
      image: '/images/birthday.png',
    },
  ],
  daily: [
    {
      id: 'daily-1',
      date: '2026-07-28',
      mood: '甜甜的',
      description: '下班后绕远路去吃了那家一直想吃的小店，回家的路上还遇见了一场粉色晚霞。',
      image: '/images/daily-sunset.png',
    },
    {
      id: 'daily-2',
      date: '2026-07-20',
      mood: '安心',
      description: '下雨天窝在家里，各自做事，偶尔抬头看见对方就觉得很好。',
      image: '/images/daily-rain.png',
    },
  ],
  gallery: [
    {
      id: 'photo-1',
      year: '2023',
      category: '旅行',
      title: '海边的傍晚',
      image: '/images/gallery-sea.png',
      story: '第一次一起去看海。风把头发吹得乱糟糟，但我们笑得很开心。',
    },
    {
      id: 'photo-2',
      year: '2023',
      category: '日常',
      title: '周末散步',
      image: '/images/gallery-walk.png',
      story: '没有目的地，牵着手慢慢走就是最喜欢的周末安排。',
    },
    {
      id: 'photo-3',
      year: '2024',
      category: '生日',
      title: '愿望成真',
      image: '/images/birthday.png',
      story: '蛋糕有点歪，礼物藏得也不够好，但惊喜是真的。',
    },
    {
      id: 'photo-4',
      year: '2024',
      category: '旅行',
      title: '山顶的风',
      image: '/images/gallery-mountain.png',
      story: '爬到一半都说不行了，最后还是一起站到了山顶。',
    },
    {
      id: 'photo-5',
      year: '2025',
      category: '日常',
      title: '一起做饭',
      image: '/images/gallery-cooking.png',
      story: '第一次合作做晚饭，厨房很乱，味道却意外地不错。',
    },
    {
      id: 'photo-6',
      year: '2025',
      category: '旅行',
      title: '小城车站',
      image: '/images/trip.png',
      story: '带着一只小箱子，去一个从没到过的地方，留下只属于我们的地图。',
    },
  ],
  wishes: [
    {
      id: 'wish-1',
      title: '一起去看一次极光',
      type: '想去的地方',
      status: 'todo',
      completedDate: '',
      reflection: '',
    },
    {
      id: 'wish-2',
      title: '学会做一道彼此最喜欢的菜',
      type: '想完成的事情',
      status: 'doing',
      completedDate: '',
      reflection: '这周先从选菜单开始。',
    },
    {
      id: 'wish-3',
      title: '一起拍一套四季合照',
      type: '想完成的事情',
      status: 'done',
      completedDate: '2025-12-21',
      reflection: '原来最珍贵的不是照片，是一起等过的四个季节。',
    },
  ],
  anniversaries: [
    {
      id: 'anniversary-1',
      title: '恋爱纪念日',
      date: '2023-05-20',
      repeatYearly: true,
      note: '每年都要认真庆祝我们又多了一年的故事。',
    },
    {
      id: 'anniversary-2',
      title: '小予的生日',
      date: '1998-09-18',
      repeatYearly: true,
      note: '提前准备蛋糕和一封手写信。',
    },
    {
      id: 'anniversary-3',
      title: '第一次见面',
      date: '2023-03-12',
      repeatYearly: true,
      note: '去第一次见面的地方喝一杯咖啡。',
    },
  ],
  messages: [
    {
      id: 'message-1',
      kind: 'message',
      author: '小予',
      date: '2026-07-30',
      content: '谢谢你总能记住我随口说过的小事。今天也很喜欢你。',
    },
    {
      id: 'letter-1',
      kind: 'letter',
      author: '阿川',
      date: '2026-08-01',
      openDate: '2027-05-20',
      title: '写给下一周年的我们',
      content: '希望打开这封信的时候，我们又一起收集了很多平凡却闪亮的日子。',
    },
  ],
}
