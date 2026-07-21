// Dữ liệu 7 ban cho trang /join-us.
// Khung field theo Refactor.md: Mission, Responsibilities, Requirements, Benefits, Growth Path.
// Tách khỏi translations.js vì đây là mảng lồng nhau, không phải dictionary phẳng.
//
// NOTE: nội dung dưới đây là bản nháp, cần rà lại trước khi công bố.

export const teams = [
  {
    slug: 'marketing',
    icon: 'campaign',
    name: { vi: 'Marketing', en: 'Marketing' },
    mission: {
      vi: 'Đưa BoardMates đến đúng người: những ai đang tìm một cộng đồng board game tử tế.',
      en: 'Bring BoardMates to the right people: those looking for a community built around board games.',
    },
    responsibilities: {
      vi: [
        'Lên kế hoạch và triển khai nội dung trên các kênh social của BoardMates',
        'Xây dựng câu chuyện thương hiệu, giữ giọng nói nhất quán',
        'Phối hợp với ban Design để sản xuất hình ảnh, video',
        'Theo dõi số liệu và điều chỉnh nội dung theo phản hồi thật',
      ],
      en: [
        'Plan and run content across BoardMates social channels',
        'Build the brand story and keep the voice consistent',
        'Work with Design to produce visuals and video',
        'Track metrics and adjust content based on real feedback',
      ],
    },
    requirements: {
      vi: [
        'Viết được tiếng Việt tự nhiên, rõ ràng',
        'Hiểu cách hoạt động của ít nhất một nền tảng social',
        'Chủ động đề xuất ý tưởng, không chờ giao việc',
      ],
      en: [
        'Write clear, natural Vietnamese',
        'Understand how at least one social platform works',
        'Propose ideas proactively rather than waiting for assignments',
      ],
    },
    benefits: {
      vi: [
        'Toàn quyền quyết định hướng nội dung ngay từ đầu',
        'Được thử nghiệm và sai, không bị bó bởi quy trình có sẵn',
        'Portfolio thật từ một dự án thật',
      ],
      en: [
        'Full ownership of content direction from day one',
        'Room to experiment and fail, unconstrained by legacy process',
        'A real portfolio from a real project',
      ],
    },
    growthPath: {
      vi: 'Content Contributor → Marketing Lead → định hình toàn bộ chiến lược thương hiệu.',
      en: 'Content Contributor → Marketing Lead → shaping the whole brand strategy.',
    },
  },
  {
    slug: 'design',
    icon: 'palette',
    name: { vi: 'Design', en: 'Design' },
    mission: {
      vi: 'Định hình ngôn ngữ hình ảnh của BoardMates, để nhìn là nhận ra.',
      en: 'Shape the BoardMates visual language so it is recognizable at a glance.',
    },
    responsibilities: {
      vi: [
        'Thiết kế ấn phẩm cho social, sự kiện và website',
        'Giữ và phát triển hệ thống nhận diện đã có',
        'Phối hợp với Product/Technology để thiết kế giao diện',
        'Xây dựng bộ template để cả team dùng lại được',
      ],
      en: [
        'Design assets for social, events, and the website',
        'Maintain and extend the existing identity system',
        'Work with Product/Technology on interface design',
        'Build templates the whole team can reuse',
      ],
    },
    requirements: {
      vi: [
        'Thành thạo ít nhất một công cụ thiết kế (Figma, Illustrator, Photoshop...)',
        'Có portfolio hoặc sản phẩm từng làm, không cần chuyên nghiệp',
        'Sẵn sàng nhận góp ý và chỉnh sửa nhiều lần',
      ],
      en: [
        'Comfortable with at least one design tool (Figma, Illustrator, Photoshop...)',
        'A portfolio or past work, however informal',
        'Willing to take feedback and iterate',
      ],
    },
    benefits: {
      vi: [
        'Được định hình nhận diện của một thương hiệu từ giai đoạn đầu',
        'Sản phẩm được dùng thật, không nằm trong ngăn kéo',
        'Làm việc trực tiếp với người quyết định, không qua nhiều tầng duyệt',
      ],
      en: [
        'Shape a brand identity from its earliest stage',
        'Work that actually ships instead of sitting in a drawer',
        'Direct access to decision-makers, no approval layers',
      ],
    },
    growthPath: {
      vi: 'Designer → Design Lead → sở hữu toàn bộ design system của BoardMates.',
      en: 'Designer → Design Lead → owning the entire BoardMates design system.',
    },
  },
  {
    slug: 'community',
    icon: 'groups',
    name: { vi: 'Community', en: 'Community' },
    mission: {
      vi: 'Biến một nhóm người lạ thành một cộng đồng thật sự muốn quay lại.',
      en: 'Turn a group of strangers into a community that genuinely wants to come back.',
    },
    responsibilities: {
      vi: [
        'Vận hành và giữ nhịp các kênh cộng đồng (Discord, Facebook Group)',
        'Chào đón thành viên mới, tạo không khí để người mới dám lên tiếng',
        'Lắng nghe phản hồi và chuyển lại cho các ban liên quan',
        'Kết nối với câu lạc bộ board game ở các trường đại học',
      ],
      en: [
        'Run and keep momentum in community channels (Discord, Facebook Group)',
        'Welcome new members and make it safe for them to speak up',
        'Listen for feedback and route it to the right team',
        'Connect with university board game clubs',
      ],
    },
    requirements: {
      vi: [
        'Thích nói chuyện với người lạ và kiên nhẫn với người mới',
        'Có mặt đều đặn, cộng đồng chết khi không ai ở đó',
        'Xử lý được mâu thuẫn nhỏ mà không làm to chuyện',
      ],
      en: [
        'Enjoy talking to strangers and have patience with newcomers',
        'Show up consistently — communities die when nobody is there',
        'Defuse small conflicts without escalating them',
      ],
    },
    benefits: {
      vi: [
        'Xây dựng cộng đồng từ thành viên số 0',
        'Hiểu sâu về vận hành cộng đồng, thứ không học được qua sách',
        'Quan hệ với mạng lưới câu lạc bộ và người chơi',
      ],
      en: [
        'Build a community from member zero',
        'Deep, hands-on understanding of community operations',
        'A network across clubs and players',
      ],
    },
    growthPath: {
      vi: 'Moderator → Community Lead → định hướng văn hoá của toàn cộng đồng.',
      en: 'Moderator → Community Lead → steering the culture of the whole community.',
    },
  },
  {
    slug: 'event',
    icon: 'event',
    name: { vi: 'Event', en: 'Event' },
    mission: {
      vi: 'Tổ chức những buổi gặp mà người tham gia muốn kể lại cho bạn bè.',
      en: 'Run gatherings that attendees want to tell their friends about.',
    },
    responsibilities: {
      vi: [
        'Lên ý tưởng và tổ chức Board Game Night, Workshop, Tournament',
        'Làm việc với board game café và các địa điểm đối tác',
        'Quản lý đăng ký, hậu cần và điều phối trong ngày diễn ra',
        'Tổng kết sau mỗi sự kiện để lần sau tốt hơn',
      ],
      en: [
        'Design and run Board Game Nights, Workshops, Tournaments',
        'Work with board game cafés and partner venues',
        'Handle registration, logistics, and day-of coordination',
        'Run a retro after each event so the next one is better',
      ],
    },
    requirements: {
      vi: [
        'Có tổ chức, nhớ được chi tiết nhỏ',
        'Bình tĩnh khi mọi thứ không diễn ra như kế hoạch',
        'Có thể có mặt vào cuối tuần, khi sự kiện thường diễn ra',
      ],
      en: [
        'Organized, and good with small details',
        'Calm when things do not go to plan',
        'Available on weekends, when events usually happen',
      ],
    },
    benefits: {
      vi: [
        'Kinh nghiệm tổ chức sự kiện thật, từ đầu tới cuối',
        'Quan hệ với chuỗi café và địa điểm ở địa phương',
        'Thấy ngay kết quả công việc của mình trên gương mặt người tham gia',
      ],
      en: [
        'Real end-to-end event experience',
        'Relationships with local cafés and venues',
        'Immediate, visible results on attendees faces',
      ],
    },
    growthPath: {
      vi: 'Event Crew → Event Lead → xây dựng chuỗi sự kiện thường niên của BoardMates.',
      en: 'Event Crew → Event Lead → building the BoardMates recurring event series.',
    },
  },
  {
    slug: 'business-development',
    icon: 'handshake',
    name: { vi: 'Business Development', en: 'Business Development' },
    mission: {
      vi: 'Xây mạng lưới đối tác để BoardMates đi được đường dài.',
      en: 'Build the partner network that lets BoardMates last.',
    },
    responsibilities: {
      vi: [
        'Tìm và tiếp cận đối tác: café, cửa hàng, nhà xuất bản, nhà sáng tạo',
        'Đàm phán hợp tác đôi bên cùng có lợi',
        'Duy trì quan hệ với đối tác đã có',
        'Tìm hướng để dự án tự nuôi được mình',
      ],
      en: [
        'Find and approach partners: cafés, stores, publishers, creators',
        'Negotiate partnerships that work for both sides',
        'Maintain relationships with existing partners',
        'Find paths for the project to sustain itself',
      ],
    },
    requirements: {
      vi: [
        'Tự tin bắt chuyện với người chưa quen',
        'Nghĩ được từ góc nhìn của đối phương, không chỉ của mình',
        'Kiên trì, phần lớn lời mời hợp tác sẽ bị từ chối',
      ],
      en: [
        'Comfortable starting conversations with strangers',
        'Able to think from the other side perspective',
        'Persistent — most partnership pitches get turned down',
      ],
    },
    benefits: {
      vi: [
        'Mạng lưới quan hệ trong ngành board game Việt Nam',
        'Kinh nghiệm đàm phán thật với đối tác thật',
        'Ảnh hưởng trực tiếp tới việc dự án có sống được hay không',
      ],
      en: [
        'A network inside the Vietnamese board game scene',
        'Real negotiation experience with real partners',
        'Direct influence on whether the project survives',
      ],
    },
    growthPath: {
      vi: 'BD Executive → BD Lead → định hình mô hình phát triển của BoardMates.',
      en: 'BD Executive → BD Lead → shaping the BoardMates growth model.',
    },
  },
  {
    slug: 'product',
    icon: 'lightbulb',
    name: { vi: 'Product', en: 'Product' },
    mission: {
      vi: 'Quyết định BoardMates nên làm gì tiếp theo, và quan trọng hơn là không nên làm gì.',
      en: 'Decide what BoardMates builds next — and more importantly, what it does not.',
    },
    responsibilities: {
      vi: [
        'Thu thập nhu cầu từ cộng đồng và chuyển thành yêu cầu cụ thể',
        'Sắp thứ tự ưu tiên, quyết định làm gì trước',
        'Phối hợp với Design và Technology từ ý tưởng tới khi ra mắt',
        'Đo lường xem thứ vừa làm có thật sự hữu ích không',
      ],
      en: [
        'Gather community needs and turn them into concrete requirements',
        'Prioritize — decide what gets built first',
        'Work with Design and Technology from idea to launch',
        'Measure whether what shipped is actually useful',
      ],
    },
    requirements: {
      vi: [
        'Suy nghĩ có cấu trúc, biết đặt câu hỏi đúng',
        'Dám nói không với ý tưởng hay nhưng chưa cần thiết',
        'Viết được yêu cầu rõ ràng để người khác hiểu và làm theo',
      ],
      en: [
        'Structured thinking, asks the right questions',
        'Willing to say no to good-but-not-yet ideas',
        'Writes requirements clearly enough for others to act on',
      ],
    },
    benefits: {
      vi: [
        'Quyền quyết định hướng sản phẩm từ giai đoạn sớm nhất',
        'Làm việc xuyên suốt với mọi ban',
        'Thấy toàn cảnh cách một sản phẩm hình thành',
      ],
      en: [
        'Product direction ownership from the earliest stage',
        'Work across every team',
        'See the full picture of how a product comes together',
      ],
    },
    growthPath: {
      vi: 'Product Contributor → Product Lead → định hình lộ trình toàn nền tảng.',
      en: 'Product Contributor → Product Lead → owning the whole platform roadmap.',
    },
  },
  {
    slug: 'technology',
    icon: 'code',
    name: { vi: 'Technology', en: 'Technology' },
    mission: {
      vi: 'Xây và giữ nền tảng kỹ thuật để mọi thứ còn lại chạy được.',
      en: 'Build and keep the technical foundation everything else runs on.',
    },
    responsibilities: {
      vi: [
        'Phát triển website và các tính năng của nền tảng',
        'Giữ hệ thống chạy ổn định, sửa lỗi khi phát sinh',
        'Phối hợp với Product và Design để hiện thực hoá ý tưởng',
        'Ghi lại tài liệu để người sau tiếp nhận được',
      ],
      en: [
        'Build the website and platform features',
        'Keep the system running and fix issues as they surface',
        'Work with Product and Design to realize ideas',
        'Document things so the next person can pick them up',
      ],
    },
    requirements: {
      vi: [
        'Biết ít nhất một ngôn ngữ lập trình và Git',
        'Tự tìm hiểu được thứ chưa biết',
        'Không cần kinh nghiệm đi làm, cần sự chủ động',
      ],
      en: [
        'Know at least one programming language and Git',
        'Able to learn what you do not yet know',
        'Work experience not required; initiative is',
      ],
    },
    benefits: {
      vi: [
        'Làm trên codebase thật với người dùng thật',
        'Được chọn công nghệ và cách làm, không bị áp đặt',
        'Kinh nghiệm full-stack từ dựng tới vận hành',
      ],
      en: [
        'Work on a real codebase with real users',
        'Choose the technology and approach yourself',
        'Full-stack experience from building to operating',
      ],
    },
    growthPath: {
      vi: 'Developer → Tech Lead → quyết định kiến trúc của toàn nền tảng.',
      en: 'Developer → Tech Lead → owning the architecture of the whole platform.',
    },
  },
];
