# Simeplify 前端架构与全功能细节详解手册 (Frontend Features Breakdown)

本文档面向前端工程师与产品设计团队，对 **Simeplify**（Oakridge 绿色生态社区应用）的全部已实现功能、页面路由、核心组件、状态流转、交互逻辑与设计系统细节进行深度拆解。

---

## 目录
1. [系统总体技术架构与设计规范](#1-系统总体技术架构与设计规范)
2. [Feature 1: Community 社区生态中心与绿叶挑战](#2-feature-1-community-社区生态中心与绿叶挑战)
3. [Feature 2: Waste Sorting AI Bin 智能垃圾识别与投放](#3-feature-2-waste-sorting-ai-bin-智能垃圾识别与投放)
4. [Feature 3: Simulator 家居能耗与虚拟居民孪生模拟器](#4-feature-3-simulator-家居能耗与虚拟居民孪生模拟器)
5. [Feature 4: Scanner 水电账单 AI 解析与漏水预警](#5-feature-4-scanner-水电账单-ai-解析与漏水预警)
6. [Feature 5: Profile 个人与家庭生态档案](#6-feature-5-profile-个人与家庭生态档案)
7. [Feature 6: Auth & Onboarding 鉴权与新手引导](#7-feature-6-auth--onboarding-鉴权与新手引导)
8. [公共设计系统与底层服务库 (Shared Foundation)](#8-公共设计系统与底层服务库-shared-foundation)

---

## 1. 系统总体技术架构与设计规范

### 1.1 技术选型
- **底层框架**: Expo SDK 58 + React Native 0.88 (跨移动端与 Web 响应式)
- **文件路由**: Expo Router v58 (基于 `src/app` 目录树组织路由)
- **样式与排版**: NativeWind / Tailwind CSS v3.4 + React Native StyleSheet
- **矢量图形**: `react-native-svg` (用于精准仪表盘、环形进度圈与户型图绘制)
- **图标系统**: `lucide-react-native`
- **动画引擎**: `react-native-reanimated` v4.7
- **字体规范**:
  - 衬线标题字体: `Lora_600SemiBold` / `Lora_500Medium`
  - 无衬线正文字体: `SourceSans3_400Regular` / `SourceSans3_600SemiBold` / `SourceSans3_700Bold`

### 1.2 移动端优先视口规范 (Strict Mobile Viewport)
为了在桌面端 Web 和宽屏调试时保持 100% 还原手机体验，所有主页面均采用严格的移动视口约束：
- 最大宽度: `maxWidth: 430px`
- 居中对齐: `alignSelf: 'center', width: '100%'`
- 外围背景: `#ede7df` (柔和中性衬底)，主界面背景: `#FAF6F1` (温暖生态奶油白)
- 底部安全边距: `paddingBottom: 112px` (避免内容被悬浮底部 Tab 栏遮挡)

---

## 2. Feature 1: Community 社区生态中心与绿叶挑战

- **页面入口**: [`src/app/(tabs)/community.tsx`](file:///c:/laragon/www/Simeplify/frontend/src/app/(tabs)/community.tsx)
- **核心定位**: Oakridge Commons（240 户）月度 30 天生态挑战聚合中心，串联投票倡议、日常打卡、环形生命之叶状态与社区大盘协作。

### 2.1 动态旅程生命周期 (Voting & Challenge Phases)
社区页面基于住户的月度旅程动态流转三种状态，顶部的原生应用头部与主内容区无缝联动：

1. **Phase 1: Initial / New Letter (信封源阶段)**
   - 顶部单标签显示: `"Monthly Letter"`（附带带小红点的信封图标）。
   - 主界面加载: [`NewLetterHome.tsx`](file:///c:/laragon/www/Simeplify/frontend/src/features/community/components/NewLetterHome.tsx)，呈现 Cedar Grove 社区信箱插画与未开封月度信函卡片。
   - 交互: 点击 `"Open Letter"` 触发 [`VotingLetterModal.tsx`](file:///c:/laragon/www/Simeplify/frontend/src/features/community/components/VotingLetterModal.tsx) 投票弹窗。
2. **Phase 2: Voted / Waiting (选票封存阶段)**
   - 顶部单标签显示: `"Ballot Sealed"`（附带绿色勾选对勾），表明投票已提交。
   - 主界面加载: [`VotedWaitingView.tsx`](file:///c:/laragon/www/Simeplify/frontend/src/features/community/components/VotedWaitingView.tsx)，显示飞鸽邮差封存选票动效、家庭投票选项（如 "Plant a tree"）、提交时间与已投票户数统计（185/240 户）。
   - 交互: 点击 `"View Results & Audit"` 唤起 [`AnnouncementModal.tsx`](file:///c:/laragon/www/Simeplify/frontend/src/features/community/components/AnnouncementModal.tsx) 计票公示浮层。
3. **Phase 3: Living Task (挑战正式开启阶段)**
   - 顶部切换为 `"Living Task • Day 1"` 独立药丸标签，**彻底销毁卸载 "Ballot Sealed" 标签**，视觉居中。
   - 主界面加载: [`LivingLeafHome.tsx`](file:///c:/laragon/www/Simeplify/frontend/src/features/community/components/LivingLeafHome.tsx)，进入日常绿叶养成与任务打卡。

### 2.2 生命之叶双版本渲染 (Living Leaf: Healthy vs. Dry)
在 [`LivingLeafHome.tsx`](file:///c:/laragon/www/Simeplify/frontend/src/features/community/components/LivingLeafHome.tsx) 中完整实现了两个版本的状态展示，且通过 `flex-col`, `items-center`, `gap-4` 彻底杜绝文字与图表重叠：

- **Variation 1: Healthy State (Thriving 茁壮生长态)**
  - 视觉: 环形 SVG 进度条高亮 50% (`1/2 deeds`)，中心为绿意盎然的 Living Leaf 表盘。
  - 徽章位置: **圆环正下方独立排版**，深绿底白字 `"1 / 2 deeds"`，零重叠。
  - 状态标签: `"Healthy Stage • 1 action today"` (`bg-[#E5ECE0]`, 墨绿小圆点)。
  - 主副标题: `"Living Leaf is Thriving"`，副标题说明再完成 1 项绿行即可解锁明日 Lush 繁茂状态。
  - 阶段步进器: 高亮选中中间的 `Healthy (Active)`，其余两项为中性灰色。
- **Variation 2: Dry State (0 Actions Penalty 枯萎受罚态)**
  - 场景: 住户前一天未完成任何环保行动。
  - 视觉: 环形 SVG 为 0% 虚线干旱圆环，中心为 45° 倾斜、凋落干枯的秋褐色叶片。
  - 徽章位置: 圆环正下方独立排版，深焦糖褐底白字 `"0 / 2 deeds"`。
  - 状态标签: `"Dry Stage • 0 actions today"` (`bg-amber-100`, `text-amber-800`)。
  - 主副标题: `"Living Leaf is Dry"`，提示前一日零行动，完成任意一项即可复活。
  - 阶段步进器: 高亮选中 `Dry (0) • Active`，并弹出惩罚与即刻复活提示卡片。

### 2.3 Oakridge 社区实时大盘 (Community Activity Dashboard)
- **组件实现**: [`CommunityActivityDashboard.tsx`](file:///c:/laragon/www/Simeplify/frontend/src/features/community/components/CommunityActivityDashboard.tsx)
- **弹窗包装**: [`OakridgeStatsModal.tsx`](file:///c:/laragon/www/Simeplify/frontend/src/features/community/components/OakridgeStatsModal.tsx)
- **核心模块**:
  1. 标题与社区区块标识: `"Oakridge Commons • Sector 4B"`，标题 `"Today's Community Activity"`。
  2. 全局进度卡片: **225 of 240 households active (94% participation)**，带呼吸绿点 `Live` 标签、94% 进度条与活跃/待办住户明细。
  3. 环形追踪器与枯萎警示对比卡片: 规范外置徽章，分别展示 Healthy 与 Withered 状态对比。

### 2.4 独立开发者测试控制台 (Demo State Navigator)
- **组件实现**: [`DemoControlsPanel.tsx`](file:///c:/laragon/www/Simeplify/frontend/src/features/community/components/DemoControlsPanel.tsx)
- **视觉隔离特征**: 采用 `bg-gray-100` 浅灰底色、`border-dashed border-gray-400` 虚线边框以及明显的 `"Demo State Navigator • DEV PANEL"` 标识，确保与真实商业 UI 完全区分。
- **功能集成**:
  - 5 项旅程状态瞬时切换: `Envelope Source` -> `Waiting Page` -> `Announce Voting` -> `Living Task` -> `Announce Final`。
  - Living Leaf 双版本即时切换: `🌿 Healthy (Thriving)` vs `🍂 Dry State (0 Actions)`。
  - 一键 Reset 重置所有打卡与投票状态。

---

## 3. Feature 2: Waste Sorting AI Bin 智能垃圾识别与投放

- **Tab 路由入口**: [`src/app/(tabs)/bin.tsx`](file:///c:/laragon/www/Simeplify/frontend/src/app/(tabs)/bin.tsx)
- **子路由栈**:
  - `src/app/bin/scanner.tsx`: 实时相机扫码识别界面
  - `src/app/bin/result.tsx`: AI 识别判定结果、拆解指引与投放确认
  - `src/app/bin/upload.tsx`: 本地相册选取与图片上传
- **核心功能定位**: 借助 Google Gemini 视觉多模态能力，对住户包装盒、塑料瓶、金属玻璃进行精准分类，提供清洗分离建议并打卡积分。

### 3.1 四流分类体系 (Four-Stream Bins)
- **Paper (纸类 - 蓝色)**: 纸盒、快递纸箱、报纸，指引压扁去除胶带。
- **Plastic (塑料 - 橙色)**: PET 饮料瓶、HDPE 瓶身，指引冲洗沥干、取下瓶盖。
- **Glass / Metal (玻璃与金属 - 棕色)**: 玻璃调味瓶、铝易拉罐，指引清空内物防碎。
- **General (其他一般废弃物 - 深灰)**: 厨余废渣、受污染油腻餐盒，指引妥善密封。

### 3.2 扫描识别状态流 (Scan Result States)
在 [`BinScanResultScreen.tsx`](file:///c:/laragon/www/Simeplify/frontend/src/features/bin/BinScanResultScreen.tsx) 中支持 4 种 UI 状态：
1. **Loading (叶片动态自旋等待)**:
   - 动画: Reanimated `withRepeat(withTiming)` 驱动的自研 `LeafSpinner` 动效。
   - 提示语: *"Analyzing waste with Gemini... Identifying material and sorting stream"*.
2. **Success (高置信度识别结果)**:
   - 顶部展示拍摄原图与识别物料卡片（如 PET 塑料水瓶、瓦楞纸箱）。
   - 投递容器高亮卡片（匹配对应的桶位色彩与图标）。
   - **分离处置步骤 (Separation Steps)**:
     - 步骤 1: 拧开瓶盖，投入塑料桶；
     - 步骤 2: 撕下 PVC 标签条；
     - 步骤 3: 压扁瓶身以节约回收空间。
   - 确认投放按钮: 点击调用 `confirmDisposal`，触发 `+10 points` 成功 Toast。
3. **Low Confidence (低置信度状态)**:
   - 黄色警告图标，提示 *"Not sure. Please retake the photo."*。
   - 引导住户在良好光线下方正摆放废弃物，提供「重拍」与「手动选择桶位」双按钮。
4. **Error / Timeout (网络异常态)**:
   - 红色警示图标，提示 *"Classification failed"*，提供重试机制。

### 3.3 业务服务层抽象
- [`src/lib/services/binService.ts`](file:///c:/laragon/www/Simeplify/frontend/src/lib/services/binService.ts):
  - 严格遵守 Screen 纯渲染规范，数据修改由 `classifyWaste` 与 `confirmDisposal` 集中处理。
  - 内置 `LEAF_DAILY_DEED_CAP = 3` 每日打卡上限防刷机制。

---

## 4. Feature 3: Simulator 家居能耗与虚拟居民孪生模拟器

- **Tab 路由入口**: [`src/app/(tabs)/simulator.tsx`](file:///c:/laragon/www/Simeplify/frontend/src/app/(tabs)/simulator.tsx)
- **功能目录**: `src/features/simulator/` (包含 23 个专用组件与逻辑模块)
- **核心定位**: 模拟 Oakridge 户型能耗的数字孪生系统，结合户型图摆放、虚拟居民 24 小时日常作息、家电发光联动与马来西亚 TNB 阶梯电价账单测算。

### 4.1 户型图网格坐标与摆放系统
- **网格规范**: 4 房间网格系统 (`gridCol`, `gridRow`, `gridColSpan`, `gridRowSpan`)
  - 客厅 (Living Room, 0,0, 2x2)
  - 厨房 (Kitchen, 2,0, 2x2)
  - 卧室 (Bedroom, 0,2, 2x2)
  - 浴室 (Bathroom, 2,2, 2x2)
- **房间自定义**: 支持点击房间唤起 [`RoomNamingModal.tsx`](file:///c:/laragon/www/Simeplify/frontend/src/features/simulator/components/RoomNamingModal.tsx) 进行自定义重命名。
- **家电/家具拖拽摆放**:
  - 组件: [`PlacedItem.tsx`](file:///c:/laragon/www/Simeplify/frontend/src/features/simulator/components/PlacedItem.tsx), [`Sprite.tsx`](file:///c:/laragon/www/Simeplify/frontend/src/features/simulator/components/Sprite.tsx)
  - 库目录: 空调 (Inverter / Non-Inverter)、吊扇、电视机、冰箱、电磁炉、洗衣机、热水器等。
  - 属性配置: 可以在 [`ApplianceDetailsSheet.tsx`](file:///c:/laragon/www/Simeplify/frontend/src/features/simulator/components/ApplianceDetailsSheet.tsx) 中设定功率 (Watt)、每日使用时长与星级能效。

### 4.2 虚拟居民 24 小时日常模拟引擎 (Avatar & Routine Engine)
- **核心逻辑模块**: [`SimulationEngine.ts`](file:///c:/laragon/www/Simeplify/frontend/src/features/simulator/logic/SimulationEngine.ts)
- **寻路算法**: `buildWaypoints` 自动在房间几何中心点之间生成平滑拐角路径，虚拟角色沿着路径平滑移动。
- **时间系统**:
  - 24 小时分钟级时钟系统（`00:00` 到 `23:59`）。
  - 倍速控制 ([`FastForwardPanel.tsx`](file:///c:/laragon/www/Simeplify/frontend/src/features/simulator/components/FastForwardPanel.tsx)): 支持 1x、2x、5x、10x 模拟流速切换。
- **作息时刻表 (MyDay Timeline)**:
  - 见 [`MyDayTimelineSheet.tsx`](file:///c:/laragon/www/Simeplify/frontend/src/features/simulator/components/MyDayTimelineSheet.tsx)
  - 默认日常块:
    - 00:00 - 07:00: 卧室睡眠 (开启卧室变频空调与风扇)
    - 07:00 - 08:30: 厨房做早餐与热水冲澡
    - 08:30 - 18:00: 外出办公 (仅冰箱维持保鲜功耗，其余家电休眠)
    - 18:30 - 20:00: 厨房烹饪晚饭、开启抽油烟机
    - 20:00 - 23:00: 客厅休闲观影 (开启客厅 65寸 TV 与客厅空调)
- **家电实时联动光晕 (Appliance Glows)**:
  - 当虚拟角色进入该房间并处于相应日程时，对应家电周围渲染动态光晕，直观体现用电负载。

### 4.3 TNB 马来西亚电费实时测算引擎
- **函数实现**: `computeSimulationBill`
- **阶梯电价算法**:
  - 第 1 档 (1 - 200 kWh): RM 0.218 / kWh
  - 第 2 档 (201 - 300 kWh): RM 0.334 / kWh
  - 第 3 档 (301 - 600 kWh): RM 0.516 / kWh
  - 第 4 档 (601 - 900 kWh): RM 0.546 / kWh
  - 第 5 档 (901 kWh 以上): RM 0.571 / kWh
- **账单卡片与节能建议**:
  - [`BillCard.tsx`](file:///c:/laragon/www/Simeplify/frontend/src/features/simulator/components/BillCard.tsx): 实时展示预计月度用电量 (kWh) 与预计电费 (RM)。
  - [`SuggestionArea.tsx`](file:///c:/laragon/www/Simeplify/frontend/src/features/simulator/components/SuggestionArea.tsx): 测算出替换定频空调为 5 星变频后每月可节省的费用 (如 *"Save RM 42.50/mo by upgrading Bedroom AC"*).

---

## 5. Feature 4: Scanner 水电账单 AI 解析与漏水预警

- **Tab 路由入口**: [`src/app/(tabs)/scanner.tsx`](file:///c:/laragon/www/Simeplify/frontend/src/app/(tabs)/scanner.tsx)
- **核心组件集**: `src/components/scanner/`
- **核心定位**: 支持 TNB 电费账单与 Air Selangor 水费账单拍摄/PDF 上传，自动 OCR 提取关键计量数据，比对历史能耗并提供水管爆裂/暗漏预警。

### 5.1 上传与 OCR 解析底抽屉 (Check and Correct Sheet)
- **组件实现**: [`CheckAndCorrectSheet.tsx`](file:///c:/laragon/www/Simeplify/frontend/src/components/scanner/CheckAndCorrectSheet.tsx)
- **AI 提取关键字段**:
  - 供应机构: `TNB` (电) / `Air Selangor` (水)
  - 账单月份: `October 2026`
  - 实际计量用量: `525 kWh` 或 `28 m³`
  - 账单金额: `RM 184.20`
- **防错校验机制**: 允许住户在确认前对 AI 提取出的金额和读数进行手工二次校对与修改。

### 5.2 漏水检测与水资源预警算法 (Water Alert Levels)
- **算法文件**: [`src/lib/waterLevel.ts`](file:///c:/laragon/www/Simeplify/frontend/src/lib/waterLevel.ts)
- **算法输入**: `volumeM3` (本月用水量), `momPercent` (环比增长率), `residents` (居住人口)
- **分级阈值**:
  1. `normal`: 用量在家庭人均定额内，环比无剧增；
  2. `leak_detected`: 环比增长超过 30%，检测到持续微量走字，提示暗漏检查；
  3. `major_pipe_burst`: 环比增长超过 45% 且总量超标，触发严重红色预警卡片 ([`WaterAlert.tsx`](file:///c:/laragon/www/Simeplify/frontend/src/components/scanner/WaterAlert.tsx))，弹出报修电话与物业即刻检修指引。

### 5.3 历史能耗走势与节能打卡
- [`UsageChart.tsx`](file:///c:/laragon/www/Simeplify/frontend/src/components/scanner/UsageChart.tsx): 柱状对比过去 6 个月的电/水走势，标出基准节能线 (< 280 kWh)。
- 确认保存后触发 [`awardEnergyPoints`](file:///c:/laragon/www/Simeplify/frontend/src/lib/services/scannerService.ts)，若低于历史基线自动发放绿色奖励积分。

---

## 6. Feature 5: Profile 个人与家庭生态档案

- **Tab 路由入口**: [`src/app/(tabs)/profile.tsx`](file:///c:/laragon/www/Simeplify/frontend/src/app/(tabs)/profile.tsx)
- **界面组件**: [`ProfileScreen.tsx`](file:///c:/laragon/www/Simeplify/frontend/src/features/profile/ProfileScreen.tsx)
- **核心模块**:
  1. **住户身份名片**:
     - 头像与家庭单元号: `Oakridge Commons • Block 4B-12`
     - 生态称号: `Oak Guardian (橡树卫士)` / `Green Sapling (绿意树苗)`
  2. **三大量化资产看板**:
     - `Points Balance`: 累计生态积分 (如 2,840 pts)
     - `Active Streak`: 连续打卡天数 (如 18 Days Streak)
     - `CO₂ Offset`: 累计碳减排千克数 (如 142 kg CO₂)
  3. **生态凭证与兑换券 (Vouchers & Rewards)**:
     - 认领的小树苗编号证书: `Sapling Plot #42 Certificate`
     - Sime Darby 社区商场有机蔬果 50% 折扣券
  4. **系统设置项**: 房门钥匙绑定、能耗异常即时推送通知、隐私协议与登出操作。

---

## 7. Feature 6: Auth & Onboarding 鉴权与新手引导

- **路由目录**: `src/app/(auth)/` 与 `src/app/(onboarding)/`

### 7.1 登录与注册流程
- [`login.tsx`](file:///c:/laragon/www/Simeplify/frontend/src/app/(auth)/login.tsx):
  - 干净极简的自然生态美学设计，支持住户手机号/密码或短信快捷登录。
  - 输入框配备清晰的视觉焦点态与错误校验提示。
- [`sign-up.tsx`](file:///c:/laragon/www/Simeplify/frontend/src/app/(auth)/sign-up.tsx):
  - Oakridge 住户单元绑定（单元门牌号、业主身份证件校验）。

### 7.2 新手引导配置流 (3步快速初始化)
- `src/app/(onboarding)/layout.tsx`: 户型选择（1房、2房、3房或复式）。
- `src/app/(onboarding)/appliances.tsx`: 勾选家里主要拥有的大功率电器。
- `src/app/(onboarding)/schedule.tsx`: 设定家庭主要作息习惯（早出晚归、居家办公、学生家庭等），自动写入模拟器的默认作息表。

---

## 8. 公共设计系统与底层服务库 (Shared Foundation)

### 8.1 视觉设计系统规范 (`src/components/`)
| 组件名称 | 路径 | 核心设计细节 |
| :--- | :--- | :--- |
| `Header` | `src/components/Header.tsx` | 支持三种变体：`brand`（带小树徽标）、`back-and-title`（二级返回标题）、`modal` |
| `Card` | `src/components/Card.tsx` | 20px 圆角，`#FFFFFF` 背景，细致的 `#E7E5E4` 边框与温润微投影 |
| `MiniCard` | `src/components/MiniCard.tsx` | 双列并排微型指标卡片，常用于展示 `Energy Saved` 与 `Points Earned` |
| `Badge` | `src/components/Badge.tsx` | 药丸形态标签，支持 `success`, `warning`, `error`, `neutral` 四种配色系统 |
| `Button` | `src/components/Button.tsx` | 严谨的触控微反馈，主按钮采用森林墨绿 `#566549`，字重 700 |
| `Toast` | `src/components/Toast.tsx` | 全局 Context 驱动的顶部悬浮轻提示，支持自动出入栈动画 |
| `EmptyState` | `src/components/EmptyState.tsx` | 空白态插画与引导行动占位卡片 |

### 8.2 调色板 (Color Palette)
```typescript
export const PALETTE = {
  background: '#FAF6F1',      // 奶油米白主底色
  neutralCard: '#FFFFFF',     // 纯白卡片
  forestPrimary: '#4A6D56',   // 森林鼠尾草主绿
  forestDeep: '#263321',      // 深墨绿（用于徽章底色）
  textDark: '#1C1917',        // 标题与主正文字色 (Stone-900)
  textMuted: '#57534E',       // 次级说明文本字色 (Stone-600)
  amberWarningBg: '#FEF3C7',  // 枯萎与警报浅黄底色 (Amber-100)
  amberWarningText: '#92400E',// 枯萎与警报文字色 (Amber-800)
  borderNeutral: '#E7E5E4',   // 边框中性灰
  borderDashed: '#9CA3AF',    // 开发者面板虚线边框色
};
```

### 8.3 数据流向与代码组织规则
1. **纯渲染与业务解耦**: 所有的 UI Screen 严禁直接写入硬编码业务状态，数据读写统一通过各 Feature 下的 `logic/`、`services/` 或全局 Context 调度。
2. **零重叠排版铁律**: 所有文本和动态指标容器一律声明 `flex: 1`, `minWidth: 0`, `flexShrink: 1` 与确定的 `lineHeight`，严禁用绝对定位覆盖动态文字。
3. **安全类型体系**: 所有的 Feature 均拥有严格的 `types.ts` 定义，编译期执行 `npx tsc --noEmit` 保持 0 类型报错。

---
*文档版本: v1.0.0 (2026-10-20)*  
*生成自 Simeplify 核心工程代码库*
