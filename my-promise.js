(function(window){
    function MyPromise (executor) {
        let self = this
        self.status = 'pending'
        self.data = undefined
        self.callbacks = []

        function resolve (value) {
            self.status = 'fulfilled'
            self.data = value
            if (self.callbacks.length > 0) {
                self.callbacks.forEach(item => {
                    try {
                        item.resolved(value)
                    }
                    catch (err) {
                        item.rejected(err)
                    }
                })
            }
        }

        function reject (reason) {
            self.status = 'rejected'
            self.data = reason
            if (self.callbacks.length > 0) {
                self.callbacks.forEach(item => {
                    try {
                        item.rejected(reason)
                    }
                    catch (err) {
                        item.rejected(err)
                    }
                })
            }
        }

        executor(resolve, reject)
    }

    function handle (handleFn, onresolved, onrejected, data) {
        setTimeout(() => {
            try {
                const result = handleFn(data)
                if (result instanceof MyPromise) {
                    result.then(onresolved, onrejected)
                } else {
                    onresolved(result)
                }
            }
            catch (err) {
                onrejected(err)
            }
        }, 0)
    }

    MyPromise.prototype.then = function (resolved, rejected) {
        let self = this

        // 成功的回调不处理就 透传
        resolved = typeof resolved == 'function' ? resolved : (value) => value
        // 失败的回调不处理  透传
        rejected = typeof rejected == 'function' ? rejected : (reason) => { throw reason }

        return new MyPromise ((onresolved, onrejected) => {
            if (self.status == 'pending') {
                self.callbacks.push({resolved () {
                    handle(resolved, onresolved, onrejected, self.data)
                }, rejected () {
                    handle(rejected, onresolved, onrejected, self.data)
                }})
            } else if (self.status == 'fulfilled') {
                handle(resolved, onresolved, onrejected, self.data)
            } else {
                handle(rejected, onresolved, onrejected, self.data)
            }

        })
    }

    MyPromise.prototype.catch = function (callback) {
        this.then(null, callback)
    }

    MyPromise.resolve = function (value) {
        return new MyPromise((resolve, reject) => {
            if (value) {
                if (value instanceof MyPromise) {
                    value.then(resolve, reject)
                } else {
                    resolve(value)
                }
            }
        })
    }

    MyPromise.reject = function (reason) {
        return new MyPromise((resolve, reject) => {
            reject(reason)
        })
    }

    // 只要有一个失败就失败，失败的回调是第一个失败的 reason
    MyPromise.all = function (promises) {
        let values = []

        return new MyPromise((resolve, reject) => {
            promises.forEach((p, index) => {
                MyPromise.resolve(p).then(value => {
                    values.push(value)
                    if (values.length === promises.length) {
                        resolve(values)
                    }
                }, reject)
            })
        })
    }

    // race 是主要有一个 promise 状态变化，就执行 then  里面额回调
    MyPromise.race = function (promises) {
        return new MyPromise((resolve, reject) => {
            promises.forEach(p => {
                MyPromise.resolve(p).then(resolve, reject)
            })
        })
    }

    window.MyPromise = MyPromise
})(window)