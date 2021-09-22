// 设置三个常量表示promise的三种状态
const PENDING = 'pending'
const FULFILLED = 'fulfilled'
const REJECTED = 'rejected'

function resolvePromise(promise2, x, resolve, reject) {
  if (x === promise2) {
    return reject(
      new TypeError('Chaining cycle detected for promise #<Promise>')
    )
  }
  if (typeof x === 'object' || typeof x === 'function') {
    if (x === null) {
      return resolve(x)
    }
    // 获取x的then方法，若获取失败直接reject
    let then
    try {
      then = x.then
    } catch (err) {
      reject(err)
    }
    // 成功获取then，且类型为函数，则以x为context执行then方法
    if (typeof then === 'function') {
      let called = false // 防止多次调用resolve或reject
      try {
        then.call(
          x,
          (y) => {
            if (called) return
            called = true
            resolvePromise(promise2, y, resolve, reject)
          },
          (r) => {
            if (called) return
            called = true
            reject(r)
          }
        )
      } catch (err) {
        if (called) return
        reject(err)
      }
    } else {
      resolve(x)
    }
  } else {
    resolve(x)
  }
}

// promise类
class myPromise {
  constructor(executor) {
    // 状态变量
    this.state = PENDING
    // 成功之后的值
    this.value = null
    // 失败的原因
    this.reason = null
    // 存储成功的回调函数
    this.onFulfilledCallbacks = []
    // 存储失败的回调函数
    this.onRejectedCallbacks = []

    try {
      // 立即执行传入promise的函数
      executor(this.resolve, this.reject)
    } catch (err) {
      this.reject(err)
    }
  }

  // 成功决议
  resolve = (value) => {
    if (this.state === PENDING) {
      // 修改状态为fulfilled
      this.state = FULFILLED
      this.value = value
      // 执行成功的回调函数
      this.onFulfilledCallbacks.forEach((callback) => callback())
    }
  }

  // 失败决议
  reject = (reason) => {
    if (this.state === PENDING) {
      // 修改状态为rejected
      this.state = REJECTED
      this.reason = reason
      this.onRejectedCallbacks.forEach((callback) => callback())
    }
  }

  then(onFulfilled, onRejected) {
    // 传入的参数不是函数则使用默认函数
    const realOnFulfilled =
      typeof onFulfilled === 'function' ? onFulfilled : (value) => value
    const realOnRejected =
      typeof onRejected === 'function'
        ? onRejected
        : (reason) => {
            throw reason
          }
    // 为了链式调用，在这new一个promise并return
    const promise2 = new myPromise((resolve, reject) => {
      // 创建成功回调函数的微任务
      const fullfilledMicrotask = () => {
        queueMicrotask(() => {
          try {
            const x = realOnFulfilled(this.value)
            resolvePromise(promise2, x, resolve, reject)
          } catch (err) {
            reject(err)
          }
        })
      }
      // 创建失败回调函数的微任务
      const rejectedMicrotask = () => {
        queueMicrotask(() => {
          try {
            const x = realOnRejected(this.reason)
            resolvePromise(promise2, x, resolve, reject)
          } catch (err) {
            reject(err)
          }
        })
      }

      // 如果promise已决议，则根据其状态将相应的回调函数添加到微任务队列中
      if (this.state === FULFILLED) {
        fullfilledMicrotask()
      } else if (this.state === REJECTED) {
        rejectedMicrotask()
      } else if (this.state === PENDING) {
        // 如果promise未决议则先将回调存储起来，等待promise决议后再执行
        this.onFulfilledCallbacks.push(fullfilledMicrotask)
        this.onRejectedCallbacks.push(rejectedMicrotask)
      }
    })
    return promise2
  }

  catch(onRejected) {
    // 只需要进行错误处理
    this.then(undefined, onRejected)
  }

  finally(fn) {
    return this.then(
      (value) => {
        return myPromise.resolve(fn()).then(() => value)
      },
      (error) => {
        return myPromise.resolve(fn()).then(() => {
          throw error
        })
      }
    )
  }

  // resolve静态方法
  static resolve(parameter) {
    if (parameter instanceof myPromise) {
      return parameter
    }

    return new myPromise((resolve) => {
      resolve(parameter)
    })
  }

  // reject静态方法
  static reject(reason) {
    return new myPromise((resolve, reject) => {
      reject(reason)
    })
  }

  static all(promiseList) {
    return new myPromise((resolve, reject) => {
      const result = []
      const len = promiseList.length
      let count = 0

      if (length === 0) return resolve(result)

      promiseList.forEach((promise, index) => {
        myPromise.resolve(promise).then(
          (value) => {
            count++
            // 不用push是为了确保result内容的顺序与promiseList一致
            result[index] = value
            if (count === length) {
              resolve(result)
            }
          },
          (reason) => {
            reject(reason)
          }
        )
      })
    })
  }

  static race(promiseList) {
    return new myPromise((resolve, reject) => {
      const len = promiseList.length

      if (len === 0) resolve()
      else {
        promiseList.forEach((promise) => {
          myPromise.resolve(promise).then(
            (value) => resolve(value),
            (reason) => reject(reason)
          )
        })
      }
    })
  }

  static allSettled(promiseList) {
    return new myPromise((resolve) => {
      const result = []
      const len = promiseList.length
      let count = 0
      if (len === 0) resolve(result)
      promiseList.forEach((promise, index) => {
        myPromise.resolve(promise).then(
          (value) => {
            count++
            result[index] = {
              status: 'fulfilled',
              value: value,
            }
            if (count === length) return resolve(result)
          },
          (reason) => {
            count++
            result[index] = {
              status: 'rejected',
              reason: reason,
            }
            if (count === length) return resolve(result)
          }
        )
      })
    })
  }
}

myPromise.deferred = function () {
  var result = {}
  result.promise = new myPromise(function (resolve, reject) {
    result.resolve = resolve
    result.reject = reject
  })

  return result
}

module.exports = myPromise
