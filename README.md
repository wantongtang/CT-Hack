# 免账号登录 ChinaNet 热点 #

### 用法： ###

1. 连接上 ChinaNet 无线网
2. 运行**【运行.bat】**
3. 等待连接成功

### 提示： ###

1. 由于是模拟天翼 WiFi 客户端进行登录，理论上应该不受区域限制。
2. 可能出现第一次登录失败的情况，脚本会在**三秒后**执行第二次登录尝试，**两次登录都失败则进行下一组计算**。
3. 默认八分钟后开始检查网络连接，每十秒检测一次，直到网络断开。
4. 程序为**【Windows 64 位版本】**，Windows 32 位版本或其它系统的请到 [http://nodejs.org/](http://nodejs.org/ "Node.js") 下载对应的 node.js 程序，然后在 shell 中运行 `node mother.js`。
5. 通过运行**【检查更新.bat】** 可获取脚本最新版本

### 原理： ###

1. 利用每次申请购买时长卡会得到**十分钟**的连接时间，通过 node.js 模拟购买流程，自动获得账号密码。
2. 利用所得到的帐密，模拟天翼 WiFi 客户端登录过程，达到联网的目的。

![](http://i.imgur.com/euGAGLq.png)
### 版权： ###

北京化工大学-学生网络中心-系统组 [@Dolphin Wood](http://www.idiotwu.com/),   
MIT Licensed.
