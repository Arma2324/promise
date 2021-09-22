## 测试步骤

**1. 安装promises-aplus-tests**

~~~shell
npm install promises-aplus-tests -D
~~~

**2. 在手写promise代码文件中加入代码，如下**

~~~JavaScript
// myPromise.js

class myPromise{
    ......
}

// 测试前需要添加的代码
myPromise.deferred = function () {
  var result = {}
  result.promise = new myPromise(function (resolve, reject) {
    result.resolve = resolve
    result.reject = reject
  })

  return result
}

module.exports = myPromise
~~~

**3.开始测试**

* 在package.json文件中配置scripts，如下

~~~javascript
"scripts": {
    "test": "promises-aplus-tests myPromise"
  },
~~~

* 在命令行中输入以下命令

  ~~~shell
  npm run test
  ~~~

**4.测试成功截图**

![image-20210922134118772.png](https://i.loli.net/2021/09/22/YxjD4Nn3hTHME1A.png)

