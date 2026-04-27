<!-- Improved compatibility of back to top link: See: https://github.com/othneildrew/Best-README-Template/pull/73 -->
<a id="readme-top"></a>

<br />
<div align="center">
  <a href="#readme-top">
    <img src="src/icons/icon128.png" alt="Logo" width="80" height="80">
  </a>

  <h3 align="center">基金看板</h3>

  <p align="center">
    一个面向 Chrome / Edge 的基金信息看板扩展，适合在浏览器小窗中快速查看自选基金、持仓收益、分组列表、指数行情和持仓明细。
    <br />
    基于 Vue 2、Webpack 4 与 Chrome Extension Manifest V3 构建。
    <br />
    <a href="#快速开始"><strong>开始阅读 »</strong></a>
  </p>
</div>

<details>
  <summary>目录</summary>
  <ol>
    <li>
      <a href="#关于项目">关于项目</a>
      <ul>
        <li><a href="#技术组成">技术组成</a></li>
      </ul>
    </li>
    <li>
      <a href="#快速开始">快速开始</a>
      <ul>
        <li><a href="#前置条件">前置条件</a></li>
        <li><a href="#安装方式">安装方式</a></li>
      </ul>
    </li>
    <li><a href="#使用说明">使用说明</a></li>
    <li><a href="#后续计划">后续计划</a></li>
    <li><a href="#许可证">许可证</a></li>
  </ol>
</details>

## 关于项目

这个项目的核心形态不是普通网页，而是一个浏览器扩展：你安装后会通过 popup 小窗查看基金分组、收益概览、指数行情和持仓相关信息，并通过设置页调整显示方式、角标提醒和数据管理。

> 当前截图资源已统一放在 `docs/images/readme/` 目录下，下面的展示区已经使用这些真实路径。

当前可对应的主要页面包括：

* 基金首页：展示指数概览、当前分组、收益概览、基金列表与底部快捷操作
* 编辑页：用于向当前分组添加基金，并进入持仓控制面板
* 仓位管理页：维护单只基金的加仓 / 减仓记录、持仓成本与历史记录
* 设置页面：调整基础显示、主题、角标提醒和数据管理相关选项
* 大盘行情页：查看市场资金流向、成交额变化和整体行情概览

它更适合这些场景：

* 想在桌面端高频查看基金涨跌、估值和持仓收益
* 需要按主题、策略或账户分组管理基金
* 希望把基金详情、指数行情、持仓结构和常用设置收在同一个扩展里

这也是它值得使用的原因：

* 你可以把高频查看基金状态的动作压缩到浏览器小窗里完成
* 你不需要为了看估值、收益、分组和行情在多个页面之间来回切换
* 当前仓库已经把 popup、设置页、bridge 链路和打包脚本组织成一套完整的扩展工程

仓库里的实现还明确体现了这些事实：

* Popup 主界面包含当前分组、收益概览和运行状态等总览信息
* 持仓相关能力通过 bridge 链路获取，并依赖东方财富相关页面与接口环境
* 设置页覆盖基础显示、角标提醒和数据管理等配置

### 页面展示

#### 基金首页

[![基金首页][fund-home-screenshot]](docs/images/readme/fund-home.png)

这一页适合作为 README 的主展示图，重点体现：

* 指数概览区
* 当前分组与收益概览
* 基金列表与底部快捷操作

#### 编辑页

[![编辑页][edit-page-screenshot]](docs/images/readme/edit-page.png)

这一页适合展示分组编辑模式，包括：

* 向当前分组添加基金
* 分组轨道切换
* 持仓控制面板入口

#### 仓位管理页

[![仓位管理页][position-manager-screenshot]](docs/images/readme/position-manager.png)

这一页适合突出仓位维护能力，包括：

* 加仓 / 减仓模式
* 持仓成本与当前份额
* 历史记录维护

#### 设置页面

[![设置页面][settings-page-screenshot]](docs/images/readme/settings-page.png)

这一页适合展示 popup 设置页中当前清晰可见的显示与列表配置，包括：

* 主题模式
* 字号密度、界面灰度与背景透明度
* 基础信息与收益信息开关项

#### 大盘行情页

[![大盘行情页][market-detail-screenshot]](docs/images/readme/market-detail.png)

这一页适合说明市场行情与资金观察能力，包括：

* 大盘资金流向概览
* 两市成交额与涨跌家数
* 资金净流入走势

<p align="right">(<a href="#readme-top">回到顶部</a>)</p>

### 技术组成

* Vue 2
* Webpack 4
* Element UI
* ECharts
* Chrome Extension Manifest V3

<p align="right">(<a href="#readme-top">回到顶部</a>)</p>

## 快速开始

下面是基于当前仓库真实脚本整理的本地启动方式。这个项目不是传统 Web 服务，不需要运行本地站点；核心路径是安装依赖、构建扩展、再在浏览器中加载 `dist/` 目录。

### 前置条件

* Node.js >= 10
* npm
* 支持 Manifest V3 的 Chrome / Edge 浏览器

### 安装方式

1. 安装依赖
   ```sh
   npm install
   ```
2. 构建扩展
   ```sh
   npm run build
   ```
3. 打开 Chrome / Edge 扩展管理页
4. 开启“开发者模式”
5. 选择“加载已解压的扩展程序”
6. 选择项目下的 `dist/` 目录

如果你是在开发过程中持续调试，也可以使用：

```sh
npm run watch:dev
```

如果你需要生成压缩包：

```sh
npm run build-zip
```

该命令会读取 `package.json` 中的 `name` 和 `version`，并在 `dist-zip/` 下生成形如 `fund-dashboard-v1.0.0.zip` 的压缩包。

<p align="right">(<a href="#readme-top">回到顶部</a>)</p>

## 使用说明

安装后可以按下面的最小路径开始使用：

1. 点击浏览器工具栏中的“基金看板”图标，打开 popup 小窗
2. 在主界面查看当前分组、当日估值收益、持有收益和运行状态
3. 进入基金列表，按分组管理自选基金，查看详情、行情和持仓信息
4. 打开设置页，调整显示方式、角标提醒和数据管理相关选项

如果你从界面结构理解这个扩展，当前最典型的使用流转是：

1. 从基金首页查看指数、分组和收益概览
2. 进入编辑页管理当前分组中的基金
3. 在仓位管理页维护加仓 / 减仓记录与持仓成本
4. 在设置页面调整显示、主题和提醒方式
5. 在大盘行情页查看市场资金流向与整体成交信息

在使用前，建议了解几个与当前实现直接相关的约束：

* 基金相关数据主要来自东方财富 / 天天基金公开接口
* 扩展当前会访问以下公开接口域名：
  * `https://fundmobapi.eastmoney.com/*`
  * `https://fundsuggest.eastmoney.com/*`
  * `https://push2.eastmoney.com/*`
  * `https://fundgz.1234567.com.cn/*`
* 内容脚本会在 `https://*.eastmoney.com/*` 页面运行，用于配合持仓桥接能力
* 盘中数据可能存在延迟，历史净值和持仓披露也可能滞后
* 浏览器小窗受宿主环境和网络状态影响，刷新体验不一定始终稳定
* README 中列出的权限、访问域名和数据来源，以当前仓库中的配置和代码为准

如果你想继续了解实现细节，当前仓库里最关键的结构如下：

```text
src/
  background.js            后台逻辑、角标、代理请求
  manifest.json            扩展清单
  popup/                   主弹窗
  options/                 设置页
  content/bridge.js        content script 桥接
  page/holdings-bridge.js  页面上下文持仓桥接
  common/                  详情页、图表、行情组件
scripts/
  build-zip.js             打包 zip 文件
```

<p align="right">(<a href="#readme-top">回到顶部</a>)</p>

[fund-home-screenshot]: docs/images/readme/fund-home.png
[edit-page-screenshot]: docs/images/readme/edit-page.png
[position-manager-screenshot]: docs/images/readme/position-manager.png
[settings-page-screenshot]: docs/images/readme/settings-page.png
[market-detail-screenshot]: docs/images/readme/market-detail.png

## 后续计划

- [x] 生成生产构建并加载本地扩展
- [x] 提供 popup 主界面与设置页
- [x] 支持基金、指数与持仓相关信息查看
- [x] 提供 ZIP 打包脚本
- [x] 补充可直接复用的界面截图资源
- [ ] 持续整理 README 与实现细节的一致性

<p align="right">(<a href="#readme-top">回到顶部</a>)</p>

## 许可证

Distributed under the GPL-3.0 License. See `LICENSE` for more information.

<p align="right">(<a href="#readme-top">回到顶部</a>)</p>
