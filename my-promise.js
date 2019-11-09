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
                if (result instanceof Promise) {
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

    window.MyPromise = MyPromise
})(window)